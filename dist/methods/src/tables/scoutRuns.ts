import { db } from '@mindstudio-ai/agent';
import type { CoHostEvent, Scope, Counters, ModelConfig, RunStatus } from '../common/domain';
interface ScoutRun {
  ownerId: string;
  status: RunStatus;
  scope: Scope;
  events: CoHostEvent[];
  includedSponsorIds: string[];
  includedSponsors: Array<{ id: string; name: string; website: string; notes: string }>;
  modelConfig: ModelConfig;
  counters: Counters;
  summary: string;
  errors: string[];
  unresolved: string[];
  startedAt: number;
  finishedAt?: number;
  lastProgressAt: number;
  budgetEndsAt: number;
  fetchedAt?: number;
  responseCount: number;
  snapshotNotes: string[];
  claimId: string;
  claimToken: string;
  isSample: boolean;
}
export const ScoutRuns = db.defineTable<ScoutRun>('scout_runs');
