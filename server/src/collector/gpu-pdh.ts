import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface PdhGpuMemory {
  /** Raw PDH adapter key, e.g. "luid_0x00000000_0x0000a0a9_phys_0" */
  adapterKey: string;
  /** Dedicated (local) VRAM usage in bytes */
  dedicatedUsedBytes: number;
  /** Shared (system RAM used as VRAM) in bytes */
  sharedUsedBytes: number;
}

/**
 * Queries Windows PDH "GPU Adapter Memory" performance counters via typeperf.
 * Works for Intel, AMD, and NVIDIA GPUs — no extra drivers required.
 *
 * Counter paths used:
 *   \GPU Adapter Memory(*)\Dedicated Usage  — dedicated VRAM used (bytes)
 *   \GPU Adapter Memory(*)\Shared Usage     — shared memory used (bytes)
 *
 * Returns an empty array if the counters are unavailable (e.g. older Windows).
 */
export async function getPdhGpuMemory(): Promise<PdhGpuMemory[]> {
  try {
    // typeperf takes one sample (-sc 1), CSV format, no banner (-y)
    const cmd = [
      'typeperf',
      '"\\GPU Adapter Memory(*)\\Dedicated Usage"',
      '"\\GPU Adapter Memory(*)\\Shared Usage"',
      '-sc', '1',
      '-y',  // suppress banner / header confirmation prompts
    ].join(' ');

    const { stdout } = await execAsync(cmd, { timeout: 8000 });

    return parsePdhOutput(stdout);
  } catch {
    // Counter not available on this Windows version, or typeperf failed
    return [];
  }
}

/**
 * Parses typeperf CSV output.
 *
 * typeperf outputs two lines when -y is used:
 *   Line 0: header  — "(PDH-CSV 4.0)","\\host\GPU Adapter Memory(luid_...)\Dedicated Usage",...
 *   Line 1: values  — "timestamp","<bytes>","<bytes>",...
 *
 * We parse header keys to build an adapterKey→{ded,shared} map.
 */
function parsePdhOutput(raw: string): PdhGpuMemory[] {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = splitCsv(lines[0]);
  const values  = splitCsv(lines[1]);

  // Map: adapterKey → { dedicatedUsedBytes?, sharedUsedBytes? }
  const map = new Map<string, Partial<PdhGpuMemory>>();

  for (let i = 1; i < headers.length; i++) {
    const header = headers[i] ?? '';
    const raw    = values[i]  ?? '';
    const value  = parseFloat(raw);
    if (isNaN(value)) continue;

    // Header looks like: \\HOSTNAME\GPU Adapter Memory(luid_0x…_phys_N)\Dedicated Usage
    const counterMatch = header.match(/GPU Adapter Memory\(([^)]+)\)\\(\w+)/i);
    if (!counterMatch) continue;

    const adapterKey  = counterMatch[1];  // e.g. "luid_0x00000000_0x0000a0a9_phys_0"
    const counterName = counterMatch[2].toLowerCase(); // "dedicated" or "shared"

    if (!map.has(adapterKey)) map.set(adapterKey, { adapterKey });

    const entry = map.get(adapterKey)!;
    if (counterName.startsWith('dedicated')) {
      entry.dedicatedUsedBytes = value;
    } else if (counterName.startsWith('shared')) {
      entry.sharedUsedBytes = value;
    }
  }

  return Array.from(map.values())
    .filter((e): e is PdhGpuMemory =>
      e.adapterKey !== undefined &&
      e.dedicatedUsedBytes !== undefined &&
      e.sharedUsedBytes    !== undefined
    )
    .map((e) => ({
      adapterKey:        e.adapterKey!,
      dedicatedUsedBytes: e.dedicatedUsedBytes!,
      sharedUsedBytes:    e.sharedUsedBytes!,
    }));
}

/**
 * Splits a single CSV line, stripping surrounding double-quotes from each field.
 */
function splitCsv(line: string): string[] {
  return line.split(',').map((field) => field.replace(/^"|"$/g, '').trim());
}
