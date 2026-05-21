type Status = 'live' | 'connecting' | 'error';

interface StatusBadgeProps {
  status: Status;
}

const config: Record<Status, { label: string; dot: string; bg: string; text: string }> = {
  live:       { label: 'LIVE',       dot: 'bg-emerald-400',  bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  connecting: { label: 'CONNECTING', dot: 'bg-amber-400',    bg: 'bg-amber-500/10',   text: 'text-amber-400'   },
  error:      { label: 'ERROR',      dot: 'bg-red-500',      bg: 'bg-red-500/10',     text: 'text-red-400'     },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { label, dot, bg, text } = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-widest ${bg} ${text} border border-current/20`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} ${status === 'live' ? 'animate-pulse' : ''}`} />
      {label}
    </span>
  );
}
