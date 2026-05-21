import { useState, useMemo, memo } from 'react';
import type { CpuSnapshot } from '../../graphql/types';
import { useHistory } from '../../hooks/useHistory';
import GlassCard from '../ui/GlassCard';
import RingGauge from '../ui/RingGauge';
import Sparkline from '../ui/Sparkline';
import SensorRow from '../ui/SensorRow';

const CPU_COLOR = '#22d3ee'; // cyan-400

interface CpuCardProps {
  cpu: CpuSnapshot;
}

type ChartTab = 'load' | 'clock';

function CpuCard({ cpu }: CpuCardProps) {
  const [chartTab, setChartTab] = useState<ChartTab>('load');
  const loadHistory  = useHistory('cpu-load',  cpu.maxLoad);
  const clockHistory = useHistory('cpu-clock', cpu.clock[0]?.value);

  const avgClock = useMemo(
    () =>
      cpu.clock.length
        ? cpu.clock.reduce((s, c) => s + c.value, 0) / cpu.clock.length / 1000
        : null,
    [cpu.clock],
  );

  return (
    <GlassCard accentColor={CPU_COLOR} className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={CPU_COLOR} strokeWidth="2">
              <rect x="4" y="4" width="16" height="16" rx="2"/>
              <rect x="9" y="9" width="6" height="6"/>
              <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
              <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
              <line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="15" x2="23" y2="15"/>
              <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="15" x2="4" y2="15"/>
            </svg>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: CPU_COLOR }}>CPU</span>
          </div>
          <p className="text-sm text-white/60 leading-tight max-w-[200px]">{cpu.name}</p>
        </div>
        {avgClock && (
          <span className="text-xs text-white/40 font-mono">{avgClock.toFixed(2)} GHz</span>
        )}
      </div>

      {/* Gauge row */}
      <div className="flex items-center gap-6">
        <RingGauge value={cpu.maxLoad} color={CPU_COLOR} size={110} label="Load" />
        <div className="flex-1 flex flex-col gap-1 overflow-hidden max-h-[110px] overflow-y-auto pr-1">
          {cpu.load.map((s) => (
            <SensorRow key={s.name} sensor={s} color={CPU_COLOR} />
          ))}
        </div>
      </div>

      {/* Temperature row */}
      {cpu.temperature.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-white/50">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
          </svg>
          {cpu.temperature.map((t) => (
            <span key={t.name}>{t.name}: <span className="text-white/80 font-mono">{t.value.toFixed(0)}°C</span></span>
          ))}
        </div>
      )}

      {/* Chart tabs */}
      <div>
        <div className="flex gap-2 mb-2">
          {(['load', 'clock'] as ChartTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setChartTab(tab)}
              className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded transition-colors ${
                chartTab === tab ? 'text-white' : 'text-white/30 hover:text-white/60'
              }`}
              style={chartTab === tab ? { color: CPU_COLOR } : undefined}
            >
              {tab}
            </button>
          ))}
        </div>
        <Sparkline
          data={chartTab === 'load' ? loadHistory : clockHistory}
          color={CPU_COLOR}
          height={48}
          width={280}
        />
      </div>
    </GlassCard>
  );
}

export default memo(CpuCard);
