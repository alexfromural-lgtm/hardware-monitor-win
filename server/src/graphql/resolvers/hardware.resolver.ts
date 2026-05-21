import { getLatestSnapshot } from '../../services/hardware.service';

export const resolvers = {
  Query: {
    hardware: () => {
      return getLatestSnapshot();
    },
  },
};
