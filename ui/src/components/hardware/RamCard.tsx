import { memo } from 'react';
import type { RamSnapshot } from '../../graphql/types';
import { useHistory } from '../../hooks/useHistory';
import GlassCard from '../ui/GlassCard';
import RingGauge from '../ui/RingGauge';
import Sparkline from '../ui/Sparkline';

const RAM_COLOR = '#a78bfa'; // violet-400

interface RamCardProps {
  ram: RamSnapshot;
  timestamp: string;
}

function RamCard({ ram, timestamp }: RamCardProps) {
  const loadHistory = useHistory('ram-load', ram.loadPercent, timestamp);

  const usedPct  = ram.loadPercent;
  const freePct  = 100 - usedPct;

  return (
    <GlassCard accentColor={RAM_COLOR} className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={RAM_COLOR} strokeWidth="2">
          <rect x="2" y="7" width="20" height="10" rx="2"/>
          <line x1="6" y1="7" x2="6" y2="17"/>
          <line x1="10" y1="7" x2="10" y2="17"/>
          <line x1="14" y1="7" x2="14" y2="17"/>
          <line x1="18" y1="7" x2="18" y2="17"/>
        </svg>
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: RAM_COLOR }}>RAM</span>
      </div>

      {/* Gauge + stats */}
      <div className="flex items-center gap-6">
        <RingGauge value={ram.loadPercent} color={RAM_COLOR} size={110} label="Used" />
        <div className="flex flex-col gap-2">
          <div>
            <p className="text-3xl font-bold text-white leading-none">
              {ram.usedGB.toFixed(1)}
              <span className="text-sm text-white/40 font-normal ml-1">GB</span>
            </p>
            <p className="text-xs text-white/40 mt-0.5">of {ram.totalGB.toFixed(0)} GB total</p>
          </div>
          <div className="text-xs text-white/40 space-y-0.5">
            <div>Free: <span className="text-white/70 font-mono">{ram.freeGB.toFixed(1)} GB</span></div>
          </div>
        </div>
      </div>

      {/* Stacked bar */}
      <div>
        <div className="flex justify-between text-[10px] text-white/40 mb-1">
          <span>Used {usedPct.toFixed(0)}%</span>
          <span>Free {freePct.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden flex">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${usedPct}%`, background: RAM_COLOR }}
          />
        </div>
      </div>

      {/* Sparkline */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Load History</p>
        <Sparkline data={loadHistory} color={RAM_COLOR} height={48} width={280} />
      </div>
    </GlassCard>
  );
}

export default memo(RamCard);
