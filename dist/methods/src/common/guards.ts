import { auth, events, MindStudioError } from '@mindstudio-ai/agent';
import { randomUUID, createHash } from 'node:crypto';
import { OperationClaims } from '../tables/operationClaims';

export function requireUser() {
  if (!auth.userId)
    throw new MindStudioError('Sign in to open Sponsor Scout.', 'not_authenticated', 401);
  return auth.userId;
}
export function owned<T extends { ownerId: string }>(
  row: T | null,
  ownerId: string,
  name = 'Record',
): T {
  if (!row || row.ownerId !== ownerId) throw new Error(`${name} not found.`);
  return row;
}
export async function acquireClaim(ownerId: string, resource: string) {
  try {
    return await OperationClaims.push({
      ownerId,
      resource,
      token: randomUUID(),
      acquiredAt: Date.now(),
    });
  } catch {
    throw new Error(
      'This operation is already in progress. Refresh its status before trying again.',
    );
  }
}
export async function withClaim<T>(
  ownerId: string,
  resource: string,
  action: () => Promise<T>,
): Promise<T> {
  const claim = await acquireClaim(ownerId, resource);
  try {
    return await action();
  } finally {
    await OperationClaims.remove(claim.id);
  } // Original row only; never remove a successor's claim.
}
export function fingerprint(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}
export function logFailure(label: string, error: unknown) {
  console.error(label, {
    code: (error as { code?: string })?.code || 'execution_error',
    message: error instanceof Error ? error.message.slice(0, 500) : 'Unknown error',
  });
}
export async function announce(ownerId: string, data: Record<string, unknown>) {
  // Durable writes are truth. A missed ephemeral nudge is recovered on reconnect.
  try {
    await events.publish(`user:${ownerId}`, data);
  } catch (err) {
    logFailure('Realtime notification failed', err);
  }
}
