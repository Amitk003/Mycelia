# Horizontal Gene Transfer

This document explains how genetic material is shared between peers in the mesh.

## What it does

In nature, bacteria can share genes directly with each other (horizontal gene transfer). Mycelia does the same thing. When two browser tabs are connected, they can exchange genetic material. This helps good genes spread through the network faster than waiting for random mutation.

## How it works

### Sending Genes

Every 4 evolution ticks (8 seconds), the `GeneTransfer` module picks a random gene from the genome and sends it to all connected peers. The packet includes:

- The gene index and data values
- The sender's current fitness score
- The sender's generation number

### Receiving Genes

When a gene fragment arrives from a peer:

1. The system checks if the sender has higher fitness. If not, the fragment is ignored.
2. For each value in the incoming gene, there is a 50% chance of replacing the local value (crossover).
3. If the remote gene has more data values than the local one, extra values are added.
4. The local genome's fitness gets a small boost based on the remote fitness.

## Configuration

The `GeneTransfer` class accepts these settings:

| Setting | Default | Description |
|---------|---------|-------------|
| transferInterval | 4 | Number of ticks between gene transfers |
| fitnessThreshold | 0.05 | Minimum fitness difference for crossover |
| crossoverRate | 0.5 | Chance per value to take the remote gene's data |

## Files

| File | Purpose |
|------|---------|
| `src/network/gene-transfer.ts` | GeneTransfer class with send/receive logic |
| `src/main.ts` | Integration into the main loop |
