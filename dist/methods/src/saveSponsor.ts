import { z } from 'zod';
import { Sponsors } from './tables/sponsors';
import { owned, requireUser, announce, withClaim } from './common/guards';
import { contactSchema, websiteValue, publicUrl } from './common/validation';
export async function saveSponsor(input: {
  id?: string;
  name: string;
  website: string;
  sector: string;
  regions: string[];
  audiences: string[];
  notes: string;
  contact: { name: string; role: string; email: string; sourceUrl: string; note: string };
}) {
  const ownerId = requireUser();
  const values = z
    .object({
      name: z.string().trim().min(1).max(150),
      website: websiteValue,
      sector: z.string().max(150),
      regions: z.array(z.string().max(100)).max(30),
      audiences: z.array(z.string().max(100)).max(30),
      notes: z.string().max(5000),
      contact: contactSchema,
    })
    .parse(input);
  const domain = publicUrl(values.website)
    .hostname.toLowerCase()
    .replace(/^www\./, '');
  const sponsor = await withClaim(
    ownerId,
    input.id ? `sponsor:${input.id}` : `domain:${domain}`,
    async () => {
      const duplicate = await Sponsors.findOne(
        (s, $) => s.ownerId === $.ownerId && s.domain === $.domain,
        { ownerId, domain },
      ); // bindings: SQL deduplication
      if (duplicate && duplicate.id !== input.id)
        throw new Error('This company is already in your sponsor library.');
      if (input.id) {
        owned(await Sponsors.get(input.id), ownerId, 'Sponsor');
        return Sponsors.update(input.id, { ...values, domain });
      }
      return Sponsors.push({
        ...values,
        domain,
        ownerId,
        origin: 'maintained',
        maintained: true,
        archived: false,
        doNotContact: false,
        isSample: false,
      });
    },
  );
  await announce(ownerId, { type: 'sponsor', sponsorId: sponsor.id });
  return { sponsor };
}
