import { db } from '@mindstudio-ai/agent';
import type { Factor, Source, Match, Contact } from '../common/domain';
interface Assessment {
  ownerId: string;
  runId: string;
  sponsorId: string;
  status: 'complete' | 'failed';
  qualified: boolean;
  qualificationScore: number;
  summary: string;
  factors: Factor[];
  gaps: string[];
  sources: Source[];
  contact: Contact;
  matches: Match[];
  fundingStage: string;
  sector: string;
  regions: string[];
  isSample: boolean;
}
export const Assessments = db.defineTable<Assessment>('sponsor_assessments', {
  unique: [['runId', 'sponsorId']],
});
