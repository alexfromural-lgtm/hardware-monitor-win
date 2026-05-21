import { gql } from '@apollo/client';
import type { DocumentNode } from '@apollo/client';
import type { DisplaySettings } from '../store/displaySettings';

/**
 * Dynamically builds a GraphQL subscription document based on the user's
 * display settings. Only selected fields are included in the request,
 * so the server sends no unnecessary data.
 */
export function buildSubscription(settings: DisplaySettings): DocumentNode {
  const cpuFields = buildCpuFields(settings);
  const ramFields = settings.ram ? buildRamFields() : null;
  const gpuFields = settings.gpu.enabled ? buildGpuFields(settings) : null;

  const body = [
    `cpu { ${cpuFields} }`,
    ramFields && `ram { ${ramFields} }`,
    gpuFields && `gpu { ${gpuFields} }`,
  ]
    .filter(Boolean)
    .join('\n      ');

  return gql`
    subscription HardwareUpdated {
      hardwareUpdated {
        timestamp
        ${body}
      }
    }
  `;
}

// ── CPU ───────────────────────────────────────────────────────────────────────

function buildCpuFields(s: DisplaySettings): string {
  const parts: string[] = [
    'name',
    'maxLoad', // always needed for ring gauge
  ];
  if (s.cpu.load) parts.push('load { name value min max }');
  if (s.cpu.temperature) parts.push('temperature { name value min max }');
  if (s.cpu.clock) parts.push('clock { name value min max }');
  return parts.join(' ');
}

// ── RAM ───────────────────────────────────────────────────────────────────────

function buildRamFields(): string {
  return 'totalGB usedGB freeGB loadPercent';
}

// ── GPU ───────────────────────────────────────────────────────────────────────

function buildGpuFields(s: DisplaySettings): string {
  const parts: string[] = [
    'index',
    'name',
    'vendor',
    'loadPercent', // always needed for ring gauge
  ];
  if (s.gpu.temperature) parts.push('temperatureC');
  if (s.gpu.fan) parts.push('fanPercent');
  if (s.gpu.vram) parts.push('vramTotalMB vramUsedMB');
  return parts.join(' ');
}
