import StatusBadge from '../ui/StatusBadge';

type Status = 'live' | 'connecting' | 'error';

interface HeaderProps {
  status: Status;
  lastUpdated: string | null;
  onSettingsClick: () => void;
  settingsOpen: boolean;
}

export default function Header({ status, lastUpdated, onSettingsClick, settingsOpen }: HeaderProps) {
  const timeStr = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/8">
      <div className="flex items-center gap-3">
        {/* Logo mark */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border border-white/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-wide">HW Monitor</h1>
          <p className="text-[10px] text-white/30 leading-none">Windows Hardware Dashboard</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {timeStr && (
          <span className="text-xs text-white/30 font-mono hidden sm:block">
            Updated {timeStr}
          </span>
        )}
        <StatusBadge status={status} />

        {/* Settings gear button */}
        <button
          id="btn-settings"
          onClick={onSettingsClick}
          aria-label="Display options"
          aria-expanded={settingsOpen}
          className={`header-settings-btn ${settingsOpen ? 'header-settings-btn--active' : ''}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
