import * as THREE from "three";
import type { ClassDef } from "../types";

function mat(color: number, roughness = 0.72, metalness = 0.18): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, envMapIntensity: 0.6 });
}

function box(parent: THREE.Object3D, w: number, h: number, d: number, color: number, y: number, z = 0, x = 0, extra?: Partial<THREE.MeshStandardMaterialParameters>): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), extra ? new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.15, ...extra }) : mat(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

export interface Rig {
  root: THREE.Group; body: THREE.Group; torso: THREE.Group; head: THREE.Group;
  armL: THREE.Group; armR: THREE.Group; legL: THREE.Group; legR: THREE.Group;
  weapon: THREE.Group; cloak?: THREE.Mesh;
}

export function forgeHero(def: ClassDef): Rig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const torso = new THREE.Group();
  torso.position.y = 1.15;
  body.add(torso);
  box(torso, 0.62, 0.78, 0.36, def.color, 0);
  box(torso, 0.72, 0.16, 0.4, def.accent, 0.38);
  const head = new THREE.Group();
  head.position.y = 0.58;
  torso.add(head);
  box(head, 0.32, 0.34, 0.32, 0xc4a07a, 0);
  if (def.id === "noyon") {
    box(head, 0.38, 0.16, 0.38, 0x8a7a4a, 0.22);
    box(head, 0.08, 0.22, 0.08, def.accent, 0.38);
  } else if (def.id === "boo") {
    box(head, 0.42, 0.12, 0.42, 0x1a1228, 0.2);
  } else if (def.id === "kharachin") {
    box(head, 0.34, 0.14, 0.34, 0x111111, 0.12);
  }
  const armL = new THREE.Group();
  armL.position.set(-0.42, 0.28, 0);
  torso.add(armL);
  box(armL, 0.16, 0.7, 0.16, def.color, -0.28);
  const armR = new THREE.Group();
  armR.position.set(0.42, 0.28, 0);
  torso.add(armR);
  box(armR, 0.16, 0.7, 0.16, def.color, -0.28);
  const weapon = new THREE.Group();
  armR.add(weapon);
  weapon.position.set(0, -0.62, 0.05);
  forgeWeapon(weapon, def);
  const legL = new THREE.Group();
  legL.position.set(-0.18, 1.15, 0);
  body.add(legL);
  box(legL, 0.2, 1.05, 0.22, 0x1a1816, -0.52);
  const legR = new THREE.Group();
  legR.position.set(0.18, 1.15, 0);
  body.add(legR);
  box(legR, 0.2, 1.05, 0.22, 0x1a1816, -0.52);
  let cloak: THREE.Mesh | undefined;
  if (def.id === "noyon" || def.id === "boo") {
    cloak = box(torso, 0.7, 0.95, 0.08, def.id === "boo" ? 0x241836 : 0x3a2014, -0.2, -0.24);
  }
  root.userData.radius = 0.45;
  root.userData.height = 1.9;
  return { root, body, torso, head, armL, armR, legL, legR, weapon, cloak };
}

function forgeWeapon(parent: THREE.Group, def: ClassDef): void {
  if (def.weapon === "greatsword") {
    box(parent, 0.08, 1.55, 0.04, 0xb8b4ae, 0.7, 0, 0, { metalness: 0.85, roughness: 0.25 });
    box(parent, 0.32, 0.06, 0.08, 0xc9a46a, 0.08);
    box(parent, 0.07, 0.28, 0.07, 0x3a2a18, -0.08);
  } else if (def.weapon === "axe") {
    box(parent, 0.07, 1.15, 0.07, 0x4a3218, 0.5);
    box(parent, 0.42, 0.28, 0.08, 0x9aa0a8, 1.0, 0, 0.12, { metalness: 0.8, roughness: 0.3 });
  } else if (def.weapon === "bow") {
    const bow = box(parent, 0.06, 1.1, 0.06, 0x6a4a28, 0.4);
    bow.rotation.z = 0.15;
    box(parent, 0.02, 0.9, 0.02, 0xd8c8a8, 0.4, 0.12);
  } else if (def.weapon === "staff") {
    box(parent, 0.07, 1.6, 0.07, 0x3a2458, 0.7);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), new THREE.MeshStandardMaterial({ color: 0x8a6ad4, emissive: 0x4a28a0, emissiveIntensity: 1.4, roughness: 0.2 }));
    orb.position.y = 1.5;
    parent.add(orb);
  } else {
    box(parent, 0.05, 0.7, 0.03, 0xc0c6ce, 0.28, 0, 0, { metalness: 0.85, roughness: 0.22 });
    box(parent, 0.05, 0.55, 0.03, 0xc0c6ce, 0.12, 0.08, -0.08, { metalness: 0.85, roughness: 0.22 });
  }
}

export function forgeEnemy(kind: "warden" | "rider" | "wolf" | "cultist" | "boss"): Rig {
  const tint = kind === "boss" ? 0x1a0c10 : kind === "warden" ? 0x2a3030 : kind === "rider" ? 0x3a2a20 : kind === "cultist" ? 0x2a1830 : 0x3a342e;
  const accent = kind === "boss" ? 0x8b1e1e : kind === "cultist" ? 0x6a3aa0 : 0x6a5a40;
  const scale = kind === "boss" ? 1.85 : kind === "wolf" ? 0.72 : 1;
  const fake: ClassDef = {
    id: "noyon", name: kind, nameMn: kind, blurb: "", color: tint, accent,
    hp: 1, stamina: 1, poise: 1, speed: 1, light: 1, heavy: 1, range: 1, flasks: 1,
    weapon: kind === "cultist" ? "staff" : kind === "wolf" ? "dual" : kind === "boss" ? "greatsword" : "axe",
  };
  const rig = forgeHero(fake);
  rig.root.scale.setScalar(scale);
  if (kind === "wolf") { rig.torso.rotation.x = 0.7; rig.head.position.z = 0.25; }
  if (kind === "boss") {
    const crown = box(rig.head, 0.55, 0.18, 0.55, 0x8b1e1e, 0.32);
    crown.material = new THREE.MeshStandardMaterial({ color: 0x4a1010, emissive: 0x3a0000, emissiveIntensity: 0.6, metalness: 0.6, roughness: 0.4 });
  }
  return rig;
}

export function forgeOvoo(): THREE.Group {
  const g = new THREE.Group();
  const stoneMat = mat(0x5a544c, 0.9, 0.05);
  for (let i = 0; i < 9; i++) {
    const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18 + Math.random() * 0.16, 0), stoneMat);
    const a = (i / 9) * Math.PI * 2;
    s.position.set(Math.cos(a) * 0.55, 0.18, Math.sin(a) * 0.55);
    s.castShadow = true; s.receiveShadow = true; g.add(s);
  }
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.7, 8), new THREE.MeshStandardMaterial({ color: 0xffb060, emissive: 0xff7010, emissiveIntensity: 2, transparent: true, opacity: 0.9 }));
  flame.position.y = 0.7; flame.name = "flame"; g.add(flame);
  const light = new THREE.PointLight(0xff8a3a, 4, 14, 1.6);
  light.position.y = 0.9; light.castShadow = true; g.add(light);
  return g;
}

export function forgeRuin(seed: number): THREE.Group {
  const g = new THREE.Group();
  const stone = mat(0x3a3732, 0.92, 0.04);
  const cracked = mat(0x2c2a26, 0.95, 0.02);
  const h = 3 + (seed % 5);
  const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.7, h, 0.7), stone);
  pillar.position.y = h / 2; pillar.castShadow = true; pillar.receiveShadow = true; g.add(pillar);
  if (seed % 3 === 0) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.28, 0.4), cracked);
    beam.position.set(1.2, h - 0.2, 0); beam.rotation.z = -0.18; beam.castShadow = true; g.add(beam);
  }
  return g;
}

export function forgeTree(seed: number): THREE.Group {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 2.4, 6), mat(0x2a2018, 0.95, 0));
  trunk.position.y = 1.2; trunk.castShadow = true; g.add(trunk);
  const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1 + (seed % 4) * 0.12, 0), mat(0x1a2418, 0.9, 0));
  crown.position.y = 2.5; crown.castShadow = true; g.add(crown);
  return g;
}
