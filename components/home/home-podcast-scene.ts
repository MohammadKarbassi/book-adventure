import type * as Three from "three"
import { podcastReveal } from "@/components/home/home-media-math"

/** Independent podcast camera/scene, sharing the shelf's WebGL context. */
export function createHomePodcastScene(
  THREE: typeof Three,
  root: Element,
  invalidate: () => void
) {
  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 3000)
  camera.position.z = 1000
  const backdropMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color().setScalar(0.27),
    transparent: true,
  })
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    backdropMaterial
  )
  backdrop.position.z = -500
  scene.add(backdrop)
  const edge = new THREE.MeshStandardMaterial({
    color: 0x233038,
    roughness: 0.9,
  })
  const face = new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0 })
  const cover = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.028), [
    edge,
    edge,
    edge,
    edge,
    face,
    edge,
  ])
  scene.add(cover, new THREE.HemisphereLight(0xfff4dd, 0x233038, 1.6))
  const key = new THREE.DirectionalLight(0xfff4dd, 1.5)
  key.position.set(-300, 400, 800)
  scene.add(key)
  let live = true
  let loading = false
  let backgroundLoaded = false
  let coverLoaded = false
  let backgroundAspect = 1.5
  const textures: Three.Texture[] = []
  const reduced = matchMedia("(prefers-reduced-motion: reduce)")
  const restore = () => {
    root
      .querySelectorAll<HTMLElement>(
        "[data-home-podcast-background], [data-home-podcast-cover]"
      )
      .forEach((el) => {
        el.style.opacity = ""
      })
    const section = root.querySelector<HTMLElement>("#home-podcast")
    if (section) section.dataset.podcastSceneReady = "false"
  }
  return {
    restore,
    update(width: number, height: number) {
      const section = root.querySelector<HTMLElement>("#home-podcast")
      const anchor = root.querySelector<HTMLElement>(
        "[data-home-podcast-anchor]"
      )
      const image = root.querySelector<HTMLImageElement>(
        "[data-home-podcast-cover]"
      )
      if (!section || !anchor || !image)
        return { pixels: 0, ready: false, signature: "podcast-absent" }
      const bounds = section.getBoundingClientRect()
      const { pixels, progress } = podcastReveal(bounds.top, height)
      section.dataset.podcastReveal = progress.toFixed(3)
      if (!loading && bounds.top < height * 1.5 && !reduced.matches) {
        loading = true
        const loader = new THREE.TextureLoader()
        const load = (url: string, isBackground: boolean) =>
          loader.load(
            url,
            (texture) => {
              if (!live) {
                texture.dispose()
                return
              }
              textures.push(texture)
              texture.colorSpace = THREE.SRGBColorSpace
              if (isBackground) {
                backdropMaterial.map = texture
                backdropMaterial.needsUpdate = true
                backgroundAspect = texture.image.width / texture.image.height
                backgroundLoaded = true
              } else {
                face.map = texture
                face.needsUpdate = true
                coverLoaded = true
              }
              invalidate()
            },
            undefined,
            () => {
              restore()
            }
          )
        load("/home-media/jupiter-provided.webp", true)
        load(image.currentSrc || image.src, false)
      }
      const ready = backgroundLoaded && coverLoaded && !reduced.matches
      section.dataset.podcastSceneReady = ready ? "true" : "false"
      if (!ready || pixels === 0) {
        restore()
        return { pixels, ready: false, signature: `podcast-wait:${pixels}` }
      }
      root
        .querySelectorAll<HTMLElement>(
          "[data-home-podcast-background], [data-home-podcast-cover]"
        )
        .forEach((el) => {
          el.style.opacity = "0"
        })
      camera.left = -width / 2
      camera.right = width / 2
      camera.top = height / 2
      camera.bottom = -height / 2
      camera.updateProjectionMatrix()
      const ease = 1 - Math.pow(1 - progress, 3)
      const backgroundWidth =
        Math.max(width, height * backgroundAspect) * (1.12 - ease * 0.12)
      backdrop.scale.set(backgroundWidth, backgroundWidth / backgroundAspect, 1)
      backdropMaterial.opacity = 0.65 + ease * 0.35
      const rect = anchor.getBoundingClientRect()
      cover.scale.set(rect.width, rect.height, rect.width)
      cover.position.set(
        rect.left + rect.width / 2 - width / 2,
        height / 2 - rect.top - rect.height / 2,
        30 * ease
      )
      cover.rotation.set(
        (1 - ease) * -0.16,
        (1 - ease) * 1.15,
        (1 - ease) * 0.06
      )
      return {
        pixels,
        ready,
        signature: `podcast:${progress}:${rect.top}:${rect.left}:${rect.width}`,
      }
    },
    render(renderer: Three.WebGLRenderer) {
      renderer.render(scene, camera)
    },
    dispose() {
      live = false
      restore()
      textures.forEach((texture) => texture.dispose())
      cover.geometry.dispose()
      backdrop.geometry.dispose()
      face.dispose()
      edge.dispose()
      backdropMaterial.dispose()
    },
  }
}
