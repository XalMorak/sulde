export type ClassId = "noyon" | "baatar" | "mergen" | "boo" | "kharachin";

export interface ClassDef {
  id: ClassId;
  name: string;
  nameMn: string;
  blurb: string;
  color: number;
  accent: number;
  hp: number;
  stamina: number;
  poise: number;
  speed: number;
  light: number;
  heavy: number;
  range: number;
  flasks: number;
  weapon: "greatsword" | "axe" | "bow" | "staff" | "dual";
}

export type Anim =
  | "idle"
  | "walk"
  | "sprint"
  | "light"
  | "heavy"
  | "dodge"
  | "hit"
  | "death"
  | "cast";

export interface HitEvent {
  damage: number;
  poise: number;
  knock: number;
  source: "player" | "enemy";
  kind: "light" | "heavy" | "spell" | "arrow";
}
