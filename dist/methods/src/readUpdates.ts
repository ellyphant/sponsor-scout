import { db } from '@mindstudio-ai/agent';
import { z } from 'zod';
import { requireUser } from './common/guards';
import { Users } from './tables/users';
import { Sponsors } from './tables/sponsors';
import { ScoutRuns } from './tables/scoutRuns';
import { Assessments } from './tables/assessments';
import { Drafts } from './tables/drafts';
import { DispatchAttempts } from './tables/dispatchAttempts';
import { RunActivity } from './tables/runActivity';
export async function readUpdates(input: {
  runIds?: string[];
  sponsorIds?: string[];
  draftIds?: string[];
  profile?: boolean;
}) {
  const ownerId = requireUser();
  const list = z.array(z.string().max(100)).max(100).default([]);
  const values = z
    .object({ runIds: list, sponsorIds: list, draftIds: list, profile: z.boolean().default(false) })
    .parse(input);
  const $ = { ownerId, ...values }; // bindings: ID-limited reconciliation stays in SQL
  const [runs, drafts, activity] = await db.batch(
    ScoutRuns.filter((r, $) => r.ownerId === $.ownerId && $.runIds.includes(r.id), $),
    Drafts.filter(
      (d, $) =>
        d.ownerId === $.ownerId && ($.draftIds.includes(d.id) || $.runIds.includes(d.runId)),
      $,
    ),
    RunActivity.filter((a, $) => a.ownerId === $.ownerId && $.runIds.includes(a.runId), $)
      .sortBy((a) => a.seq)
      .reverse()
      .take(400),
  );
  const draftIds = drafts.map((d) => d.id);
  const assessmentIds = drafts.map((d) => d.assessmentId);
  const [assessments, attempts] = await db.batch(
    Assessments.filter(
      (a, $) =>
        a.ownerId === $.ownerId && ($.runIds.includes(a.runId) || $.assessmentIds.includes(a.id)),
      { ...$, assessmentIds },
    ), // bindings: only changed review packets
    DispatchAttempts.filter((a, $) => a.ownerId === $.ownerId && $.draftIds.includes(a.draftId), {
      ownerId,
      draftIds,
    }), // bindings: attempt history for changed drafts
  );
  const sponsorIds = [...new Set([...values.sponsorIds, ...assessments.map((a) => a.sponsorId)])];
  const sponsors = await Sponsors.filter(
    (s, $) => s.ownerId === $.ownerId && $.sponsorIds.includes(s.id),
    { ownerId, sponsorIds },
  ); // bindings: changed company rows only
  const profile = values.profile ? await Users.get(ownerId) : undefined;
  return { runs, drafts, activity, assessments, attempts, sponsors, profile };
}
