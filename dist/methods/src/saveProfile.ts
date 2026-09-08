import { z } from 'zod';
import { Users } from './tables/users';
import { requireUser, announce, withClaim } from './common/guards';
import { emailValue } from './common/validation';
export async function saveProfile(input: {
  displayName: string;
  replyTo: string;
  deliveryMode: 'test' | 'live';
  introDismissed?: boolean;
}) {
  const ownerId = requireUser();
  const values = z
    .object({
      displayName: z.string().trim().min(1).max(80),
      replyTo: emailValue,
      deliveryMode: z.enum(['test', 'live']),
      introDismissed: z.boolean().optional(),
    })
    .parse(input);
  const profile = await withClaim(ownerId, 'profile', async () => {
    const current = await Users.get(ownerId);
    if (values.deliveryMode === 'live' && !(current?.senderVerified && current.senderAddress))
      throw new Error('Verify an app-owned managed sender before enabling live delivery.');
    return Users.update(ownerId, values);
  });
  await announce(ownerId, { type: 'profile' });
  return { profile };
}
