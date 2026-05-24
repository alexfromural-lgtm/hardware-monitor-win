import { memo } from 'react';
import { useMutation } from '@apollo/client/react';
import { useDisplaySettings } from '../../store/displaySettings';
import type { DisplaySettingsAction } from '../../store/displaySettings';
import { SET_POLL_INTERVAL } from '../../graphql/queries';

interface ToggleProps {
  label: string;
  checked: boolean;
  action: DisplaySettingsAction;
  dispatch: React.Dispatch<DisplaySettingsAction>;
  indent?: boolean;
}

function Toggle({ label, checked, action, dispatch, indent = false }: ToggleProps) {
  return (
    <label
      className="settings-toggle"
      style={{ paddingLeft: indent ? '1.5rem' : '0' }}
    >
      <span className="settings-toggle__label">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => dispatch(action)}
        className={`settings-toggle__switch ${checked ? 'settings-toggle__switch--on' : ''}`}
      >
        <span className="settings-toggle__thumb" />
      </button>
    </label>
  );
}

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { settings, dispatch } = useDisplaySettings();
  const [setPollInterval] = useMutation<{ setPollInterval: number }, { ms: number }>(
    SET_POLL_INTERVAL,
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className={`settings-backdrop ${open ? 'settings-backdrop--visible' : ''}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className={`settings-panel ${open ? 'settings-panel--open' : ''}`}>
        {/* Header */}
        <div className="settings-panel__header">
          <div className="settings-panel__title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
            </svg>
            Display Options
          </div>
          <div className="settings-panel__actions">
            <button className="settings-panel__reset" onClick={() => dispatch({ type: 'RESET' })}>
              Reset
            </button>
            <button className="settings-panel__close" onClick={onClose} aria-label="Close settings">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="settings-panel__body">
          {/* CPU Section */}
          <section className="settings-section">
            <div className="settings-section__label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <rect x="9" y="9" width="6" height="6" />
                <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
                <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
                <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="15" x2="23" y2="15" />
                <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="15" x2="4" y2="15" />
              </svg>
              CPU
            </div>
            <Toggle label="CPU Card"         checked={settings.cpu.enabled}     action={{ type: 'TOGGLE_CPU_ENABLED' }}     dispatch={dispatch} indent />
            <Toggle label="Per-core Load"    checked={settings.cpu.load}        action={{ type: 'TOGGLE_CPU_LOAD' }}        dispatch={dispatch} indent />
            <Toggle label="Temperature"      checked={settings.cpu.temperature} action={{ type: 'TOGGLE_CPU_TEMPERATURE' }} dispatch={dispatch} indent />
            <Toggle label="Clock Speed"      checked={settings.cpu.clock}       action={{ type: 'TOGGLE_CPU_CLOCK' }}       dispatch={dispatch} indent />
          </section>

          <div className="settings-divider" />

          {/* RAM Section */}
          <section className="settings-section">
            <div className="settings-section__label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2">
                <rect x="2" y="7" width="20" height="10" rx="1" />
                <line x1="6" y1="7" x2="6" y2="17" /><line x1="10" y1="7" x2="10" y2="17" />
                <line x1="14" y1="7" x2="14" y2="17" /><line x1="18" y1="7" x2="18" y2="17" />
              </svg>
              RAM
            </div>
            <Toggle label="RAM Card" checked={settings.ram} action={{ type: 'TOGGLE_RAM' }} dispatch={dispatch} indent />
          </section>

          <div className="settings-divider" />

          {/* GPU Section */}
          <section className="settings-section">
            <div className="settings-section__label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
                <rect x="1" y="6" width="22" height="12" rx="2" />
                <path d="M8 12h8M12 8v8" />
                <line x1="5" y1="18" x2="5" y2="21" /><line x1="19" y1="18" x2="19" y2="21" />
              </svg>
              GPU
            </div>
            <Toggle label="GPU Card"    checked={settings.gpu.enabled}     action={{ type: 'TOGGLE_GPU_ENABLED' }}     dispatch={dispatch} indent />
            <Toggle label="Temperature" checked={settings.gpu.temperature} action={{ type: 'TOGGLE_GPU_TEMPERATURE' }} dispatch={dispatch} indent />
            <Toggle label="Fan Speed"   checked={settings.gpu.fan}         action={{ type: 'TOGGLE_GPU_FAN' }}         dispatch={dispatch} indent />
            <Toggle label="VRAM Usage"  checked={settings.gpu.vram}        action={{ type: 'TOGGLE_GPU_VRAM' }}        dispatch={dispatch} indent />
          </section>

          <div className="settings-divider" />

          {/* Update Speed Section */}
          <section className="settings-section">
            <div className="settings-select-group">
              <div className="settings-select-group__label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Update Frequency
              </div>
              <div className="settings-select-buttons">
                {[1000, 2000, 5000, 10000].map((ms) => (
                  <button
                    key={ms}
                    className={`settings-select-btn ${
                      settings.updateInterval === ms ? 'settings-select-btn--active' : ''
                    }`}
                    onClick={() => {
                      // Optimistic local update — UI responds instantly
                      dispatch({ type: 'SET_UPDATE_INTERVAL', payload: ms });
                      // Tell the server; it will broadcast pollIntervalChanged
                      // to all other connected clients so their pickers sync too
                      setPollInterval({ variables: { ms } });
                    }}
                  >
                    {ms / 1000}s
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="settings-panel__footer">
          <span className="settings-panel__hint">Frequency changes apply to all connected clients</span>
        </div>
      </aside>
    </>
  );
}

export default memo(SettingsPanel);
