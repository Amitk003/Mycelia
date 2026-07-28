# Strain Library

Export, import, and load starter strains for the digital organism.

## Starter Strains

| Strain | Description |
|--------|-------------|
| Balanced | Steady growth with moderate branch angles and even weight distribution |
| Aggressive | Fast-growing with wide branch angles and high expression levels |
| Explorer | Thin, far-reaching hyphae with high variance and low expression |

## Export

Click "Export Current" to copy the current genome as an encoded JSON
string. The string is automatically copied to the clipboard.

## Import

Paste an encoded strain string into the input field and click
"Import". The current genome is replaced with the imported one,
and it is saved to localStorage for later use.

## WASM Serialization

The Genome struct uses serde_json for encoding/decoding via:
- `to_encoded()` - serializes gene data, lengths, generation, fitness,
  and species tag to a JSON string
- `from_encoded(json)` - deserializes and constructs a new Genome
  with the restored gene data and metadata

## Files

- src/strains/strain-library.ts
- crates/mycelia-core/src/genome.rs (to_encoded/from_encoded)
