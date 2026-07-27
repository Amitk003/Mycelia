const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8080";
const appElement = document.getElementById("app");

function renderUI() {
  if (!appElement) return;

  appElement.innerHTML = `
    <div style="font-family: system-ui, sans-serif; padding: 2rem; background: #0a0e17; color: #e2e8f0; min-height: 100vh;">
      <header style="border-bottom: 1px solid #1e293b; padding-bottom: 1rem; margin-bottom: 2rem;">
        <h1 style="color: #38bdf8; margin: 0 0 0.5rem 0;">Mycelia</h1>
        <p style="color: #94a3b8; margin: 0;">Living digital organism growing inside browser tabs</p>
      </header>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
        <div style="background: #111827; padding: 1.5rem; border-radius: 8px; border: 1px solid #1f2937;">
          <h2 style="color: #a7f3d0; margin-top: 0;">Cell State</h2>
          <div id="cell-status">Initializing cell environment...</div>
        </div>

        <div style="background: #111827; padding: 1.5rem; border-radius: 8px; border: 1px solid #1f2937;">
          <h2 style="color: #c084fc; margin-top: 0;">Peer Mesh</h2>
          <div id="mesh-status">Connecting to signaling server...</div>
        </div>
      </div>

      <div id="genome-stats" style="margin-top: 2rem; background: #111827; padding: 1.5rem; border-radius: 8px; border: 1px solid #1f2937;">
        <h2 style="color: #fbbf24; margin-top: 0;">Genome</h2>
        <pre id="genome-output" style="color: #94a3b8; font-size: 0.85rem; overflow-x: auto;">Waiting for WASM init...</pre>
      </div>
    </div>
  `;
}

async function initWasm() {
  const cellStatus = document.getElementById("cell-status");
  try {
    const wasm = await import("/pkg/mycelia-core/mycelia_core.js");
    const result = wasm.init();
    const version = wasm.version();
    const genome = new wasm.Genome();
    const sensorField = new wasm.SensorField();

    if (cellStatus) {
      cellStatus.innerHTML = `
        <p style="color: #4ade80; margin: 0 0 0.25rem 0;">Cell active</p>
        <p style="color: #94a3b8; margin: 0; font-size: 0.85rem;">${result} v${version}</p>
        <p style="color: #94a3b8; margin: 0; font-size: 0.85rem;">Genes: ${genome.gene_count()}, Generation: ${genome.generation()}</p>
      `;
    }

    const genomeOutput = document.getElementById("genome-output");
    if (genomeOutput) {
      genomeOutput.textContent = JSON.stringify(
        {
          genes: genome.gene_count(),
          generation: genome.generation(),
          fitness: genome.fitness(),
          species: genome.species_tag(),
          sensorChannels: sensorField.to_array(),
        },
        null,
        2
      );
    }

    return { wasm, genome, sensorField };
  } catch (err) {
    console.error("WASM init failed:", err);
    if (cellStatus) {
      cellStatus.innerHTML = `
        <p style="color: #f87171; margin: 0;">WASM load failed</p>
        <p style="color: #94a3b8; margin: 0; font-size: 0.85rem;">${err instanceof Error ? err.message : "Unknown error"}</p>
      `;
    }
    throw err;
  }
}

function connectSignaling() {
  const meshStatus = document.getElementById("mesh-status");
  if (!meshStatus) return;

  try {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      meshStatus.innerHTML = '<p style="color: #4ade80; margin: 0;">Connected to signaling mesh</p>';
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "welcome") {
          meshStatus.innerHTML = `
            <p style="color: #4ade80; margin: 0;">Connected as ${msg.peerId}</p>
          `;
        }
      } catch {
        // ignore non-JSON messages
      }
    };

    ws.onerror = () => {
      meshStatus.innerHTML = '<p style="color: #f87171; margin: 0;">Signaling server offline (local cell mode)</p>';
    };

    ws.onclose = () => {
      meshStatus.innerHTML = '<p style="color: #fbbf24; margin: 0;">Disconnected (will retry)</p>';
      setTimeout(connectSignaling, 3000);
    };

    return ws;
  } catch (err) {
    meshStatus.innerHTML = '<p style="color: #f87171; margin: 0;">WebSocket not available (local cell mode)</p>';
    console.error("WebSocket error:", err);
    return null;
  }
}

async function main() {
  renderUI();
  const wasmResult = await initWasm();
  connectSignaling();

  setInterval(() => {
    const genomeOutput = document.getElementById("genome-output");
    if (genomeOutput && wasmResult) {
      wasmResult.genome.set_generation(wasmResult.genome.generation() + 1);
    }
  }, 5000);
}

main().catch((err) => console.error("Mycelia failed to start:", err));
