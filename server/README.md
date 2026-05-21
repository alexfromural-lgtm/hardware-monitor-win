# Hardware Monitor — Windows Hardware Monitor Server

A Node.js + TypeScript project that collects CPU, RAM, and GPU data from a
Windows machine and exposes it via an Apollo GraphQL API.

## Architecture

```
Windows Host
├── Collector (npm run collector)   → reads hardware → exposes :5390/rest
└── Docker Container (docker compose up)
    └── Apollo GraphQL Server       → polls :5390 → serves GraphQL :4000
```

## Prerequisites

- Node.js 20+ installed on Windows host
- Docker Desktop (Linux containers mode)
- NVIDIA GPU drivers installed (for nvidia-smi)

## Quick Start

### 1. Install dependencies

```bash
cd server
npm install
```

### 2. Copy env file

```bash
cp .env.sample .env
```

### 3. Start the Collector (Windows host — keep this terminal open)

```bash
npm run collector
```

Verify: `curl http://localhost:5390/rest`

### 4. Start the GraphQL Server (Docker)

```bash
docker compose up --build
```

### 5. Open Apollo Sandbox

Navigate to: http://localhost:4000/graphql

Run this query:

```graphql
{
  hardware {
    cpu {
      name
      maxLoad
      temperature { name value }
      clock { name value }
    }
    ram {
      totalGB
      usedGB
      loadPercent
    }
    gpu {
      name
      vendor
      loadPercent
      temperatureC
      vramTotalMB
      vramUsedMB
      fanPercent
    }
    timestamp
  }
}
```

## Development

Run GraphQL server locally (without Docker, for development):

```bash
# Terminal 1 — Collector
npm run collector

# Terminal 2 — GraphQL server with hot reload
npm run dev:graphql
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `COLLECTOR_PORT` | `5390` | Port the Collector listens on |
| `PORT` | `4000` | Port the GraphQL server listens on |
| `COLLECTOR_URL` | `http://host.docker.internal:5390` | URL of Collector as seen from Docker |
| `POLL_INTERVAL_MS` | `2000` | How often GraphQL server polls Collector |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin (production) |

## Notes

- **CPU Temperature**: May return empty array on Windows without Administrator privileges.
- **GPU Data**: Requires `nvidia-smi` on PATH (installed with NVIDIA drivers).
- The Collector process must stay running while the GraphQL server is active.
