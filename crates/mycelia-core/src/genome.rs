use rand::Rng;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[derive(Clone, Serialize, Deserialize)]
pub enum GeneType {
    NeuralWeight,
    BehaviorRule,
    Structural,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct Gene {
    pub id: String,
    pub gene_type: GeneType,
    pub data: Vec<f32>,
    pub mutation_rate: f32,
    pub expression_level: f32,
}

#[wasm_bindgen]
pub struct Genome {
    genes: Vec<Gene>,
    generation: u32,
    parent_ids: Vec<String>,
    birth_timestamp: f64,
    fitness: f32,
    species_tag: String,
}

#[wasm_bindgen]
impl Genome {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        let mut rng = rand::thread_rng();
        let mut genes = Vec::new();

        for i in 0..10 {
            let data_len = rng.gen_range(4..12);
            let mut data = Vec::with_capacity(data_len);
            for _ in 0..data_len {
                data.push(rng.gen_range(-1.0..1.0));
            }

            genes.push(Gene {
                id: format!("gene_{}", i),
                gene_type: GeneType::NeuralWeight,
                data,
                mutation_rate: 0.05,
                expression_level: rng.gen_range(0.5..1.0),
            });
        }

        let birth_timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs_f64();

        Genome {
            genes,
            generation: 0,
            parent_ids: Vec::new(),
            birth_timestamp,
            fitness: 0.0,
            species_tag: "prototype".to_string(),
        }
    }

    pub fn gene_count(&self) -> usize {
        self.genes.len()
    }

    pub fn generation(&self) -> u32 {
        self.generation
    }

    pub fn set_generation(&mut self, new_gen: u32) {
        self.generation = new_gen;
    }

    pub fn fitness(&self) -> f32 {
        self.fitness
    }

    pub fn set_fitness(&mut self, f: f32) {
        self.fitness = f;
    }

    pub fn species_tag(&self) -> String {
        self.species_tag.clone()
    }

    pub fn set_species_tag(&mut self, tag: String) {
        self.species_tag = tag;
    }

    pub fn birth_timestamp(&self) -> f64 {
        self.birth_timestamp
    }

    pub fn get_gene_data(&self, index: usize) -> Vec<f32> {
        if index < self.genes.len() {
            self.genes[index].data.clone()
        } else {
            Vec::new()
        }
    }

    pub fn set_gene_data(&mut self, index: usize, data: Vec<f32>) {
        if index < self.genes.len() {
            self.genes[index].data = data;
        }
    }

    pub fn to_encoded(&self) -> String {
        let payload = StrainPayload {
            gene_count: self.genes.len() as u32,
            gene_lengths: self.genes.iter().map(|g| g.data.len() as u32).collect(),
            gene_data: self.genes.iter().flat_map(|g| g.data.clone()).collect(),
            generation: self.generation,
            fitness: self.fitness,
            species_tag: self.species_tag.clone(),
        };
        serde_json::to_string(&payload).unwrap_or_default()
    }

    pub fn from_encoded(json: &str) -> Option<Genome> {
        let payload: StrainPayload = serde_json::from_str(json).ok()?;
        let mut genome = Genome::new();
        genome.generation = payload.generation;
        genome.fitness = payload.fitness;
        genome.species_tag = payload.species_tag;

        let mut offset = 0;
        for (i, &len) in payload.gene_lengths.iter().enumerate() {
            if i >= genome.genes.len() {
                break;
            }
            let end = offset + len as usize;
            if end <= payload.gene_data.len() {
                genome.genes[i].data = payload.gene_data[offset..end].to_vec();
                offset = end;
            }
        }
        Some(genome)
    }
}

#[derive(serde::Serialize, serde::Deserialize)]
struct StrainPayload {
    gene_count: u32,
    gene_lengths: Vec<u32>,
    gene_data: Vec<f32>,
    generation: u32,
    fitness: f32,
    species_tag: String,
}

impl Genome {
    pub fn genes(&self) -> &Vec<Gene> {
        &self.genes
    }

    pub fn genes_mut(&mut self) -> &mut Vec<Gene> {
        &mut self.genes
    }

    pub fn parent_ids(&self) -> &Vec<String> {
        &self.parent_ids
    }

    pub fn add_parent_id(&mut self, id: String) {
        self.parent_ids.push(id);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_genome_has_genes() {
        let genome = Genome::new();
        assert!(genome.gene_count() > 0);
    }

    #[test]
    fn test_set_fitness() {
        let mut genome = Genome::new();
        genome.set_fitness(0.85);
        assert!((genome.fitness() - 0.85).abs() < 1e-6);
    }

    #[test]
    fn test_gene_data_roundtrip() {
        let mut genome = Genome::new();
        let data = vec![0.1, 0.2, 0.3];
        genome.set_gene_data(0, data.clone());
        assert_eq!(genome.get_gene_data(0), data);
    }
}
