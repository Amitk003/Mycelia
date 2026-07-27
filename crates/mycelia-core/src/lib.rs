use wasm_bindgen::prelude::*;

pub mod genome;
pub mod sensor;
pub mod evolution;

#[wasm_bindgen]
pub fn init() -> String {
    "mycelia-core ready".to_string()
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_init() {
        assert_eq!(super::init(), "mycelia-core ready");
    }
}
