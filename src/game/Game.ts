import * as THREE from "three";
import { Input } from "./input/Input";
import { FollowCamera } from "./camera/FollowCamera";
import { World } from "./world/World";
import { Player } from "./player/Player";
import { Enemy, populateEnemies } from "./enemies/Enemy";
import { UI } from "./ui/UI";
import { Sfx } from "./audio/Sfx";
import type { ClassDef, HitEvent } from "./types";

export class Game {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly input: Input;
  readonly follow = new FollowCamera();
  readonly world: World;
  readonly ui = new UI();
  readonly sfx = new Sfx();
  player: Player | null = null;
  enemies: Enemy[] = [];
  private fx: { mesh: THREE.Mesh; life: number }[] = [];
  private clock = new THREE.Clock();
  private playing = false; private deathTimer = 0; private paused = false; private qLatch = false;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 180);
    this.camera.position.set(0, 8, 16);
    this.input = new Input(canvas);
    this.world = new World(this.scene);
    window.addEventListener("resize", () => {
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(innerWidth, innerHeight);
    });
    this.ui.bindStart(() => { this.ui.show("title-layer", false); this.ui.show("class-layer", true); }, () => this.start(this.ui.selected));
    window.addEventListener("keydown", (e) => {
      if (e.code === "Escape" && this.playing) {
        this.paused = !this.paused; this.ui.show("help", this.paused); if (!this.paused) this.clock.getDelta();
      }
    });
    this.loop();
  }

  start(def: ClassDef): void {
    if (this.player) this.scene.remove(this.player.rig.root);
    this.enemies.forEach((e) => this.scene.remove(e.rig.root));
    this.player = new Player(def);
    this.scene.add(this.player.rig.root);
    this.enemies = populateEnemies();
    this.enemies.forEach((e) => this.scene.add(e.rig.root));
    this.ui.show("class-layer", false); this.ui.show("hud", true); this.ui.show("help", true);
    window.setTimeout(() => this.ui.show("help", false), 5000);
    this.ui.toast(def.nameMn); this.playing = true; this.paused = false; this.sfx.rest();
  }

  private loop = (): void => {
    requestAnimationFrame(this.loop);
    const dt = Math.min(0.033, this.clock.getDelta());
    if (this.playing && !this.paused && this.player) this.tick(dt);
    this.renderer.render(this.scene, this.camera);
  };

  private tick(dt: number): void {
    const p = this.player!;
    const living = this.enemies.filter((e) => !e.dead);
    if (this.input.pressed("KeyQ") && !p.dead) {
      if (!this.qLatch) { this.toggleLock(living); this.qLatch = true; }
    } else this.qLatch = false;
    if (p.lockTarget && !living.find((e) => e.rig.root === p.lockTarget)) p.lockTarget = null;
    p.update(dt, this.input, this.follow.yaw, (o, d, r, h) => this.playerStrike(o, d, r, h), (pos, c) => this.burst(pos, c));
    this.world.clamp(p.position);
    for (const e of this.enemies) e.update(dt, p.position, p.invuln > 0 || p.dead, (hit) => this.hurtPlayer(hit), (pos, c) => this.burst(pos, c));
    this.follow.update(dt, this.input, p.position, this.camera, p.lockTarget?.position ?? null);
    const nearOvoo = p.position.distanceTo(this.world.ovooPos) < 2.4;
    const nearSouls = this.world.hasDeathMark && p.position.distanceTo(this.world.deathMark) < 1.6;
    let prompt: string | null = null;
    if (nearOvoo) prompt = "E  ·  Rest at the Ovoo";
    else if (nearSouls) prompt = "E  ·  Reclaim lost Sülde";
    if (this.input.pressed("KeyE") && !p.dead) {
      if (nearOvoo) this.restAtOvoo();
      else if (nearSouls) this.reclaim();
    }
    const flame = this.world.ovooMesh.getObjectByName("flame");
    if (flame) flame.rotation.y += dt * 2.2;
    this.updateFx(dt);
    const boss = this.enemies.find((e) => e.kind === "boss");
    this.ui.sync(p.hp, p.def.hp, p.stamina, p.def.stamina, p.flasks, p.def.flasks, p.souls, p.def.nameMn, prompt, Boolean(p.lockTarget),
      boss && !boss.dead && p.position.distanceTo(boss.position) < 28 ? { name: boss.name, hp: boss.hp, max: boss.maxHp } : null);
    if (p.dead) { this.deathTimer += dt; this.ui.youDied(true); if (this.deathTimer > 2.4) this.afterDeath(); }
  }

  private toggleLock(living: Enemy[]): void {
    const p = this.player!;
    if (p.lockTarget) { p.lockTarget = null; return; }
    let best: Enemy | null = null, bestD = 16;
    for (const e of living) { const d = e.position.distanceTo(p.position); if (d < bestD) { bestD = d; best = e; } }
    if (best) { p.lockTarget = best.rig.root; this.sfx.lock(); }
  }
  private playerStrike(origin: THREE.Vector3, dir: THREE.Vector3, range: number, hit: HitEvent): void {
    this.sfx.swing();
    const p = this.player!;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const to = e.position.clone().add(new THREE.Vector3(0, 1, 0)).sub(origin);
      const dist = to.length();
      if (dist > range + 0.6) continue;
      const nd = dir.lengthSq() ? dir.clone().normalize() : to.clone().normalize();
      if (to.normalize().dot(nd) < 0.25 && range < 6) continue;
      if (e.applyHit(hit)) {
        this.sfx.hit(); this.follow.bump(hit.kind === "heavy" ? 0.55 : 0.28);
        this.burst(e.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xd4783a);
        if (e.dead) { p.souls += e.souls; this.ui.toast(`+${e.souls} СҮЛД`); this.sfx.death(); if (e.kind === "boss") this.ui.toast("The Black Banner falls.", 3200); }
      }
    }
  }
  private hurtPlayer(hit: HitEvent): void {
    const p = this.player!;
    if (p.applyHit(hit)) {
      this.sfx.hurt(); this.ui.hurtFlash(); this.follow.bump(0.6);
      if (p.dead) {
        this.sfx.death(); this.world.deathMark.copy(p.position);
        this.world.hasDeathMark = p.souls > 0; p.recoverSouls = p.souls; p.souls = 0; this.deathTimer = 0;
      }
    }
  }
  private restAtOvoo(): void {
    const p = this.player!;
    p.rest(); p.position.copy(this.world.ovooPos).add(new THREE.Vector3(0, 0, 1.6));
    this.enemies.forEach((e) => { if (e.kind !== "boss" || !e.dead) e.respawn(); });
    this.sfx.rest(); this.ui.toast("The ovoo remembers you.");
  }
  private reclaim(): void {
    const p = this.player!; p.souls += p.recoverSouls; p.recoverSouls = 0; this.world.hasDeathMark = false; this.sfx.flask(); this.ui.toast("Sülde reclaimed.");
  }
  private afterDeath(): void {
    const p = this.player!; p.rest(); p.position.copy(this.world.ovooPos).add(new THREE.Vector3(0, 0, 1.6)); p.lockTarget = null;
    this.enemies.forEach((e) => { if (e.kind !== "boss" || e.hp > 0) e.respawn(); });
    this.ui.youDied(false); this.deathTimer = 0; this.ui.toast("Returned to the ovoo.");
  }
  private burst(pos: THREE.Vector3, color: number): void {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 }));
    mesh.position.copy(pos); this.scene.add(mesh); this.fx.push({ mesh, life: 0.28 });
  }
  private updateFx(dt: number): void {
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i]; f.life -= dt; f.mesh.scale.multiplyScalar(1 + dt * 6);
      const mat = f.mesh.material as THREE.MeshBasicMaterial; mat.opacity = Math.max(0, f.life * 3);
      if (f.life <= 0) { this.scene.remove(f.mesh); f.mesh.geometry.dispose(); mat.dispose(); this.fx.splice(i, 1); }
    }
  }
}
