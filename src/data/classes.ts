import type { ClassDef } from "../game/types";

export const CLASSES: ClassDef[] = [
  { id: "noyon", name: "Noyon", nameMn: "Ноён — Banner Knight", blurb: "Greatsword and iron poise. Slow, implacable, built to trade blows with kings.", color: 0x2c3340, accent: 0xc9a46a, hp: 160, stamina: 100, poise: 80, speed: 4.2, light: 22, heavy: 46, range: 2.35, flasks: 5, weapon: "greatsword" },
  { id: "baatar", name: "Baatar", nameMn: "Баатар — Steppe Berserker", blurb: "Axe that drinks stamina for blood. High damage, thin patience.", color: 0x4a1c16, accent: 0xd4783a, hp: 145, stamina: 90, poise: 55, speed: 4.6, light: 26, heavy: 58, range: 2.05, flasks: 4, weapon: "axe" },
  { id: "mergen", name: "Mergen", nameMn: "Мэргэн — Sky Archer", blurb: "Keeps distance, punishes greed. Light body, long reach.", color: 0x1d2a24, accent: 0x8fbf7a, hp: 110, stamina: 115, poise: 30, speed: 5.1, light: 16, heavy: 34, range: 14, flasks: 4, weapon: "bow" },
  { id: "boo", name: "Böö", nameMn: "Бөө — Ash Shaman", blurb: "Channels tenger-fire. Fragile, but the night answers.", color: 0x2a2140, accent: 0x8a6ad4, hp: 100, stamina: 130, poise: 24, speed: 4.5, light: 18, heavy: 42, range: 10, flasks: 6, weapon: "staff" },
  { id: "kharachin", name: "Kharachin", nameMn: "Харачин — Night Blade", blurb: "Two knives, one breath. I-frames are the religion.", color: 0x161618, accent: 0x8aa0c4, hp: 105, stamina: 120, poise: 28, speed: 5.4, light: 14, heavy: 30, range: 1.7, flasks: 4, weapon: "dual" }
];

export function classById(id: string): ClassDef {
  return CLASSES.find((c) => c.id === id) ?? CLASSES[0];
}
