import { ScoutRuns } from './tables/scoutRuns';
import { OperationClaims } from './tables/operationClaims';
import { ACTIVE_RUN_STATES } from './common/domain';
import { owned, requireUser, withClaim, announce } from './common/guards';
export async function stopRun(input: { runId: string; abandon?: boolean; confirmed: boolean }) {
  const ownerId = requireUser();
  if (!input.confirmed) throw new Error('Confirm that this run should stop accepting results.');
  const run = await withClaim(ownerId, `run-write:${input.runId}`, async () => {
    const current = owned(await ScoutRuns.get(input.runId), ownerId, 'Run');
    if (current.isSample || !ACTIVE_RUN_STATES.includes(current.status)) return current;
    if (input.abandon) {
      if (Date.now() < current.budgetEndsAt)
        throw new Error(
          'This run has not reached its stale-work deadline. Stop accepting results instead.',
        );
      const updated = await ScoutRuns.update(current.id, {
        status: 'abandoned',
        finishedAt: Date.now(),
        summary: 'Unfinished run abandoned. Saved work is preserved.',
      });
      await OperationClaims.remove(current.claimId); // Delete by original ID, never by reusable resource key.
      return updated;
    }
    return ScoutRuns.update(current.id, {
      status: 'stopping',
      summary: 'No new results will be accepted. Research already in progress may continue.',
    });
  });
  await announce(ownerId, { type: 'run', runId: run.id });
  return { run };
}
