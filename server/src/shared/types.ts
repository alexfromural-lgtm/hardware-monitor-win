// Shared TypeScript interfaces used by both the Collector and the GraphQL Server.
// Single source of truth for the hardware data shape across the entire project.

export interface Sensor {
  name: string;
  value: number;
  min: number;
  max: number;
}

export interface CpuSnapshot {
  /** e.g. "Intel Core i7-14700F" */
  name: string;
  /** Overall CPU load percentage (0–100) */
  maxLoad: number;
  /** Per-core load sensors */
  load: Sensor[];
  /** Per-core (or package) temperature in °C — may be empty on Windows without admin */
  temperature: Sensor[];
  /** Per-core clock speed in MHz */
  clock: Sensor[];
}

export interface RamSnapshot {
  totalGB: number;
  usedGB: number;
  freeGB: number;
  /** Used / Total * 100 */
  loadPercent: number;
}

export interface GpuCard {
  index: number;
  /** e.g. "NVIDIA GeForce RTX 4080" */
  name: string;
  /** e.g. "NVIDIA" */
  vendor: string;
  /** GPU core utilization % — null if unavailable */
  loadPercent: number | null;
  /** GPU temperature in °C — null if unavailable */
  temperatureC: number | null;
  /** Total VRAM in MB — null if unavailable */
  vramTotalMB: number | null;
  /** Used VRAM in MB — null if unavailable */
  vramUsedMB: number | null;
  /** Fan speed % — null if unavailable */
  fanPercent: number | null;
}

export interface HardwareSnapshot {
  cpu: CpuSnapshot;
  ram: RamSnapshot;
  gpu: GpuCard[];
  /** ISO 8601 timestamp */
  timestamp: string;
}
