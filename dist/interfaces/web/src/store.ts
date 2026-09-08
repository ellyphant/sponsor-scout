import { create } from 'zustand';
import api, { type Workspace, type Updates, type ActivityRow } from './api';
export interface Toast {
  id: string;
  message: string;
  kind: 'info' | 'error' | 'success';
}
const merge = <T extends { id: string }>(old: T[], incoming: T[]) => [
  ...new Map([...old, ...incoming].map((row) => [row.id, row])).values(),
];
interface Store {
  data: Workspace | null;
  activity: ActivityRow[];
  loadedRuns: string[];
  loading: boolean;
  error: string;
  selectedRunId: string;
  connected: boolean;
  toasts: Toast[];
  bootstrap: () => Promise<void>;
  openRun: (id: string, force?: boolean) => Promise<void>;
  apply: (updates: Partial<Updates>) => void;
  clear: () => void;
  setConnected: (value: boolean) => void;
  notify: (message: string, kind?: Toast['kind']) => void;
  dismissToast: (id: string) => void;
}
let boot: Promise<void> | null = null;
let generation = 0;
export const useStore = create<Store>((set, get) => ({
  data: null,
  activity: [],
  loadedRuns: [],
  loading: true,
  error: '',
  selectedRunId: '',
  connected: false,
  toasts: [],
  bootstrap: async () => {
    if (boot) return boot;
    const epoch = generation;
    boot = (async () => {
      try {
        const data = await api.getWorkspace();
        if (epoch !== generation) return;
        set({
          data,
          loading: false,
          error: '',
          selectedRunId: get().selectedRunId || data.runs[0]?.id || '',
        });
        if (get().selectedRunId) await get().openRun(get().selectedRunId, true);
      } catch (err) {
        if (epoch === generation) set({ loading: false, error: messageOf(err) });
      } finally {
        boot = null;
      }
    })();
    return boot;
  },
  openRun: async (id, force = false) => {
    set({ selectedRunId: id });
    if (!force && get().loadedRuns.includes(id)) return;
    const epoch = generation;
    try {
      const detail = await api.getRun({ runId: id });
      if (epoch !== generation) return;
      get().apply({
        runs: [detail.run],
        drafts: detail.drafts,
        assessments: detail.assessments,
        activity: detail.activity,
      });
      set((state) => ({ loadedRuns: [...new Set([...state.loadedRuns, id])] }));
    } catch (err) {
      get().notify(messageOf(err), 'error');
    }
  },
  apply: (updates) =>
    set((state) => {
      if (!state.data) return {};
      const data = { ...state.data };
      // Patch each collection independently; preserve loaded records on navigation.
      if (updates.runs) data.runs = merge(data.runs, updates.runs);
      if (updates.sponsors) data.sponsors = merge(data.sponsors, updates.sponsors);
      if (updates.drafts) data.drafts = merge(data.drafts, updates.drafts);
      if (updates.assessments) data.assessments = merge(data.assessments, updates.assessments);
      if (updates.attempts) data.attempts = merge(data.attempts, updates.attempts);
      if (updates.profile) {
        data.profile = updates.profile;
        data.setup = {
          ...data.setup,
          senderConfigured: Boolean(
            updates.profile.senderAddress && updates.profile.senderVerified,
          ),
        };
      }
      return {
        data,
        activity: updates.activity
          ? merge(state.activity, updates.activity).sort((a, b) => a.seq - b.seq)
          : state.activity,
      };
    }),
  clear: () => {
    generation++;
    boot = null;
    set({
      data: null,
      activity: [],
      loadedRuns: [],
      selectedRunId: '',
      loading: true,
      error: '',
      connected: false,
      toasts: [],
    });
  },
  setConnected: (connected) => set({ connected }),
  notify: (message, kind = 'info') => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, message, kind }] }));
    setTimeout(() => get().dismissToast(id), 5500);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
export function messageOf(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/operator profile not found|invalid_session|not_authenticated/i.test(message))
    return 'Your session needs a refresh. Sign in again to reopen your saved workspace.';
  if (message.startsWith('[') || message.includes('invalid_format'))
    return 'Check the form fields and try again.';
  if (/\b[45]\d\d\b|failed to fetch|networkerror|internal server error/i.test(message)) {
    if (/confirmDispatch/i.test(message))
      return 'The send outcome could not be confirmed. Check delivery history before retrying.';
    if (/prepareDispatch/i.test(message))
      return 'The review could not be prepared. Your draft is unchanged. Retry, or refresh your sign-in if this continues.';
    if (/saveDraft|saveSponsor|saveProfile|rejectDraft/i.test(message))
      return 'The change could not be saved. Your edits are still here; try again when the connection returns.';
    return 'The console could not reach the service. Your saved work is unchanged.';
  }
  return message || 'The request could not finish. Your saved work is unchanged.';
}
