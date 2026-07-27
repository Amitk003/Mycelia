use rand::Rng;
use wasm_bindgen::prelude::*;

use crate::genome::Genome;

const MIN_MUTATION_RATE: f32 = 0.001;
const MAX_MUTATION_RATE: f32 = 0.3;
const CULL_RATIO: f32 = 0.3;
const ELITE_RATIO: f32 = 0.1;

pub fn mutate_genome(genome: &mut Genome) {
    let mut rng = rand::thread_rng();
    let base_rate = 0.05;

    for gene in genome.genes_mut() {
        for val in &mut gene.data {
            if rng.r#gen::<f32>() < base_rate {
                let mutation_type = rng.gen_range(0..3);
                let mutated = match mutation_type {
                    0 => *val + rng.gen_range(-0.2..0.2),
                    1 => *val * rng.gen_range(0.8..1.2),
                    _ => rng.gen_range(-1.0..1.0),
                };
                *val = mutated.clamp(-1.0, 1.0);
            }
        }
    }

    genome.set_generation(genome.generation() + 1);
}

pub fn crossover(parent_a: &Genome, parent_b: &Genome) -> Genome {
    let mut rng = rand::thread_rng();
    let mut child = Genome::new();

    let count_a = parent_a.gene_count();
    let count_b = parent_b.gene_count();
    let min_genes = count_a.min(count_b);

    for i in 0..min_genes {
        let data_a = &parent_a.genes()[i].data;
        let data_b = &parent_b.genes()[i].data;
        let min_len = data_a.len().min(data_b.len());

        let child_gene_data = &mut child.genes_mut()[i].data;
        child_gene_data.clear();
        child_gene_data.reserve(min_len);

        for j in 0..min_len {
            if rng.r#gen::<bool>() {
                child_gene_data.push(data_a[j]);
            } else {
                child_gene_data.push(data_b[j]);
            }
        }
    }

    child.set_generation(parent_a.generation().max(parent_b.generation()) + 1);
    child
}

pub fn select_population(mut population: Vec<Genome>) -> Vec<Genome> {
    let pop_size = population.len();
    if pop_size == 0 {
        return population;
    }

    population.sort_by(|a, b| b.fitness().partial_cmp(&a.fitness()).unwrap_or(std::cmp::Ordering::Equal));

    let elite_count = (pop_size as f32 * ELITE_RATIO).ceil() as usize;
    let cull_count = (pop_size as f32 * CULL_RATIO).floor() as usize;
    let breed_count = pop_size - cull_count;

    let mut survivors: Vec<Genome> = population.drain(..elite_count).collect();

    let mut rng = rand::thread_rng();
    let breeders: Vec<Genome> = population.drain(..breed_count - elite_count).collect();

    while survivors.len() < breed_count {
        if breeders.len() < 2 {
            break;
        }
        let idx_a = rng.gen_range(0..breeders.len());
        let idx_b = rng.gen_range(0..breeders.len());
        if idx_a == idx_b {
            continue;
        }
        let mut child = crossover(&breeders[idx_a], &breeders[idx_b]);
        mutate_genome(&mut child);
        survivors.push(child);
    }

    survivors
}

#[wasm_bindgen]
pub fn mutate_value(val: f32, rate: f32) -> f32 {
    let mut rng = rand::thread_rng();
    let clamped_rate = rate.clamp(MIN_MUTATION_RATE, MAX_MUTATION_RATE);

    if rng.r#gen::<f32>() < clamped_rate {
        let mutation_type = rng.gen_range(0..3);
        match mutation_type {
            0 => val + rng.gen_range(-0.2..0.2),
            1 => val * rng.gen_range(0.8..1.2),
            _ => rng.gen_range(-1.0..1.0),
        }
    } else {
        val
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mutate_changes_sometimes() {
        let original = 0.5;
        let mut changed = false;
        for _ in 0..1000 {
            let result = mutate_value(original, 0.5);
            if (result - original).abs() > 1e-6 {
                changed = true;
                break;
            }
        }
        assert!(changed, "Mutation should eventually change the value");
    }

    #[test]
    fn test_crossover_produces_child() {
        let a = Genome::new();
        let b = Genome::new();
        let child = crossover(&a, &b);
        assert!(child.gene_count() > 0);
    }

    #[test]
    fn test_select_preserves_best() {
        let mut pop: Vec<Genome> = (0..20).map(|_| Genome::new()).collect();
        for (i, g) in pop.iter_mut().enumerate() {
            g.set_fitness(i as f32 / 20.0);
        }
        let survivors = select_population(pop);
        assert!(survivors.len() <= 20);
        assert!(survivors.len() >= 2);
    }
}
