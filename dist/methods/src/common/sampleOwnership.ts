import { db } from '@mindstudio-ai/agent';
import { Sponsors } from '../tables/sponsors';
import { ScoutRuns } from '../tables/scoutRuns';
import { RunActivity } from '../tables/runActivity';
import { Assessments } from '../tables/assessments';
import { Drafts } from '../tables/drafts';
import { withClaim } from './guards';

// Scenario fixtures are public fictional templates, never another person's data.
// Auth can create the standing dev user AFTER seeding, so claim only this reserved
// sample namespace on the first authenticated read. Live rows never qualify.
export const SAMPLE_OWNER = 'sample-template';
export async function claimSampleWorkspace(ownerId: string) {
  const available = await ScoutRuns.some(
    (r) => r.ownerId === 'sample-template' && r.isSample === true,
  );
  if (!available) return;
  await withClaim(SAMPLE_OWNER, 'adopt', async () => {
    const [sponsors, runs, activity, assessments, drafts] = await db.batch(
      Sponsors.filter((r) => r.ownerId === 'sample-template' && r.isSample === true),
      ScoutRuns.filter((r) => r.ownerId === 'sample-template' && r.isSample === true),
      RunActivity.filter((r) => r.ownerId === 'sample-template' && r.isSample === true),
      Assessments.filter((r) => r.ownerId === 'sample-template' && r.isSample === true),
      Drafts.filter((r) => r.ownerId === 'sample-template' && r.isSample === true),
    );
    await db.batch(
      ...sponsors.map((r) => Sponsors.update(r.id, { ownerId })),
      ...runs.map((r) => ScoutRuns.update(r.id, { ownerId })),
      ...activity.map((r) => RunActivity.update(r.id, { ownerId })),
      ...assessments.map((r) => Assessments.update(r.id, { ownerId })),
      ...drafts.map((r) => Drafts.update(r.id, { ownerId })),
    );
  });
}
