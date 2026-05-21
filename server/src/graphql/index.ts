import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { typeDefs } from './schema/typeDefs';
import { resolvers } from './resolvers/hardware.resolver';
import { startPolling, stopPolling } from '../services/hardware.service';

dotenv.config();

const PORT = parseInt(process.env.PORT ?? '4000', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
const IS_DEV = process.env.NODE_ENV !== 'production';

async function startServer(): Promise<void> {
  const app = express();
  const httpServer = http.createServer(app);

  // ── Apollo Server setup ────────────────────────────────────────────────────
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    // introspection always enabled — this is an internal monitoring tool
    introspection: true,
    includeStacktraceInErrorResponses: IS_DEV,
    plugins: [
      ApolloServerPluginLandingPageLocalDefault({ embed: true }),
    ],
  });

  await apolloServer.start();

  // ── Middleware ─────────────────────────────────────────────────────────────
  app.use(
    '/graphql',
    cors<cors.CorsRequest>({
      origin: IS_DEV ? '*' : CORS_ORIGIN,
      credentials: true,
    }),
    express.json(),
    expressMiddleware(apolloServer),
  );

  // ── Health check (for Docker healthcheck / load balancer) ─────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── Start polling the hardware collector ───────────────────────────────────
  startPolling();

  // ── Start HTTP server ──────────────────────────────────────────────────────
  httpServer.listen(PORT, () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Hardware Monitor — Apollo GraphQL Server');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`  GraphQL:  http://localhost:${PORT}/graphql`);
    console.log(`  Health:   http://localhost:${PORT}/health`);
    console.log(`  Mode:     ${IS_DEV ? 'development' : 'production'}`);
    console.log('═══════════════════════════════════════════════════════');
  });

  // ── Graceful shutdown ──────────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    console.log(`\n[GraphQL] Received ${signal}. Shutting down gracefully...`);
    stopPolling();
    await apolloServer.stop();
    httpServer.close(() => {
      console.log('[GraphQL] Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('[GraphQL] Fatal: failed to start server:', err);
  process.exit(1);
});
