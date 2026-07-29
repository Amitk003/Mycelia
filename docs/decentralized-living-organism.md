# Proof of Concept: Decentralized Living Digital Organism

## 1. Digital Organisms and Evolutionary Computation

### Core Concept

A digital organism is a self-contained computational entity that exists in memory, subject to the same evolutionary pressures as biological life: mutation, selection, and inheritance. Unlike traditional AI models that are trained once and deployed, a digital organism lives continuously, adapting to its environment in real time.

### Genome Structure

The genome is the organism's complete hereditary information. In this implementation, each genome consists of:

- **Gene arrays**: Fixed-size vectors of floating-point values in range [-1.0, 1.0]. Each array represents a distinct phenotypic trait. The number of genes and the length of each array define the organism's complexity.
- **Generation counter**: Monotonically increasing integer tracking how many mutation cycles have occurred.
- **Fitness score**: A scalar in [0.0, 1.0] representing adaptation to current conditions. Higher is better.
- **Species tag**: A string identifier for lineage tracking across peer exchanges.
- **Birth timestamp**: Time of genome instantiation, used for age-based decay or pruning.

### Mutation Operators

Each tick, the genome undergoes mutation with a base probability (e.g. 5% per value). Three mutation types exist:

```
1. Point mutation: val += uniform(-0.2, 0.2)   // small drift
2. Scaling mutation: val *= uniform(0.8, 1.2)   // multiplicative shift
3. Replacement: val = random(-1.0, 1.0)         // complete reset
```

Each mutated value is clamped to [-1.0, 1.0] to maintain stability. The mutation rate can itself evolve through meta-parameters or adapt based on environmental stress.

### Fitness Function

Fitness is not computed from a single objective function. Instead, it is shaped by multiple pressure sources:

- **User feedback**: Accepting a proposal increases fitness (+0.05). Rejecting decreases (-0.03).
- **Environmental pressure**: Extreme weather (temperature >35C or <0C, humidity <20%, precipitation >5mm) imposes small negative deltas.
- **Remote pressure**: Feedback from peer organisms on the mesh can broadcast selective pressure signals, influencing local fitness.
- **Fitness decay**: Without positive feedback, entropy gradually reduces fitness through the natural mutation process.

The combination creates a dynamic fitness landscape that changes with user behavior, weather, and network activity.

## 2. Peer-to-Peer Mesh Networking (WebRTC)

### Architecture

The mesh is a fully decentralized peer-to-peer network where every node connects directly to every other node. There is no central message router, no relay server, and no single point of failure after initial connection establishment.

### Signaling Server

WebRTC requires an intermediary for the initial handshake because peers do not know each other's network addresses. The signaling server is a lightweight WebSocket server that:

1. Assigns unique peer IDs on connection
2. Relays WebRTC signaling data (SDP offers, answers, ICE candidates) between peers
3. Responds to peer list requests with all connected peer IDs
4. Does not inspect, store, or process message content

The signaling server is intentionally stateless with respect to application data. It only maintains the connection registry for peer discovery.

### Connection Establishment

```
Peer A                    Signaling Server              Peer B
  |                            |                          |
  |--- WebSocket connect ----->|                          |
  |<-- welcome(peer_A) --------|                          |
  |                            |                          |--- WebSocket connect -->
  |                            |                          |<-- welcome(peer_B) -----
  |                            |                          |
  |<--- peer_list([peer_B]) ---|                          |
  |                            |                          |
  |--- initiate WebRTC ------->|                          |
  |                            |--- signal(offer) ------->|
  |<--- signal(answer) --------|                          |
  |                            |                          |
  |===== WebRTC DataChannel established =================|
```

Once the WebRTC connection is established, all future communication happens directly between peers without involving the signaling server.

### Mesh Topology

Each peer maintains a SimplePeer connection to every other peer it discovers. This creates a full mesh topology where:

- Every node can broadcast to all others in O(1) hops
- Latency is minimal (direct connections)
- The network is resilient to individual node failures
- Each node stores N-1 peer connections for N nodes

For a browser-based PoC, full mesh is practical up to approximately 10-20 simultaneous connections. Beyond that, a gossip protocol or overlay network would be needed.

### Periodic Rediscovery

To handle late-joining peers, a periodic peer list request runs every 30 seconds. The signaling server returns all currently connected peers, and the client initiates WebRTC handshakes with any it does not already have a connection to.

## 3. Horizontal Gene Transfer

### Biological Inspiration

In nature, horizontal gene transfer (HGT) allows organisms to acquire genetic material from other organisms without being direct descendants. This accelerates adaptation by sharing successful traits across a population.

### Implementation

When two peers have an established WebRTC data channel, they periodically exchange gene fragments:

1. **Selection**: On a configurable interval (every N ticks), the organism selects a random gene index.
2. **Serialization**: The gene's data array is bundled with metadata (index, source fitness, source generation, mutation rate, expression level).
3. **Broadcast**: The fragment is sent to all connected peers via the data channel.
4. **Reception**: On the receiving end, the fragment is evaluated:
   - If the source has higher fitness than the receiver, there is a chance of integration
   - Integration uses crossover: each value position randomly selects from either local or remote data
   - If source fitness exceeds receiver fitness by a threshold, the crossover rate increases
   - A small fitness boost is applied to the receiver to reward successful integration

### Crossover Mechanics

```
For each position i in the gene array:
  if random() < crossoverRate AND sourceFitness > localFitness + threshold:
    merged[i] = remoteData[i]
  else:
    merged[i] = localData[i]
```

This biases integration toward higher-fitness donors while maintaining some local trait preservation. The crossover rate (typically 0.5) controls how aggressively new genetic material is adopted.

## 4. Stigmergy

### Definition

Stigmergy is a mechanism of indirect coordination where agents communicate through modifications to their shared environment. The classic example is ant trails: ants deposit pheromones as they move, and other ants follow those trails, reinforcing them. No ant has a global map. The collective behavior emerges from local sensing and deposit.

### Chemical Grid

The stigmergy field is a 2D grid (10x10 by default) with multiple chemical layers. Five chemical types are defined:

| Chemical | Purpose | Visual Color |
|----------|---------|--------------|
| food | Signals resource availability | Gold/amber |
| danger | Alerts about threats | Red/orange |
| stress | Indicates environmental pressure | Dark red |
| success | Marks positive outcomes | Green |
| explore | Encourages exploration | Muted green |

### Dynamics

Each tick, the field undergoes three operations:

1. **Decay**: Every cell's concentration is multiplied by a decay factor (0.95). Values below 0.01 are zeroed. This prevents perpetual accumulation.

2. **Diffusion**: Each cell averages its concentration with its four cardinal neighbors. The diffusion rate (0.1) controls how quickly chemicals spread. The formula:
   ```
   newValue = currentValue + (neighborAvg - currentValue) * diffusionRate
   ```
   This creates smooth concentration gradients across the grid.

3. **Deposit**: When the organism performs an action or detects a condition, a chemical is deposited at a random grid position with a concentration between 0.3 and 0.7. Multiple deposits to the same cell sum, capped at 1.0.

### Sensing

The organism can sense the grid by querying for the cell with the highest concentration of a given chemical. This returns coordinates and concentration level. The action engine uses this information to modulate proposal confidence:

- High food signal near current position increases confidence in planting proposals
- High danger signal from the network triggers pest-related proposals
- Stress signals shift behavior toward conservative actions

### Remote Stigmergy

Peers on the mesh periodically broadcast their recent deposits. The receiving peer applies them at 50% concentration to its local grid. This allows network-wide coordination without central aggregation. A danger signal from one peer's location can influence another peer's decisions even though they are in different physical spaces.

## 5. Action Proposal Engine

### Overview

The action proposal engine generates suggestions for the user based on the organism's internal state (genes), environmental context (sensors, weather), and network signals (pheromones). Proposals have confidence scores representing the system's certainty about the suggestion.

### Template Architecture

Proposals are generated from parameterized templates. Each template defines:

- A **category** (e.g. "water", "shade", "soil", "pest", "planting")
- A **build function** that takes current state and returns a proposal with title, description, and confidence

The build function processes three input sources:

1. **Gene values**: The average value of each gene array, representing expressed traits. For example, gene[0] might represent "water affinity" and influence watering proposals.

2. **Sensor readings**: Current environmental readings from camera (brightness, motion), microphone (ambient volume), and device orientation (tilt). These ground proposals in the real world.

3. **Pheromone signals**: The stigmergy field provides context from the local organism's history and remote peers' activity.

### Confidence Scoring

Confidence is computed per-template using heuristics:

```
confidence = baseOffset + |geneValue| * geneWeight
           + sensorWeight * sensorDelta
           + pheromoneWeight * pheromoneConcentration
```

Templates with confidence below a threshold (0.2) are suppressed. The top 3 proposals by confidence are presented to the user.

### Example Template: Pest Detection

```
Inputs:
  - Gene[3] (stress indicator): avg value across array
  - Sensor[2] (motion delta): recent movement
  - Pheromone "stress": concentration from local grid
  - Pheromone "danger": concentration from network

Threat level = max(
    |stressGene| * 0.5 + motionDelta * 0.3,
    stressPheromone * 0.4,
    dangerPheromone * 0.6
)

Confidence = 0.2 + threatLevel * 0.6

Severity:
  threat > 0.6 → "immediate"
  threat > 0.3 → "moderate"
  otherwise → "low"
```

## 6. Feedback-Driven Learning

### Feedback Loop

The organism learns from user interaction through a simple reinforcement loop:

1. The action engine presents proposals with descriptions and confidence scores
2. The user either accepts (waters) or rejects (prunes) each proposal
3. Acceptance increases fitness; rejection decreases it
4. The feedback is recorded with the proposal context
5. Selective pressure from accumulated feedback influences future fitness calculations

### Selective Pressure

Each feedback event creates a selective pressure entry:

```
{
  category: "water" | "shade" | "soil" | "pest" | "planting",
  direction: +1 (accepted) | -1 (rejected),
  strength: 0.05 (accept) | 0.03 (reject),
  source: "local" | "remote",
  timestamp: ms
}
```

Active pressures (within the last 60 seconds) are summed and applied to fitness on each tick:

```
totalPressure = sum(direction * strength * 0.1 for each active pressure)
fitness = clamp(fitness + totalPressure, 0, 1)
```

This creates a decaying memory of recent feedback. The organism "remembers" what the user preferred for approximately 60 seconds, gradually reverting to baseline if no new feedback arrives.

### Remote Feedback Propagation

When feedback occurs, the pressure is broadcast to all mesh peers. Other organisms apply the same selective pressure (marked as "remote" source). This means:

- If one user consistently waters "shade" proposals, remote peers become more likely to propose shade actions
- The collective preferences of the user community shape the behavior of the entire mesh
- No central server aggregates preferences; they spread organically through the network

### Limitations

- Learning is short-term (60-second pressure window). There is no long-term memory or persistent preference model.
- There is no distinction between "this proposal was bad" and "this category is bad." The pressure is category-based.
- The system learns from feedback patterns but does not form predictive models of user behavior.

## 7. Environmental Sensing

### Browser-Based Sensors

The organism gathers real-world data using standard browser APIs:

**Camera (CameraSensor)**
- Captures a low-resolution (128x96) video frame every tick using getUserMedia
- Downsamples to 64x48 for processing
- Computes average brightness from RGB values
- Estimates color temperature from red/blue channel ratio
- Detects motion by comparing consecutive frames using pixel difference
- All processing happens locally; no video data leaves the device

**Microphone (AudioSensor)**
- Creates an AudioContext with an AnalyserNode (FFT size 256)
- Captures frequency data from the microphone stream
- Computes ambient volume from the full frequency range
- Estimates low-frequency rumble from the bottom 15% of frequency bins
- Silent periods return baseline values (not zero) to avoid empty readings

**Device Orientation (MotionSensor)**
- Listens for DeviceOrientationEvent
- Converts gamma (left-right tilt) to [0, 1] range: (gamma + 90) / 180
- Converts beta (forward-backward tilt) to [0, 1] range: (beta + 180) / 360
- Falls back to default values (0.5 each) on devices without orientation sensors

### Weather API (Environmental API)

The organism fetches real weather data from the Open-Meteo API (free, no API key required):

- Current temperature, humidity, precipitation, cloud cover
- Weather codes mapped to human-readable conditions (clear, cloudy, rain, etc.)
- Data cached in localStorage for 10 minutes to reduce API calls
- Falls back to cached data or defaults (20C, 60% humidity) on network failure
- Weather extremes apply selective pressure to fitness

### Sensor Fusion

All sensor readings are combined into a SensorField struct that is shared with the WASM genome and the action engine:

```
SensorField {
  brightness: float,        // 0.0 (dark) to 1.0 (bright)
  color_temperature: float, // 0.0 (warm) to 1.0 (cool)
  motion_delta: float,     // 0.0 (static) to 1.0 (high motion)
  ambient_volume: float,   // 0.0 (silent) to 1.0 (loud)
  low_freq_rumbling: float,// 0.0 to 1.0
  device_tilt_x: float,    // 0.0 to 1.0
  device_tilt_y: float,    // 0.0 to 1.0
  tab_visible: bool        // Page visibility state
}
```

The proposal engine reads these values to ground its suggestions in real-world conditions. For example, low brightness and high motion delta might suggest the user is in a moving vehicle, lowering confidence for proposals that require user attention.

## 8. WebAssembly Computation

### Why WASM

WebAssembly provides near-native performance for compute-intensive operations in the browser. For this use case:

- **Genome operations** involve iterating over arrays of floats with mutation logic. In JavaScript, this is slower due to dynamic typing and garbage collection. WASM provides deterministic performance.
- **Sensor field updates** are simple struct assignments that benefit from WASM's memory model.
- **The entire evolutionary loop** runs synchronously within the tick, avoiding frame drops.

### Rust-to-WASM Pipeline

The Rust code is compiled using wasm-pack, which generates:

1. A `.wasm` binary containing the compiled Rust code
2. JavaScript bindings for each public function and struct
3. TypeScript type definitions for type-safe usage

Key bindings generated:

```
Genome        class with: new(), gene_count(), get_gene_data(i), set_gene_data(i, data),
                           generation(), set_generation(n), fitness(), set_fitness(f),
                           species_tag(), set_species_tag(tag), to_encoded(), from_encoded(str)
SensorField   class with: new(), update_brightness(v), update_device_tilt(x, y), to_array()
              functions:  mutate_genome(genome)
```

### Memory Management

The Rust code itself handles memory allocation for gene arrays and sensor fields. wasm-pack automatically generates the necessary glue code to:

- Allocate memory on the WASM heap when creating new objects
- Copy data between JS TypedArrays and WASM linear memory for gene data access
- Free memory when objects go out of scope (the generated bindings handle garbage collection)

### Performance Considerations

- The bottleneck is typically the canvas rendering, not the WASM computation
- WASM operations for genomes with 10-14 genes (each with 5-6 values) complete in under 1ms
- The mutation loop processes approximately 50-80 float values per tick
- Sensor field updates are setter operations on 8 scalar values

## 9. Strain Management

### Concept

A strain is a serialized genome at a point in time. Strains allow users to save preferred organism configurations, share them with others, and restore previous states.

### Encoding

Genomes are serialized to JSON using Serde in Rust:

```json
{
  "gene_count": 10,
  "gene_lengths": [5, 4, 6, 4, 5, 5, 4, 6, 4, 5],
  "gene_data": [0.3, -0.1, 0.5, ...],
  "generation": 42,
  "fitness": 0.75,
  "species_tag": "balanced"
}
```

The JSON string is the portable format. It can be copied to clipboard, shared via text, or stored in localStorage.

### Starter Strains

Pre-defined starter strains demonstrate different growth personalities:

| Strain | Characteristics |
|--------|----------------|
| **Balanced** | Moderate branch angles, even weight distribution, steady growth |
| **Aggressive** | Wide branch angles, high expression levels, fast-growing |
| **Explorer** | Thin, far-reaching hyphae, high variance, low expression |

Each starter strain sets specific gene values that affect the visual appearance (branch length, angle, color, thickness) and influence the action engine's proposals.

### Local Persistence

Saved strains are stored in localStorage under a dedicated key. The storage wrapper handles:

- JSON parsing with error recovery for corrupted data
- Appending new strains with unique IDs (timestamp-based)
- Retrieving all saved strains on page load

## 10. Performance Adaptation

### Adaptive Tick Rate

The system runs on a timed loop (setTimeout, not requestAnimationFrame, to decouple from render). The tick rate adapts to conditions:

| Condition | Target FPS | Tick Interval | Sensor Resolution |
|-----------|-----------|---------------|-------------------|
| Tab visible, running smoothly | 0.5 | ~2000ms | 100% |
| Tab visible, ticks skipped | 2 | ~500ms | 50% |
| Tab hidden | 1 | ~1000ms | 25% |

- "Ticks skipped" counter increments when actual tick time exceeds 2x the expected interval
- Counter decays back toward zero when ticks complete on time
- User speed control overrides the target FPS (1x to 10x multiplier)

### CPU Budget Display

The CPU budget metric shows how much of the allocatd time is actually consumed:

```
cpuBudget = max(0, (1 - avgTickTime / targetInterval) * 100)
```

A value of 80% means 20% of the tick interval is used for computation. Values below 10% indicate the system is near its performance limit.

### Purpose

The adaptive system ensures:
- The organism keeps running even under heavy load
- Hidden tabs do not waste CPU resources
- Users on slow devices still get a functional experience
- Power usage is minimized when the page is not visible

## 11. Putting It Together

### Lifecycle of a Single Tick

```
Time (ms)
|
|-- 0: PerformanceMonitor.beginTick()
|-- Genome mutation (WASM)
|-- Horizontal gene transfer check
|-- Feedback pressure application
|-- Environmental pressure application
|-- Sensor readout (camera, mic, orientation)
|-- Fitness broadcast to mesh peers
|-- Stigmergy field tick (decay, diffusion, gossip)
|-- Action engine evaluation (genes + sensors + pheromones)
|-- UI update (stats, sensors, proposals, feedback, peer list)
|-- Canvas redraw (hyphae, mushrooms, pheromones, spores)
|-- PerformanceMonitor.snapshot() for next tick
|-- setTimeout(nextTick, interval)
```

### Data Flow Diagram

```
User Feedback          Sensors (Camera, Mic, Orientation)
    |                          |
    v                          v
FeedbackTracker ----+    SensorManager
    |               |         |
    v               v         v
Genome <---- mutate_genome() ----> SensorField
 |                                       |
 |  GeneTransfer (HGT)                   |
 |       |                               |
 |       v                               |
 |   PeerManager <----> Signaling Server |
 |       |                               |
 |       +-- StigmergyField              |
 |       |       |                       |
 |       |       v                       |
 |       +---> ActionProposalEngine      |
 |                 |                     |
 |                 v                     |
 |           User Chooses                |
 +<-------- feedback recorded -----------+
```

### Independence of Modules

Each module can function independently:

- **Core evolution** requires only the WASM genome and mutation. No network, no sensors, no user input.
- **Mesh networking** requires only the signaling server. Works without sensors or proposals.
- **Action proposals** require genes and sensors. Feedback and network are optional enhancements.
- **Performance adaptation** is self-contained, adjusting to runtime conditions regardless of what other modules are doing.

This modularity means the system degrades gracefully. If the camera is unavailable, sensor readings fall back to defaults. If there is no network, the organism evolves in isolation. If the user never gives feedback, fitness drifts based on environmental pressure alone.
