import { email } from '@mindstudio-ai/agent';
import { DispatchAttempts } from './tables/dispatchAttempts';
import { owned, requireUser, withClaim, announce } from './common/guards';
export async function refreshDelivery(input: { attemptId: string }) {
  const ownerId = requireUser();
  const original = owned(await DispatchAttempts.get(input.attemptId), ownerId, 'Send attempt');
  const attempt = await withClaim(ownerId, `draft:${original.draftId}`, async () => {
    const current = owned(await DispatchAttempts.get(original.id), ownerId, 'Send attempt');
    const { messages } = await email.messages({ batchId: current.batchId, kind: 'method' });
    const message = messages.find(
      (m) => m.recipient.toLowerCase() === current.envelope.to.toLowerCase(),
    );
    if (!message) return current; // Absence of a receipt does NOT establish no send.
    const accepted = ['sent', 'delivered', 'bounced', 'complained', 'delayed', 'rejected'].includes(
      message.status,
    );
    const state = accepted
      ? 'accepted'
      : message.status === 'suppressed' || message.status === 'blocked'
        ? 'suppressed'
        : message.status === 'failed'
          ? 'failed'
          : current.state;
    return DispatchAttempts.update(current.id, {
      state,
      deliveryStatus: message.status,
      checkedAt: Date.now(),
      resolvedFrom: message.fromAddress || current.resolvedFrom,
    });
  });
  await announce(ownerId, { type: 'draft', draftId: attempt.draftId });
  return {
    attempt,
    message:
      attempt.state === 'unknown'
        ? 'The outcome is still unknown. Do not retry this message.'
        : `Delivery record: ${attempt.deliveryStatus || attempt.state}.`,
  };
}
