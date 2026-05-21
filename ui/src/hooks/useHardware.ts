import { useMemo } from 'react';
import { useSubscription } from '@apollo/client/react';
import type { HardwareSnapshot } from '../graphql/types';
import { buildSubscription } from '../graphql/buildSubscription';
import { useDisplaySettings } from '../store/displaySettings';

interface UseHardwareResult {
  snapshot: HardwareSnapshot | null;
  loading: boolean;
  error: Error | undefined;
}

export function useHardware(): UseHardwareResult {
  const { settings } = useDisplaySettings();

  // Rebuild the gql document only when settings change
  const query = useMemo(() => buildSubscription(settings), [settings]);

  const { data, loading, error } = useSubscription<{ hardwareUpdated: HardwareSnapshot | null }>(
    query,
  );
  return {
    snapshot: data?.hardwareUpdated ?? null,
    loading,
    error,
  };
}
