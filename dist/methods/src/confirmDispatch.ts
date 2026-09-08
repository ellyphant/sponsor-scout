import { db, email } from '@mindstudio-ai/agent';
import { randomUUID } from 'node:crypto';
import { Drafts } from './tables/drafts';
import { DispatchAttempts } from './tables/dispatchAttempts';
import { requireUser, withClaim, announce, logFailure } from './common/guards';
import {
  packet,
  assertMutable,
  envelopeFor,
  reviewFingerprint,
  validateLiveEvents,
} from './common/outreach';

export async function confirmDispatch(input: {
  draftId: string;
  nonce: string;
  expectedRevision: number;
  confirmed: boolean;
}) {
  const ownerId = requireUser();
  if (input.confirmed !== true)
    throw new Error('Confirm the recipient and exact email before proceeding.');
  const result = await withClaim(ownerId, `draft:${input.draftId}`, async () =>
    withClaim(ownerId, 'profile', async () => {
      const { draft, profile, sponsor, run, assessment } = await packet(ownerId, input.draftId);
      await assertMutable(ownerId, draft.id);
      const prepared = draft.prepared;
      if (
        !prepared ||
        prepared.nonce !== input.nonce ||
        prepared.expiresAt < Date.now() ||
        input.expectedRevision !== draft.revision ||
        prepared.fingerprint !== reviewFingerprint(draft, profile, prepared.mode)
      )
        throw new Error('This review is stale. Review the current recipient and letter again.');
      if (draft.reviewState !== 'pending') throw new Error('This draft was already reviewed.');
      if (
        sponsor.archived ||
        sponsor.doNotContact ||
        !assessment.qualified ||
        !draft.eventIds.length
      )
        throw new Error('This sponsor or its matches are no longer eligible for outreach.');
      const approval = {
        at: Date.now(),
        by: ownerId,
        fingerprint: prepared.fingerprint,
        revision: draft.revision,
      };
      if (prepared.mode === 'sample') {
        if (!(draft.isSample && run.isSample && sponsor.isSample && assessment.isSample))
          throw new Error('Only sample packets can simulate a review.');
        const updated = await Drafts.update(draft.id, { reviewState: 'simulated', approval });
        return { draft: updated, attempt: null, message: 'Review simulated. No email was sent.' };
      }
      // This guard stays server-side even if a client edits a sample recipient or nonce.
      if (draft.isSample || run.isSample || sponsor.isSample || assessment.isSample)
        throw new Error('Sample records cannot send email.');
      if (prepared.mode === 'live' && profile.deliveryMode !== 'live')
        throw new Error('Live delivery is not enabled.');
      if (prepared.mode === 'live') {
        await validateLiveEvents(run, draft.eventIds);
        const prior = await DispatchAttempts.filter(
          (a, $) =>
            a.ownerId === $.ownerId &&
            a.sponsorId === $.sponsorId &&
            a.mode === 'live' &&
            (a.state === 'accepted' ||
              a.state === 'unknown' ||
              a.state === 'sending' ||
              a.state === 'preparing'),
          { ownerId, sponsorId: sponsor.id },
        ); // bindings: cross-run duplicate guard
        if (prior.some((a) => a.envelope.eventIds.some((id) => draft.eventIds.includes(id))))
          throw new Error(
            'This sponsor already has outreach for one of these events. Review its delivery history first.',
          );
      }
      const quota = await email.quota();
      if (quota.remaining !== null && quota.remaining < 1)
        throw new Error('The outbound email quota is exhausted. Nothing was sent.');
      const envelope = envelopeFor(draft, profile, prepared.mode);
      const attempt = await DispatchAttempts.push({
        ownerId,
        draftId: draft.id,
        sponsorId: sponsor.id,
        revision: draft.revision,
        mode: prepared.mode,
        state: 'preparing',
        batchId: randomUUID(),
        fingerprint: prepared.fingerprint,
        approvedAt: Date.now(),
        envelope,
        resolvedFrom: '',
        errorMessage: '',
        deliveryStatus: '',
      });
      await db.batch(
        DispatchAttempts.update(attempt.id, { state: 'sending' }),
        ...(prepared.mode === 'live'
          ? [Drafts.update(draft.id, { reviewState: 'approved', approval })]
          : []),
      );
      try {
        const receipt = await email.send({
          to: envelope.to,
          from: envelope.from,
          replyTo: envelope.replyTo,
          subject: envelope.subject,
          body: envelope.body,
          bodyType: 'text',
          category: 'marketing',
          batchId: attempt.batchId,
        });
        const suppressed = receipt.suppressed.some(
          (address) => address.toLowerCase() === envelope.to.toLowerCase(),
        );
        const accepted = receipt.recipients.some(
          (address) => address.toLowerCase() === envelope.to.toLowerCase(),
        );
        const state = suppressed ? 'suppressed' : accepted ? 'accepted' : 'unknown';
        const updatedAttempt = await DispatchAttempts.update(attempt.id, {
          state,
          resolvedFrom: receipt.from,
          batchId: receipt.batchId,
          deliveryStatus: state,
          checkedAt: Date.now(),
        });
        return {
          draft: (await Drafts.get(draft.id))!,
          attempt: updatedAttempt,
          message: suppressed
            ? 'Not sent. This recipient opted out.'
            : accepted
              ? prepared.mode === 'test'
                ? 'Test email accepted for your inbox. The sponsor was not contacted.'
                : 'Accepted for sending. Delivery not yet confirmed.'
              : 'Send outcome unknown. Check the mail log before retrying.',
        };
      } catch (err) {
        logFailure(`Email submission failed (${attempt.batchId})`, err);
        const code = (err as { code?: string }).code;
        const definitelyNotSent = [
          'outbound_daily_cap_exceeded',
          'sending_paused',
          'sender_not_allowed',
          'invalid_recipient',
          'invalid_email',
        ].includes(code || '');
        const updatedAttempt = await DispatchAttempts.update(attempt.id, {
          state: definitelyNotSent ? 'failed' : 'unknown',
          errorMessage: definitelyNotSent
            ? 'The service refused this submission before acceptance. Edit and review a new revision before retrying.'
            : 'Submission outcome unknown. Check the mail log before retrying to avoid a duplicate.',
          checkedAt: Date.now(),
        });
        return {
          draft: (await Drafts.get(draft.id))!,
          attempt: updatedAttempt,
          message: updatedAttempt.errorMessage,
        };
      }
    }),
  );
  await announce(ownerId, { type: 'draft', draftId: input.draftId });
  return result;
}
