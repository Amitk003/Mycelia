# Mycelia

A living digital organism that grows inside your browser and helps the environment stay healthy.

## What is this?

Most AI needs huge servers, lots of data, and pre-trained models. Mycelia is different.

Every open browser tab becomes a tiny living cell. These cells connect to each other like a fungus network underground. They sense the world through your device's camera, microphone, and motion sensors. They evolve by themselves. No servers. No training data. No big tech.

The cells compete, cooperate, and share genetic information. The ones that make good decisions survive. The ones that make bad decisions die off. Over time, the whole network gets better at understanding the environment and suggesting actions that help plants grow, water get saved, and soil stay healthy.

## How it works

1. **Open a browser tab** - A digital hypha (a tiny artificial life form) comes to life.
2. **It senses the world** - Camera light, ambient sound, device motion. No images or audio leave your device.
3. **It evolves** - Each hypha has genes that mutate and change. Better genes survive.
4. **It connects** - Multiple tabs on multiple devices form a peer-to-peer mesh. They share genes and signals.
5. **It proposes actions** - The organism suggests real things to try: change watering time, add shade, adjust soil mix.
6. **It learns from feedback** - You tell it if the suggestion worked. The population feels the result. It adapts.

## What makes it different

- No pre-trained models. No cloud AI. Everything runs in your browser.
- Privacy first. Raw sensor data never leaves your device.
- The intelligence is grown, not built. The system can discover strategies no human designed.
- It works offline or on slow connections. The core loop is lightweight.
- Every device that runs Mycelia makes the whole network smarter.

## Quick Start

```bash
# Install dependencies
npm install

# Build the WASM core
npm run build:wasm

# Start the dev server
npm run dev
```

Open the app in multiple browser tabs. Watch the cells discover each other and start evolving.

## Project Structure

```
mycelia/
  src/             - Frontend code (TypeScript)
  crates/
    hypha-core/    - Rust core: genome, mutation, crossover
    sensor-field/  - Rust: sensor processing
    evolution/     - Rust: evolutionary engine
  signaling-server/ - Node.js WebSocket server for peer discovery
  docs/            - Project documentation
```

## License

MIT
