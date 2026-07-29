export interface MushroomProposal {
  id: string;
  title: string;
  confidence: number;
  category: string;
  x: number;
  y: number;
  grown: number;
  wilting: boolean;
  wiltProgress: number;
  alpha: number;
}

interface Spore {
  x: number; y: number; vx: number; vy: number;
  radius: number; alpha: number; hue: number; life: number;
}

const CAP_COLORS: Record<string, { h: number; s: number; l: number }> = {
  water: { h: 200, s: 45, l: 55 },
  shade: { h: 120, s: 35, l: 45 },
  soil: { h: 30, s: 50, l: 45 },
  pest: { h: 0, s: 55, l: 45 },
  planting: { h: 280, s: 40, l: 55 },
};

export class ForestCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private time = 0;
  private mushrooms: MushroomProposal[] = [];
  private weatherDrops: Array<{ x: number; y: number; speed: number; size: number; alpha: number }> = [];
  private pheromones: Array<{ x: number; y: number; color: string; alpha: number; radius: number }> = [];
  private spores: Spore[] = [];
  private soilPattern: ImageData | null = null;
  private lastSoilSize = { w: 0, h: 0 };
  private onMushroomClick: ((id: string) => void) | null = null;
  private hoveredMushroom: MushroomProposal | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.resize();
    this.setupInteraction();
  }

  resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w > 0 && h > 0) { this.canvas.width = w; this.canvas.height = h; this.soilPattern = null; }
  }

  onMushroomInteract(cb: (id: string) => void): void { this.onMushroomClick = cb; }

  private setupInteraction(): void {
    this.canvas.addEventListener("mousemove", (e) => {
      let found: MushroomProposal | null = null;
      for (const m of this.mushrooms) {
        if (m.wiltProgress >= 1) continue;
        const dx = e.clientX - m.x, dy = e.clientY - m.y;
        if (Math.sqrt(dx * dx + dy * dy) < 22) { found = m; break; }
      }
      this.hoveredMushroom = found;
      this.canvas.style.cursor = found ? "pointer" : "default";
      if (found) {
        this.canvas.dispatchEvent(new CustomEvent("mushroom-hover", {
          detail: { id: found.id, x: e.clientX, y: e.clientY, title: found.title, confidence: found.confidence, category: found.category }
        }));
      } else {
        this.canvas.dispatchEvent(new CustomEvent("mushroom-hover", { detail: null }));
      }
    });
    this.canvas.addEventListener("click", () => {
      if (this.hoveredMushroom && this.onMushroomClick) {
        this.onMushroomClick(this.hoveredMushroom.id);
        this.hoveredMushroom.wilting = true;
        this.hoveredMushroom.wiltProgress = 0;
      }
    });
    this.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      if (this.hoveredMushroom) {
        this.hoveredMushroom.wilting = true;
        this.hoveredMushroom.wiltProgress = 0;
        this.canvas.dispatchEvent(new CustomEvent("mushroom-reject", { detail: { id: this.hoveredMushroom.id } }));
      }
    });
  }

  setMushrooms(proposals: Array<{ id: string; title: string; confidence: number; category: string }>): void {
    const cx = this.canvas.width / 2, cy = this.canvas.height / 2;
    const existing = new Map(this.mushrooms.map(m => [m.id, m]));
    const next: MushroomProposal[] = [];
    for (let i = 0; i < proposals.length; i++) {
      const p = proposals[i];
      const old = existing.get(p.id);
      if (old) { old.title = p.title; old.confidence = p.confidence; old.category = p.category; next.push(old); }
      else {
        const angle = (i / proposals.length) * Math.PI * 2 + Math.PI * 0.3;
        const dist = 90 + Math.random() * 70;
        next.push({ ...p, x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist, grown: 0, wilting: false, wiltProgress: 0, alpha: 1 });
      }
    }
    for (const [id, m] of existing) {
      if (!next.find(n => n.id === id) && !m.wilting) { m.wilting = true; m.wiltProgress = 0; next.push(m); }
    }
    this.mushrooms = next.filter(m => !(m.wilting && m.wiltProgress >= 1));
  }

  addPheromone(x: number, y: number, color: string): void {
    this.pheromones.push({ x, y, color, alpha: 0.5, radius: 14 + Math.random() * 10 });
    if (this.pheromones.length > 50) this.pheromones.shift();
  }

  private generateSoilTexture(): void {
    const w = this.canvas.width, h = this.canvas.height;
    if (this.soilPattern && this.lastSoilSize.w === w && this.lastSoilSize.h === h) return;
    const imageData = this.ctx.createImageData(w, h);
    const data = imageData.data;
    let seed = 42;
    const rand = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed / 2147483647) - 0.5; };
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const n = rand() * 10, v = 12 + n;
        data[i] = Math.max(0, Math.min(255, v + 2));
        data[i + 1] = Math.max(0, Math.min(255, v + 3));
        data[i + 2] = Math.max(0, Math.min(255, v));
        data[i + 3] = 255;
      }
    }
    this.soilPattern = imageData;
    this.lastSoilSize = { w, h };
  }

  draw(generation: number, geneDataList: Float32Array[], fitness: number, _species: string, rainIntensity: number): void {
    const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
    this.time += 0.016;
    const cx = w / 2, cy = h / 2;

    this.generateSoilTexture();
    if (this.soilPattern) ctx.putImageData(this.soilPattern, 0, 0);

    // Fog
    const fog = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.55);
    fog.addColorStop(0, `rgba(26, 38, 20, ${0.06 + fitness * 0.04})`);
    fog.addColorStop(1, "rgba(13, 15, 10, 0)");
    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, w, h);

    // Vignette
    const vig = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.3, cx, cy, Math.max(w, h) * 0.7);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);

    // Pheromones
    for (let i = this.pheromones.length - 1; i >= 0; i--) {
      const p = this.pheromones[i];
      p.alpha *= 0.994; p.radius += 0.12;
      if (p.alpha < 0.01) { this.pheromones.splice(i, 1); continue; }
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
      grad.addColorStop(0, p.color); grad.addColorStop(1, "transparent");
      ctx.globalAlpha = p.alpha; ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Growth rings
    const maxRings = Math.min(generation, 40);
    for (let i = 0; i < maxRings; i++) {
      const radius = 22 + i * 7, alpha = 0.03 + fitness * 0.025;
      ctx.beginPath();
      for (let s = 0; s <= 60; s++) {
        const a = (s / 60) * Math.PI * 2;
        const rr = radius + Math.sin(a * 3 + i * 0.5 + this.time * 0.1) * 1.5;
        const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
        if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = `hsla(${75 + (i % 4) * 12}, 18%, 28%, ${alpha})`;
      ctx.lineWidth = 0.6 + (i % 5 === 0 ? 0.4 : 0);
      ctx.stroke();
    }

    // Ambient glow
    const pulse = 1 + Math.sin(this.time * 0.6) * 0.08;
    const gr = (50 + fitness * 40) * pulse;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, gr);
    glow.addColorStop(0, `hsla(85, 40%, ${35 + fitness * 15}%, ${0.12 + fitness * 0.06})`);
    glow.addColorStop(1, "hsla(80, 20%, 20%, 0)");
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, gr, 0, Math.PI * 2); ctx.fill();

    // Organism
    const n = Math.min(geneDataList.length, 14);
    const t = this.time;
    const breathScale = 1 + Math.sin(t * 0.7) * 0.005;
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(breathScale, breathScale); ctx.translate(-cx, -cy);

    for (let i = 0; i < n; i++) {
      const d = geneDataList[i];
      if (d.length === 0) continue;
      const avg = d.reduce((a, b) => a + b, 0) / d.length;
      const pk = Math.max(...d.map(Math.abs));
      const vari = d.reduce((s, vv) => s + (vv - avg) * (vv - avg), 0) / d.length;
      const f0 = d[0];
      const baseAngle = (i / n) * Math.PI * 2;
      const angle = baseAngle + f0 * 0.8 + Math.sin(t * 0.4 + i) * 0.12;
      const len = 30 + (avg + 1) * 28 + Math.sin(t * 0.25 + i + generation * 0.015) * 10;
      const curveStrength = (vari + 0.1) * 25 + Math.sin(t * 0.3 + i * 2) * 8;
      const cp1x = cx + Math.cos(angle + curveStrength * 0.02) * len * 0.35;
      const cp1y = cy + Math.sin(angle + curveStrength * 0.02) * len * 0.35;
      const cp2x = cx + Math.cos(angle - curveStrength * 0.015) * len * 0.7;
      const cp2y = cy + Math.sin(angle - curveStrength * 0.015) * len * 0.7;
      const endX = cx + Math.cos(angle) * len, endY = cy + Math.sin(angle) * len;
      const hue = 65 + f0 * 35 + (1 - fitness) * 25;
      const sat = 30 + pk * 18 + fitness * 22;
      const lit = 28 + avg * 8 + fitness * 12;

      // Glow layer
      ctx.save();
      ctx.strokeStyle = `hsla(${hue}, ${sat + 10}%, ${lit + 15}%, 0.12)`;
      ctx.lineWidth = Math.max(1, (0.8 + (vari + 0.1) * 3.5) * 3);
      ctx.lineCap = "round"; ctx.filter = "blur(4px)";
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY); ctx.stroke();
      ctx.restore();

      // Main branch
      ctx.strokeStyle = `hsl(${hue}, ${sat}%, ${lit}%)`;
      ctx.lineWidth = Math.max(0.5, 0.8 + (vari + 0.1) * 2.8);
      ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY); ctx.stroke();

      // Tip glow
      const tipR = 1.5 + (pk + 1) * 2, tipPulse = 1 + Math.sin(t * 1.2 + i * 0.8) * 0.2;
      ctx.save();
      ctx.shadowColor = `hsl(${hue}, ${sat + 15}%, ${lit + 20}%)`;
      ctx.shadowBlur = 10 * tipPulse;
      ctx.fillStyle = `hsla(${hue}, ${sat + 10}%, ${lit + 18}%, 0.7)`;
      ctx.beginPath(); ctx.arc(endX, endY, tipR * tipPulse, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.fillStyle = `hsla(${hue}, ${sat + 20}%, ${lit + 25}%, 0.9)`;
      ctx.beginPath(); ctx.arc(endX, endY, tipR * 0.4 * tipPulse, 0, Math.PI * 2); ctx.fill();

      // Sub-branches
      if (d.length >= 3) {
        const subAngle = angle + (d[2] - 0.5) * 1.0;
        const subLen = len * 0.3 * (1 + (avg + 1) * 0.1);
        const sx = endX + Math.cos(subAngle) * subLen, sy = endY + Math.sin(subAngle) * subLen;
        const scpx = endX + Math.cos(subAngle + (d[4] ?? 0) * 0.2) * subLen * 0.5;
        const scpy = endY + Math.sin(subAngle + (d[4] ?? 0) * 0.2) * subLen * 0.5;
        ctx.strokeStyle = `hsla(${hue}, ${sat - 8}%, ${lit - 3}%, 0.3)`;
        ctx.lineWidth = Math.max(0.3, (0.8 + (vari + 0.1) * 2.8) * 0.25);
        ctx.beginPath(); ctx.moveTo(endX, endY); ctx.quadraticCurveTo(scpx, scpy, sx, sy); ctx.stroke();
        ctx.fillStyle = `hsla(${hue}, ${sat}%, ${lit + 10}%, 0.35)`;
        ctx.beginPath(); ctx.arc(sx, sy, 0.8, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Center body
    const bodyR = 7 + fitness * 5 + Math.sin(t * 0.8) * 0.8;
    const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, bodyR * 2.5);
    halo.addColorStop(0, `hsla(82, 35%, ${32 + fitness * 12}%, 0.08)`);
    halo.addColorStop(1, "hsla(80, 20%, 20%, 0)");
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, bodyR * 2.5, 0, Math.PI * 2); ctx.fill();
    const bodyGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, bodyR);
    bodyGrad.addColorStop(0, `hsla(82, 40%, ${38 + fitness * 18}%, 0.85)`);
    bodyGrad.addColorStop(0.6, `hsla(78, 30%, ${25 + fitness * 10}%, 0.5)`);
    bodyGrad.addColorStop(1, "hsla(80, 20%, 20%, 0)");
    ctx.fillStyle = bodyGrad; ctx.beginPath(); ctx.arc(cx, cy, bodyR, 0, Math.PI * 2); ctx.fill();
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, bodyR * 0.35);
    coreGrad.addColorStop(0, `hsla(85, 50%, ${55 + fitness * 15}%, 0.6)`);
    coreGrad.addColorStop(1, "hsla(82, 35%, 40%, 0)");
    ctx.fillStyle = coreGrad; ctx.beginPath(); ctx.arc(cx, cy, bodyR * 0.35, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Spores
    if (Math.random() < 0.3 + fitness * 0.2) {
      if (this.spores.length < 120) {
        const angle = Math.random() * Math.PI * 2, speed = 0.15 + Math.random() * 0.4;
        this.spores.push({ x: cx + (Math.random() - 0.5) * 30, y: cy + (Math.random() - 0.5) * 30, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 0.1, radius: 0.8 + Math.random() * 1.8, alpha: 0, hue: 60 + Math.random() * 40, life: 0 });
      }
    }
    for (let i = this.spores.length - 1; i >= 0; i--) {
      const s = this.spores[i];
      s.life += 0.008;
      if (s.life < 0.2) s.alpha = s.life / 0.2; else if (s.life > 0.7) s.alpha = Math.max(0, (1 - s.life) / 0.3); else s.alpha = 1;
      s.x += s.vx + Math.sin(t * 0.5 + i) * 0.08; s.y += s.vy + Math.cos(t * 0.3 + i * 0.7) * 0.06;
      s.vx += (Math.random() - 0.5) * 0.01; s.vy += (Math.random() - 0.5) * 0.01 - 0.002;
      if (s.life >= 1) { this.spores.splice(i, 1); continue; }
      ctx.save(); ctx.globalAlpha = s.alpha * 0.55;
      ctx.shadowColor = `hsl(${s.hue}, 50%, 70%)`; ctx.shadowBlur = 6;
      ctx.fillStyle = `hsl(${s.hue}, 40%, 75%)`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // Weather
    const spawnCount = Math.floor(rainIntensity * 0.6);
    for (let i = 0; i < spawnCount; i++) {
      this.weatherDrops.push({ x: Math.random() * w, y: -5, speed: 2.5 + Math.random() * 3 + rainIntensity * 0.4, size: 1 + Math.random() * 1.5, alpha: 0.12 + Math.random() * 0.1 });
    }
    for (let i = this.weatherDrops.length - 1; i >= 0; i--) {
      const drop = this.weatherDrops[i];
      drop.y += drop.speed; drop.x += 0.25;
      if (drop.y > h + 5) { this.weatherDrops.splice(i, 1); continue; }
      ctx.strokeStyle = `rgba(170, 195, 215, ${drop.alpha})`; ctx.lineWidth = drop.size * 0.35;
      ctx.beginPath(); ctx.moveTo(drop.x, drop.y); ctx.lineTo(drop.x + 0.8, drop.y + drop.size * 3.5); ctx.stroke();
    }
    if (this.weatherDrops.length > 180) this.weatherDrops.splice(0, this.weatherDrops.length - 180);

    // Mushrooms
    for (const m of this.mushrooms) {
      if (m.wilting) { m.wiltProgress = Math.min(1, m.wiltProgress + 0.02); m.alpha = Math.max(0, 1 - m.wiltProgress); if (m.alpha <= 0) continue; }
      else { m.grown = Math.min(1, m.grown + 0.025); }
      const scale = m.wilting ? (1 - m.wiltProgress * 0.6) : m.grown;
      const droop = m.wilting ? m.wiltProgress * 0.5 : 0;
      const col = CAP_COLORS[m.category] || CAP_COLORS.water;
      ctx.save(); ctx.translate(m.x, m.y + droop * 15); ctx.scale(scale, scale); ctx.globalAlpha = m.alpha;
      ctx.strokeStyle = "rgba(180, 175, 155, 0.45)"; ctx.lineWidth = 2.8; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(0, 2); ctx.quadraticCurveTo(droop * 6, -8, droop * 3, -16); ctx.stroke();
      const capW = 7 + m.confidence * 12, capH = 5 + m.confidence * 6;
      const capX = droop * 3, capY = -16;
      ctx.save(); ctx.shadowColor = `hsl(${col.h}, ${col.s + 10}%, ${col.l + 15}%)`; ctx.shadowBlur = 16;
      ctx.fillStyle = `hsla(${col.h}, ${col.s}%, ${col.l}%, 0.15)`;
      ctx.beginPath(); ctx.ellipse(capX, capY, capW + 6, capH + 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      const capGrad = ctx.createRadialGradient(capX - capW * 0.15, capY - capH * 0.3, 0, capX, capY, capW);
      capGrad.addColorStop(0, `hsl(${col.h}, ${col.s + 5}%, ${col.l + 12}%)`);
      capGrad.addColorStop(1, `hsl(${col.h}, ${col.s - 5}%, ${col.l - 8}%)`);
      ctx.fillStyle = capGrad;
      ctx.beginPath(); ctx.ellipse(capX, capY, capW, capH, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${0.06 + m.confidence * 0.04})`;
      ctx.beginPath(); ctx.ellipse(capX - capW * 0.2, capY - capH * 0.35, capW * 0.4, capH * 0.3, -0.2, 0, Math.PI * 2); ctx.fill();
      if (this.hoveredMushroom === m && !m.wilting) {
        const hP = 1 + Math.sin(t * 3) * 0.1;
        ctx.save(); ctx.shadowColor = `hsl(${col.h},${col.s+10}%,${col.l+10}%)`; ctx.shadowBlur = 14 * hP;
        ctx.strokeStyle = `hsla(${col.h},${col.s+10}%,${col.l+10}%,0.6)`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(capX, capY, capW + 4 * hP, capH + 3 * hP, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1; ctx.restore();
    }

    // Fitness vine
    const vineY = h - 3, vineW = w - 40, startX = 20;
    ctx.fillStyle = "rgba(42, 37, 32, 0.35)"; ctx.fillRect(startX, vineY, vineW, 1.5);
    const fillW = vineW * Math.max(0, Math.min(1, fitness));
    const vh = 80 - fitness * 40;
    ctx.fillStyle = `hsl(${vh}, 40%, 35%)`; ctx.fillRect(startX, vineY, fillW, 1.5);
    if (fillW > 2) {
      const tipGrad = ctx.createRadialGradient(startX + fillW, vineY, 0, startX + fillW, vineY, 8);
      tipGrad.addColorStop(0, `hsla(${vh}, 50%, 45%, 0.35)`); tipGrad.addColorStop(1, "transparent");
      ctx.fillStyle = tipGrad; ctx.fillRect(startX + fillW - 8, vineY - 7, 16, 14);
    }
  }
}
