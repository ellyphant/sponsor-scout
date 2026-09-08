import { useEffect, useRef } from 'react';
import { create } from 'zustand';

interface Guard { id: string; busy: boolean; discard: () => void }
interface NavigationState {
  guard: Guard | null;
  pending: (() => void) | null;
  request: (action: () => void) => void;
  stay: () => void;
  leave: () => void;
  reset: () => void;
}
// Ephemeral UI state only. No private draft text is stored in browser persistence.
export const useNavigation = create<NavigationState>((set, get) => ({
  guard: null,
  pending: null,
  request: (action) => { if (get().guard) set({ pending: action }); else action(); },
  stay: () => set({ pending: null }),
  leave: () => {
    const { guard, pending } = get();
    if (guard?.busy) return;
    guard?.discard();
    set({ guard: null, pending: null });
    pending?.();
  },
  reset: () => set({ guard: null, pending: null }),
}));

export function useUnsavedGuard(dirty: boolean, discard: () => void, busy = false) {
  const id = useRef(crypto.randomUUID());
  const latestDiscard = useRef(discard);
  latestDiscard.current = discard;
  useEffect(() => {
    if (!dirty && !busy) return;
    const key = id.current;
    useNavigation.setState({ guard: { id: key, busy, discard: () => latestDiscard.current() } });
    return () => {
      if (useNavigation.getState().guard?.id === key) useNavigation.setState({ guard: null });
    };
  }, [dirty, busy]);
}
