interface Seed {
  name: string;
  encoded: string;
}

export class SeedBank {
  private container: HTMLElement;
  private onLoad: ((encoded: string) => void) | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  onSeedLoad(cb: (encoded: string) => void): void { this.onLoad = cb; }

  update(starterStrains: Seed[], savedStrains: Seed[]): void {
    let html = "";
    const all: Seed[] = [...starterStrains, ...savedStrains];
    for (const seed of all) {
      html += `<div class="seed" data-encoded="${seed.encoded}">
        <div class="seed-dot"></div>
        <span class="seed-name">${seed.name}</span>
      </div>`;
    }
    this.container.innerHTML = html;

    this.container.querySelectorAll(".seed").forEach(el => {
      el.addEventListener("click", () => {
        const encoded = el.getAttribute("data-encoded");
        if (encoded) this.onLoad?.(encoded);
      });
    });
  }
}
