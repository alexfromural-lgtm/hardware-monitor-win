interface SparklineProps {
  data: number[];
  color: string;
  height?: number;
  width?: number;
  filled?: boolean;
}

export default function Sparkline({
  data,
  color,
  height = 48,
  width = 200,
  filled = true,
}: SparklineProps) {
  if (data.length < 2) {
    return <div style={{ width, height }} className="opacity-20 bg-white/5 rounded" />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2);
    const y = pad + ((max - v) / range) * (height - pad * 2);
    return `${x},${y}`;
  });

  const polylinePoints = points.join(' ');

  // Build a closed polygon for the fill (go to bottom-right then bottom-left)
  const lastX = pad + ((data.length - 1) / (data.length - 1)) * (width - pad * 2);
  const firstX = pad;
  const bottomY = height - pad;
  const polygonPoints = `${polylinePoints} ${lastX},${bottomY} ${firstX},${bottomY}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      {filled && (
        <polygon
          points={polygonPoints}
          fill={color}
          fillOpacity={0.12}
        />
      )}
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
