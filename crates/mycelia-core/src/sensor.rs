use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct SensorData {
    pub brightness: f32,
    pub volume: f32,
}

#[wasm_bindgen]
impl SensorData {
    #[wasm_bindgen(constructor)]
    pub fn new(brightness: f32, volume: f32) -> Self {
        Self { brightness, volume }
    }
}
