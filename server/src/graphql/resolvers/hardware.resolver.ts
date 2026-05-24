import {
  getLatestSnapshot,
  getCurrentPollInterval,
  restartPolling,
  pubsub,
  HARDWARE_UPDATED,
  POLL_INTERVAL_CHANGED,
} from '../../services/hardware.service';

export const resolvers = {
  Query: {
    hardware: () => getLatestSnapshot(),
    pollInterval: () => getCurrentPollInterval(),
  },

  Mutation: {
    setPollInterval: (_: unknown, { ms }: { ms: number }): number => {
      return restartPolling(ms);
    },
  },

  Subscription: {
    hardwareUpdated: {
      subscribe: () => pubsub.asyncIterableIterator(HARDWARE_UPDATED),
    },
    pollIntervalChanged: {
      subscribe: () => pubsub.asyncIterableIterator(POLL_INTERVAL_CHANGED),
    },
  },
};
