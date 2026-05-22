import { getLatestSnapshot, pubsub, HARDWARE_UPDATED } from '../../services/hardware.service';

export const resolvers = {
  Query: {
    hardware: () => {
      return getLatestSnapshot();
    },
  },
  Subscription: {
    hardwareUpdated: {
      subscribe: () => pubsub.asyncIterableIterator(HARDWARE_UPDATED),
    },
  },
};

