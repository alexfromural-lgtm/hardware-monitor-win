import http from 'http';
import { getCpuSnapshot } from './cpu';
import { getRamSnapshot } from './ram';
import { getGpuSnapshot } from './gpu';
import { HardwareSnapshot } from '../shared/types';

const PORT = parseInt(process.env.COLLECTOR_PORT ?? '5390', 10);

// ── Hardware collection ────────────────────────────────────────────────────────

async function collectSnapshot(): Promise<HardwareSnapshot> {
  const [cpu, ram, gpu] = await Promise.all([
    getCpuSnapshot(),
    getRamSnapshot(),
    getGpuSnapshot(),
  ]);

  return {
    cpu,
    ram,
    gpu,
    timestamp: new Date().toISOString(),
  };
}

// ── HTTP Server ────────────────────────────────────────────────────────────────

function setCorsHeaders(res: http.ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res: http.ServerResponse, data: unknown, status = 200): void {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  // Pre-flight OPTIONS
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }

  // Hardware data endpoint
  if (req.url === '/rest') {
    try {
      const snapshot = await collectSnapshot();
      sendJson(res, snapshot);
    } catch (err) {
      console.error('[Collector] Error collecting hardware data:', err);
      sendJson(res, { error: 'Failed to collect hardware data' }, 500);
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Hardware Monitor Collector');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Health:   http://localhost:${PORT}/`);
  console.log(`  Data:     http://localhost:${PORT}/rest`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('  [!] This process must run on the Windows host.');
  console.log('      Keep this terminal open while using the GraphQL server.');
  console.log('═══════════════════════════════════════════════════════');
});

server.on('error', (err) => {
  console.error('[Collector] Server error:', err);
  process.exit(1);
});
