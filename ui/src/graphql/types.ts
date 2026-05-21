// Shared TypeScript interfaces mirroring server/src/shared/types.ts

export interface Sensor {
  name: string;
  value: number;
  min: number;
  max: number;
}

export interface CpuSnapshot {
  name: string;
  maxLoad: number;
  load: Sensor[];
  temperature: Sensor[];
  clock: Sensor[];
}

export interface RamSnapshot {
  totalGB: number;
  usedGB: number;
  freeGB: number;
  loadPercent: number;
}

export interface GpuCard {
  index: number;
  name: string;
  vendor: string;
  loadPercent: number | null;
  temperatureC: number | null;
  vramTotalMB: number | null;
  vramUsedMB: number | null;
  fanPercent: number | null;
}

export interface HardwareSnapshot {
  cpu: CpuSnapshot;
  ram: RamSnapshot;
  gpu: GpuCard[];
  timestamp: string;
}
