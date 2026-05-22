import { useState, useEffect, useRef } from 'react';

const MAX_LEN = 60;
const STORAGE_KEY = 'hw-monitor-history-data';

// Load consolidated history data from localStorage once at boot (no repeated reads)
let globalHistoryData: Record<string, number[]> = {};
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) globalHistoryData = JSON.parse(stored);
} catch { /* ignore */ }

// Single global debounced save — writes ALL series in one JSON blob at most once per 10 s
let saveTimer: number | null = null;
function queueSave() {
  if (saveTimer !== null) return;
  saveTimer = window.setTimeout(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(globalHistoryData)); } catch { /* quota */ }
    saveTimer = null;
  }, 10_000);
}

/**
 * Rolling window of up to `maxLen` values, backed by a single shared
 * localStorage key (written at most once every 10 s).
 *
 * Uses a ref to detect when `value` actually changes so the setState
 * call (and its re-render) only fires when there is new data.
 */
export function useHistory(
  key: string,
  value: number | null | undefined,
  timestamp: string | null | undefined,
  maxLen: number = MAX_LEN,
): number[] {
  const cacheKey = `hw-history-${key}`;

  const [history, setHistory] = useState<number[]>(() => {
    const arr = globalHistoryData[cacheKey];
    return Array.isArray(arr) ? arr.slice(-maxLen) : [];
  });

  // Track the last timestamp we processed so we only append once per snapshot
  const lastTimestampRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    // Guard: skip if no new snapshot or value is absent
    if (!timestamp || timestamp === lastTimestampRef.current) return;
    if (value == null) return;

    lastTimestampRef.current = timestamp;

    setHistory(prev => {
      const next = [...prev, value].slice(-maxLen);
      globalHistoryData[cacheKey] = next;
      queueSave();
      return next;
    });
  }, [timestamp, value, cacheKey, maxLen]);

  return history;
}

