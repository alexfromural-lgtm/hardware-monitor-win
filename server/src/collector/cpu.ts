import si from 'systeminformation';
import { CpuSnapshot, Sensor } from '../shared/types';

/**
 * Collects a CPU snapshot using systeminformation.
 * - Load: si.currentLoad() — reliable on Windows
 * - Temperature: si.cpuTemperature() — may return empty on Windows without Admin
 * - Clock: si.cpuCurrentSpeed() — per-core MHz
 */
export async function getCpuSnapshot(): Promise<CpuSnapshot> {
  const [cpuInfo, currentLoad, cpuTemp, cpuSpeed] = await Promise.all([
    si.cpu(),
    si.currentLoad(),
    si.cpuTemperature(),
    si.cpuCurrentSpeed(),
  ]);

  // ── Per-core load ──────────────────────────────────────────────────────────
  const load: Sensor[] = currentLoad.cpus.map((core, i) => ({
    name: `Core ${i}`,
    value: Math.round(core.load * 10) / 10,
    min: 0,
    max: 100,
  }));

  // ── Temperature ────────────────────────────────────────────────────────────
  // On Windows, cpuTemperature often requires Admin privileges.
  // We gracefully return an empty array when data is unavailable.
  const temperature: Sensor[] = [];
  const maxTemp = cpuTemp.max ?? 100;

  if (cpuTemp.cores && cpuTemp.cores.length > 0) {
    cpuTemp.cores.forEach((temp, i) => {
      if (temp !== null && temp !== undefined && temp > 0) {
        temperature.push({
          name: `Core ${i}`,
          value: Math.round(temp),
          min: 0,
          max: maxTemp,
        });
      }
    });
  } else if (cpuTemp.main !== null && cpuTemp.main !== undefined && cpuTemp.main > 0) {
    temperature.push({
      name: 'CPU Package',
      value: Math.round(cpuTemp.main),
      min: 0,
      max: maxTemp,
    });
  }

  // ── Per-core clock speed (GHz → MHz) ──────────────────────────────────────
  const maxSpeedMhz = Math.round((cpuInfo.speedMax || cpuInfo.speed) * 1000);
  const clock: Sensor[] = [];

  if (Array.isArray(cpuSpeed.cores) && cpuSpeed.cores.length > 0) {
    cpuSpeed.cores.forEach((speedGhz, i) => {
      clock.push({
        name: `Core ${i}`,
        value: Math.round(speedGhz * 1000),
        min: 0,
        max: maxSpeedMhz,
      });
    });
  } else {
    clock.push({
      name: 'CPU',
      value: Math.round((cpuSpeed.avg || cpuInfo.speed) * 1000),
      min: 0,
      max: maxSpeedMhz,
    });
  }

  return {
    name: cpuInfo.brand,
    maxLoad: Math.round(currentLoad.currentLoad * 10) / 10,
    load,
    temperature,
    clock,
  };
}
