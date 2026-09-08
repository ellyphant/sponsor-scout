import { email } from '@mindstudio-ai/agent';
import { Users } from './tables/users';
import { requireUser, withClaim, announce, logFailure } from './common/guards';
import { emailValue } from './common/validation';
export async function verifySender(input: { address: string; confirmed: boolean }) {
  const ownerId = requireUser();
  if (input.confirmed !== true)
    throw new Error('Confirm the sender-check email before continuing.');
  const address = emailValue.parse(input.address).toLowerCase();
  return withClaim(ownerId, 'profile', async () => {
    const profile = await Users.get(ownerId);
    if (!profile?.email) throw new Error('Sign in with your operator email first.');
    try {
      // A requested verification message ONLY to the signed-in operator, never a sponsor.
      // The service enforces ownership of an explicit From domain. Its receipt is authoritative.
      const name = (profile.displayName || 'Elly').replace(/[<>\r\n"]/g, '');
      const receipt = await email.send({
        to: profile.email,
        from: `${name} <${address}>`,
        replyTo: profile.replyTo || profile.email,
        subject: 'Sponsor Scout sender check',
        body: 'You requested a sender check for Sponsor Scout. This message went only to your operator inbox. No sponsor was contacted.',
        bodyType: 'text',
        category: 'transactional',
      });
      const resolved = (receipt.from.match(/<([^>]+)>/)?.[1] || receipt.from).trim().toLowerCase();
      const verified =
        resolved === address &&
        receipt.recipients.some(
          (recipient) => recipient.toLowerCase() === profile.email.toLowerCase(),
        );
      const updated = await Users.update(ownerId, {
        senderAddress: address,
        senderVerified: verified,
        deliveryMode: 'test',
      });
      await announce(ownerId, { type: 'profile' });
      return {
        profile: updated,
        verified,
        message: verified
          ? 'Managed sender confirmed by the mail service. The check went only to your inbox.'
          : 'The service used a different sender. Configure an app-owned domain or subdomain before live outreach.',
      };
    } catch (err) {
      logFailure('Sender verification failed', err);
      const updated = await Users.update(ownerId, {
        senderAddress: address,
        senderVerified: false,
        deliveryMode: 'test',
      });
      await announce(ownerId, { type: 'profile' });
      return {
        profile: updated,
        verified: false,
        message:
          'Could not verify that sender. Configure an app-owned sending domain in the platform, then check again.',
      };
    }
  });
}
