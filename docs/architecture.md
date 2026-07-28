# Architecture

## Overview

Mycelia is a decentralized living organism that lives inside browser tabs. Each tab runs a complete copy of the system. Tabs connect through a peer-to-peer mesh to share genetic material and signals.

## Layers

### 1. WASM Core (Rust)

The evolutionary engine runs as a WebAssembly module compiled from Rust. It contains three modules:

- **Genome** -- Stores gene data (arrays of floats), generation counter, fitness score, species tag, and birth timestamp. Provides methods for reading and writing gene data, encoding to JSON, and decoding from JSON.
- **Sensor** -- SensorField struct that holds readings from camera, microphone, and motion sensors. Written to by the TypeScript layer each tick. Read by the action engine and genome for fitness calculations.
- **Evolution** -- Mutation operators (point mutations, drift, random replacement) and crossover (single-point per-value gene exchange between genomes).

### 2. TypeScript Frontend

The UI layer written in TypeScript and built with Vite.

- **main.ts** -- Initializes all modules, runs the tick loop, renders UI panels.
- **Network** -- PeerManager (WebRTC via simple-peer), SignalingClient (WebSocket), GeneTransfer, StigmergyField (pheromone grid).
- **Actions** -- ActionProposalEngine (5 proposal templates with confidence scoring), FeedbackTracker (records accept/reject history, applies selective pressure).
- **Sensors** -- CameraSensor (light from video element), AudioSensor (Web Audio API), MotionSensor (DeviceOrientation API), SensorManager (orchestrator).
- **Environmental** -- EnvironmentalAPI (Open-Meteo weather fetch with localStorage cache).
- **Strains** -- StrainLibrary (starter strains, export/import, localStorage persistence).
- **Performance** -- PerformanceMonitor (dynamic tick rate, CPU budget tracking, sensor resolution scaling).

### 3. Signaling Server (Node.js)

A lightweight WebSocket server that helps peers discover each other. It assigns peer IDs, relays WebRTC signaling messages, and maintains a list of connected peers. No message content is stored or inspected.

### 4. Renderers

- **Organism canvas** -- Visualizes the genome as branching hyphae with colored tips. Each gene controls branch angle, length, width, and color.
- **Pheromone grid canvas** -- Renders the 10x10 chemical grid as colored cells. Chemicals decay and diffuse each tick.

## Data Flow

```
Tick start
  -> performance monitor starts timing
  -> genome is mutated (WASM)
  -> horizontal gene transfer check
  -> fitness is adjusted by feedback pressure and environmental conditions
  -> sensors read real-world data, write to SensorField (WASM)
  -> peer mesh broadcasts fitness
  -> stigmergy field ticks (decay, diffusion, gossip)
  -> action engine evaluates proposals using genes, sensors, pheromones
  -> UI panels are updated
  -> canvases are redrawn
  -> next tick scheduled via setTimeout
```

## Communication

- **Same device, different tabs** -- Each tab opens a WebSocket to the signaling server. The server bridges WebRTC signaling. Tabs establish direct peer-to-peer data channels.
- **Different devices** -- Same mechanism. As long as both devices can reach the signaling server, they can connect.
- **Offline** -- The core loop (mutation, sensors, proposals) works without network. P2P features and weather API are skipped when offline.
