import { z } from 'zod';
import { Drafts } from './tables/drafts';
import { owned, requireUser, withClaim, announce } from './common/guards';
import { optionalEmail } from './common/validation';
import { assertMutable } from './common/outreach';
export async function saveDraft(input: {
  draftId: string;
  expectedRevision: number;
  recipientName: string;
  recipientRole: string;
  recipientEmail: string;
  subject: string;
  body: string;
}) {
  const ownerId = requireUser();
  const values = z
    .object({
      recipientName: z.string().max(150),
      recipientRole: z.string().max(200),
      recipientEmail: optionalEmail,
      subject: z
        .string()
        .trim()
        .min(1)
        .max(120)
        .refine((s) => !/[\r\n]/.test(s), 'Subject must be a single line.'),
      body: z.string().trim().min(1).max(12000),
    })
    .parse(input);
  const draft = await withClaim(ownerId, `draft:${input.draftId}`, async () => {
    const current = owned(await Drafts.get(input.draftId), ownerId, 'Draft');
    await assertMutable(ownerId, current.id);
    if (current.revision !== input.expectedRevision)
      throw new Error('This draft changed in another view. Reload it before saving.');
    const contactChanged =
      current.recipientEmail !== values.recipientEmail ||
      current.recipientName !== values.recipientName ||
      current.recipientRole !== values.recipientRole;
    return Drafts.update(current.id, {
      ...values,
      revision: current.revision + 1,
      reviewState: 'pending',
      rejectionReason: '',
      recipientSource: !values.recipientEmail
        ? 'missing'
        : contactChanged
          ? 'operator'
          : current.recipientSource,
      recipientSourceUrl: contactChanged ? '' : current.recipientSourceUrl,
    });
  });
  await announce(ownerId, { type: 'draft', draftId: draft.id });
  return { draft };
}
