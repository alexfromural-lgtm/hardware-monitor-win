import StatusBadge from '../ui/StatusBadge';

type Status = 'live' | 'connecting' | 'error';

interface HeaderProps {
  status: Status;
  lastUpdated: string | null;
}

export default function Header({ status, lastUpdated }: HeaderProps) {
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

      <div className="flex items-center gap-4">
        {timeStr && (
          <span className="text-xs text-white/30 font-mono hidden sm:block">
            Updated {timeStr}
          </span>
        )}
        <StatusBadge status={status} />
      </div>
    </header>
  );
}
