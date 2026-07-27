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

#[wasm_bindgen]
pub fn mutate_genome(genome: &mut genome::Genome) {
    evolution::mutate_genome(genome);
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_init() {
        assert_eq!(crate::init(), "mycelia-core ready");
    }

    #[test]
    fn test_version_not_empty() {
        let v = crate::version();
        assert!(!v.is_empty(), "Version string should not be empty");
    }

    #[test]
    fn test_mutate_genome_wasm() {
        let mut g = crate::genome::Genome::new();
        let initial_gen = g.generation();
        crate::mutate_genome(&mut g);
        assert_eq!(g.generation(), initial_gen + 1);
    }
}
