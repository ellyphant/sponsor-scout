import { db } from '@mindstudio-ai/agent';
import type { Source } from '../common/domain';
interface Activity {
  ownerId: string;
  runId: string;
  key: string;
  seq: number;
  timestamp: number;
  kind: 'action' | 'finding' | 'error' | 'status';
  state: 'working' | 'complete' | 'failed';
  label: string;
  detail: string;
  sponsorId: string;
  sources: Source[];
  isSample: boolean;
}
export const RunActivity = db.defineTable<Activity>('run_activity', { unique: [['runId', 'key']] });
