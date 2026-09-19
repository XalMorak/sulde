import type { ClassDef } from "../types";
import { CLASSES } from "../../data/classes";

export class UI {
  selected: ClassDef = CLASSES[0];

  constructor() {
    const grid = document.getElementById("class-grid")!;
    for (const c of CLASSES) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "class-card";
      el.innerHTML = `<h3>${c.name}</h3><div class="mn">${c.nameMn}</div><p>${c.blurb}</p><div class="stats">HP ${c.hp} · STA ${c.stamina} · POISE ${c.poise}</div>`;
      el.addEventListener("click", () => {
        this.selected = c;
        grid.querySelectorAll(".class-card").forEach((n) => n.classList.remove("selected"));
        el.classList.add("selected");
        (document.getElementById("embark-btn") as HTMLButtonElement).disabled = false;
      });
      grid.appendChild(el);
    }
    (grid.firstElementChild as HTMLElement | null)?.click();
  }

  show(id: string, on = true): void {
    document.getElementById(id)?.classList.toggle("hidden", !on);
  }

  bindStart(onEnter: () => void, onEmbark: () => void): void {
    document.getElementById("enter-btn")?.addEventListener("click", onEnter);
    document.getElementById("embark-btn")?.addEventListener("click", onEmbark);
  }

  sync(
    hp: number, maxHp: number,
    sta: number, maxSta: number,
    flasks: number, maxFlasks: number,
    souls: number,
    className: string,
    prompt: string | null,
    locked: boolean,
    boss?: { name: string; hp: number; max: number } | null,
  ): void {
    const hpEl = document.getElementById("hp-fill") as HTMLElement;
    const staEl = document.getElementById("sta-fill") as HTMLElement;
    hpEl.style.transform = `scaleX(${Math.max(0, hp / maxHp)})`;
    staEl.style.transform = `scaleX(${Math.max(0, sta / maxSta)})`;
    const row = document.getElementById("flask-row")!;
    if (row.childElementCount !== maxFlasks) {
      row.innerHTML = "";
      for (let i = 0; i < maxFlasks; i++) {
        const f = document.createElement("div");
        f.className = "flask";
        row.appendChild(f);
      }
    }
    [...row.children].forEach((n, i) => n.classList.toggle("empty", i >= flasks));
    document.getElementById("soul-count")!.textContent = String(souls);
    document.getElementById("class-tag")!.textContent = className;
    const p = document.getElementById("prompt")!;
    p.textContent = prompt ?? "";
    p.classList.toggle("hidden", !prompt);
    document.getElementById("lock-hint")!.classList.toggle("hidden", !locked);
    const bb = document.getElementById("boss-bar")!;
    if (boss && boss.hp > 0) {
      bb.classList.remove("hidden");
      document.getElementById("boss-name")!.textContent = boss.name;
      (document.getElementById("boss-hp") as HTMLElement).style.transform = `scaleX(${boss.hp / boss.max})`;
    } else bb.classList.add("hidden");
  }

  toast(text: string, ms = 1600): void {
    const el = document.getElementById("toast")!;
    el.textContent = text;
    el.classList.remove("hidden");
    window.setTimeout(() => el.classList.add("hidden"), ms);
  }

  youDied(on: boolean): void {
    document.getElementById("you-died")!.classList.toggle("hidden", !on);
    (document.getElementById("death-veil") as HTMLElement).style.opacity = on ? "0.55" : "0";
  }

  hurtFlash(): void {
    const el = document.getElementById("hurt") as HTMLElement;
    el.style.opacity = "1";
    window.setTimeout(() => { el.style.opacity = "0"; }, 180);
  }
}
