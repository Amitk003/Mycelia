import "./ui/styles.css";
import { createLayout, showToast, showTooltip, hideTooltip } from "./ui/layout";
import { ForestCanvas } from "./ui/organism-canvas";
import { ForestControls } from "./ui/controls";
import { Sparkline } from "./ui/sparkline";
import { SeedBank } from "./ui/stats-overlay";
import { PeerManager } from "./network/peer-manager";
import { GeneTransfer } from "./network/gene-transfer";
import { StigmergyField } from "./network/stigmergy";
import { ActionProposalEngine } from "./actions/action-engine";
import { FeedbackTracker } from "./actions/feedback-tracker";
import { SensorManager } from "./sensors/sensor-manager";
import { EnvironmentalAPI } from "./environmental/environmental-api";
import { getStarterStrains, exportGenome, importGenome, saveStrain, getSavedStrains } from "./strains/strain-library";
import { PerformanceMonitor } from "./performance/performance-monitor";
import type { NetworkPacket } from "./network/mesh-types";
import type { SensorField } from "../pkg/mycelia_core.js";
import type { ActionProposal } from "./actions/action-engine";

const WS_URL = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname || "localhost"}:8080`;
const g = (id: string) => document.getElementById(id)!;

function updateSensors(s: SensorField): void {
  g("sb-bright").textContent = s.brightness.toFixed(2);
  g("sb-motion").textContent = s.motion_delta.toFixed(2);
  g("sb-ambient").textContent = s.ambient_volume.toFixed(2);
  g("sb-tilt").textContent = `${s.device_tilt_x.toFixed(2)}, ${s.device_tilt_y.toFixed(2)}`;
}

function updateWeather(w: { condition: string; temperature: number; humidity: number }): void {
  g("wb-cond").textContent = w.condition;
  g("wb-temp").textContent = `${w.temperature.toFixed(1)}°C`;
  g("wb-humid").textContent = `${(w.humidity * 100).toFixed(0)}%`;
}

let lastProposalKey = "";
function updateProposals(proposals: ActionProposal[], onAccept: (id: string) => void, onReject: (id: string) => void): void {
  const key = proposals.map(p => p.id).join(",");
  if (key === lastProposalKey) return;
  lastProposalKey = key;

  const countEl = g("prop-count");
  const listEl = g("prop-list");
  if (proposals.length === 0) {
    countEl.textContent = "";
    listEl.innerHTML = '<span class="box-hint" style="margin:0">waiting for evolution...</span>';
    return;
  }
  countEl.textContent = `[${proposals.length}]`;
  listEl.innerHTML = proposals.map(p => `
    <div class="prop-item">
      <div class="prop-item-title">${p.title}</div>
      <div class="prop-item-desc">${p.description}</div>
      <div class="prop-item-foot">
        <span class="prop-item-conf">${(p.confidence * 100).toFixed(0)}%</span>
        <button class="prop-btn-accept" data-pid="${p.id}">water</button>
        <button class="prop-btn-reject" data-pid="${p.id}">prune</button>
      </div>
    </div>
  `).join("");
  listEl.querySelectorAll(".prop-btn-accept").forEach(b => b.addEventListener("click", () => { const id = b.getAttribute("data-pid"); if (id) onAccept(id); }));
  listEl.querySelectorAll(".prop-btn-reject").forEach(b => b.addEventListener("click", () => { const id = b.getAttribute("data-pid"); if (id) onReject(id); }));
}

let lastFeedbackLen = 0;
function updateFeedback(entries: Array<{ action: string; category: string; previousFitness: number; newFitness: number }>): void {
  if (entries.length === lastFeedbackLen) return;
  lastFeedbackLen = entries.length;
  const el = g("fb-list");
  if (entries.length === 0) { el.innerHTML = '<span class="box-hint" style="margin:0">no feedback yet</span>'; return; }
  el.innerHTML = entries.map(e => `
    <div class="fb-item">
      <span class="fb-action-${e.action}">${e.action === "accepted" ? "+" : "−"}${e.action}</span>
      <span class="fb-category">${e.category}</span>
      <span class="fb-fit-change">${e.previousFitness.toFixed(2)} → ${e.newFitness.toFixed(2)}</span>
    </div>
  `).join("");
}

async function main(): Promise<void> {
  const ui = createLayout();

  // Welcome box for first-time visitors
  const welcomeBox = document.getElementById("welcome-box");
  const welcomeOverlay = document.getElementById("welcome-overlay");
  const welcomeEnter = document.getElementById("welcome-enter");
  if (welcomeBox && welcomeOverlay && welcomeEnter && !localStorage.getItem("mycelia_visited")) {
    welcomeOverlay.classList.add("visible");
    welcomeBox.classList.add("visible");
    welcomeEnter.addEventListener("click", () => {
      welcomeBox.classList.remove("visible");
      welcomeOverlay.classList.remove("visible");
      localStorage.setItem("mycelia_visited", "1");
    });
  }

  const forest = new ForestCanvas(ui.canvas);
  const controls = new ForestControls(ui.leafPause, ui.stepBtn, ui.speedSlider, ui.speedLabel);
  const sparkline = new Sparkline();
  const seedBank = new SeedBank(document.getElementById("seed-grid")!);

  let peerManager: PeerManager | null = null;
  let geneTransfer: GeneTransfer | null = null;
  let stigmergyField: StigmergyField | null = null;
  let actionEngine: ActionProposalEngine | null = null;
  let feedbackTracker: FeedbackTracker | null = null;
  let sensorManager: SensorManager | null = null;
  let environmentalAPI: EnvironmentalAPI | null = null;
  let perfMonitor: PerformanceMonitor | null = null;
  let wasmResult: Awaited<ReturnType<typeof initWasm>> | null = null;
  let hgtCount = 0;
  let paused = false;

  function resizeCanvas(): void {
    ui.canvas.width = window.innerWidth;
    ui.canvas.height = window.innerHeight;
    forest.resize();
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  controls.onPause((p) => { paused = p; });
  controls.onSpeed((speed) => {
    const interval = Math.max(200, Math.round(2000 / speed));
    if (perfMonitor) (perfMonitor as unknown as { targetFps: number }).targetFps = 1000 / interval;
  });
  controls.onStepOnce(() => { doTick(); });

  ui.canvas.addEventListener("mushroom-hover", ((e: CustomEvent) => {
    if (e.detail) showTooltip(ui.tooltip, e.detail.x, e.detail.y, e.detail.title, `${(e.detail.confidence * 100).toFixed(0)}%`, e.detail.category);
    else hideTooltip(ui.tooltip);
  }) as EventListener);

  function acceptProposal(id: string): void {
    if (!wasmResult || !feedbackTracker) return;
    const f = wasmResult.genome.fitness();
    feedbackTracker.recordFeedback(id, "proposal", "accepted", f);
    wasmResult.genome.set_fitness(Math.min(1, f + 0.05));
    showToast(ui.toast, "watered", 1500);
  }
  function rejectProposal(id: string): void {
    if (!wasmResult || !feedbackTracker) return;
    const f = wasmResult.genome.fitness();
    feedbackTracker.recordFeedback(id, "proposal", "rejected", f);
    wasmResult.genome.set_fitness(Math.max(0, f - 0.03));
    showToast(ui.toast, "pruned", 1500);
  }

  forest.onMushroomInteract(acceptProposal);
  ui.canvas.addEventListener("mushroom-reject", ((e: CustomEvent) => { if (e.detail) rejectProposal(e.detail.id); }) as EventListener);

  seedBank.onSeedLoad((encoded) => {
    if (!wasmResult) return;
    const genome = importGenome(wasmResult.wasm, encoded);
    if (genome) { wasmResult.genome = genome; showToast(ui.toast, "seed planted", 2000); renderSeeds(); }
  });

  document.getElementById("strain-harvest-btn")?.addEventListener("click", () => {
    if (!wasmResult) return;
    const encoded = exportGenome(wasmResult.genome);
    navigator.clipboard?.writeText(encoded);
    ui.strainInput.value = encoded;
    ui.strainInput.select();
    showToast(ui.toast, "strain harvested", 2000);
  });

  document.getElementById("strain-plant-btn")?.addEventListener("click", () => {
    const val = ui.strainInput.value.trim();
    if (!val || !wasmResult) return;
    const genome = importGenome(wasmResult.wasm, val);
    if (genome) { wasmResult.genome = genome; saveStrain("imported strain", val); ui.strainInput.value = ""; showToast(ui.toast, "strain planted", 2000); renderSeeds(); }
  });

  function renderSeeds(): void {
    if (!wasmResult) return;
    seedBank.update(getStarterStrains(wasmResult.wasm), getSavedStrains());
  }

  try {
    wasmResult = await initWasm();
    ui.titleStatus.textContent = "living";
    renderSeeds();
  } catch {
    ui.titleStatus.textContent = "dormant";
    ui.titleStatus.style.color = "var(--decay)";
  }

  function updatePeerList(): void {
    const el = g("peer-list");
    if (!peerManager || peerManager.getPeers().size === 0) {
      el.innerHTML = '<span class="box-hint" style="margin:0">no peers yet</span>';
      return;
    }
    let html = "";
    for (const [id, info] of peerManager.getPeers()) {
      html += `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:0.82rem;">
        <span style="width:6px;height:6px;border-radius:50%;background:var(--moss-glow);flex-shrink:0;"></span>
        <span style="color:var(--mycelium);font-family:var(--font-data);font-size:0.72rem;">${id.slice(0,8)}</span>
        <span style="color:var(--mycelium-faint);font-family:var(--font-data);font-size:0.68rem;margin-left:auto;">g:${info.generation} f:${info.fitness.toFixed(2)}</span>
      </div>`;
    }
    el.innerHTML = html;
  }

  peerManager = new PeerManager(WS_URL, {
    onPeersChanged: () => { updatePeerList(); },
    onStateChange: (state) => {
      ui.titleStatus.textContent = state === "connected" ? "living" : state;
      ui.titleStatus.style.color = state === "connected" ? "var(--moss-glow)" : "var(--decay)";
      updatePeerList();
    },
    onPacket: (packet: NetworkPacket) => {
      if (wasmResult && geneTransfer) { geneTransfer.onPacket(packet, wasmResult.genome); if (packet.type === "gene_fragment") hgtCount++; }
      if (stigmergyField && packet.type === "pheromone") { try { stigmergyField.applyRemoteDeposit(JSON.parse(packet.payload)); } catch { /* */ } }
      if (feedbackTracker && packet.type === "fitness_broadcast") { try { const d = JSON.parse(packet.payload); if (d.feedbackType === "selective_pressure") feedbackTracker.applyRemotePressure(packet.payload); } catch { /* */ } }
    },
  });

  peerManager.connect();
  geneTransfer = new GeneTransfer(peerManager, { transferInterval: 4, fitnessThreshold: 0.02 });
  stigmergyField = new StigmergyField(peerManager, { gridWidth: 10, gridHeight: 10, gossipInterval: 3 });
  actionEngine = new ActionProposalEngine();
  feedbackTracker = new FeedbackTracker(peerManager);

  sensorManager = new SensorManager();
  sensorManager.init().then(() => { if (wasmResult) sensorManager?.setSensorField(wasmResult.sensorField); });

  environmentalAPI = new EnvironmentalAPI();
  environmentalAPI.init().then(() => { if (environmentalAPI) updateWeather(environmentalAPI.getWeather()); });
  setInterval(() => { environmentalAPI?.refresh().then(() => { if (environmentalAPI) updateWeather(environmentalAPI.getWeather()); }); }, 300000);

  perfMonitor = new PerformanceMonitor();

  function doTick(): void {
    if (!wasmResult) return;
    perfMonitor?.beginTick();

    wasmResult.wasm.mutate_genome(wasmResult.genome);
    geneTransfer?.tick(wasmResult.genome);

    let fitness = wasmResult.genome.fitness();
    if (feedbackTracker) fitness = feedbackTracker.applySelectivePressure(fitness);
    if (environmentalAPI) fitness = environmentalAPI.applySelectivePressure(fitness);
    wasmResult.genome.set_fitness(fitness);
    sensorManager?.tick();

    const gen = wasmResult.genome.generation();
    const fit = wasmResult.genome.fitness();
    const geneCount = wasmResult.genome.gene_count();
    const species = wasmResult.genome.species_tag();

    if (peerManager) peerManager.broadcast({ type: "fitness_broadcast", sourcePeerId: peerManager.getPeerId(), generation: gen, ttl: 3, payload: JSON.stringify({ fitness: fit, geneCount, species }), checksum: 0, timestamp: Date.now() });

    if (stigmergyField) {
      stigmergyField.tick();
      const ct: Array<"success" | "food" | "explore" | "stress" | "danger"> = ["success", "food", "explore", "stress", "danger"];
      const rc = ct[Math.floor(Math.random() * ct.length)];
      stigmergyField.deposit(rc, 0.3 + Math.random() * 0.4, `gen:${gen}`);
      g("ph-grid").textContent = `${stigmergyField.getGridWidth()}x${stigmergyField.getGridHeight()}`;
      const foodSig = stigmergyField.sense("food");
      const dangerSig = stigmergyField.sense("danger");
      g("ph-food").textContent = foodSig ? foodSig.concentration.toFixed(2) : "0.00";
      g("ph-danger").textContent = dangerSig ? dangerSig.concentration.toFixed(2) : "0.00";

      const sense = stigmergyField.sense(rc);
      if (sense) {
        const cc: Record<string, string> = { success: "rgba(74,103,65,0.4)", food: "rgba(196,162,53,0.4)", explore: "rgba(90,107,74,0.3)", stress: "rgba(139,58,58,0.4)", danger: "rgba(196,90,58,0.4)" };
        forest.addPheromone(20 + sense.x * (ui.canvas.width - 40) / 10, 20 + sense.y * (ui.canvas.height - 40) / 10, cc[rc] || "rgba(90,107,74,0.3)");
      }
    }

    const geneDataList: Float32Array[] = [];
    for (let i = 0; i < geneCount; i++) geneDataList.push(wasmResult.genome.get_gene_data(i));
    const proposals = actionEngine ? actionEngine.evaluate(geneDataList, wasmResult.sensorField.to_array(), stigmergyField) : [];
    forest.setMushrooms(proposals);

    g("box-gen-val").textContent = gen.toString();
    g("box-fit-val").textContent = fit.toFixed(4);
    g("box-peers-val").textContent = (peerManager?.getPeers().size || 0).toString();
    g("box-hgt-val").textContent = hgtCount.toString();

    updateSensors(wasmResult.sensorField);
    updateProposals(proposals, acceptProposal, rejectProposal);
    if (feedbackTracker) updateFeedback(feedbackTracker.getRecentFeedback(5));

    if (perfMonitor) {
      const snap = perfMonitor.snapshot();
      g("perf-fps").textContent = `${snap.fps.toFixed(1)}`;
      g("perf-ms").textContent = `${snap.msPerTick}ms`;
      g("perf-cpu").textContent = `${snap.cpuBudget}%`;
    }

    sparkline.push(fit);

    const weatherRain = environmentalAPI ? Math.min(1, (environmentalAPI.getWeather().precipitation / 10)) * controls.getSpeed() : controls.getSpeed() * 0.3;
    forest.draw(gen, geneDataList, fit, species, weatherRain);
  }

  function tick(): void {
    if (!wasmResult) return;
    if (paused) { setTimeout(tick, 100); return; }
    doTick();
    setTimeout(tick, perfMonitor ? perfMonitor.getIntervalMs() : 2000);
  }

  tick();
}

async function initWasm(): Promise<{ wasm: typeof import("../pkg/mycelia_core.js"); genome: import("../pkg/mycelia_core.js").Genome; sensorField: import("../pkg/mycelia_core.js").SensorField }> {
  const wasm = await import("../pkg/mycelia_core.js");
  await wasm.default();
  if (!wasm.init()) throw new Error("WASM init failed");
  return { wasm, genome: new wasm.Genome(), sensorField: new wasm.SensorField() };
}

main().catch((err) => console.error("Mycelia failed to start:", err));
