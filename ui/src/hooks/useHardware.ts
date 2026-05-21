import { useSubscription } from '@apollo/client/react';
import type { HardwareSnapshot } from '../graphql/types';
import { HARDWARE_UPDATED } from '../graphql/queries';

interface UseHardwareResult {
  snapshot: HardwareSnapshot | null;
  loading: boolean;
  error: Error | undefined;
}

export function useHardware(): UseHardwareResult {
  const { data, loading, error } = useSubscription<{ hardwareUpdated: HardwareSnapshot | null }>(
    HARDWARE_UPDATED,
  );
  return {
    snapshot: data?.hardwareUpdated ?? null,
    loading,
    error,
  };
}
