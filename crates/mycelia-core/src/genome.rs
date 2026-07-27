use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Genome {
    generation: u32,
    fitness: f32,
}

#[wasm_bindgen]
impl Genome {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            generation: 0,
            fitness: 0.0,
        }
    }

    pub fn generation(&self) -> u32 {
        self.generation
    }

    pub fn fitness(&self) -> f32 {
        self.fitness
    }
}
