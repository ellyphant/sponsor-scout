import { db } from '@mindstudio-ai/agent';
import { ScoutRuns } from './tables/scoutRuns';
import { RunActivity } from './tables/runActivity';
import { Assessments } from './tables/assessments';
import { Drafts } from './tables/drafts';
import { owned, requireUser } from './common/guards';
export async function getRun(input: { runId: string; beforeSeq?: number }) {
  const ownerId = requireUser();
  const run = owned(await ScoutRuns.get(input.runId), ownerId, 'Run');
  const $ = { ownerId, runId: run.id }; // bindings: restrict all batch reads in SQL
  let activityQuery = RunActivity.filter(
    (r, $) => r.ownerId === $.ownerId && r.runId === $.runId,
    $,
  );
  if (input.beforeSeq !== undefined)
    activityQuery = activityQuery.filter((r, $) => r.seq < $.before, { before: input.beforeSeq }); // bindings: SQL history cursor
  const [activity, assessments, drafts] = await db.batch(
    activityQuery
      .sortBy((r) => r.seq)
      .reverse()
      .take(200),
    Assessments.filter((r, $) => r.ownerId === $.ownerId && r.runId === $.runId, $),
    Drafts.filter((r, $) => r.ownerId === $.ownerId && r.runId === $.runId, $),
  );
  return {
    run,
    activity: activity.reverse(),
    assessments,
    drafts,
    hasOlder: activity.length === 200,
  };
}
