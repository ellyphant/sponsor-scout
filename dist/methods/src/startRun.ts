import { mindstudio } from '@mindstudio-ai/agent';
import { Sponsors } from './tables/sponsors';
import { ScoutRuns } from './tables/scoutRuns';
import { OperationClaims } from './tables/operationClaims';
import { scopeSchema } from './common/validation';
import { requireUser, acquireClaim, announce } from './common/guards';
import { MODEL_CONFIG } from './common/domain';
import { executePipeline } from './common/pipeline';
export async function startRun(input: {
  city?: string;
  vertical?: string;
  from?: string;
  to?: string;
  newLimit?: number;
}) {
  const ownerId = requireUser();
  const scope = scopeSchema.parse(input);
  const claim = await acquireClaim(ownerId, 'active-run');
  try {
    const known = await Sponsors.filter((s, $) => s.ownerId === $.ownerId && s.isSample === false, {
      ownerId,
    }); // bindings: private SQL-scoped candidate roster
    const maintained = known.filter((s) => s.maintained && !s.archived && !s.doNotContact);
    const now = Date.now();
    const run = await ScoutRuns.push({
      ownerId,
      status: 'queued',
      scope,
      events: [],
      includedSponsorIds: maintained.map((s) => s.id),
      includedSponsors: maintained.map((s) => ({
        id: s.id,
        name: s.name,
        website: s.website,
        notes: s.notes,
      })),
      modelConfig: MODEL_CONFIG,
      counters: { researched: 0, qualified: 0, matched: 0, drafts: 0 },
      summary: '',
      errors: [],
      unresolved: [],
      startedAt: now,
      lastProgressAt: now,
      budgetEndsAt: now + 20 * 60 * 1000,
      responseCount: 0,
      snapshotNotes: [],
      claimId: claim.id,
      claimToken: claim.token,
      isSample: false,
    });
    // The entire pipeline (including fetch/final persistence) is kept alive, not only runTask.
    mindstudio.waitUntil(executePipeline(run, maintained, known));
    await announce(ownerId, { type: 'run', runId: run.id });
    return { run };
  } catch (err) {
    await OperationClaims.remove(claim.id);
    throw err;
  }
}
