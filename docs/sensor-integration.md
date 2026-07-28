# Sensor Integration

Connects real device sensors to the WASM SensorField so the digital
organism perceives the physical world.

## Sensors

### Camera (CameraSensor)
- Requests `getUserMedia` with environment-facing camera
- Downsamples video to 64x48 on a hidden canvas
- Computes: brightness (average RGB luminance 0-1), color temperature
  (R/B ratio mapped to 0-1), motion delta (frame-to-frame pixel
  difference, sampled every 16th pixel)
- If camera permission is denied, returns neutral defaults (0.5, 0.5, 0)

### Audio (AudioSensor)
- Requests `getUserMedia` with audio
- Creates AudioContext + AnalyserNode (256-bin FFT)
- Computes: ambient volume (average across all bins), low-frequency
  rumble (bottom 15% of bins)
- If mic permission is denied, returns 0 for both

### Motion (MotionSensor)
- Listens for DeviceOrientationEvent
- Computes: tiltX (gamma mapped from -90-90 to 0-1), tiltY (beta
  mapped from -180-180 to 0-1)
- If device orientation is unavailable, returns 0, 0

## SensorManager

Orchestrates all three sensors. On each tick:
1. Reads raw values from each sensor
2. Writes directly to the WASM SensorField struct
3. Updates `tab_visible` via `document.hidden`

## WASM SensorField (8 channels)

| Index | Channel        | Source      | Range |
|-------|---------------|-------------|-------|
| 0     | brightness     | camera      | 0-1   |
| 1     | color_temperature | camera  | 0-1   |
| 2     | motion_delta   | camera      | 0-1   |
| 3     | ambient_volume | audio       | 0-1   |
| 4     | low_freq_rumbling | audio    | 0-1   |
| 5     | device_tilt_x  | motion      | -1-1  |
| 6     | device_tilt_y  | motion      | -1-1  |
| 7     | tab_visible    | Page Visibility | 0 or 1 |

## Files
- src/sensors/camera-sensor.ts
- src/sensors/audio-sensor.ts
- src/sensors/motion-sensor.ts
- src/sensors/sensor-manager.ts
