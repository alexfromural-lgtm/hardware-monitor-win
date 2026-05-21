import { exec } from 'child_process';
import { promisify } from 'util';
import si from 'systeminformation';
import { GpuCard } from '../shared/types';

const execAsync = promisify(exec);

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
 * Primary:  nvidia-smi (NVIDIA GPUs — full data including temp, load, VRAM, fan)
 * Fallback: systeminformation.graphics() (basic info for AMD/Intel GPUs)
 */
export async function getGpuSnapshot(): Promise<GpuCard[]> {
  const nvidiaCards = await getNvidiaGpus();

  if (nvidiaCards && nvidiaCards.length > 0) {
    return nvidiaCards;
  }

  // Fallback for non-NVIDIA GPUs
  const graphics = await si.graphics();
  return graphics.controllers.map((g, i) => ({
    index: i,
    name: g.model || 'Unknown GPU',
    vendor: g.vendor || 'Unknown',
    loadPercent: null,
    temperatureC: typeof g.temperatureGpu === 'number' ? g.temperatureGpu : null,
    vramTotalMB: typeof g.vram === 'number' ? g.vram : null,
    vramUsedMB: null,
    fanPercent: null,
  }));
}
