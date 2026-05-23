import { useState } from 'react';
import { useHardware } from '../hooks/useHardware';
import { useDisplaySettings } from '../store/displaySettings';
import Header from '../components/layout/Header';
import CpuCard from '../components/hardware/CpuCard';
import RamCard from '../components/hardware/RamCard';
import GpuCard from '../components/hardware/GpuCard';
import SettingsPanel from '../components/ui/SettingsPanel';

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 animate-pulse">
      <div className="h-4 w-24 bg-white/10 rounded mb-4" />
      <div className="flex gap-4 items-center mb-4">
        <div className="w-[110px] h-[110px] rounded-full bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-white/10 rounded w-full" />
          <div className="h-3 bg-white/10 rounded w-4/5" />
          <div className="h-3 bg-white/10 rounded w-3/5" />
        </div>
      </div>
      <div className="h-12 bg-white/10 rounded" />
    </div>
  );
}

function DashboardContent() {
  const { snapshot, loading, error } = useHardware();
  const { settings } = useDisplaySettings();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const status = error ? 'error' : loading && !snapshot ? 'connecting' : 'live';

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      <Header
        status={status}
        lastUpdated={snapshot?.timestamp ?? null}
        onSettingsClick={() => setSettingsOpen((v) => !v)}
        settingsOpen={settingsOpen}
      />

      <main className="flex-1 p-6">
        {/* Error banner */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
            <span className="font-semibold">Connection error:</span> {error.message} — make sure the server is running at localhost:4000.
          </div>
        )}

        {/* Cards grid */}
        {loading && !snapshot ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : snapshot ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* CPU card — always shown, but inner sections follow settings */}
            <CpuCard cpu={snapshot.cpu} timestamp={snapshot.timestamp} />

            {/* RAM card — hidden when settings.ram is false */}
            {settings.ram && snapshot.ram && <RamCard ram={snapshot.ram} timestamp={snapshot.timestamp} />}

            {/* GPU card — hidden when settings.gpu.enabled is false */}
            {settings.gpu.enabled && snapshot.gpu && snapshot.gpu.length > 0 && <GpuCard gpus={snapshot.gpu} timestamp={snapshot.timestamp} />}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-white/30">
            <svg className="w-12 h-12 mb-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            <p className="text-sm">Waiting for first hardware snapshot…</p>
          </div>
        )}
      </main>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}
