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

### WASM Crates (Rust)

We split the WASM code into three separate crates. Each crate compiles to a WebAssembly module.

- `crates/hypha-core/` - Genome, gene, mutation, crossover logic
- `crates/sensor-field/` - Camera light field, audio, motion processing
- `crates/evolution/` - Evolutionary algorithm, fitness, selection

Each crate uses `wasm-pack` to compile Rust to WASM for the browser.

### Signaling Server (Node.js)

A simple WebSocket server that helps peers find each other.

- `signaling-server/src/index.js` - Server code
- `signaling-server/package.json` - Dependencies for the server

## How to build

```bash
# Install JavaScript dependencies
npm install

# Build all WASM crates
npm run build:wasm

# Start development server
npm run dev
```

## How to test

```bash
# Run Rust tests for all crates
cargo test --workspace

# Run JavaScript tests
npm test
```

## Scripts reference

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production |
| `npm run build:wasm` | Compile all Rust crates to WASM |
| `npm run test` | Run JavaScript tests |
| `npm run test:wasm` | Run Rust tests |
| `npm run lint` | Check TypeScript for errors |
