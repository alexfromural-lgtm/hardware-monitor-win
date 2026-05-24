// GraphQL Schema Definition Language (SDL)
// Mirrors the TypeScript interfaces in src/shared/types.ts

export const typeDefs = `#graphql

  """A named sensor reading with current, min, and max values."""
  type Sensor {
    name: String!
    """Current sensor reading"""
    value: Float!
    min: Float!
    max: Float!
  }

  """CPU hardware snapshot"""
  type CpuSnapshot {
    """Full CPU model name, e.g. 'Intel Core i7-14700F'"""
    name: String!
    """Overall CPU utilization percentage (0-100)"""
    maxLoad: Float!
    """Per-core load readings"""
    load: [Sensor!]!
    """Per-core (or package) temperatures in °C. May be empty without admin rights on Windows."""
    temperature: [Sensor!]!
    """Per-core clock speeds in MHz"""
    clock: [Sensor!]!
  }

  """RAM hardware snapshot"""
  type RamSnapshot {
    """Total physical RAM in GB"""
    totalGB: Float!
    """Currently used RAM in GB (active pages)"""
    usedGB: Float!
    """Available RAM in GB"""
    freeGB: Float!
    """Used / Total as a percentage (0-100)"""
    loadPercent: Float!
  }

  """A single GPU card"""
  type GpuCard {
    """GPU index (0-based)"""
    index: Int!
    """GPU model name, e.g. 'NVIDIA GeForce RTX 4080'"""
    name: String!
    """GPU vendor, e.g. 'NVIDIA'"""
    vendor: String!
    """GPU core utilization % — null if unavailable"""
    loadPercent: Float
    """GPU temperature in °C — null if unavailable"""
    temperatureC: Float
    """Total VRAM in MB — null if unavailable"""
    vramTotalMB: Float
    """Used VRAM in MB — null if unavailable"""
    vramUsedMB: Float
    """Fan speed % — null if unavailable"""
    fanPercent: Float
  }

  """Complete hardware snapshot from the Windows host"""
  type HardwareSnapshot {
    cpu: CpuSnapshot!
    ram: RamSnapshot!
    """List of detected GPU cards"""
    gpu: [GpuCard!]!
    """ISO 8601 collection timestamp"""
    timestamp: String!
  }

  type Query {
    """
    Returns the latest hardware snapshot collected from the Windows host.
    Data is refreshed every POLL_INTERVAL_MS milliseconds (default: 2000ms).
    Returns null if the collector has not yet responded.
    """
    hardware: HardwareSnapshot
    """Returns the current server-side poll interval in milliseconds."""
    pollInterval: Int!
  }

  type Mutation {
    """
    Dynamically changes the server-side hardware poll interval.
    Accepted range: 500 – 60000 ms. The new interval is broadcast to all
    connected clients via the pollIntervalChanged subscription.
    Returns the accepted interval in milliseconds.
    """
    setPollInterval(ms: Int!): Int!
  }

  type Subscription {
    """
    Fires every POLL_INTERVAL_MS milliseconds with the latest hardware snapshot.
    Pushes null if the collector has not yet responded.
    """
    hardwareUpdated: HardwareSnapshot
    """
    Fires whenever any client calls setPollInterval.
    All connected clients should update their local UI to reflect the new rate.
    """
    pollIntervalChanged: Int!
  }
`;
