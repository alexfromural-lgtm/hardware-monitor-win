import { gql } from '@apollo/client';

export const HARDWARE_UPDATED = gql`
  subscription HardwareUpdated {
    hardwareUpdated {
      timestamp
      cpu {
        name
        maxLoad
        load        { name value min max }
        temperature { name value min max }
        clock       { name value min max }
      }
      ram {
        totalGB
        usedGB
        freeGB
        loadPercent
      }
      gpu {
        index
        name
        vendor
        loadPercent
        temperatureC
        vramTotalMB
        vramUsedMB
        fanPercent
      }
    }
  }
`;
