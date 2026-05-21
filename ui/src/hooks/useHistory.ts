import { useState, useEffect, useRef } from 'react';

const MAX_LEN = 60;
/** Only flush history to localStorage once every 5 s to avoid serialising
 *  a 60-element JSON array on every single subscription event. */
const LS_THROTTLE_MS = 5_000;

/**
 * Maintains a rolling window of up to `maxLen` numeric values,
 * persisted to localStorage under the given key.
 */
export function useHistory(
  key: string,
  value: number | null | undefined,
  maxLen: number = MAX_LEN,
): number[] {
  const storageKey = `hw-history-${key}`;

  const [history, setHistory] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed.slice(-maxLen);
      }
    } catch {
      // ignore parse errors
    }
    return [];
  });

  // Use a ref so the effect always has the latest history without re-registering
  const historyRef = useRef(history);
  historyRef.current = history;

  // Track timestamp of last localStorage write to throttle expensive I/O
  const lastWriteRef = useRef<number>(0);

  useEffect(() => {
    if (value == null) return;
    const next = [...historyRef.current, value].slice(-maxLen);
    setHistory(next);

    // Throttle: only persist to localStorage every LS_THROTTLE_MS
    const now = Date.now();
    if (now - lastWriteRef.current >= LS_THROTTLE_MS) {
      lastWriteRef.current = now;
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // quota exceeded — ignore
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, storageKey, maxLen]);

  return history;
}
