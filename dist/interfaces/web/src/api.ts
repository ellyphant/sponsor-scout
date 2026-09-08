import { createClient } from '@mindstudio-ai/interface';
import type { getWorkspace } from '../../../methods/src/getWorkspace';
import type { getRun } from '../../../methods/src/getRun';
import type { watchWorkspace } from '../../../methods/src/watchWorkspace';
import type { readUpdates } from '../../../methods/src/readUpdates';
import type { saveSponsor } from '../../../methods/src/saveSponsor';
import type { setSponsorStatus } from '../../../methods/src/setSponsorStatus';
import type { saveProfile } from '../../../methods/src/saveProfile';
import type { checkConnection } from '../../../methods/src/checkConnection';
import type { verifySender } from '../../../methods/src/verifySender';
import type { startRun } from '../../../methods/src/startRun';
import type { stopRun } from '../../../methods/src/stopRun';
import type { saveDraft } from '../../../methods/src/saveDraft';
import type { rejectDraft } from '../../../methods/src/rejectDraft';
import type { prepareDispatch } from '../../../methods/src/prepareDispatch';
import type { confirmDispatch } from '../../../methods/src/confirmDispatch';
import type { refreshDelivery } from '../../../methods/src/refreshDelivery';
export type Workspace = Awaited<ReturnType<typeof getWorkspace>>;
export type RunDetail = Awaited<ReturnType<typeof getRun>>;
export type Prepared = Awaited<ReturnType<typeof prepareDispatch>>;
export type Updates = Awaited<ReturnType<typeof readUpdates>>;
export type {
  SponsorRow,
  RunRow,
  AssessmentRow,
  DraftRow,
  AttemptRow,
  ActivityRow,
  UserRow,
} from '../../../methods/src/common/records';
export type { Source, CoHostEvent, Factor, Match, Scope } from '../../../methods/src/common/domain';
const api = createClient<{
  getWorkspace: typeof getWorkspace;
  getRun: typeof getRun;
  watchWorkspace: typeof watchWorkspace;
  readUpdates: typeof readUpdates;
  saveSponsor: typeof saveSponsor;
  setSponsorStatus: typeof setSponsorStatus;
  saveProfile: typeof saveProfile;
  checkConnection(
    input: Parameters<typeof checkConnection>[0],
    options?: { stream: boolean; onToken?: (text: string) => void },
  ): ReturnType<typeof checkConnection>;
  verifySender: typeof verifySender;
  startRun: typeof startRun;
  stopRun: typeof stopRun;
  saveDraft: typeof saveDraft;
  rejectDraft: typeof rejectDraft;
  prepareDispatch: typeof prepareDispatch;
  confirmDispatch: typeof confirmDispatch;
  refreshDelivery: typeof refreshDelivery;
}>();
export default api;
