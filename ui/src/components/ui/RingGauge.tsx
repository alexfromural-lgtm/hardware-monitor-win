interface RingGaugeProps {
  value: number;        // 0–100
  color: string;        // CSS color
  size?: number;        // px (default 120)
  thickness?: number;   // stroke width (default 10)
  label?: string;
}

export default function RingGauge({
  value,
  color,
  size = 120,
  thickness = 10,
  label,
}: RingGaugeProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={thickness}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      {/* Center label */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white leading-none">
          {Math.round(clampedValue)}%
        </span>
        {label && (
          <span className="text-[10px] text-white/40 mt-0.5 uppercase tracking-wider">{label}</span>
        )}
      </div>
    </div>
  );
}
