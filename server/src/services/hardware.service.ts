import axios from 'axios';
import { PubSub } from 'graphql-subscriptions';
import { HardwareSnapshot } from '../shared/types';

const COLLECTOR_URL = process.env.COLLECTOR_URL ?? 'http://host.docker.internal:5390';
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS ?? '2000', 10);

export const pubsub = new PubSub();
const HARDWARE_UPDATED = 'HARDWARE_UPDATED';
const POLL_INTERVAL_CHANGED = 'POLL_INTERVAL_CHANGED';

/** Minimum / maximum accepted poll intervals (ms). */
const MIN_INTERVAL_MS = 500;
const MAX_INTERVAL_MS = 60_000;

let latestSnapshot: HardwareSnapshot | null = null;
let pollTimer: NodeJS.Timeout | null = null;
let currentPollIntervalMs = POLL_INTERVAL_MS;

async function poll(): Promise<void> {
  try {
    const response = await axios.get<HardwareSnapshot>(`${COLLECTOR_URL}/rest`, {
      timeout: 5000,
    });
    latestSnapshot = response.data;
    pubsub.publish(HARDWARE_UPDATED, { hardwareUpdated: latestSnapshot });
  } catch (err) {
    if (axios.isAxiosError(err)) {
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
 * Dynamically change the poll interval at runtime.
 * The new value is clamped to [MIN_INTERVAL_MS, MAX_INTERVAL_MS].
 * Immediately restarts the interval and broadcasts the change to all
 * connected clients via the pollIntervalChanged subscription.
 * Returns the accepted (possibly clamped) interval in ms.
 */
export function restartPolling(newIntervalMs: number): number {
  const clamped = Math.max(MIN_INTERVAL_MS, Math.min(MAX_INTERVAL_MS, newIntervalMs));
  stopPolling();
  currentPollIntervalMs = clamped;
  console.log(`[HardwareService] Poll interval changed to ${clamped}ms`);
  poll(); // immediate poll so clients get fresh data right away
  pollTimer = setInterval(poll, clamped);
  pubsub.publish(POLL_INTERVAL_CHANGED, { pollIntervalChanged: clamped });
  return clamped;
}

/**
 * Returns the most recently collected hardware snapshot.
 * Returns null if no successful poll has occurred yet.
 */
export function getLatestSnapshot(): HardwareSnapshot | null {
  return latestSnapshot;
}

export function getCurrentPollInterval(): number {
  return currentPollIntervalMs;
}

export { HARDWARE_UPDATED, POLL_INTERVAL_CHANGED };
