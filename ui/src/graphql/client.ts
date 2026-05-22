import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client/core';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

const httpLink = new HttpLink({
  uri: import.meta.env.VITE_GRAPHQL_HTTP_URL ?? '/graphql',
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: import.meta.env.VITE_GRAPHQL_WS_URL ?? (() => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.host}/graphql`;
    })(),
    retryAttempts: Infinity,
    shouldRetry: () => true,
    // Exponential back-off: 1 s → 2 s → 4 s … capped at 30 s.
    // Without this, infinite retries with no delay spin the CPU when
    // the server is unreachable.
    retryWait: async (retries) => {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(1_000 * 2 ** retries, 30_000)),
      );
    },
  }),
);

// Route subscription operations over WebSocket, everything else over HTTP
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink,
);

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});
