# Hardware Monitor — GraphQL Server

A Node.js + TypeScript server that collects CPU, RAM, and GPU data from a
Windows machine and exposes it via an **Apollo GraphQL API** with real-time
**WebSocket subscriptions**.

## Architecture

```
Windows Host
├── Collector (npm run collector)   → reads hardware → exposes :5390/rest
└── GraphQL Server (Docker or dev)
    ├── Apollo HTTP  :4000/graphql  → query / mutation
    ├── WebSocket    :4000/graphql  → subscription (graphql-ws protocol)
    └── Health       :4000/health   → Docker healthcheck endpoint
```

The GraphQL server polls the Collector every `POLL_INTERVAL_MS` milliseconds
and publishes each snapshot to all WebSocket subscribers in real time.

## Prerequisites

- Node.js 20+ installed on the Windows host
- Docker Desktop (Linux containers mode) — for the Docker workflow
- NVIDIA GPU drivers installed if you want GPU metrics via `nvidia-smi`

## Quick Start

### 1. Install dependencies

```bash
cd server
npm install
```

### 2. Copy and edit the env file

```bash
cp .env.sample .env
```

Update `CORS_ORIGIN` to match the origin of the UI (default: `http://localhost:5173`).

### 3. Start the Collector (Windows host — keep this terminal open)

```bash
npm run collector
```

> **Note**: On PowerShell running as an Administrator, run this first if scripts
> are blocked:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

Verify: `curl http://localhost:5390/rest`

### 4a. Start the GraphQL Server via Docker (production-like)

```bash
docker compose up --build
```

### 4b. Or start the GraphQL Server locally (development, hot-reload)

```bash
npm run dev:graphql
```

> If Docker previously occupied port 4000 you may need to run
> `docker stop hardware-monitor-server` first.

### 5. Open Apollo Sandbox

Navigate to **http://localhost:4000/graphql**

## Available Scripts

| Command | Description |
|---|---|
| `npm run collector` | Start the hardware collector process (Windows host) |
| `npm run dev:graphql` | Start the GraphQL server with nodemon hot-reload |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Run compiled server from `dist/graphql/index.js` |

## GraphQL API

### Types

```graphql
# Named sensor reading with current, min, and max values
type Sensor {
  name: String!
  value: Float!
  min: Float!
  max: Float!
}

type CpuSnapshot {
  name: String!
  maxLoad: Float!          # Overall utilization % (0-100)
  load:        [Sensor!]! # Per-core load sensors
  temperature: [Sensor!]! # Per-core/package temps in °C (may be empty without admin)
  clock:       [Sensor!]! # Per-core clock speeds in MHz
}

type RamSnapshot {
  totalGB:     Float!
  usedGB:      Float!
  freeGB:      Float!
  loadPercent: Float!
}

type GpuCard {
  index:       Int!
  name:        String!
  vendor:      String!
  loadPercent: Float    # null if unavailable
  temperatureC: Float   # null if unavailable
  vramTotalMB: Float    # null if unavailable
  vramUsedMB:  Float    # null if unavailable
  fanPercent:  Float    # null if unavailable
}

type HardwareSnapshot {
  cpu:       CpuSnapshot!
  ram:       RamSnapshot!
  gpu:       [GpuCard!]!
  timestamp: String!    # ISO 8601
}
```

### Queries

```graphql
# Latest hardware snapshot (refreshed every POLL_INTERVAL_MS)
query {
  hardware {
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
    timestamp
  }
}

# Current server-side poll interval in milliseconds
query {
  pollInterval
}
```

### Mutation — change poll interval

```graphql
# Accepted range: 500 – 60000 ms.
# Returns the clamped, accepted value.
# Broadcasts pollIntervalChanged to all connected clients.
mutation {
  setPollInterval(ms: 2000)
}
```

### Subscriptions

```graphql
# Live hardware snapshots — fires every POLL_INTERVAL_MS
subscription {
  hardwareUpdated {
    timestamp
    cpu { name maxLoad load { name value } }
    ram { usedGB freeGB loadPercent }
    gpu { index name vendor loadPercent temperatureC }
  }
}

# Fires whenever any client calls setPollInterval.
# All clients subscribe so the Update Frequency picker stays in sync.
subscription {
  pollIntervalChanged
}
```

Connect via WebSocket to `ws://localhost:4000/graphql` using the
[graphql-ws](https://github.com/enisdenjo/graphql-ws) client protocol.

> The UI builds the `hardwareUpdated` subscription document dynamically via
> `buildSubscription.ts`, requesting only the fields the user has enabled in
> the Settings Panel.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `COLLECTOR_PORT` | `5390` | Port the Collector listens on |
| `PORT` | `4000` | Port the GraphQL server listens on |
| `COLLECTOR_URL` | `http://host.docker.internal:5390` | URL of Collector as seen from Docker |
| `POLL_INTERVAL_MS` | `2000` | Poll interval in milliseconds |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin for the UI |
| `NODE_ENV` | `development` | `development` enables Apollo Sandbox |

## Notes

- **CPU Temperature**: May return an empty array on Windows without Administrator privileges.
- **GPU Data**: Requires `nvidia-smi` on PATH (installed with NVIDIA drivers).  
  AMD/Intel GPUs will return partial data via `systeminformation`.
- **Poll interval**: `setPollInterval` clamps input to 500–60 000 ms and
  broadcasts `pollIntervalChanged` to all subscribers so every open tab updates
  its picker without a page refresh.
- The Collector process must stay running while the GraphQL server is active.
- In development, the Collector and GraphQL server can both run natively on
  Windows (no Docker needed).
- A `/health` endpoint is exposed for Docker healthcheck probes.
