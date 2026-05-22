import { useState, memo } from 'react';
import type { GpuCard as GpuCardType } from '../../graphql/types';
import { useHistory } from '../../hooks/useHistory';
import { useDisplaySettings } from '../../store/displaySettings';
import GlassCard from '../ui/GlassCard';
import RingGauge from '../ui/RingGauge';
import Sparkline from '../ui/Sparkline';

const GPU_COLOR = '#fbbf24'; // amber-400

const fmt = (v: number | null | undefined, decimals = 0, suffix = '') =>
  v == null ? '—' : `${v.toFixed(decimals)}${suffix}`;

interface SingleGpuPanelProps {
  gpu: GpuCardType;
  timestamp: string;
}

const SingleGpuPanel = memo(function SingleGpuPanel({ gpu, timestamp }: SingleGpuPanelProps) {
  const { settings } = useDisplaySettings();
  const loadHistory = useHistory(`gpu-${gpu.index}-load`, gpu.loadPercent, timestamp);

  const vramPct =
    settings.gpu.vram && gpu.vramTotalMB && gpu.vramUsedMB
      ? (gpu.vramUsedMB / gpu.vramTotalMB) * 100
      : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Gauge + quick stats */}
      <div className="flex items-center gap-6">
        <RingGauge
          value={gpu.loadPercent ?? 0}
          color={GPU_COLOR}
          size={110}
          label="Core"
        />
        <div className="flex flex-col gap-2 text-sm">
          <div className="text-xs text-white/40 space-y-1">
            {settings.gpu.temperature && (
              <div className="flex justify-between gap-4">
                <span className="text-white/50">Temp</span>
                <span className="font-mono text-white/80">{fmt(gpu.temperatureC, 0, '°C')}</span>
              </div>
            )}
            {settings.gpu.fan && (
              <div className="flex justify-between gap-4">
                <span className="text-white/50">Fan</span>
                <span className="font-mono text-white/80">{fmt(gpu.fanPercent, 0, '%')}</span>
              </div>
            )}
            {settings.gpu.vram && (
              <>
                <div className="flex justify-between gap-4">
                  <span className="text-white/50">VRAM Used</span>
                  <span className="font-mono text-white/80">
                    {gpu.vramUsedMB != null ? `${(gpu.vramUsedMB / 1024).toFixed(1)} GB` : '—'}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-white/50">VRAM Total</span>
                  <span className="font-mono text-white/80">
                    {gpu.vramTotalMB != null ? `${(gpu.vramTotalMB / 1024).toFixed(1)} GB` : '—'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* VRAM bar */}
      {vramPct != null && (
        <div>
          <div className="flex justify-between text-[10px] text-white/40 mb-1">
            <span>VRAM {vramPct.toFixed(0)}% used</span>
            <span>{fmt(gpu.vramUsedMB, 0)} / {fmt(gpu.vramTotalMB, 0)} MB</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${vramPct}%`, background: GPU_COLOR }}
            />
          </div>
        </div>
      )}

      {/* Sparkline */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Core Load History</p>
        <Sparkline data={loadHistory} color={GPU_COLOR} height={48} width={280} />
      </div>
    </div>
  );
});

interface GpuCardProps {
  gpus: GpuCardType[];
  timestamp: string;
}

function GpuCard({ gpus, timestamp }: GpuCardProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeGpu = gpus[activeIdx] ?? gpus[0];

  return (
    <GlassCard accentColor={GPU_COLOR} className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={GPU_COLOR} strokeWidth="2">
            <rect x="1" y="6" width="22" height="12" rx="2"/>
            <path d="M8 12h8M12 8v8"/>
            <line x1="5" y1="18" x2="5" y2="21"/>
            <line x1="19" y1="18" x2="19" y2="21"/>
          </svg>
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: GPU_COLOR }}>GPU</span>
        </div>
        {/* GPU tabs */}
        {gpus.length > 1 && (
          <div className="flex gap-1">
            {gpus.map((g, i) => (
              <button
                key={g.index}
                onClick={() => setActiveIdx(i)}
                className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                  i === activeIdx
                    ? 'border-amber-400/50 text-amber-400 bg-amber-400/10'
                    : 'border-white/10 text-white/30 hover:text-white/60'
                }`}
              >
                GPU {g.index}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* GPU name */}
      <p className="text-sm text-white/60 leading-tight -mt-2">{activeGpu.name}</p>

      {/* Panel for active GPU */}
      <SingleGpuPanel key={activeGpu.index} gpu={activeGpu} timestamp={timestamp} />
    </GlassCard>
  );
}

export default memo(GpuCard);
