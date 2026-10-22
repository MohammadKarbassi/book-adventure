import type * as THREE from "three"

/** A pulled book gets its own depth pass, not depthTest:false on its faces. */
export function setShelfForeground(group: THREE.Group, foreground: boolean) {
  group.traverse((node) => node.layers.set(foreground ? 2 : 0))
}

export function renderShelfLayers(
  renderer: Pick<THREE.WebGLRenderer, "render" | "clearDepth">,
  scene: THREE.Scene,
  camera: THREE.Camera,
  hasForeground: boolean
) {
  renderer.render(scene, camera)
  if (!hasForeground) return
  const mask = camera.layers.mask
  renderer.clearDepth()
  camera.layers.set(2)
  try {
    renderer.render(scene, camera)
  } finally {
    camera.layers.mask = mask
  }
}
