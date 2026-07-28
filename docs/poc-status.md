# Proof of Concept Status

## What works

- WASM core compiles and runs in the browser. Genome mutation, fitness tracking, encoding and decoding work.
- Peer-to-peer mesh connects multiple browser tabs through the signaling server. Fitness broadcasts and gene fragments are exchanged.
- Stigmergy field maintains a 10x10 chemical grid with decay, diffusion, and gossip between peers.
- Action proposal engine generates 5 types of proposals with confidence scores based on genes, sensor readings, and pheromone concentrations.
- Feedback tracker records accept/reject history and applies selective pressure to fitness.
- Camera sensor reads brightness and color temperature from a hidden video element.
- Audio sensor measures ambient volume and low-frequency rumble through Web Audio API.
- Motion sensor captures device tilt from DeviceOrientation API.
- Environmental API fetches weather data from Open-Meteo with localStorage caching.
- Strain library provides 3 starter strains, export/import via JSON encoding, and localStorage persistence.
- Performance monitor adjusts tick rate dynamically based on CPU budget and tab visibility.

## What is limited

- Camera sensor requires camera permission. In some browsers, getUserMedia may be blocked or require HTTPS.
- Audio sensor requires microphone permission. Permissions must be granted before readings are available.
- Motion sensor requires DeviceOrientation permission on recent browsers (iOS 13+).
- Action proposals are template-based. They are not trained on real gardening data. Confidence scores are heuristic.
- The peer mesh depends on a signaling server. Without it, only single-tab mode works.
- Weather data depends on Open-Meteo API availability. The cache provides fallback data for 10 minutes.

## What is not included

- No machine learning models. The genome mutation is random, not guided by any training process.
- No server-side persistence. All data lives in browser memory and localStorage.
- No authentication or access control. Anyone who can reach the signaling server can join the mesh.
- No real hardware integration (soil moisture sensors, pH meters, etc.).
- No mobile app. The web app works on mobile browsers but is not optimized for small screens.
