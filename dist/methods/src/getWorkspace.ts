import { db } from '@mindstudio-ai/agent';
import { Users } from './tables/users';
import { Sponsors } from './tables/sponsors';
import { ScoutRuns } from './tables/scoutRuns';
import { Drafts } from './tables/drafts';
import { Assessments } from './tables/assessments';
import { DispatchAttempts } from './tables/dispatchAttempts';
import { requireUser } from './common/guards';
import { cohostConfigured } from './common/cohost';
import { claimSampleWorkspace } from './common/sampleOwnership';
import { MODEL_CONFIG } from './common/domain';
export async function getWorkspace() {
  const ownerId = requireUser();
  await claimSampleWorkspace(ownerId);
  const $ = { ownerId }; // bindings: scoped predicates compile to SQL rather than fetching every user's rows
  // SDK tuple inference covers five operations per batch. Keep both batches parallel.
  const [[profile, sponsors, runs], [pending, history, attempts]] = await Promise.all([
    db.batch(
      Users.get(ownerId),
      Sponsors.filter((r, $) => r.ownerId === $.ownerId, $),
      ScoutRuns.filter((r, $) => r.ownerId === $.ownerId, $)
        .sortBy((r) => r.startedAt)
        .reverse()
        .take(30),
    ),
    db.batch(
      Drafts.filter((r, $) => r.ownerId === $.ownerId && r.reviewState === 'pending', $),
      Drafts.filter((r, $) => r.ownerId === $.ownerId && r.reviewState !== 'pending', $)
        .sortBy((r) => r.updated_at)
        .reverse()
        .take(80),
      DispatchAttempts.filter((r, $) => r.ownerId === $.ownerId, $)
        .sortBy((r) => r.created_at)
        .reverse()
        .take(100),
    ),
  ]);
  const drafts = [...pending, ...history];
  const ids = [
    ...new Set([
      ...drafts.map((d) => d.assessmentId),
      ...sponsors.map((s) => s.latestAssessmentId).filter((id): id is string => Boolean(id)),
    ]),
  ];
  const assessments = ids.length
    ? await Assessments.filter((r, $) => r.ownerId === $.ownerId && $.ids.includes(r.id), {
        ownerId,
        ids,
      })
    : []; // bindings: owner and ID list stay in SQL
  return {
    profile,
    sponsors,
    runs,
    drafts,
    assessments,
    attempts,
    setup: {
      cohostConfigured: cohostConfigured(),
      modelConfig: MODEL_CONFIG,
      senderConfigured: Boolean(profile?.senderAddress && profile.senderVerified),
      operatorRestriction: 'Configure the platform email allowlist before publishing.',
    },
  };
}
