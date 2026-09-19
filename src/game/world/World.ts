import * as THREE from "three";
import { forgeOvoo, forgeRuin, forgeTree } from "../mesh/Forge";

export class World {
  readonly group = new THREE.Group();
  readonly ovooPos = new THREE.Vector3(0, 0, 8);
  readonly bossArena = new THREE.Vector3(0, 0, -46);
  readonly deathMark = new THREE.Vector3();
  hasDeathMark = false;
  ovooMesh: THREE.Group;

  constructor(scene: THREE.Scene) {
    scene.add(this.group);
    this.buildLights(scene);
    this.buildGround();
    this.buildArchitecture();
    this.ovooMesh = forgeOvoo();
    this.ovooMesh.position.copy(this.ovooPos);
    this.group.add(this.ovooMesh);
    this.buildFogGate();
  }

  private buildLights(scene: THREE.Scene): void {
    scene.background = new THREE.Color(0x0b0c10);
    scene.fog = new THREE.FogExp2(0x0b0c10, 0.028);
    const hemi = new THREE.HemisphereLight(0x6a7a99, 0x1a120c, 0.55);
    scene.add(hemi);
    const moon = new THREE.DirectionalLight(0xb8c4e0, 1.15);
    moon.position.set(-18, 28, 10);
    moon.castShadow = true;
    moon.shadow.mapSize.set(2048, 2048);
    moon.shadow.camera.near = 2;
    moon.shadow.camera.far = 80;
    moon.shadow.camera.left = -40;
    moon.shadow.camera.right = 40;
    moon.shadow.camera.top = 40;
    moon.shadow.camera.bottom = -40;
    scene.add(moon);
    const fill = new THREE.DirectionalLight(0x3a2a40, 0.35);
    fill.position.set(20, 8, -12);
    scene.add(fill);
  }

  private buildGround(): void {
    const geo = new THREE.PlaneGeometry(220, 220, 80, 80);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      pos.setZ(i, Math.sin(x * 0.09) * Math.cos(y * 0.07) * 0.35 + Math.sin(x * 0.21 + y * 0.13) * 0.12);
    }
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x2a271f, roughness: 0.96, metalness: 0.02 }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    this.group.add(mesh);
    const rim = new THREE.Mesh(new THREE.CircleGeometry(18, 48), new THREE.MeshStandardMaterial({ color: 0x1e1c18, roughness: 0.9 }));
    rim.rotation.x = -Math.PI / 2;
    rim.position.set(0, 0.03, -46);
    rim.receiveShadow = true;
    this.group.add(rim);
  }

  private buildArchitecture(): void {
    const spots = [[-10, 4], [12, 6], [-7, -8], [9, -12], [-16, -20], [15, -22], [-8, -32], [10, -34], [-18, 14], [20, 10], [0, -18], [-22, -40], [22, -42]];
    spots.forEach(([x, z], i) => {
      const r = forgeRuin(i + 3);
      r.position.set(x, 0, z);
      r.rotation.y = i * 0.7;
      this.group.add(r);
    });
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      const rad = 26 + (i % 5) * 3.5;
      const t = forgeTree(i);
      t.position.set(Math.cos(a) * rad, 0, Math.sin(a) * rad + 2);
      t.rotation.y = i;
      this.group.add(t);
    }
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x2c2a26, roughness: 0.94 });
    const mkWall = (x: number, z: number, w: number, d: number, h = 3.2) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
      m.position.set(x, h / 2, z);
      m.castShadow = true;
      m.receiveShadow = true;
      this.group.add(m);
    };
    mkWall(-14, -28, 18, 1.1);
    mkWall(14, -28, 18, 1.1);
    mkWall(0, -58, 36, 1.2, 5);
    mkWall(-20, -46, 1.2, 26, 5);
    mkWall(20, -46, 1.2, 26, 5);
  }

  private buildFogGate(): void {
    const gate = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 5),
      new THREE.MeshStandardMaterial({ color: 0x6a2030, emissive: 0x3a0810, emissiveIntensity: 0.8, transparent: true, opacity: 0.35, side: THREE.DoubleSide }),
    );
    gate.position.set(0, 2.4, -28);
    gate.name = "fogGate";
    this.group.add(gate);
  }

  clamp(pos: THREE.Vector3): void {
    pos.x = THREE.MathUtils.clamp(pos.x, -70, 70);
    pos.z = THREE.MathUtils.clamp(pos.z, -70, 70);
  }
}
