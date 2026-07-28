# Action Proposal Engine

This document explains how the organism proposes actions to the user.

## What it does

The Action Proposal Engine reads the current state of the genome, sensors, and pheromone field. It generates human-readable action suggestions. The user can accept or reject each suggestion. Accepted suggestions give the genome a fitness boost. Rejected ones apply a small penalty.

## Proposal Categories

| Category | What it suggests | Data sources |
|----------|-----------------|--------------|
| Water | Shift watering time to morning or evening, target moisture level | Gene[0], brightness sensor |
| Shade | Increase or reduce shade cover | Gene[1], brightness + motion sensors |
| Soil | Apply biochar or compost tea amendment | Gene[2], ambient volume sensor |
| Pest | Take action for pest stress, monitor, or observe | Gene[3], motion sensor, stress/danger pheromones |
| Planting | Try intercropping, border planting, or mixed guild patterns | Gene[4], device tilt, food pheromones |

## Confidence Scoring

Each proposal has a confidence score from 0 to 1. Proposals below 0.2 confidence are not shown. The score is based on:

- How strongly the gene values deviate from neutral
- Sensor readings that support the proposal
- Pheromone signals from the network
- Higher confidence proposals appear first

## Accept / Reject

When you click Accept:
- The genome's fitness increases by 0.05
- This makes the organism more likely to make similar proposals in the future

When you click Reject:
- The genome's fitness decreases by 0.03
- The organism is less likely to propose similar actions

## Files

| File | Purpose |
|------|---------|
| `src/actions/action-engine.ts` | ActionProposalEngine class with templates and evaluation |
| `src/main.ts` | Integration into main loop, accept/reject button handlers |
