export interface LayoutElements {
  canvas: HTMLCanvasElement;
  // Title
  titleBox: HTMLElement;
  titleText: HTMLElement;
  titleStatus: HTMLElement;
  // Stats box
  boxStats: HTMLElement;
  boxGenVal: HTMLElement;
  boxFitVal: HTMLElement;
  boxPeersVal: HTMLElement;
  boxHgtVal: HTMLElement;
  // Sensors box
  boxSensors: HTMLElement;
  // Weather box
  boxWeather: HTMLElement;
  // Proposals box
  boxProposals: HTMLElement;
  // Feedback box
  boxFeedback: HTMLElement;
  // Seeds
  boxSeeds: HTMLElement;
  // Controls
  leafPause: HTMLElement;
  rainSlider: HTMLInputElement;
  rainSpeed: HTMLElement;
  // Overlays
  tooltip: HTMLElement;
  toast: HTMLElement;
  strainIO: HTMLElement;
  strainInput: HTMLInputElement;
}

export function createLayout(): LayoutElements {
  const app = document.getElementById("app")!;
  app.innerHTML = `
    <canvas id="forest-canvas"></canvas>

    <!-- Title box — top left -->
    <div id="title-box" class="fbox">
      <h1 id="title-text">mycelia</h1>
      <div id="title-status">waking...</div>
    </div>

    <!-- Stats box — top center-right -->
    <div id="box-stats" class="fbox stats-combined">
      <div class="stats-row">
        <span class="stat-label">generation</span><span class="stat-val" id="box-gen-val">0</span>
      </div>
      <div class="stats-row">
        <span class="stat-label">fitness</span><span class="stat-val accent" id="box-fit-val">0.000</span>
      </div>
      <div class="stats-row">
        <span class="stat-label">peers</span><span class="stat-val" id="box-peers-val">0</span>
      </div>
      <div class="stats-row">
        <span class="stat-label">exchanges</span><span class="stat-val" id="box-hgt-val">0</span>
      </div>
    </div>
    <div id="peer-list-box" class="fbox data-box" style="top:200px;right:16px;max-width:280px;max-height:120px;overflow-y:auto;">
      <div class="box-title">mesh</div>
      <div id="peer-list"><span class="box-hint" style="margin:0">no peers yet</span></div>
    </div>

    <!-- Sensors box — below title on left side -->
    <div id="box-sensors" class="fbox data-box">
      <div class="box-title">senses</div>
      <div class="box-grid">
        <span class="box-label">brightness</span><span class="box-val" id="sb-bright">0.00</span>
        <span class="box-label">motion</span><span class="box-val" id="sb-motion">0.00</span>
        <span class="box-label">ambient</span><span class="box-val" id="sb-ambient">0.00</span>
        <span class="box-label">tilt</span><span class="box-val" id="sb-tilt">0, 0</span>
      </div>
      <div style="border-top:1px solid rgba(120,140,100,0.15);margin:6px 0;padding-top:6px;">
        <div class="box-grid">
          <span class="box-label">fps</span><span class="box-val" id="perf-fps">—</span>
          <span class="box-label">ms/tick</span><span class="box-val" id="perf-ms">—</span>
          <span class="box-label">cpu</span><span class="box-val" id="perf-cpu">—</span>
        </div>
      </div>
      <div class="box-hint">camera, mic & motion — stays on your device</div>
    </div>

    <!-- Weather box — right top -->
    <div id="box-weather" class="fbox data-box">
      <div class="box-title">environment</div>
      <div class="box-grid">
        <span class="box-label">condition</span><span class="box-val" id="wb-cond">—</span>
        <span class="box-label">temperature</span><span class="box-val" id="wb-temp">—</span>
        <span class="box-label">humidity</span><span class="box-val" id="wb-humid">—</span>
      </div>
      <div style="border-top:1px solid rgba(120,140,100,0.15);margin:6px 0;padding-top:6px;">
        <div class="box-grid">
          <span class="box-label">pheromone grid</span><span class="box-val" id="ph-grid">—</span>
          <span class="box-label">food signal</span><span class="box-val" id="ph-food">0.00</span>
          <span class="box-label">danger signal</span><span class="box-val" id="ph-danger">0.00</span>
        </div>
      </div>
      <div class="box-hint">weather affects fitness — extremes stress the organism</div>
    </div>

    <!-- Proposals box — bottom left -->
    <div id="box-proposals" class="fbox data-box">
      <div class="box-title">proposals <span id="prop-count"></span></div>
      <div id="prop-list">waiting for evolution...</div>
      <div class="box-hint">organism suggests actions — you choose</div>
    </div>

    <!-- Feedback box — bottom right -->
    <div id="box-feedback" class="fbox data-box">
      <div class="box-title">feedback</div>
      <div id="fb-list">no feedback yet</div>
      <div class="box-hint">accept/reject changes fitness — it learns from you</div>
    </div>

    <!-- Seeds — bottom center -->
    <div id="box-seeds" class="fbox">
      <div class="box-title">seeds</div>
      <div id="seed-grid"></div>
      <div id="strain-io">
        <input id="strain-input" type="text" placeholder="paste strain..." />
        <button id="strain-plant-btn" class="fbox-btn">plant</button>
        <button id="strain-harvest-btn" class="fbox-btn">harvest</button>
      </div>
    </div>

    <!-- Controls -->
    <div id="leaf-pause" title="pause/resume">
      <svg viewBox="0 0 32 32" fill="none"><path d="M16 2 C12 6,6 10,4 16 C2 22,6 28,12 30 C14 30.5,16 30,18 28 C22 24,28 18,30 12 C32 6,28 2,22 1 C20 0.8,18 1,16 2Z" fill="#4a6741" opacity="0.7"/><path d="M16 2 C16 8,15 14,14 20 C13 24,12 27,12 30" stroke="#5a6b4a" stroke-width="0.5" opacity="0.5"/></svg>
    </div>

    <div id="rain-control">
      <label>rain</label>
      <input type="range" id="rain-slider" min="1" max="10" value="3" />
      <span id="rain-speed">1x</span>
    </div>

    <div id="organic-tooltip"><div class="tooltip-leaf" id="tooltip-inner"></div></div>
    <div id="toast"></div>
  `;

  const g = (id: string) => document.getElementById(id)!;
  const els: LayoutElements = {
    canvas: g("forest-canvas") as HTMLCanvasElement,
    titleBox: g("title-box"),
    titleText: g("title-text"),
    titleStatus: g("title-status"),
    boxStats: g("box-stats"),
    boxGenVal: g("box-gen-val"),
    boxFitVal: g("box-fit-val"),
    boxPeersVal: g("box-peers-val"),
    boxHgtVal: g("box-hgt-val"),
    boxSensors: g("box-sensors"),
    boxWeather: g("box-weather"),
    boxProposals: g("box-proposals"),
    boxFeedback: g("box-feedback"),
    boxSeeds: g("box-seeds"),
    leafPause: g("leaf-pause"),
    rainSlider: g("rain-slider") as HTMLInputElement,
    rainSpeed: g("rain-speed"),
    tooltip: g("organic-tooltip"),
    toast: g("toast"),
    strainIO: g("strain-io"),
    strainInput: g("strain-input") as HTMLInputElement,
  };
  return els;
}

export function showToast(toast: HTMLElement, message: string, ms = 2000): void {
  toast.textContent = message;
  toast.classList.add("visible");
  setTimeout(() => toast.classList.remove("visible"), ms);
}

export function showTooltip(tip: HTMLElement, x: number, y: number, title: string, value: string, extra?: string): void {
  const inner = tip.querySelector("#tooltip-inner")!;
  inner.innerHTML = `<div class="tt-title">${title}</div><div class="tt-value">${value}</div>${extra ? `<div class="tt-extra">${extra}</div>` : ""}`;
  tip.style.left = `${x + 14}px`;
  tip.style.top = `${y - 10}px`;
  tip.classList.add("visible");
}

export function hideTooltip(tip: HTMLElement): void { tip.classList.remove("visible"); }
