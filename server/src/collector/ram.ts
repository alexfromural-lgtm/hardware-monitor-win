import si from 'systeminformation';
import { RamSnapshot } from '../shared/types';

const BYTES_PER_GB = 1024 * 1024 * 1024;

const toGB = (bytes: number): number => Math.round((bytes / BYTES_PER_GB) * 10) / 10;

/**
 * Collects a RAM snapshot using systeminformation.
 * Uses mem.active for "used" (actual physical pages in use, excluding cache/buffers).
 * Uses mem.available for "free" (what the OS reports as available to applications).
 */
export async function getRamSnapshot(): Promise<RamSnapshot> {
  const mem = await si.mem();

  const totalGB = toGB(mem.total);
  const usedGB = toGB(mem.active);
  const freeGB = toGB(mem.available);
  const loadPercent = Math.round((mem.active / mem.total) * 1000) / 10;

  return { totalGB, usedGB, freeGB, loadPercent };
}
