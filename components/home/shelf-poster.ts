import type * as Three from "three"
import {
  foldPosterPoint,
  posterOpening,
  POSTER_HEIGHT,
} from "@/components/home/home-media-math"

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
          "/home-media/listening-poster.webp",
          (map) => {
            if (!live) {
              map.dispose()
              return
            }
            void document.fonts.ready.then(() => {
              if (!live) {
                map.dispose()
                return
              }
              const paper = document.createElement("canvas")
              paper.width = 1100
              paper.height = 1500
              const context = paper.getContext("2d")!
              const source = map.image as HTMLImageElement
              const cropHeight = source.width * POSTER_HEIGHT
              context.drawImage(
                source,
                0,
                (source.height - cropHeight) / 2,
                source.width,
                cropHeight,
                0,
                0,
                1100,
                1500
              )
              context.fillStyle = getComputedStyle(section).backgroundColor
              context.globalAlpha = 0.82
              context.fillRect(0, 1200, 1100, 300)
              context.globalAlpha = 1
              context.fillStyle = getComputedStyle(section).color
              context.direction = "rtl"
              context.textAlign = "center"
              context.font = `600 78px ${getComputedStyle(anchor).fontFamily}`
              context.fillText("هر قصه، یک صدای تازه", 550, 1320, 980)
              context.font = `400 40px ${getComputedStyle(anchor).fontFamily}`
              context.fillText("ماجراجویی با کتاب", 550, 1410)
              texture = new THREE.CanvasTexture(paper)
              texture.colorSpace = THREE.SRGBColorSpace
              material.map = texture
              material.needsUpdate = true
              map.dispose()
              loaded = true
              invalidate()
            })
          },
          undefined,
          () => {
            restore()
          }
        )
      }
      mesh.visible = visible && loaded && !reduced.matches
      const opening = posterOpening(bounds.top, height, reduced.matches)
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
