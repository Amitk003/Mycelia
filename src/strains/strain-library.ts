import type { Genome } from "../../pkg/mycelia_core.js";

export interface StrainInfo {
  id: string;
  name: string;
  description: string;
  encoded: string;
}

const STORAGE_KEY = "mycelia_imported_strains";

function makeStrain(wasm: typeof import("../../pkg/mycelia_core.js"), name: string, description: string, geneValues: number[][]): StrainInfo {
  const genome = new wasm.Genome();
  for (let i = 0; i < Math.min(geneValues.length, genome.gene_count()); i++) {
    genome.set_gene_data(i, new Float32Array(geneValues[i]));
  }
  genome.set_species_tag(name.toLowerCase().replace(/\s+/g, "_"));
  const encoded = genome.to_encoded();
  return { id: `strain_${name.toLowerCase().replace(/\s+/g, "_")}`, name, description, encoded };
}

export function getStarterStrains(wasm: typeof import("../../pkg/mycelia_core.js")): StrainInfo[] {
  return [
    makeStrain(wasm, "Balanced", "Steady growth with moderate branch angles and even weight distribution", [
      [0.3, -0.1, 0.5, -0.2, 0.4],
      [0.2, 0.3, -0.1, 0.6],
      [-0.2, 0.4, 0.1, -0.3, 0.5, 0.0],
      [0.5, -0.3, 0.2, 0.1],
      [-0.1, 0.2, -0.4, 0.3, 0.6],
      [0.4, 0.1, -0.2, 0.5, -0.1],
      [-0.3, 0.6, 0.0, 0.2],
      [0.1, -0.2, 0.3, -0.4, 0.5, 0.2],
      [0.6, -0.1, 0.3, 0.0],
      [-0.2, 0.5, -0.3, 0.1, 0.4],
    ]),
    makeStrain(wasm, "Aggressive", "Fast-growing with wide branch angles and high expression levels", [
      [0.8, -0.5, 0.9, -0.3, 0.7],
      [0.6, 0.7, -0.4, 0.9],
      [-0.6, 0.8, 0.5, -0.7, 0.9, 0.3],
      [0.9, -0.7, 0.6, 0.4],
      [-0.5, 0.7, -0.8, 0.6, 0.9],
      [0.8, 0.5, -0.6, 0.9, -0.4],
      [-0.7, 0.9, 0.3, 0.6],
      [0.5, -0.6, 0.7, -0.8, 0.9, 0.6],
      [0.9, -0.5, 0.7, 0.2],
      [-0.6, 0.9, -0.7, 0.5, 0.8],
    ]),
    makeStrain(wasm, "Explorer", "Thin, far-reaching hyphae with high variance and low expression", [
      [0.1, 0.0, 0.2, -0.1, 0.3],
      [0.0, 0.1, 0.0, 0.2],
      [-0.1, 0.2, 0.0, -0.1, 0.2, 0.1],
      [0.2, -0.1, 0.1, 0.0],
      [0.0, 0.1, -0.1, 0.0, 0.2],
      [0.1, 0.0, 0.0, 0.2, 0.1],
      [-0.1, 0.2, 0.1, 0.0],
      [0.0, -0.1, 0.1, 0.0, 0.2, 0.1],
      [0.2, 0.0, 0.1, 0.1],
      [0.0, 0.1, -0.1, 0.0, 0.2],
    ]),
  ];
}

export function exportGenome(genome: Genome): string {
  return genome.to_encoded();
}

export function importGenome(wasm: typeof import("../../pkg/mycelia_core.js"), encoded: string): Genome | undefined {
  try {
    const genome = wasm.Genome.from_encoded(encoded);
    return genome;
  } catch {
    return undefined;
  }
}

export function saveStrain(name: string, encoded: string): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const strains: StrainInfo[] = stored ? JSON.parse(stored) : [];
    strains.push({ id: `imported_${Date.now()}`, name, description: "Imported strain", encoded });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(strains));
  } catch {
    // storage unavailable, ignore
  }
}

export function getSavedStrains(): StrainInfo[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}
