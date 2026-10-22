import type * as Three from "three"
import {
  foldPosterPoint,
  posterOpening,
  POSTER_HEIGHT,
  settlePosterOpening,
} from "@/components/home/home-media-math"
import { HOME_POSTER } from "@/data/home-poster"

/** A single segmented paper mesh in the shelf's existing renderer. */
export function createShelfPoster(
  THREE: typeof Three,
  scene: Three.Scene,
  root: Element,
  invalidate: () => void
) {
  const geometry = new THREE.PlaneGeometry(1, POSTER_HEIGHT, 24, 100)
  const original = geometry.attributes.position.array.slice()
  const material = new THREE.MeshStandardMaterial({
    side: THREE.DoubleSide,
    roughness: 0.92,
    metalness: 0,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.visible = false
  scene.add(mesh)
  let pending = false
  let loaded = false
  let live = true
  let lastOpening = -1
  let displayedOpening = -1
  let previousTime = performance.now()
  let texture: Three.Texture | undefined
  const reduced = matchMedia("(prefers-reduced-motion: reduce)")
  const fallback = () =>
    root.querySelector<HTMLElement>("[data-home-poster-fallback]")
  const restore = () => {
    const image = fallback()
    if (image) image.style.opacity = ""
    const print = root.querySelector<HTMLElement>("[data-home-poster-print]")
    if (print) print.style.opacity = ""
    const anchor = root.querySelector<HTMLElement>("[data-home-poster-anchor]")
    if (anchor) anchor.dataset.posterReady = "false"
  }
  return {
    restore,
    update(width: number, height: number) {
      const anchor = root.querySelector<HTMLElement>(
        "[data-home-poster-anchor]"
      )
      const section = root.querySelector<HTMLElement>("#home-audio")
      if (!anchor || !section) {
        mesh.visible = false
        return "no-poster"
      }
      const rect = anchor.getBoundingClientRect()
      const bounds = section.getBoundingClientRect()
      const visible =
        bounds.top < height &&
        bounds.bottom > 0 &&
        rect.bottom > 0 &&
        rect.top < height
      if (visible && !pending && !reduced.matches) {
        pending = true
        new THREE.TextureLoader().load(
          HOME_POSTER.src,
          (map) => {
            if (!live) {
              map.dispose()
              return
            }
            const { crop, sourceSize } = HOME_POSTER
            texture = map
            texture.repeat.set(
              crop.width / sourceSize,
              crop.height / sourceSize
            )
            texture.offset.set(
              crop.x / sourceSize,
              1 - (crop.y + crop.height) / sourceSize
            )
            texture.colorSpace = THREE.SRGBColorSpace
            material.map = texture
            material.needsUpdate = true
            loaded = true
            invalidate()
          },
          undefined,
          () => {
            restore()
          }
        )
      }
      mesh.visible = visible && loaded && !reduced.matches
      const targetOpening = posterOpening(bounds.top, height, reduced.matches)
      const now = performance.now()
      displayedOpening =
        displayedOpening < 0 || !visible || reduced.matches
          ? targetOpening
          : settlePosterOpening(
              displayedOpening,
              targetOpening,
              Math.min(100, now - previousTime)
            )
      previousTime = now
      const opening = displayedOpening
      anchor.dataset.posterOpening = opening.toFixed(3)
      if (!mesh.visible) {
        restore()
        return `poster-hidden:${visible}`
      }
      if (opening !== lastOpening) {
        const vertices = geometry.attributes.position
        for (let i = 0; i < vertices.count; i++) {
          const p = foldPosterPoint(
            original[i * 3],
            original[i * 3 + 1],
            opening
          )
          vertices.setXYZ(i, p.x, p.y, p.z)
        }
        vertices.needsUpdate = true
        geometry.computeVertexNormals()
        lastOpening = opening
      }
      mesh.scale.setScalar(rect.width)
      mesh.rotation.set(
        (1 - opening) * -0.18,
        (1 - opening) * 0.12,
        (1 - opening) * -0.045
      )
      mesh.position.set(
        rect.left + rect.width / 2 - width / 2,
        height / 2 - rect.top - rect.height / 2,
        0
      )
      const image = fallback()
      if (image) image.style.opacity = "0"
      const print = root.querySelector<HTMLElement>("[data-home-poster-print]")
      if (print) print.style.opacity = "0"
      anchor.dataset.posterReady = "true"
      return `poster:${opening}:${rect.top}:${rect.left}:${rect.width}`
    },
    dispose() {
      live = false
      restore()
      scene.remove(mesh)
      geometry.dispose()
      material.dispose()
      texture?.dispose()
    },
  }
}
