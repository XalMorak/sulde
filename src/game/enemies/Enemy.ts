import * as THREE from "three";
import type { Anim, HitEvent } from "../types";
import { forgeEnemy, type Rig } from "../mesh/Forge";

export type EnemyKind = "warden" | "rider" | "wolf" | "cultist" | "boss";

const STATS: Record<EnemyKind, { hp: number; dmg: number; speed: number; range: number; souls: number; aggro: number; name: string }> = {
  warden: { hp: 90, dmg: 18, speed: 2.6, range: 2.1, souls: 85, aggro: 14, name: "Grave Warden" },
  rider: { hp: 120, dmg: 22, speed: 3.2, range: 2.3, souls: 140, aggro: 16, name: "Withered Rider" },
  wolf: { hp: 55, dmg: 14, speed: 4.6, range: 1.5, souls: 45, aggro: 18, name: "Ash Wolf" },
  cultist: { hp: 70, dmg: 16, speed: 2.3, range: 8, souls: 110, aggro: 15, name: "Ash Cultist" },
  boss: { hp: 720, dmg: 34, speed: 3.0, range: 3.1, souls: 2200, aggro: 40, name: "Khar Sülde, Black Banner" },
};

export class Enemy {
  readonly kind: EnemyKind;
  readonly rig: Rig;
  readonly name: string;
  hp: number; maxHp: number; souls: number;
  dead = false; anim: Anim = "idle"; animT = 0; yaw = 0;
  private windup = 0; private recover = 0; private aggroed = false;
  private home = new THREE.Vector3(); private attackTok = false;

  constructor(kind: EnemyKind, x: number, z: number) {
    this.kind = kind; this.rig = forgeEnemy(kind);
    this.rig.root.position.set(x, 0, z); this.home.set(x, 0, z);
    const s = STATS[kind];
    this.hp = s.hp; this.maxHp = s.hp; this.souls = s.souls; this.name = s.name;
  }
  get position(): THREE.Vector3 { return this.rig.root.position; }

  update(dt: number, playerPos: THREE.Vector3, playerInvuln: boolean, onHitPlayer: (hit: HitEvent) => void, spawnFx: (p: THREE.Vector3, c: number) => void): void {
    if (this.dead) { this.animT += dt; this.rig.torso.rotation.x = Math.min(1.35, this.animT * 1.2); return; }
    this.animT += dt; this.windup = Math.max(0, this.windup - dt); this.recover = Math.max(0, this.recover - dt);
    const s = STATS[this.kind];
    const toP = playerPos.clone().sub(this.position); toP.y = 0;
    const dist = toP.length();
    if (dist < s.aggro || (this.kind === "boss" && dist < 22)) this.aggroed = true;
    if (!this.aggroed) { this.idleSway(); return; }
    if (this.recover > 0) { this.animate(); return; }
    if (dist > 0.001) { this.yaw = Math.atan2(-toP.x, -toP.z); this.rig.root.rotation.y = this.yaw; }
    if (this.windup > 0) {
      this.anim = this.kind === "cultist" ? "cast" : "heavy"; this.animate();
      if (this.windup <= dt) this.strike(playerPos, playerInvuln, onHitPlayer, spawnFx);
      return;
    }
    if (dist > s.range * 0.92) {
      this.position.addScaledVector(toP.normalize(), s.speed * dt);
      this.anim = "walk"; this.animate(); return;
    }
    this.windup = this.kind === "boss" ? 0.7 : this.kind === "wolf" ? 0.28 : 0.48;
    this.animT = 0; this.attackTok = false; this.anim = "heavy";
  }

  private strike(playerPos: THREE.Vector3, playerInvuln: boolean, onHitPlayer: (hit: HitEvent) => void, spawnFx: (p: THREE.Vector3, c: number) => void): void {
    if (this.attackTok) return; this.attackTok = true;
    const s = STATS[this.kind];
    spawnFx(this.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 0x8b1e1e);
    if (playerPos.distanceTo(this.position) <= s.range + 0.45 && !playerInvuln) {
      onHitPlayer({ damage: s.dmg, poise: this.kind === "boss" ? 30 : 14, knock: 2.2, source: "enemy", kind: this.kind === "cultist" ? "spell" : "heavy" });
    }
    this.recover = this.kind === "boss" ? 0.85 : 0.7; this.anim = "idle";
  }
  applyHit(hit: HitEvent): boolean {
    if (this.dead) return false;
    this.hp -= hit.damage; this.aggroed = true; this.anim = "hit"; this.animT = 0; this.windup = 0; this.recover = 0.35;
    if (this.hp <= 0) { this.hp = 0; this.dead = true; this.anim = "death"; this.animT = 0; }
    return true;
  }
  private idleSway(): void { this.rig.root.rotation.y += 0.003; }
  private animate(): void {
    const t = this.animT;
    if (this.anim === "walk") { const w = Math.sin(t * 8); this.rig.legL.rotation.x = w * 0.55; this.rig.legR.rotation.x = -w * 0.55; }
    else if (this.anim === "heavy" || this.anim === "cast") this.rig.armR.rotation.x = -1.4 + Math.sin(t * 6) * 0.2;
    else if (this.anim === "hit") this.rig.torso.rotation.x = -0.2;
  }
  respawn(): void {
    this.hp = this.maxHp; this.dead = false; this.aggroed = false; this.anim = "idle";
    this.position.copy(this.home); this.rig.torso.rotation.x = 0; this.rig.root.visible = true;
  }
}

export function populateEnemies(): Enemy[] {
  return [
    new Enemy("warden", -6, -4), new Enemy("warden", 7, -10),
    new Enemy("wolf", -12, 2), new Enemy("wolf", -14, -2), new Enemy("wolf", 13, -6),
    new Enemy("rider", -4, -20), new Enemy("rider", 6, -22),
    new Enemy("cultist", -10, -34), new Enemy("cultist", 11, -36),
    new Enemy("warden", -8, -42), new Enemy("boss", 0, -48),
  ];
}
