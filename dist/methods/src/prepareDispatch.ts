import { randomUUID } from 'node:crypto';
import { Drafts } from './tables/drafts';
import { requireUser, withClaim } from './common/guards';
import { packet, assertMutable, envelopeFor, reviewFingerprint } from './common/outreach';
export async function prepareDispatch(input: {
  draftId: string;
  mode: 'sample' | 'test' | 'live';
}) {
  const ownerId = requireUser();
  if (!['sample', 'test', 'live'].includes(input.mode))
    throw new Error('Choose a valid review mode.');
  return withClaim(ownerId, `draft:${input.draftId}`, async () => {
    const { draft, profile, sponsor, run, assessment } = await packet(ownerId, input.draftId);
    await assertMutable(ownerId, draft.id);
    if (draft.reviewState !== 'pending') throw new Error('This draft has already been reviewed.');
    if (
      Boolean(draft.isSample) !== (input.mode === 'sample') ||
      (input.mode !== 'sample' && (run.isSample || assessment.isSample || sponsor.isSample))
    )
      throw new Error('Sample records can only simulate a review. No email can be sent.');
    if (sponsor.archived || sponsor.doNotContact)
      throw new Error('This sponsor is archived or marked Do not contact.');
    if (!assessment.qualified || !draft.eventIds.length)
      throw new Error('This draft does not have qualified event matches.');
    if (input.mode === 'live' && profile.deliveryMode !== 'live')
      throw new Error('Enable Live delivery in Settings before approving outreach.');
    const envelope = envelopeFor(draft, profile, input.mode);
    const prepared = {
      nonce: randomUUID(),
      fingerprint: reviewFingerprint(draft, profile, input.mode),
      expiresAt: Date.now() + 10 * 60 * 1000,
      mode: input.mode,
    };
    await Drafts.update(draft.id, { prepared });
    return {
      ...prepared,
      revision: draft.revision,
      envelope,
      sponsorRecipient: draft.recipientEmail,
      isSample: Boolean(draft.isSample),
    };
  });
}
