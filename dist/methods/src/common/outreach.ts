import { db } from '@mindstudio-ai/agent';
import { Users } from '../tables/users';
import { Drafts } from '../tables/drafts';
import { Sponsors } from '../tables/sponsors';
import { ScoutRuns } from '../tables/scoutRuns';
import { Assessments } from '../tables/assessments';
import { DispatchAttempts } from '../tables/dispatchAttempts';
import { owned, fingerprint } from './guards';
import { emailValue } from './validation';
import { eventSignature, fetchEvents } from './cohost';
import type { DraftRow, UserRow } from './records';
import type { Envelope } from './domain';

export async function packet(ownerId: string, draftId: string) {
  const draft = owned(await Drafts.get(draftId), ownerId, 'Draft');
  const [profile, sponsor, run, assessment] = await db.batch(
    Users.get(ownerId),
    Sponsors.get(draft.sponsorId),
    ScoutRuns.get(draft.runId),
    Assessments.get(draft.assessmentId),
  );
  if (!profile) throw new Error('Operator profile not found.');
  return {
    draft,
    profile,
    sponsor: owned(sponsor, ownerId, 'Sponsor'),
    run: owned(run, ownerId, 'Run'),
    assessment: owned(assessment, ownerId, 'Assessment'),
  };
}
export async function assertMutable(ownerId: string, draftId: string) {
  const attempts = await DispatchAttempts.filter(
    (a, $) => a.ownerId === $.ownerId && a.draftId === $.draftId,
    { ownerId, draftId },
  ); // bindings: prevent cross-user or cross-revision retries
  if (attempts.some((a) => ['preparing', 'sending', 'unknown'].includes(a.state)))
    throw new Error(
      'A send is in progress or its outcome is unknown. Check delivery before editing or retrying.',
    );
  if (
    attempts.some((a) => a.mode === 'live' && (a.state === 'accepted' || a.state === 'suppressed'))
  )
    throw new Error(
      'This outreach has already been submitted or suppressed. It cannot be sent again.',
    );
  return attempts;
}
export function envelopeFor(
  draft: DraftRow,
  profile: UserRow,
  mode: 'sample' | 'test' | 'live',
): Envelope {
  emailValue.parse(draft.recipientEmail);
  if (!draft.subject.trim() || /[\r\n]/.test(draft.subject) || !draft.body.trim())
    throw new Error('Save a valid subject and body before review.');
  const name = (profile.displayName || 'Elly').replace(/[<>\r\n"]/g, '');
  if (mode !== 'sample' && !(profile.senderAddress && profile.senderVerified))
    throw new Error('Verify your app-owned managed sender in Settings before sending.');
  const replyTo = profile.replyTo || profile.email;
  emailValue.parse(replyTo);
  return {
    to: mode === 'test' ? profile.email : draft.recipientEmail,
    from: `${name} <${mode === 'sample' ? 'sample-sender@example.com' : profile.senderAddress}>`,
    replyTo,
    subject: mode === 'test' ? `[Test] ${draft.subject}` : draft.subject,
    body: draft.body,
    eventIds: [...draft.eventIds],
  };
}
export function reviewFingerprint(
  draft: DraftRow,
  profile: UserRow,
  mode: 'sample' | 'test' | 'live',
) {
  return fingerprint({
    draftId: draft.id,
    revision: draft.revision,
    isSample: Boolean(draft.isSample),
    mode,
    deliveryPreference: profile.deliveryMode || 'test',
    senderAddress: profile.senderAddress || '',
    senderVerified: Boolean(profile.senderVerified),
    envelope: envelopeFor(draft, profile, mode),
    recipient: draft.recipientEmail,
  });
}
export async function validateLiveEvents(
  run: Awaited<ReturnType<typeof packet>>['run'],
  eventIds: string[],
) {
  const snapshot = await fetchEvents(run.scope);
  for (const id of eventIds) {
    const oldEvent = run.events.find((e) => e.id === id);
    const current = snapshot.events.find((e) => e.id === id);
    if (!oldEvent || !current || eventSignature(current) !== eventSignature(oldEvent))
      throw new Error(
        'A matched event changed or is no longer seeking sponsorship. Refresh the case in a new run before sending.',
      );
  }
}
