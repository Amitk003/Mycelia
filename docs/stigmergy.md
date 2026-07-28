# Stigmergy - Digital Pheromone Field

This document explains how the digital pheromone system works.

## What it does

In nature, ants leave chemical trails for other ants to follow. Mycelia does the same thing. Each browser tab maintains a virtual grid of chemicals. When a cell finds something useful (or dangerous), it leaves a chemical mark. Other connected cells can sense these marks and react.

This is called stigmergy - coordination through environmental traces.

## How it works

### The Grid

The pheromone field is a 10x10 grid. Each cell in the grid can hold 5 different chemicals:

| Chemical | Color | Meaning |
|----------|-------|---------|
| success | Green | A strategy worked well |
| food | Yellow | Resources found |
| explore | Blue | Unexplored area |
| stress | Red | Environmental stress detected |
| danger | Dark Red | Threat detected |

### Decay

Every tick, all chemical concentrations decrease by 5% (multiply by 0.95). If a value drops below 0.01, it is set to zero.

### Diffusion

Chemicals spread to neighboring cells. Each tick, the system averages each cell with its up/down/left/right neighbors. This makes the field smooth like a real pheromone cloud.

### Gossip

Every 3 ticks, the field shares the 3 most recent deposits with all connected peers. Remote deposits are added to the local grid at half concentration.

### Sensing

Cells can ask the field "where is the strongest food signal?" or "is there danger nearby?" The field returns the best match location and concentration.

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| gridWidth | 10 | Number of columns |
| gridHeight | 10 | Number of rows |
| decayRate | 0.95 | Per-tick decay multiplier |
| diffusionRate | 0.1 | How fast chemicals spread |
| gossipInterval | 3 | Ticks between peer broadcasts |

## Files

| File | Purpose |
|------|---------|
| `src/network/stigmergy.ts` | StigmergyField class with grid, decay, diffusion, gossip |
| `src/main.ts` | Integration into main loop with pheromone canvas |
