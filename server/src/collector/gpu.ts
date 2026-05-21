import { exec } from 'child_process';
import { promisify } from 'util';
import si from 'systeminformation';
import { GpuCard } from '../shared/types';

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
 * Collects GPU data.
 * Merges systeminformation.graphics() controllers with nvidia-smi detailed metrics
 * for NVIDIA GPUs, so all graphics controllers (e.g. Intel/AMD and NVIDIA) are returned.
 */
export async function getGpuSnapshot(): Promise<GpuCard[]> {
  const [graphics, nvidiaCards] = await Promise.all([
    getGraphics(),   // cached — no OS enumeration after warm-up
    getNvidiaGpus(), // live — queries nvidia-smi each call
  ]);

  let nvidiaCount = 0;

  return graphics.controllers.map((g, i) => {
    const isNvidia =
      g.vendor?.toLowerCase().includes('nvidia') ||
      g.model?.toLowerCase().includes('nvidia');

    if (isNvidia && nvidiaCards && nvidiaCount < nvidiaCards.length) {
      const nv = nvidiaCards[nvidiaCount];
      nvidiaCount++;
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

    return {
      index: i,
      name: g.model || 'Unknown GPU',
      vendor: g.vendor || 'Unknown',
      loadPercent: null,
      temperatureC: typeof g.temperatureGpu === 'number' ? g.temperatureGpu : null,
      vramTotalMB: typeof g.vram === 'number' ? g.vram : null,
      vramUsedMB: null,
      fanPercent: null,
    };
  });
}
