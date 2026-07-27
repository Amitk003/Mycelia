use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn init() -> String {
    "hypha-core ready".to_string()
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_init() {
        assert_eq!(super::init(), "hypha-core ready");
    }
}
