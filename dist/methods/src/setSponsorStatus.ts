import { z } from 'zod';
import { Sponsors } from './tables/sponsors';
import { owned, requireUser, announce, withClaim } from './common/guards';
export async function setSponsorStatus(input: {
  sponsorId: string;
  maintained?: boolean;
  archived?: boolean;
  doNotContact?: boolean;
}) {
  const ownerId = requireUser();
  const values = z
    .object({
      maintained: z.boolean().optional(),
      archived: z.boolean().optional(),
      doNotContact: z.boolean().optional(),
    })
    .parse(input);
  const sponsor = await withClaim(ownerId, `sponsor:${input.sponsorId}`, async () => {
    owned(await Sponsors.get(input.sponsorId), ownerId, 'Sponsor');
    return Sponsors.update(input.sponsorId, values);
  });
  await announce(ownerId, { type: 'sponsor', sponsorId: sponsor.id });
  return { sponsor };
}
