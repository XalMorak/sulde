import * as THREE from "three";
import type { Input } from "../input/Input";
export class FollowCamera {
  yaw = 0.2; pitch = 0.35; dist = 7.2; shake = 0;
  private minDist = 3.2; private maxDist = 11;
  update(dt: number, input: Input, target: THREE.Vector3, camera: THREE.PerspectiveCamera, lock?: THREE.Vector3 | null): void {
    const look = input.consumeLook();
    this.yaw -= look.x * 0.0022;
    this.pitch -= look.y * 0.0020;
    this.pitch = THREE.MathUtils.clamp(this.pitch, 0.08, 1.15);
    const wheel = input.consumeWheel();
    if (wheel) this.dist = THREE.MathUtils.clamp(this.dist + wheel * 0.6, this.minDist, this.maxDist);
    if (lock) {
      const to = lock.clone().sub(target);
      this.yaw = Math.atan2(to.x, to.z);
    }
    const off = new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      Math.cos(this.yaw) * Math.cos(this.pitch),
    ).multiplyScalar(this.dist);
    const desired = target.clone().add(new THREE.Vector3(0, 1.35, 0)).add(off);
    camera.position.lerp(desired, 1 - Math.pow(0.0008, dt));
    const aim = target.clone().add(new THREE.Vector3(0, 1.25, 0));
    if (lock) aim.lerp(lock.clone().add(new THREE.Vector3(0, 1.4, 0)), 0.45);
    if (this.shake > 0) {
      camera.position.x += (Math.random() - 0.5) * this.shake;
      camera.position.y += (Math.random() - 0.5) * this.shake * 0.5;
      this.shake = Math.max(0, this.shake - dt * 8);
    }
    camera.lookAt(aim);
  }
  bump(amount = 0.35): void { this.shake = Math.max(this.shake, amount); }
}
