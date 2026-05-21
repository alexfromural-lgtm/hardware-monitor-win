import { type ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  accentColor?: string; // CSS color for glow, e.g. 'var(--color-cpu)'
}

export default function GlassCard({ children, className = '', accentColor }: GlassCardProps) {
  return (
    <div
      className={`relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 overflow-hidden ${className}`}
      style={
        accentColor
          ? {
              boxShadow: `0 0 0 1px ${accentColor}22, 0 4px 32px ${accentColor}18`,
            }
          : undefined
      }
    >
      {/* Subtle top gradient line */}
      {accentColor && (
        <div
          className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
          style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
        />
      )}
      {children}
    </div>
  );
}
