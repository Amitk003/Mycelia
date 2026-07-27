use wasm_bindgen::prelude::*;

pub mod evolution;
pub mod genome;
pub mod sensor;

#[wasm_bindgen]
pub fn init() -> String {
    "mycelia-core ready".to_string()
}

#[wasm_bindgen]
pub fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_init() {
        assert_eq!(super::init(), "mycelia-core ready");
    }

    #[test]
    fn test_version_not_empty() {
        let v = super::version();
        assert!(!v.is_empty(), "Version string should not be empty");
    }
}
