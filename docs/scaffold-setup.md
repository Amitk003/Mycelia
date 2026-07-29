# Project Scaffolding Setup

This document explains how the project is set up.

## What we have

### Frontend (TypeScript + Vite)

We use Vite to build the frontend. It is fast and supports WASM imports natively.

- `index.html` - Entry point for the browser app
- `src/main.ts` - Starting point of the JavaScript code
- `vite.config.ts` - Vite configuration, sets port 3000
- `tsconfig.json` - TypeScript configuration, strict mode
- `package.json` - All JavaScript dependencies and scripts

### WASM Core (Rust)

We use a single Rust crate called `mycelia-core`. It compiles to WebAssembly using `wasm-pack`.

- `crates/mycelia-core/src/genome.rs` - Genome and gene data structures. Each genome has genes with evolvable float data, mutation rate, and expression level.
- `crates/mycelia-core/src/sensor.rs` - Sensor field processing. Converts camera light, audio, and motion into a float array for the genome to react to.
- `crates/mycelia-core/src/evolution.rs` - Evolutionary engine. Contains mutation operators (point, drift, random), crossover (single-point), and selection (elite preservation + cull).

### Signaling Server (Node.js)

A lightweight WebSocket server that helps peers discover each other and relay WebRTC signaling messages.

- `signaling-server/src/index.js` - Server code with peer connection tracking, targeted message relay, and peer list support.
- `signaling-server/package.json` - Dependencies for the server.

## How to build

```bash
# Install JavaScript dependencies
npm install

# Build the WASM crate
npm run build:wasm

# Start development server
npm run dev
```

## How to test

```bash
# Run Rust tests
cargo test --workspace

# Run JavaScript tests
npm test
```

## Scripts reference

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production |
| `npm run build:wasm` | Compile Rust crate to WASM |
| `npm run test` | Run JavaScript tests |
| `npm run test:wasm` | Run Rust tests |
| `npm run lint` | Check TypeScript for errors |

## Dependencies

### JavaScript
- `simple-peer` - WebRTC peer connections for the mesh network
- `ws` - WebSocket for the signaling server

### Rust
- `wasm-bindgen` - Bindings between Rust and JavaScript
- `serde` - Serialization for genome data
- `rand` - Random number generation for mutation operators
