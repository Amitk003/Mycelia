use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct SensorField {
    pub brightness: f32,
    pub color_temperature: f32,
    pub motion_delta: f32,
    pub ambient_volume: f32,
    pub low_freq_rumbling: f32,
    pub device_tilt_x: f32,
    pub device_tilt_y: f32,
    pub tab_visible: bool,
}

#[wasm_bindgen]
impl SensorField {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        SensorField {
            brightness: 0.0,
            color_temperature: 0.5,
            motion_delta: 0.0,
            ambient_volume: 0.0,
            low_freq_rumbling: 0.0,
            device_tilt_x: 0.0,
            device_tilt_y: 0.0,
            tab_visible: true,
        }
    }

    pub fn update_brightness(&mut self, val: f32) {
        self.brightness = val.clamp(0.0, 1.0);
    }

    pub fn update_motion_delta(&mut self, val: f32) {
        self.motion_delta = val.clamp(0.0, 1.0);
    }

    pub fn update_ambient_volume(&mut self, val: f32) {
        self.ambient_volume = val.clamp(0.0, 1.0);
    }

    pub fn update_device_tilt(&mut self, x: f32, y: f32) {
        self.device_tilt_x = x.clamp(-1.0, 1.0);
        self.device_tilt_y = y.clamp(-1.0, 1.0);
    }

    pub fn to_array(&self) -> Vec<f32> {
        vec![
            self.brightness,
            self.color_temperature,
            self.motion_delta,
            self.ambient_volume,
            self.low_freq_rumbling,
            self.device_tilt_x,
            self.device_tilt_y,
            if self.tab_visible { 1.0 } else { 0.0 },
        ]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_sensor_has_defaults() {
        let field = SensorField::new();
        assert!((field.brightness - 0.0).abs() < 1e-6);
        assert!(field.tab_visible);
    }

    #[test]
    fn test_update_clamps_values() {
        let mut field = SensorField::new();
        field.update_brightness(1.5);
        assert!((field.brightness - 1.0).abs() < 1e-6);
        field.update_brightness(-0.5);
        assert!((field.brightness - 0.0).abs() < 1e-6);
    }

    #[test]
    fn test_to_array_length() {
        let field = SensorField::new();
        assert_eq!(field.to_array().len(), 8);
    }
}
