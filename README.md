# Mycelia

A living digital organism that grows, evolves, and learns inside your browser.

Every open tab becomes a tiny artificial cell. Cells connect through a peer-to-peer mesh, share genetic material, sense the world through your device's camera and microphone, and propose actions based on what they learn. No servers, no training data, no cloud.

## How it works

1. Open the app in any browser tab. A digital hypha comes to life with a unique genome.
2. It mutates every tick. Genes drift, recombine, and evolve over time.
3. Multiple tabs on multiple devices form a direct peer-to-peer mesh. They exchange gene fragments and pheromone signals.
4. Sensors read real-world data: camera brightness, ambient sound, device orientation. Raw data never leaves your device.
5. The action engine proposes changes (water timing, shade, soil amendments) with confidence scores.
6. Accept or reject each proposal. The organism's fitness changes with your feedback, shaping its evolution.
7. Weather data from Open-Meteo adds environmental pressure. Extreme conditions stress the organism; favorable conditions reward it.
8. Strains can be saved, exported, and shared. Starter strains (balanced, aggressive, explorer) offer different starting points.

## Concept

Read the detailed proof-of-concept document on Notion:

https://fluffy-column-9b8.notion.site/Proof-of-Concept-Decentralized-living-organism-3ac3488ed99180a1938bcf768370cd62

## Quick Start

```bash
npm install
npm run build:wasm
npm run dev
```

Open in multiple tabs. Watch them discover each other and evolve.

## Project Structure

```
mycelia/
  src/               - Frontend (TypeScript)
  crates/
    mycelia-core/    - Evolution engine (Rust, compiled to WASM)
  signaling-server/  - WebSocket peer discovery (Node.js)
  docs/              - Documentation
```

## Notes

This is a proof-of-concept MVP. The interface targets desktop screens and hasn't been optimized for mobile layouts yet.

## License

MIT
