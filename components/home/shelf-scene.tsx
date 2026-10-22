"use client"

import { useEffect, useRef } from "react"
import type * as Three from "three"
import { createBookSurfaceTextures } from "@/components/book/book-materials"
import type { ShelfBook } from "@/components/home/shelf-geometry"
import { createShelfPoster } from "@/components/home/shelf-poster"
import { createHomePodcastScene } from "@/components/home/home-podcast-scene"

/** One transparent, lit layer; native links and CSS remain the accessible fallback. */
export function ShelfScene({ books }: { books: ShelfBook[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    let live = true
    let cleanup = () => {}
    void import("three")
      .then((THREE) => {
        const target = canvasRef.current
        if (!live || !target) return
        const canvas: HTMLCanvasElement = target
        const root = canvas.closest("[data-press-shelf]")
        if (!root) return
        let renderer: Three.WebGLRenderer
        try {
          renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true,
          })
        } catch {
          return
        }
        renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.autoClear = false
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(45, 1, 1, 10000)
        camera.layers.enable(1)
        scene.add(new THREE.HemisphereLight(0xfff4dd, 0x344559, 2.2))
        const key = new THREE.DirectionalLight(0xfff5e5, 2.8)
        key.position.set(-600, 900, 1400)
        scene.add(key)
        const fill = new THREE.DirectionalLight(0xc7e4ff, 0.65)
        fill.position.set(900, -100, 800)
        scene.add(fill)
        const surfaces = createBookSurfaceTextures(THREE, () => {
          previousRender = ""
        })
        const entries = new Map<
          number,
          {
            group: Three.Group
            body: HTMLElement
            maps: Three.Texture[]
            loaded: boolean
          }
        >()
        const pending = new Set<number>()
        const failed = new Set<number>()
        const loader = new THREE.TextureLoader()
        let frame = 0
        let width = 0
        let height = 0
        let lost = false
        let previousRender = ""
        const poster = createShelfPoster(THREE, scene, root, () => {
          previousRender = ""
        })
        const podcast = createHomePodcastScene(THREE, root, () => {
          previousRender = ""
        })
        const restoreDOM = () => {
          entries.forEach(({ body }) => {
            body.style.opacity = ""
          })
          canvas.dataset.ready = "false"
          poster.restore()
          podcast.restore()
        }
        function build(
          book: ShelfBook,
          index: number,
          image: HTMLImageElement
        ) {
          const body = root?.querySelector<HTMLElement>(
            `[data-shelf-index="${index}"] [data-shelf-body]`
          )
          if (!live || !body) return
          const group = new THREE.Group()
          const maps: Three.Texture[] = []
          const texture = (element: HTMLCanvasElement) => {
            const map = new THREE.CanvasTexture(element)
            map.colorSpace = THREE.SRGBColorSpace
            map.anisotropy = Math.min(
              renderer.capabilities.getMaxAnisotropy(),
              8
            )
            maps.push(map)
            return map
          }
          const cover = document.createElement("canvas")
          cover.width = 1080
          cover.height = 720
          const coverContext = cover.getContext("2d")!
          coverContext.translate(1080, 0)
          coverContext.rotate(Math.PI / 2)
          coverContext.drawImage(image, 0, 0, 720, 1080)
          const spine = document.createElement("canvas")
          spine.width = 1800
          spine.height = 210
          const context = spine.getContext("2d")!
          context.fillStyle = book.color.dominant
          context.fillRect(0, 0, 1800, 210)
          context.globalAlpha = 0.22
          context.drawImage(
            image,
            0,
            image.height * 0.35,
            image.width,
            image.height * 0.2,
            0,
            0,
            1800,
            210
          )
          context.globalAlpha = 1
          const shade = context.createLinearGradient(0, 0, 0, 210)
          shade.addColorStop(0, "#ffffff24")
          shade.addColorStop(0.13, "#ffffff00")
          shade.addColorStop(0.85, "#0000000a")
          shade.addColorStop(1, "#00000066")
          context.fillStyle = shade
          context.fillRect(0, 0, 1800, 210)
          context.direction = "rtl"
          context.textAlign = "center"
          context.textBaseline = "middle"
          const ink = book.color.isDark ? "#fff9eb" : "#24201a"
          context.fillStyle = ink
          context.shadowColor = "#00000055"
          context.shadowBlur = 1
          context.shadowOffsetY = 2
          context.font = "600 62px Vazirmatn, sans-serif"
          context.fillText(book.title, 900, 110, 880)
          context.font = "400 31px Vazirmatn, sans-serif"
          context.fillText(book.author, 1460, 110, 340)
          context.fillText(
            new Intl.NumberFormat("fa").format(index + 1),
            1675,
            110
          )
          context.strokeStyle = `${ink}66`
          context.lineWidth = 2
          context.strokeRect(66, 75, 55, 65)
          const spineMaps = surfaces.forAspect(
            body.offsetWidth / body.offsetHeight
          )
          const coverMaps = surfaces.forAspect(1.5)
          const common = {
            bumpMap: spineMaps.bump,
            bumpScale: 0.55,
            roughnessMap: spineMaps.roughness,
            roughness: 0.96,
            metalness: 0,
          }
          const spineMaterial = new THREE.MeshStandardMaterial({
            ...common,
            map: texture(spine),
          })
          const coverMaterial = new THREE.MeshStandardMaterial({
            ...common,
            bumpMap: coverMaps.bump,
            roughnessMap: coverMaps.roughness,
            map: texture(cover),
          })
          const board = new THREE.MeshStandardMaterial({
            ...common,
            color: book.color.dominant,
          })
          const paper = new THREE.MeshStandardMaterial({
            color: 0xe5dcc8,
            roughness: 0.98,
            bumpMap: surfaces.paper,
            bumpScale: 0.15,
          })
          // Unit model: broad spine X, thickness Y, cover depth Z. Binding faces viewer.
          const core = new THREE.Mesh(
            new THREE.BoxGeometry(0.994, 0.88, 0.654),
            [paper, paper, board, board, spineMaterial, paper]
          )
          core.position.z = -0.327
          group.add(core)
          for (const sign of [-1, 1]) {
            const slab = new THREE.Mesh(new THREE.BoxGeometry(1, 0.06, 0.666), [
              board,
              board,
              sign > 0 ? coverMaterial : board,
              sign < 0 ? coverMaterial : board,
              spineMaterial,
              board,
            ])
            slab.position.set(0, sign * 0.47, -0.333)
            group.add(slab)
          }
          scene.add(group)
          entries.set(index, { group, body, maps, loaded: true })
        }
        function tick() {
          if (!live) return
          frame = requestAnimationFrame(tick)
          if (lost || document.hidden || !root) return
          // A fixed canvas must not paint the arriving books over the hero.
          const shelfBounds = root.getBoundingClientRect()
          canvas.style.clipPath = `inset(${Math.max(0, shelfBounds.top)}px 0 ${Math.max(0, innerHeight - shelfBounds.bottom)}px)`
          if (width !== innerWidth || height !== innerHeight) {
            width = innerWidth
            height = innerHeight
            renderer.setSize(width, height, false)
            camera.aspect = width / height
            camera.position.z = height / (2 * Math.tan(Math.PI / 8))
            camera.updateProjectionMatrix()
            previousRender = ""
          }
          const signature: string[] = [String(scrollY), String(entries.size)]
          signature.push(poster.update(width, height))
          const podcastFrame = podcast.update(width, height)
          signature.push(podcastFrame.signature)
          books.forEach((book, index) => {
            const item = root.querySelector<HTMLElement>(
              `[data-shelf-index="${index}"]`
            )
            const body = item?.querySelector<HTMLElement>("[data-shelf-body]")
            if (!item || !body) return
            const rect = item.getBoundingClientRect()
            const visible =
              rect.bottom > -width * 0.5 && rect.top < height + width * 0.5
            if (
              visible &&
              !entries.has(index) &&
              !pending.has(index) &&
              !failed.has(index)
            ) {
              pending.add(index)
              loader.load(
                `/adventure-covers/${book.id}.webp`,
                (map) => {
                  if (live) build(book, index, map.image)
                  map.dispose()
                  pending.delete(index)
                },
                undefined,
                () => {
                  pending.delete(index)
                  failed.add(index)
                }
              )
            }
            const entry = entries.get(index)
            if (!entry) return
            entry.group.visible = visible
            signature.push(`${index}:${visible}`)
            if (!visible) return
            const matrix = new DOMMatrixReadOnly(
              getComputedStyle(body).transform
            )
            signature.push(
              `${matrix.m22},${matrix.m23},${matrix.m41},${matrix.m42},${matrix.m43},${rect.left},${rect.top},${rect.width}`
            )
            const thickness = body.offsetHeight
            entry.group.scale.set(body.offsetWidth, thickness, body.offsetWidth)
            entry.group.rotation.x = -Math.atan2(matrix.m23, matrix.m22)
            entry.group.position.set(
              rect.left + rect.width / 2 - width / 2 + matrix.m41,
              height / 2 - rect.top - thickness / 2 - matrix.m42,
              matrix.m43
            )
            body.style.opacity = "0"
            canvas.dataset.ready = "true"
          })
          const nextRender = signature.join(";")
          if (nextRender !== previousRender) {
            renderer.setScissorTest(false)
            renderer.clear()
            renderer.setScissorTest(true)
            renderer.setScissor(
              0,
              podcastFrame.pixels,
              width,
              height - podcastFrame.pixels
            )
            if (podcastFrame.pixels < height) renderer.render(scene, camera)
            if (podcastFrame.ready && podcastFrame.pixels > 0) {
              renderer.setScissor(0, 0, width, podcastFrame.pixels)
              podcast.render(renderer)
            }
            renderer.setScissorTest(false)
            previousRender = nextRender
          }
        }
        const onLost = (event: Event) => {
          event.preventDefault()
          lost = true
          restoreDOM()
        }
        const onRestored = () => {
          lost = false
          previousRender = ""
        }
        canvas.addEventListener("webglcontextlost", onLost)
        canvas.addEventListener("webglcontextrestored", onRestored)
        tick()
        cleanup = () => {
          cancelAnimationFrame(frame)
          restoreDOM()
          canvas.removeEventListener("webglcontextlost", onLost)
          canvas.removeEventListener("webglcontextrestored", onRestored)
          const materials = new Set<Three.Material>()
          entries.forEach(({ group, maps }) => {
            group.traverse((node) => {
              if (node instanceof THREE.Mesh) {
                node.geometry.dispose()
                ;(Array.isArray(node.material)
                  ? node.material
                  : [node.material]
                ).forEach((material: Three.Material) => materials.add(material))
              }
            })
            maps.forEach((map) => map.dispose())
          })
          materials.forEach((material) => material.dispose())
          surfaces.dispose()
          poster.dispose()
          podcast.dispose()
          renderer.dispose()
        }
      })
      .catch(() => {})
    return () => {
      live = false
      cleanup()
    }
  }, [books])
  return (
    <canvas
      ref={canvasRef}
      data-shelf-canvas=""
      data-ready="false"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-10 h-svh w-full"
    />
  )
}
