interface LegendEntry {
  id: string;
  title: string;
  description: string;
  color: string;
}

const ENTRIES: LegendEntry[] = [
  { id: "canvas", title: "the organism", description: "Branches are gene expressions that change each generation. Mushrooms = action proposals; click to water, right-click to prune. Colored glows = pheromones from peers. Bottom bar = fitness (health).", color: "var(--gold)" },
  { id: "stats", title: "stats", description: "Generation = mutations applied. Fitness (0-1) = adaptation level. Peers = connected browser tabs (mesh). Exchanges = gene fragments received from peers.", color: "var(--mycelium)" },
  { id: "senses", title: "senses", description: "Live readings from your camera (brightness, motion), microphone (ambient volume), and device orientation (tilt). All data stays on your device.", color: "var(--lichen)" },
  { id: "environment", title: "environment", description: "Real weather via open-meteo.com. Extremes stress the organism. Pheromone grid = virtual chemical signals shared across the mesh.", color: "var(--amber)" },
  { id: "mesh", title: "mesh", description: "Other Mycelia instances connected over WebRTC. No central server after initial handshake. They exchange genes and broadcast pheromones.", color: "var(--moss-glow)" },
  { id: "proposals", title: "proposals", description: "Actions the organism suggests based on genes, sensors, and network signals. Confidence = how certain it is. Water to reward, prune to discourage -- it learns.", color: "var(--moss)" },
  { id: "feedback", title: "feedback", description: "Your accept/reject history and how each choice changed fitness. This is the learning signal that shapes future behavior.", color: "var(--decay)" },
  { id: "seeds", title: "seeds", description: "Save or load genome strains as text. Starter strains have different personalities: Balanced, Aggressive, Explorer. Each grows and mutates differently.", color: "var(--lichen)" },
];

export class LegendPanel {
  private overlay: HTMLElement;
  private panel: HTMLElement;
  private trigger: HTMLElement;
  private visible = false;

  constructor(trigger: HTMLElement) {
    this.trigger = trigger;
    this.overlay = document.createElement("div");
    this.overlay.id = "legend-overlay";
    this.panel = document.createElement("div");
    this.panel.id = "legend-panel";
    this.panel.className = "fbox";
    this.buildPanel();
    document.getElementById("app")!.appendChild(this.overlay);
    document.getElementById("app")!.appendChild(this.panel);
    this.bindEvents();
  }

  private buildPanel(): void {
    this.panel.innerHTML = `
      <div id="legend-header">
        <div id="legend-title">the grove</div>
        <div id="legend-close">x</div>
      </div>
      <div id="legend-list">
        ${ENTRIES.map(e => `
          <div class="legend-entry" data-id="${e.id}">
            <span class="legend-dot" style="background:${e.color}"></span>
            <div class="legend-body">
              <div class="legend-entry-title">${e.title}</div>
              <div class="legend-entry-desc">${e.description}</div>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }

  private bindEvents(): void {
    this.trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggle();
    });
    this.overlay.addEventListener("click", () => this.hide());
    this.panel.querySelector("#legend-close")?.addEventListener("click", () => this.hide());
  }

  toggle(): void {
    this.visible ? this.hide() : this.show();
  }

  show(): void {
    this.visible = true;
    this.overlay.classList.add("visible");
    this.panel.classList.add("visible");
  }

  hide(): void {
    this.visible = false;
    this.overlay.classList.remove("visible");
    this.panel.classList.remove("visible");
  }
}
