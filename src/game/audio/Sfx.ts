export class Sfx {
  private ctx: AudioContext | null = null;
  muted = false;
  private ac(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }
  tone(freq: number, dur: number, type: OscillatorType, gain = 0.06, slide?: number): void {
    if (this.muted) return;
    const ctx = this.ac();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), ctx.currentTime + dur);
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.02);
  }
  swing(): void { this.tone(180, 0.12, "sawtooth", 0.04, 0.5); }
  hit(): void { this.tone(90, 0.16, "square", 0.07, 0.4); }
  hurt(): void { this.tone(140, 0.22, "triangle", 0.06, 0.45); }
  dodge(): void { this.tone(320, 0.1, "sine", 0.04, 1.6); }
  death(): void { this.tone(80, 0.8, "sawtooth", 0.08, 0.3); }
  rest(): void { this.tone(220, 0.4, "sine", 0.05, 1.4); this.tone(330, 0.5, "sine", 0.03, 1.3); }
  lock(): void { this.tone(520, 0.08, "square", 0.03); }
  flask(): void { this.tone(400, 0.18, "sine", 0.05, 1.5); }
  boss(): void { this.tone(55, 1.1, "sawtooth", 0.09, 0.7); }
}
