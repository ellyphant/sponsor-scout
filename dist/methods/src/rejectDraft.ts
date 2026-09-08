import { Drafts } from './tables/drafts';
import { owned, requireUser, withClaim, announce } from './common/guards';
import { assertMutable } from './common/outreach';
export async function rejectDraft(input: {
  draftId: string;
  expectedRevision: number;
  reason?: string;
}) {
  const ownerId = requireUser();
  const draft = await withClaim(ownerId, `draft:${input.draftId}`, async () => {
    const current = owned(await Drafts.get(input.draftId), ownerId, 'Draft');
    await assertMutable(ownerId, current.id);
    if (current.revision !== input.expectedRevision || current.reviewState !== 'pending')
      throw new Error('This draft has already changed or been reviewed.');
    return Drafts.update(current.id, {
      reviewState: 'rejected',
      revision: current.revision + 1,
      rejectionReason: (input.reason || '').trim().slice(0, 1000),
    });
  });
  await announce(ownerId, { type: 'draft', draftId: draft.id });
  return { draft };
}
