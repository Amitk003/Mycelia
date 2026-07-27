const WS_URL = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname || "localhost"}:8080`;
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
          <div id="cell-status">Initializing WASM core...</div>
          <div style="margin-top: 1rem; text-align: center;">
            <canvas id="hypha-canvas" width="280" height="200" style="background: #030712; border-radius: 6px; border: 1px solid #1e293b;"></canvas>
          </div>
        </div>

        <div style="background: #111827; padding: 1.5rem; border-radius: 8px; border: 1px solid #1f2937;">
          <h2 style="color: #c084fc; margin-top: 0;">Peer Mesh</h2>
          <div id="mesh-status">Connecting to signaling server...</div>
        </div>
      </div>

      <div id="genome-stats" style="margin-top: 2rem; background: #111827; padding: 1.5rem; border-radius: 8px; border: 1px solid #1f2937;">
        <h2 style="color: #fbbf24; margin-top: 0;">Genome Telemetry & Real-Time Evolution</h2>
        <pre id="genome-output" style="color: #94a3b8; font-size: 0.85rem; overflow-x: auto;">Waiting for WASM init...</pre>
      </div>
    </div>
  `;
}

function drawOrganism(canvas: HTMLCanvasElement, generation: number, geneCount: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "rgba(3, 7, 18, 0.2)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const numBranches = Math.min(geneCount, 12);
  const time = Date.now() * 0.002;

  ctx.lineWidth = 2;
  for (let i = 0; i < numBranches; i++) {
    const angle = (i / numBranches) * Math.PI * 2 + Math.sin(time + i) * 0.1;
    const length = 40 + Math.sin(time + generation * 0.1 + i) * 20;
    const endX = centerX + Math.cos(angle) * length;
    const endY = centerY + Math.sin(angle) * length;

    const hue = (160 + i * 20 + generation * 2) % 360;
    ctx.strokeStyle = `hsl(${hue}, 80%, 60%)`;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    ctx.fillStyle = `hsl(${hue}, 90%, 70%)`;
    ctx.beginPath();
    ctx.arc(endX, endY, 3, 0, Math.PI * 2);
    ctx.fill();
  }
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
          meshStatus.innerHTML = `<p style="color: #4ade80; margin: 0;">Connected as ${msg.peerId}</p>`;
        }
      } catch {
        // ignore non-json messages
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

  const canvas = document.getElementById("hypha-canvas") as HTMLCanvasElement;

  setInterval(() => {
    if (wasmResult) {
      // Execute WASM mutation in Rust core
      wasmResult.wasm.mutate_genome(wasmResult.genome);

      const cellStatus = document.getElementById("cell-status");
      if (cellStatus) {
        cellStatus.innerHTML = `
          <p style="color: #4ade80; margin: 0 0 0.25rem 0;">Cell active</p>
          <p style="color: #94a3b8; margin: 0; font-size: 0.85rem;">mycelia-core ready v${wasmResult.wasm.version()}</p>
          <p style="color: #94a3b8; margin: 0; font-size: 0.85rem;">Genes: ${wasmResult.genome.gene_count()}, Generation: ${wasmResult.genome.generation()}</p>
        `;
      }

      const genomeOutput = document.getElementById("genome-output");
      if (genomeOutput) {
        genomeOutput.textContent = JSON.stringify(
          {
            genes: wasmResult.genome.gene_count(),
            generation: wasmResult.genome.generation(),
            fitness: wasmResult.genome.fitness(),
            species: wasmResult.genome.species_tag(),
            sensorChannels: wasmResult.sensorField.to_array(),
          },
          null,
          2
        );
      }

      if (canvas) {
        drawOrganism(canvas, wasmResult.genome.generation(), wasmResult.genome.gene_count());
      }
    }
  }, 2000);
}

main().catch((err) => console.error("Mycelia failed to start:", err));
