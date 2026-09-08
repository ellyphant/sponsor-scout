import { db } from '@mindstudio-ai/agent';
import type { Approval } from '../common/domain';
interface Draft {
  ownerId: string;
  runId: string;
  sponsorId: string;
  assessmentId: string;
  recipientName: string;
  recipientRole: string;
  recipientEmail: string;
  recipientSource: 'researched' | 'operator' | 'missing';
  recipientSourceUrl: string;
  subject: string;
  body: string;
  eventIds: string[];
  revision: number;
  reviewState: 'pending' | 'rejected' | 'approved' | 'simulated';
  rejectionReason: string;
  approval?: Approval;
  isSample: boolean;
  prepared?: {
    nonce: string;
    fingerprint: string;
    expiresAt: number;
    mode: 'sample' | 'test' | 'live';
  };
}
export const Drafts = db.defineTable<Draft>('outreach_drafts', {
  unique: [['runId', 'sponsorId']],
});
