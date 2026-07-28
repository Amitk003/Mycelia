# Performance Optimizations

## Dynamic Tick Rate

The evolution loop uses setTimeout with a dynamic interval
instead of a fixed setInterval.

- When tab is visible: targets 2 FPS (500ms interval)
- When tab is hidden: drops to 1 FPS (1000ms interval)
- If ticks are repeatedly skipped (over budget): reduces to 2 FPS
- Recovers target when within budget again

## CPU Budget Monitoring

Tracks frame times over a rolling window of 30 samples.
Computes CPU budget as percentage of available time not spent
on tick execution.

If ticks consistently exceed the expected interval, the system
self-throttles by reducing the target FPS and sensor resolution.

## Sensor Resolution Scaling

- Normal: full resolution (1.0)
- Tab hidden: 25% resolution (0.25)
- Under CPU pressure: 50% resolution (0.5)

This avoids unnecessary computation when the page is not
visible or under load.

## Rust Optimizations

- wee_alloc: lightweight allocator for WASM (~2KB vs 10KB+)
- LTO: link-time optimization for smaller binary
- opt-level "z": optimize for size
- codegen-units 1: maximize optimization surface
- strip: remove debug symbols

## Files

- src/performance/performance-monitor.ts
- crates/mycelia-core/Cargo.toml (release profile, wee_alloc)
- crates/mycelia-core/src/lib.rs (global allocator)
