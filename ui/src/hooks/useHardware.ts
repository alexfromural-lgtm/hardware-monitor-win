import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { useSubscription } from '@apollo/client/react';
import type { HardwareSnapshot } from '../graphql/types';
import { buildSubscription } from '../graphql/buildSubscription';
import { useDisplaySettings } from '../store/displaySettings';
import { POLL_INTERVAL_CHANGED } from '../graphql/queries';

interface UseHardwareResult {
  snapshot: HardwareSnapshot | null;
  loading: boolean;
  error: Error | undefined;
}

export function useHardware(): UseHardwareResult {
  const { settings, dispatch } = useDisplaySettings();

  // Rebuild the gql document only when settings change
  const query = useMemo(() => buildSubscription(settings), [settings]);

  // Raw subscription — fires at the server's poll rate
  const { data, loading, error } = useSubscription<{ hardwareUpdated: HardwareSnapshot | null }>(
    query,
  );

  // ── Sync poll interval across all clients ───────────────────────────────────
  // When any client calls setPollInterval the server broadcasts pollIntervalChanged.
  // We listen here and update the local store so every client's UI picker stays
  // in sync without requiring a page refresh.
  useSubscription<{ pollIntervalChanged: number }>(POLL_INTERVAL_CHANGED, {
    onData: ({ data: { data: intervalData } }) => {
      const ms = intervalData?.pollIntervalChanged;
      if (ms != null) {
        dispatch({ type: 'SET_UPDATE_INTERVAL', payload: ms });
      }
    },
  });

  // ── Client-side throttle ────────────────────────────────────────────────────
  // The snapshot state only updates at most once per updateInterval ms.
  // When the server interval matches the client interval this is effectively
  // a pass-through; it remains as a safety net for edge cases.
  const [snapshot, setSnapshot] = useState<HardwareSnapshot | null>(null);

  // Use refs so the flush callback never becomes stale
  const pendingRef    = useRef<HardwareSnapshot | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const timerRef      = useRef<number | null>(null);
  const intervalRef   = useRef<number>(settings.updateInterval);
  intervalRef.current = settings.updateInterval; // always current, no re-render

  const flush = useCallback(() => {
    timerRef.current = null;
    if (pendingRef.current && !document.hidden) {
      setSnapshot(pendingRef.current);
      lastUpdateRef.current = Date.now();
    }
  }, []);

  useEffect(() => {
    const incoming = data?.hardwareUpdated ?? null;
    if (!incoming) return;

    pendingRef.current = incoming;

    // ── Page Visibility API: don't render while tab is hidden ──────────────
    if (document.hidden) return;

    const now     = Date.now();
    const elapsed = now - lastUpdateRef.current;
    const wait    = intervalRef.current;

    if (elapsed >= wait) {
      // Enough time has passed — update React state immediately
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setSnapshot(incoming);
      lastUpdateRef.current = now;
    } else if (timerRef.current === null) {
      // Schedule flush for when the remaining interval elapses
      timerRef.current = window.setTimeout(flush, wait - elapsed);
    }
    // else: timer already running; pendingRef holds the latest value
  }, [data, flush]);

  // When tab becomes visible again, immediately show the buffered snapshot
  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden && pendingRef.current) {
        setSnapshot(pendingRef.current);
        lastUpdateRef.current = Date.now();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
  }, []);

  return {
    snapshot,
    loading: loading && !snapshot,
    error,
  };
}
