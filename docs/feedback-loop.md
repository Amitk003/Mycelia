# Feedback Loop

The feedback loop turns user accept/reject actions into selective
pressure that guides the organism's evolution.

## How it works

1. Each tick, ActionProposalEngine generates proposals from
   the current genome, sensors, and pheromones.
2. User clicks Accept or Reject on a proposal.
3. FeedbackTracker records the action in a history log.
4. The action affects fitness (accepted: +0.05, rejected: -0.03).
5. Selective pressure is broadcast to peers in the mesh as
   feedback type `selective_pressure` over the `fitness_broadcast`
   packet type.
6. Each tick, `applySelectivePressure` adjusts local fitness
   based on all active (last 60s) local and remote pressures.

## Remote Feedback

When a peer accepts or rejects a proposal, the selective pressure
is gossiped to the mesh. Other peers apply a small fitness
adjustment (direction * strength * 0.1) per active pressure,
weighted by how recently it was received.

## UI

A "Feedback History" panel shows the last 5 actions with the
category, action type, and fitness before/after.

## Files

- `src/actions/feedback-tracker.ts` - FeedbackTracker class
- `src/main.ts` - Integration in tick loop and proposal buttons
