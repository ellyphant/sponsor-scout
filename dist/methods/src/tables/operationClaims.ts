import { db } from '@mindstudio-ai/agent';
interface OperationClaim {
  ownerId: string;
  resource: string;
  token: string;
  acquiredAt: number;
}
export const OperationClaims = db.defineTable<OperationClaim>('operation_claims', {
  unique: [['ownerId', 'resource']],
});
