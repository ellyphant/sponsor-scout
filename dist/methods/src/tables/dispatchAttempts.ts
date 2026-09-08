import { db } from '@mindstudio-ai/agent';
import type { Envelope } from '../common/domain';
interface DispatchAttempt {
  ownerId: string;
  draftId: string;
  sponsorId: string;
  revision: number;
  mode: 'test' | 'live';
  state: 'preparing' | 'sending' | 'accepted' | 'suppressed' | 'failed' | 'unknown';
  batchId: string;
  fingerprint: string;
  approvedAt: number;
  envelope: Envelope;
  resolvedFrom: string;
  errorMessage: string;
  deliveryStatus: string;
  checkedAt?: number;
}
export const DispatchAttempts = db.defineTable<DispatchAttempt>('dispatch_attempts', {
  unique: [['draftId', 'revision', 'mode']],
});
