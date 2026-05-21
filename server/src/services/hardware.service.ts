import axios from 'axios';
import { HardwareSnapshot } from '../shared/types';

const COLLECTOR_URL = process.env.COLLECTOR_URL ?? 'http://host.docker.internal:5390';
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS ?? '2000', 10);

let latestSnapshot: HardwareSnapshot | null = null;
let pollTimer: NodeJS.Timeout | null = null;

async function poll(): Promise<void> {
  try {
    const response = await axios.get<HardwareSnapshot>(`${COLLECTOR_URL}/rest`, {
      timeout: 5000,
    });
    latestSnapshot = response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      // Only log connection errors; timeout/network issues logged at warn level
      console.warn(`[HardwareService] Cannot reach collector at ${COLLECTOR_URL}/rest — ${err.message}`);
    } else {
      console.error('[HardwareService] Unexpected poll error:', err);
    }
  }
}

/**
 * Start polling the hardware collector at the configured interval.
 * Fires an immediate first poll so data is available as soon as the server starts.
 */
export function startPolling(): void {
  console.log(`[HardwareService] Polling ${COLLECTOR_URL}/rest every ${POLL_INTERVAL_MS}ms`);
  poll(); // immediate first poll — don't wait for first interval
  pollTimer = setInterval(poll, POLL_INTERVAL_MS);
}

/**
 * Stop polling (for graceful shutdown).
 */
export function stopPolling(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

/**
 * Returns the most recently collected hardware snapshot.
 * Returns null if no successful poll has occurred yet.
 */
export function getLatestSnapshot(): HardwareSnapshot | null {
  return latestSnapshot;
}
