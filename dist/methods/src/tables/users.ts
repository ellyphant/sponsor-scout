import { db } from '@mindstudio-ai/agent';
import type { Check } from '../common/domain';
interface UserProfile {
  email: string;
  roles: string[];
  displayName?: string;
  replyTo?: string;
  deliveryMode?: 'test' | 'live';
  introDismissed?: boolean;
  senderAddress?: string;
  senderVerified?: boolean;
  cohostCheck?: Check;
  astraCheck?: Check;
}
export const Users = db.defineTable<UserProfile>('users');
