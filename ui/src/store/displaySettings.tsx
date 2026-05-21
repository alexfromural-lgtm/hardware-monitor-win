import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

export interface DisplaySettings {
  cpu: {
    load: boolean;
    temperature: boolean;
    clock: boolean;
  };
  ram: boolean;
  gpu: {
    enabled: boolean;
    temperature: boolean;
    fan: boolean;
    vram: boolean;
  };
}

export type DisplaySettingsAction =
  | { type: 'TOGGLE_CPU_LOAD' }
  | { type: 'TOGGLE_CPU_TEMPERATURE' }
  | { type: 'TOGGLE_CPU_CLOCK' }
  | { type: 'TOGGLE_RAM' }
  | { type: 'TOGGLE_GPU_ENABLED' }
  | { type: 'TOGGLE_GPU_TEMPERATURE' }
  | { type: 'TOGGLE_GPU_FAN' }
  | { type: 'TOGGLE_GPU_VRAM' }
  | { type: 'RESET' };

// ── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: DisplaySettings = {
  cpu: { load: true, temperature: true, clock: true },
  ram: true,
  gpu: { enabled: true, temperature: true, fan: true, vram: true },
};

const STORAGE_KEY = 'hw-monitor-display-settings';

function loadFromStorage(): DisplaySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as DisplaySettings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state: DisplaySettings, action: DisplaySettingsAction): DisplaySettings {
  switch (action.type) {
    case 'TOGGLE_CPU_LOAD':
      return { ...state, cpu: { ...state.cpu, load: !state.cpu.load } };
    case 'TOGGLE_CPU_TEMPERATURE':
      return { ...state, cpu: { ...state.cpu, temperature: !state.cpu.temperature } };
    case 'TOGGLE_CPU_CLOCK':
      return { ...state, cpu: { ...state.cpu, clock: !state.cpu.clock } };
    case 'TOGGLE_RAM':
      return { ...state, ram: !state.ram };
    case 'TOGGLE_GPU_ENABLED':
      return { ...state, gpu: { ...state.gpu, enabled: !state.gpu.enabled } };
    case 'TOGGLE_GPU_TEMPERATURE':
      return { ...state, gpu: { ...state.gpu, temperature: !state.gpu.temperature } };
    case 'TOGGLE_GPU_FAN':
      return { ...state, gpu: { ...state.gpu, fan: !state.gpu.fan } };
    case 'TOGGLE_GPU_VRAM':
      return { ...state, gpu: { ...state.gpu, vram: !state.gpu.vram } };
    case 'RESET':
      return DEFAULT_SETTINGS;
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

interface DisplaySettingsContextValue {
  settings: DisplaySettings;
  dispatch: React.Dispatch<DisplaySettingsAction>;
}

const DisplaySettingsContext = createContext<DisplaySettingsContextValue | null>(null);

export function DisplaySettingsProvider({ children }: { children: ReactNode }) {
  const [settings, dispatch] = useReducer(reducer, undefined, loadFromStorage);

  // Persist to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  return (
    <DisplaySettingsContext.Provider value={{ settings, dispatch }}>
      {children}
    </DisplaySettingsContext.Provider>
  );
}

export function useDisplaySettings(): DisplaySettingsContextValue {
  const ctx = useContext(DisplaySettingsContext);
  if (!ctx) throw new Error('useDisplaySettings must be used inside DisplaySettingsProvider');
  return ctx;
}
