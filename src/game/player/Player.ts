import * as THREE from "three";
import type { Anim, ClassDef, HitEvent } from "../types";
import { forgeHero, type Rig } from "../mesh/Forge";
import type { Input } from "../input/Input";

export class Player {
  readonly rig: Rig;
  readonly def: ClassDef;
  hp: number; stamina: number; poise: number; flasks: number;
  souls = 0; anim: Anim = "idle"; animT = 0; yaw = 0; invuln = 0;
  dead = false; recoverSouls = 0; lockTarget: THREE.Object3D | null = null;
  private attackQueued: "light" | "heavy" | null = null;
  private cooldown = 0; private flaskCd = 0;

  constructor(def: ClassDef) {
    this.def = def; this.rig = forgeHero(def);
    this.hp = def.hp; this.stamina = def.stamina; this.poise = def.poise; this.flasks = def.flasks;
    this.rig.root.position.set(0, 0, 10);
  }
  get position(): THREE.Vector3 { return this.rig.root.position; }
  facing(): THREE.Vector3 { return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)); }

  update(dt: number, input: Input, camYaw: number, tryHit: (o: THREE.Vector3, d: THREE.Vector3, r: number, h: HitEvent) => void, spawnFx: (p: THREE.Vector3, c: number) => void): void {
    if (this.dead) { this.anim = "death"; this.animT += dt; this.rig.torso.rotation.x = Math.min(1.2, this.animT * 1.4); return; }
    this.invuln = Math.max(0, this.invuln - dt);
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.flaskCd = Math.max(0, this.flaskCd - dt);
    this.animT += dt;
    const busy = ["light", "heavy", "dodge", "hit", "cast"].includes(this.anim);
    if (busy && this.animEnded()) { this.anim = "idle"; this.animT = 0; }
    const lookDir = this.lockTarget ? new THREE.Vector3().subVectors(this.lockTarget.position, this.position) : new THREE.Vector3(-Math.sin(camYaw), 0, -Math.cos(camYaw));
    lookDir.y = 0; if (lookDir.lengthSq() > 0.0001) lookDir.normalize();
    if (!busy) {
      if (input.lmb) this.tryAttack("light");
      else if (input.rmb) this.tryAttack("heavy");
      else if (input.pressed("Space") && this.stamina >= 18) this.startDodge(input, camYaw);
      else if (input.pressed("KeyF")) this.useFlask();
    } else if (this.anim === "light" && input.lmb && this.animT > 0.22) this.attackQueued = "light";
    const moving = this.move(dt, input, camYaw, busy);
    if (!busy) {
      this.anim = moving ? (input.pressed("ShiftLeft") ? "sprint" : "walk") : "idle";
      if (this.lockTarget) this.yaw = Math.atan2(-lookDir.x, -lookDir.z);
    }
    this.regen(dt, moving && input.pressed("ShiftLeft"));
    this.animate(dt);
    this.resolveAttackWindows(tryHit, spawnFx);
    if (this.attackQueued && this.anim === "idle") { this.tryAttack(this.attackQueued); this.attackQueued = null; }
  }

  private move(dt: number, input: Input, camYaw: number, busy: boolean): boolean {
    const axis = input.axis();
    if (axis.x === 0 && axis.z === 0) return false;
    if (this.anim === "dodge" || this.anim === "hit" || this.anim === "death") return false;
    const speedMul = this.anim === "light" || this.anim === "heavy" || this.anim === "cast" ? 0.25 : 1;
    const sprint = !busy && input.pressed("ShiftLeft") && this.stamina > 1;
    const spd = this.def.speed * (sprint ? 1.55 : 1) * speedMul;
    const sin = Math.sin(camYaw), cos = Math.cos(camYaw);
    const wx = axis.x * cos + axis.z * sin;
    const wz = axis.z * cos - axis.x * sin;
    this.position.x += wx * spd * dt; this.position.z += wz * spd * dt;
    if (!this.lockTarget && !busy) this.yaw = Math.atan2(-wx, -wz);
    if (sprint) this.stamina = Math.max(0, this.stamina - 16 * dt);
    return true;
  }
  private tryAttack(kind: "light" | "heavy"): void {
    const cost = kind === "light" ? 16 : 32;
    if (this.stamina < cost || this.cooldown > 0) return;
    this.stamina -= cost;
    this.anim = kind === "heavy" && (this.def.weapon === "staff" || this.def.weapon === "bow") ? "cast" : kind;
    this.animT = 0; this.cooldown = kind === "light" ? 0.12 : 0.28;
  }
  private startDodge(input: Input, camYaw: number): void {
    this.stamina -= 18; this.anim = "dodge"; this.animT = 0; this.invuln = 0.28;
    const axis = input.axis();
    const sin = Math.sin(camYaw), cos = Math.cos(camYaw);
    let wx = axis.x * cos + axis.z * sin;
    let wz = axis.z * cos - axis.x * sin;
    if (wx === 0 && wz === 0) { const f = this.facing(); wx = -f.x; wz = -f.z; }
    this.rig.root.userData.dodge = new THREE.Vector3(wx, 0, wz).normalize();
  }
  private useFlask(): void {
    if (this.flasks <= 0 || this.flaskCd > 0 || this.hp >= this.def.hp) return;
    this.flasks -= 1; this.flaskCd = 1.2; this.hp = Math.min(this.def.hp, this.hp + this.def.hp * 0.42);
  }
  private resolveAttackWindows(tryHit: (o: THREE.Vector3, d: THREE.Vector3, r: number, h: HitEvent) => void, spawnFx: (p: THREE.Vector3, c: number) => void): void {
    const strike = (this.anim === "light" && this.animT > 0.18 && this.animT < 0.28) || (this.anim === "heavy" && this.animT > 0.34 && this.animT < 0.46) || (this.anim === "cast" && this.animT > 0.28 && this.animT < 0.4);
    if (!strike || this.rig.root.userData.didHit) return;
    this.rig.root.userData.didHit = true;
    const dir = this.facing();
    const origin = this.position.clone().add(new THREE.Vector3(0, 1.1, 0)).add(dir.clone().multiplyScalar(0.6));
    const heavy = this.anim === "heavy" || this.anim === "cast";
    tryHit(origin, dir, this.def.range, { damage: heavy ? this.def.heavy : this.def.light, poise: heavy ? 28 : 12, knock: heavy ? 3.2 : 1.4, source: "player", kind: this.def.weapon === "staff" ? "spell" : this.def.weapon === "bow" ? "arrow" : heavy ? "heavy" : "light" });
    spawnFx(origin.clone().add(dir.multiplyScalar(1.2)), this.def.accent);
  }
  private animEnded(): boolean {
    const dur: Record<string, number> = { light: 0.46, heavy: 0.78, cast: 0.7, dodge: 0.38, hit: 0.42 };
    const done = this.animT >= (dur[this.anim] ?? 0);
    if (done) this.rig.root.userData.didHit = false;
    return done;
  }
  private regen(dt: number, sprinting: boolean): void {
    if (sprinting || ["light", "heavy", "cast", "dodge"].includes(this.anim)) return;
    this.stamina = Math.min(this.def.stamina, this.stamina + 28 * dt);
    this.poise = Math.min(this.def.poise, this.poise + 10 * dt);
  }
  private animate(dt: number): void {
    this.rig.root.rotation.y = this.yaw;
    const t = this.animT;
    const walk = this.anim === "walk" || this.anim === "sprint";
    const w = walk ? Math.sin(t * (this.anim === "sprint" ? 14 : 9)) : 0;
    this.rig.legL.rotation.x = walk ? w * 0.7 : 0;
    this.rig.legR.rotation.x = walk ? -w * 0.7 : 0;
    this.rig.armL.rotation.x = walk ? -w * 0.5 : 0;
    this.rig.armR.rotation.x = 0;
    if (this.anim === "light") this.rig.armR.rotation.x = -Math.sin(Math.min(1, t / 0.22) * Math.PI) * 1.5;
    else if (this.anim === "heavy" || this.anim === "cast") {
      const k = Math.min(1, t / 0.4);
      this.rig.armR.rotation.x = -1.8 * k + Math.max(0, (t - 0.35) * 6);
    } else if (this.anim === "dodge") {
      const d = this.rig.root.userData.dodge as THREE.Vector3 | undefined;
      if (d) this.position.addScaledVector(d, 14 * dt);
      this.rig.torso.rotation.x = Math.sin(t * 8) * 0.25;
    } else if (this.anim === "hit") this.rig.torso.rotation.x = -0.25;
    else this.rig.torso.rotation.x = 0;
  }
  applyHit(hit: HitEvent): boolean {
    if (this.dead || this.invuln > 0) return false;
    this.hp -= hit.damage; this.poise -= hit.poise; this.anim = "hit"; this.animT = 0;
    this.position.add(this.facing().multiplyScalar(-hit.knock * 0.15));
    if (this.hp <= 0) { this.hp = 0; this.dead = true; this.anim = "death"; this.animT = 0; }
    return true;
  }
  rest(): void {
    this.hp = this.def.hp; this.stamina = this.def.stamina; this.poise = this.def.poise; this.flasks = this.def.flasks;
    this.dead = false; this.anim = "idle"; this.rig.torso.rotation.x = 0;
  }
}
