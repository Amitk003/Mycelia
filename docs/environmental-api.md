# Environmental API

Integrates real weather data as macro-selective pressure on the
digital organism's fitness.

## Data Source

Uses [Open-Meteo](https://open-meteo.com/) free API (no API key
required). Fetches current weather for a default location (London).

Fetched every 5 minutes. Falls back to cached data (10 min TTL in
localStorage) when offline.

## Weather Factors

| Condition | Fitness Effect |
|-----------|---------------|
| Temp > 35 C | -0.02 (heat stress) |
| Temp < 0 C | -0.02 (cold stress) |
| Humidity < 20% | -0.015 (drought) |
| Precipitation > 5mm | -0.01 (flooding) |
| Cloud Cover > 80% | +0.005 (shade reward) |

## UI

"Environmental" panel shows current condition, temperature,
humidity, precipitation, and cloud cover.

## Files

- src/environmental/environmental-api.ts
