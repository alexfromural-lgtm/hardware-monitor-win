import { memo } from 'react';
import type { Sensor } from '../../graphql/types';

interface SensorRowProps {
  sensor: Sensor;
  color: string;
  unit?: string;
  maxValue?: number;
}

function SensorRow({ sensor, color, unit = '%', maxValue = 100 }: SensorRowProps) {
  const pct = Math.min(100, (sensor.value / maxValue) * 100);
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="text-xs text-white/50 truncate w-18 shrink-0">{sensor.name}</span>
      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs font-mono text-white/70 w-12 text-right shrink-0">
        {sensor.value.toFixed(0)}{unit}
      </span>
    </div>
  );
}

export default memo(SensorRow);
