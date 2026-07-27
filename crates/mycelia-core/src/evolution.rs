use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn mutate_value(val: f32, rate: f32) -> f32 {
    val + rate
}
