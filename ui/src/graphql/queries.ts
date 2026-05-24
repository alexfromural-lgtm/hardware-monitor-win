import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';

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

/**
 * Mutation: tell the server to change its poll interval (ms).
 * The server clamps the value to 500–60000 ms and returns the accepted value.
 */
export const SET_POLL_INTERVAL: TypedDocumentNode<
  { setPollInterval: number },
  { ms: number }
> = gql`
  mutation SetPollInterval($ms: Int!) {
    setPollInterval(ms: $ms)
  }
`;

/**
 * Subscription: fires whenever any client calls setPollInterval.
 * All clients listen to this so the Update Frequency picker stays in sync.
 */
export const POLL_INTERVAL_CHANGED = gql`
  subscription PollIntervalChanged {
    pollIntervalChanged
  }
`;
