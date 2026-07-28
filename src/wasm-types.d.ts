export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
}

export function init(): string;
export function version(): string;
export function mutate_genome(genome: Genome): void;

export class Genome {
  constructor();
  gene_count(): number;
  generation(): number;
  set_generation(gen: number): void;
  fitness(): number;
  set_fitness(f: number): void;
  species_tag(): string;
  set_species_tag(tag: string): void;
  birth_timestamp(): number;
  get_gene_data(index: number): Float32Array;
  set_gene_data(index: number, data: Float32Array): void;
  to_encoded(): string;
  static from_encoded(json: string): Genome | undefined;
}

export class SensorField {
  constructor();
  brightness: number;
  color_temperature: number;
  motion_delta: number;
  ambient_volume: number;
  low_freq_rumbling: number;
  device_tilt_x: number;
  device_tilt_y: number;
  tab_visible: boolean;
  update_brightness(val: number): void;
  update_motion_delta(val: number): void;
  update_ambient_volume(val: number): void;
  update_device_tilt(x: number, y: number): void;
  to_array(): number[];
}
