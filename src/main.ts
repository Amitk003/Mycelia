import { PeerManager } from "./network/peer-manager";
import { GeneTransfer } from "./network/gene-transfer";
import { StigmergyField } from "./network/stigmergy";
import type { PeerInfo, NetworkPacket } from "./network/mesh-types";

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
          <div id="mesh-status">Initializing...</div>
          <div id="peer-list" style="margin-top: 0.75rem;"></div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 2rem;">
        <div id="genome-stats" style="background: #111827; padding: 1.5rem; border-radius: 8px; border: 1px solid #1f2937;">
          <h2 style="color: #fbbf24; margin-top: 0;">Genome Telemetry & Real-Time Evolution</h2>
          <pre id="genome-output" style="color: #94a3b8; font-size: 0.85rem; overflow-x: auto;">Waiting for WASM init...</pre>
        </div>

        <div style="background: #111827; padding: 1.5rem; border-radius: 8px; border: 1px solid #1f2937;">
          <h2 style="color: #f472b6; margin-top: 0;">Gene Transfer</h2>
          <div id="hgt-status" style="color: #94a3b8; font-size: 0.85rem;">Waiting for peers...</div>
        </div>
      </div>

      <div style="margin-top: 2rem; background: #111827; padding: 1.5rem; border-radius: 8px; border: 1px solid #1f2937;">
        <h2 style="color: #34d399; margin-top: 0;">Pheromone Field (Stigmergy)</h2>
        <div style="text-align: center;">
          <canvas id="pheromone-canvas" width="300" height="300" style="background: #030712; border-radius: 6px; border: 1px solid #1e293b;"></canvas>
        </div>
        <div id="pheromone-status" style="color: #94a3b8; font-size: 0.85rem; margin-top: 0.5rem;">Initializing...</div>
      </div>
    </div>
  `;
}

function drawOrganism(
  canvas: HTMLCanvasElement,
  generation: number,
  geneDataList: Float32Array[]
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "rgba(3, 7, 18, 0.15)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const numBranches = Math.min(geneDataList.length, 12);
  const time = Date.now() * 0.002;

  for (let i = 0; i < numBranches; i++) {
    const data = geneDataList[i];
    if (data.length === 0) continue;

    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    const peak = Math.max(...data.map(Math.abs));
    const variance = data.reduce((sum, v) => sum + (v - avg) * (v - avg), 0) / data.length;
    const firstVal = data[0];
    const secondVal = data.length > 1 ? data[1] : 0;

    const baseAngle = (i / numBranches) * Math.PI * 2;
    const angleOffset = firstVal * 1.2 + Math.sin(time + i) * 0.15;
    const angle = baseAngle + angleOffset;

    const branchLength = 35 + (avg + 1) * 20 + Math.sin(time + i * 0.7 + generation * 0.05) * 10;
    const branchWidth = 1.5 + (variance + 0.1) * 4;

    const endX = centerX + Math.cos(angle) * branchLength;
    const endY = centerY + Math.sin(angle) * branchLength;

    const hue = (60 + firstVal * 60 + secondVal * 40 + generation) % 360;
    const saturation = 70 + peak * 25;
    const lightness = 50 + avg * 20;
    ctx.strokeStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    ctx.lineWidth = Math.max(1, branchWidth);

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    const tipGlow = 2 + (peak + 1) * 3;
    ctx.fillStyle = `hsl(${hue}, 90%, 70%)`;
    ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(endX, endY, tipGlow, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (data.length >= 3) {
      const subAngle = angle + (data[2] - 0.5) * 1.5;
      const subLength = branchLength * 0.5 * (1 + (avg + 1) * 0.2);
      const subEndX = endX + Math.cos(subAngle) * subLength;
      const subEndY = endY + Math.sin(subAngle) * subLength;

      ctx.strokeStyle = `hsl(${hue}, 60%, 40%)`;
      ctx.lineWidth = Math.max(0.5, branchWidth * 0.4);
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(subEndX, subEndY);
      ctx.stroke();
    }
  }
}

function updateMeshUI(peers: Map<string, PeerInfo>, state: string, myPeerId: string) {
  const meshStatus = document.getElementById("mesh-status");
  const peerListEl = document.getElementById("peer-list");
  if (!meshStatus || !peerListEl) return;

  const colorMap: Record<string, string> = {
    disconnected: "#f87171",
    connecting: "#fbbf24",
    connected: "#4ade80",
    disconnecting: "#f87171",
  };
  const stateColor = colorMap[state] || "#94a3b8";

  meshStatus.innerHTML = `
    <p style="color: ${stateColor}; margin: 0 0 0.25rem 0;">${state}</p>
    <p style="color: #94a3b8; margin: 0; font-size: 0.85rem;">My ID: ${myPeerId || "none"}</p>
  `;

  if (peers.size === 0) {
    peerListEl.innerHTML = '<p style="color: #64748b; margin: 0; font-size: 0.85rem;">No peers connected</p>';
    return;
  }

  let html = "";
  for (const [id, info] of peers) {
    html += `
      <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0; border-bottom: 1px solid #1e293b;">
        <span style="width: 8px; height: 8px; border-radius: 50%; background: #4ade80; display: inline-block;"></span>
        <span style="color: #e2e8f0; font-size: 0.85rem;">${id}</span>
        <span style="color: #64748b; font-size: 0.75rem; margin-left: auto;">gen:${info.generation} fit:${info.fitness.toFixed(2)}</span>
      </div>
    `;
  }
  peerListEl.innerHTML = html;
}

function drawPheromoneGrid(
  canvas: HTMLCanvasElement,
  field: StigmergyField
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const grid = field.getGridSnapshot();
  const w = field.getGridWidth();
  const h = field.getGridHeight();
  const cCount = field.getChemicalCount();
  const cellW = canvas.width / w;
  const cellH = canvas.height / h;

  ctx.fillStyle = "#030712";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const chemicalColors: Record<string, string> = {
    success: "#4ade80",
    food: "#fbbf24",
    explore: "#38bdf8",
    stress: "#f87171",
    danger: "#ef4444",
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let maxConc = 0;
      let maxColor = "#030712";

      for (let c = 0; c < cCount; c++) {
        const val = grid[(y * w + x) * cCount + c];
        if (val > maxConc) {
          maxConc = val;
          const chemName = field.getChemicalName(c);
          maxColor = chemicalColors[chemName] || "#94a3b8";
        }
      }

      if (maxConc > 0.01) {
        ctx.fillStyle = maxColor;
        ctx.globalAlpha = Math.min(1, maxConc * 2);
        ctx.fillRect(x * cellW, y * cellH, cellW - 1, cellH - 1);
        ctx.globalAlpha = 1;
      }
    }
  }

  // draw grid lines
  ctx.strokeStyle = "rgba(30, 41, 59, 0.3)";
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= w; x++) {
    ctx.beginPath();
    ctx.moveTo(x * cellW, 0);
    ctx.lineTo(x * cellW, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * cellH);
    ctx.lineTo(canvas.width, y * cellH);
    ctx.stroke();
  }
}

async function initWasm() {
  const cellStatus = document.getElementById("cell-status");
  try {
    const wasm = await import("../pkg/mycelia-core/mycelia_core.js");
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

async function main() {
  renderUI();

  let peerManager: PeerManager | null = null;
  let geneTransfer: GeneTransfer | null = null;
  let stigmergyField: StigmergyField | null = null;
  let wasmResult: Awaited<ReturnType<typeof initWasm>> | null = null;
  let hgtCount = 0;

  try {
    wasmResult = await initWasm();
  } catch {
    // wasm init failed, continue with reduced functionality
  }

  peerManager = new PeerManager(WS_URL, {
    onPeersChanged: (peers) => {
      updateMeshUI(peers, peerManager?.getState() || "disconnected", peerManager?.getPeerId() || "");
    },
    onStateChange: (state) => {
      updateMeshUI(peerManager?.getPeers() || new Map(), state, peerManager?.getPeerId() || "");
    },
    onPacket: (packet: NetworkPacket, _from: string) => {
      if (wasmResult && geneTransfer) {
        geneTransfer.onPacket(packet, wasmResult.genome);
        if (packet.type === "gene_fragment") {
          hgtCount++;
          const hgtStatus = document.getElementById("hgt-status");
          if (hgtStatus) {
            hgtStatus.innerHTML = `
              <p style="color: #4ade80; margin: 0;">Gene exchanges: ${hgtCount}</p>
              <p style="color: #94a3b8; margin: 0.25rem 0 0 0; font-size: 0.85rem;">Last: gene#${JSON.parse(packet.payload).index} from ${packet.sourcePeerId}</p>
            `;
          }
        }
      }
      if (stigmergyField && packet.type === "pheromone") {
        try {
          const deposit = JSON.parse(packet.payload);
          stigmergyField.applyRemoteDeposit(deposit);
        } catch {
          // ignore malformed packets
        }
      }
    },
  });

  peerManager.connect();
  geneTransfer = new GeneTransfer(peerManager, { transferInterval: 4, fitnessThreshold: 0.02 });
  stigmergyField = new StigmergyField(peerManager, { gridWidth: 10, gridHeight: 10, gossipInterval: 3 });

  const canvas = document.getElementById("hypha-canvas") as HTMLCanvasElement;
  const pheromoneCanvas = document.getElementById("pheromone-canvas") as HTMLCanvasElement;

  setInterval(() => {
    if (wasmResult) {
      wasmResult.wasm.mutate_genome(wasmResult.genome);
      geneTransfer?.tick(wasmResult.genome);

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
            geneExchanges: hgtCount,
          },
          null,
          2
        );
      }

      if (peerManager) {
        const packet: NetworkPacket = {
          type: "fitness_broadcast",
          sourcePeerId: peerManager.getPeerId(),
          generation: wasmResult.genome.generation(),
          ttl: 3,
          payload: JSON.stringify({
            fitness: wasmResult.genome.fitness(),
            geneCount: wasmResult.genome.gene_count(),
            species: wasmResult.genome.species_tag(),
          }),
          checksum: 0,
          timestamp: Date.now(),
        };
        peerManager.broadcast(packet);
      }

      if (stigmergyField) {
        stigmergyField.tick();

        const chemTypes: Array<"success" | "food" | "explore" | "stress" | "danger"> = [
          "success", "food", "explore", "stress", "danger"
        ];
        const randomChem = chemTypes[Math.floor(Math.random() * chemTypes.length)];
        stigmergyField.deposit(randomChem, 0.3 + Math.random() * 0.4, `gen:${wasmResult.genome.generation()}`);

        const pheromoneStatus = document.getElementById("pheromone-status");
        if (pheromoneStatus) {
          const foodSignal = stigmergyField.sense("food");
          const dangerSignal = stigmergyField.sense("danger");
          pheromoneStatus.innerHTML = `
            <span style="color: #94a3b8;">Grid: ${stigmergyField.getGridWidth()}x${stigmergyField.getGridHeight()} | </span>
            <span style="color: #fbbf24;">Food: ${foodSignal ? foodSignal.concentration.toFixed(2) : "0.00"}</span>
            <span style="color: #94a3b8;"> | </span>
            <span style="color: #f87171;">Danger: ${dangerSignal ? dangerSignal.concentration.toFixed(2) : "0.00"}</span>
          `;
        }
      }

      if (canvas) {
        const geneCount = wasmResult.genome.gene_count();
        const geneDataList: Float32Array[] = [];
        for (let i = 0; i < geneCount; i++) {
          geneDataList.push(wasmResult.genome.get_gene_data(i));
        }
        drawOrganism(canvas, wasmResult.genome.generation(), geneDataList);
      }

      if (pheromoneCanvas && stigmergyField) {
        drawPheromoneGrid(pheromoneCanvas, stigmergyField);
      }
    }
  }, 2000);
}

main().catch((err) => console.error("Mycelia failed to start:", err));
