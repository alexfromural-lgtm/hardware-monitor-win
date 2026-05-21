import { exec } from 'child_process';
import { promisify } from 'util';
import si from 'systeminformation';
import { GpuCard } from '../shared/types';
import { getPdhGpuMemory } from './gpu-pdh';

const execAsync = promisify(exec);

// ── Static GPU controller list — fetched once, never changes ───────────────
let _graphicsCache: Awaited<ReturnType<typeof si.graphics>> | null = null;

async function getGraphics() {
  if (!_graphicsCache) {
    _graphicsCache = await si.graphics();
  }
  return _graphicsCache;
}

/**
 * Parses a value from nvidia-smi CSV output.
 * Returns null for "N/A", "[Not Supported]", or non-numeric strings.
 */
function parseNvidiaValue(raw: string): number | null {
  const trimmed = raw.trim();
  if (
    trimmed === '' ||
    trimmed === 'N/A' ||
    trimmed === '[Not Supported]' ||
    trimmed === '[Unknown Error]'
  ) {
    return null;
  }
  const n = parseFloat(trimmed);
  return isNaN(n) ? null : n;
}

/**
 * Query all NVIDIA GPUs via nvidia-smi.
 * Returns null if nvidia-smi is not found (non-NVIDIA or driver not installed).
 *
 * Fields queried:
 *   index, name, temperature.gpu, utilization.gpu,
 *   memory.total, memory.used, fan.speed
 */
async function getNvidiaGpus(): Promise<GpuCard[] | null> {
  try {
    const query = [
      'index',
      'name',
      'temperature.gpu',
      'utilization.gpu',
      'memory.total',
      'memory.used',
      'fan.speed',
    ].join(',');

    const { stdout } = await execAsync(
      `nvidia-smi --query-gpu=${query} --format=csv,noheader,nounits`,
      { timeout: 5000 }
    );

    const lines = stdout.trim().split('\n').filter(Boolean);
    if (lines.length === 0) return null;

    return lines.map((line) => {
      const parts = line.split(',');
      return {
        index: parseInt(parts[0]?.trim() ?? '0', 10),
        name: parts[1]?.trim() ?? 'Unknown GPU',
        vendor: 'NVIDIA',
        temperatureC: parseNvidiaValue(parts[2] ?? ''),
        loadPercent: parseNvidiaValue(parts[3] ?? ''),
        vramTotalMB: parseNvidiaValue(parts[4] ?? ''),
        vramUsedMB: parseNvidiaValue(parts[5] ?? ''),
        fanPercent: parseNvidiaValue(parts[6] ?? ''),
      };
    });
  } catch {
    // nvidia-smi not installed or failed — not an error, just no NVIDIA GPU
    return null;
  }
}

/**
 * Collects GPU data for all adapters.
 *
 * - NVIDIA cards:     nvidia-smi (dedicated VRAM, temp, fan, utilization)
 * - Non-NVIDIA cards: Windows PDH "GPU Adapter Memory" counters
 *
 * PDH matching strategy for non-NVIDIA adapters:
 *   Integrated GPUs (Intel/AMD iGPU) have NO dedicated VRAM — they consume
 *   shared system RAM instead.  Windows Task Manager labels this "Shared GPU
 *   memory".  Sorting PDH entries by sharedUsedBytes descending puts integrated
 *   adapters first (they hold the largest shared allocation), while near-zero
 *   virtual adapters (Microsoft Basic Display, etc.) sink to the bottom.
 *   Non-NVIDIA controllers from systeminformation are then matched in order.
 */
export async function getGpuSnapshot(): Promise<GpuCard[]> {
  const [graphics, nvidiaCards, pdhMemory] = await Promise.all([
    getGraphics(),     // cached — no OS enumeration after warm-up
    getNvidiaGpus(),   // live — queries nvidia-smi each call
    getPdhGpuMemory(), // live — Windows PDH counters for all adapters
  ]);

  let nvidiaCount    = 0;
  let nonNvidiaCount = 0;

  // Sort PDH entries by sharedUsedBytes descending so that integrated GPUs
  // (Intel/AMD iGPU — high shared, zero dedicated) naturally rank before
  // discrete non-NVIDIA adapters and virtual/idle adapters.
  const pdhByShared = [...pdhMemory].sort(
    (a, b) => b.sharedUsedBytes - a.sharedUsedBytes
  );

  return graphics.controllers.map((g, i) => {
    const isNvidia =
      g.vendor?.toLowerCase().includes('nvidia') ||
      g.model?.toLowerCase().includes('nvidia');

    if (isNvidia && nvidiaCards && nvidiaCount < nvidiaCards.length) {
      const nv = nvidiaCards[nvidiaCount++];
      return {
        index: i,
        name: nv.name || g.model || 'Unknown GPU',
        vendor: 'NVIDIA',
        loadPercent: nv.loadPercent,
        temperatureC: nv.temperatureC,
        vramTotalMB: nv.vramTotalMB || (typeof g.vram === 'number' ? g.vram : null),
        vramUsedMB: nv.vramUsedMB,
        fanPercent: nv.fanPercent,
      };
    }

    // Non-NVIDIA GPU — pick the Nth PDH entry from the shared-sorted list.
    // Integrated adapters (Intel HD, Intel Iris, AMD Vega iGPU) rank first
    // because they hold large shared allocations with zero dedicated VRAM.
    const pdh = pdhByShared[nonNvidiaCount++] ?? null;

    // sharedUsedBytes is the correct metric for integrated GPUs — it is exactly
    // what Windows Task Manager shows as "Shared GPU memory in use".
    // Round to 1 decimal place, in MB.
    const pdhUsedMB = pdh !== null
      ? Math.round((pdh.sharedUsedBytes / 1024 / 1024) * 10) / 10
      : null;

    return {
      index: i,
      name: g.model || 'Unknown GPU',
      vendor: g.vendor || 'Unknown',
      loadPercent: null,
      temperatureC: typeof g.temperatureGpu === 'number' ? g.temperatureGpu : null,
      vramTotalMB: typeof g.vram === 'number' ? g.vram : null,
      vramUsedMB: pdhUsedMB,
      fanPercent: null,
    };
  });
}
