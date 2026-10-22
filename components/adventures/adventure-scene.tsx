"use client"

import { useEffect, useRef } from "react"
import type { AdventureView } from "@/components/adventures/adventure-types"
import { createBookSurfaceTextures } from "@/components/book/book-materials"

export type SceneState = {
  index: number
  scroll: number
  previous: number
  local: number
  ratio: number
  scale: number
  activeScroll: number
  bookOffsets: number[]
}
type Props = {
  adventures: AdventureView[]
  state: React.RefObject<SceneState>
  rootRef: React.RefObject<HTMLDivElement | null>
  reduced: boolean
  onReady: (ready: boolean) => void
}

/** Fixed WebGL layer. Text/links and pointer hit areas remain ordinary DOM.
 * Geometry, back/spine and paper maps are project-generated substitutes;
 * existing catalog cover images are not Stripe assets. */
export function AdventureScene({
  adventures,
  state,
  rootRef,
  reduced,
  onReady,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    let live = true
    let frame = 0
    let dispose = () => {}
    void import("three")
      .then((THREE) => {
        if (!live || !canvasRef.current) return
        let renderer: InstanceType<typeof THREE.WebGLRenderer>
        try {
          renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            alpha: true,
            antialias: true,
          })
        } catch {
          onReady(false) // The existing six-face CSS model is the no-WebGL fallback.
          return
        }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        const scene = new THREE.Scene()
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10000)
        camera.position.z = 2000
        scene.add(new THREE.HemisphereLight(0xfff6df, 0x4b4741, 1.5))
        const light = new THREE.DirectionalLight(0xfff5df, 2.5)
        light.position.set(-500, 800, 1000)
        scene.add(light)
        const textures = new Map<number, InstanceType<typeof THREE.Texture>>()
        const loader = new THREE.TextureLoader()
        const books = new Map<
          number,
          { group: InstanceType<typeof THREE.Group>; key: string }
        >()
        const surfaces = createBookSurfaceTextures(THREE, () => {
          previousRender = ""
        })
        let width = 0
        let height = 0
        let previousRender = ""
        let cameraY = 0
        let cameraInitialized = false
        let previousTime = performance.now()
        let ready = false
        let contextLost = false
        const ownedTextures = new Set<InstanceType<typeof THREE.Texture>>()
        const load = (index: number) => {
          const adventure = adventures[index]
          if (!adventure || textures.has(adventure.id)) return
          const texture = loader.load(
            `/adventure-covers/${adventure.id}.webp`,
            () => {
              previousRender = ""
            },
            undefined,
            () => {
              previousRender = ""
            }
          )
          texture.colorSpace = THREE.SRGBColorSpace
          texture.anisotropy = Math.min(
            8,
            renderer.capabilities.getMaxAnisotropy()
          )
          textures.set(adventure.id, texture)
          ownedTextures.add(texture)
        }
        const drawnMap = (adventure: AdventureView, spine: boolean) => {
          const canvas = document.createElement("canvas")
          canvas.width = spine ? 128 : 512
          canvas.height = 1024
          const ctx = canvas.getContext("2d")!
          ctx.fillStyle = adventure.book.color.dominant
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.fillStyle = adventure.book.color.isDark ? "#f6efe1" : "#1d2333"
          ctx.direction = "rtl"
          ctx.textAlign = "center"
          const font = getComputedStyle(
            rootRef.current!.querySelector("h2")!
          ).fontFamily
          if (spine) {
            ctx.translate(64, 512)
            ctx.rotate(Math.PI / 2)
            ctx.font = `500 54px ${font}`
            ctx.fillText(adventure.book.title, 0, 8, 820)
          } else {
            ctx.font = `600 48px ${font}`
            ctx.fillText(adventure.book.title, 256, 240, 440)
            ctx.font = `400 28px ${font}`
            ctx.fillText(adventure.book.authors[0] ?? "", 256, 320, 440)
            ctx.fillText("ماجراجویی با کتاب", 256, 860, 440)
          }
          const texture = new THREE.CanvasTexture(canvas)
          texture.colorSpace = THREE.SRGBColorSpace
          ownedTextures.add(texture)
          return texture
        }
        const paperCanvas = document.createElement("canvas")
        paperCanvas.width = 128
        paperCanvas.height = 256
        const paperContext = paperCanvas.getContext("2d")!
        paperContext.fillStyle = "#efe9da"
        paperContext.fillRect(0, 0, 128, 256)
        paperContext.fillStyle = "#c9c1b0"
        for (let y = 0; y < 256; y += 4) paperContext.fillRect(0, y, 128, 1)
        const paperTexture = new THREE.CanvasTexture(paperCanvas)
        paperTexture.colorSpace = THREE.SRGBColorSpace
        ownedTextures.add(paperTexture)
        const clearGroup = (group: InstanceType<typeof THREE.Group>) => {
          group.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              object.geometry.dispose()
              const materials = Array.isArray(object.material)
                ? object.material
                : [object.material]
              new Set(materials).forEach((material) => material.dispose())
            }
          })
          scene.remove(group)
          const maps = group.userData.maps as InstanceType<
            typeof THREE.Texture
          >[]
          maps.forEach((texture) => {
            texture.dispose()
            ownedTextures.delete(texture)
          })
        }
        const buildBook = (
          adventure: AdventureView,
          w: number,
          h: number,
          depth: number,
          ratio: number
        ) => {
          const group = new THREE.Group()
          const backMap = drawnMap(adventure, false)
          const spineMap = drawnMap(adventure, true)
          group.userData.maps = [backMap, spineMap]
          const coverSurface = surfaces.forAspect(w / h)
          const spineSurface = surfaces.forAspect(depth / h)
          const edge = new THREE.MeshStandardMaterial({
            color: adventure.book.color.dominant,
            roughness: 0.82,
            bumpMap: coverSurface.bump,
            bumpScale: w * 0.00065,
            roughnessMap: coverSurface.roughness,
          })
          const paper = new THREE.MeshStandardMaterial({
            map: paperTexture,
            roughness: 0.95,
          })
          const block = new THREE.Mesh(
            new THREE.BoxGeometry(
              w - 4 * ratio,
              h - 4 * ratio,
              depth - 2 * ratio
            ),
            paper
          )
          group.add(block)
          const front = new THREE.MeshStandardMaterial({
            map: textures.get(adventure.id),
            roughness: 0.78,
            metalness: 0,
            bumpMap: coverSurface.bump,
            bumpScale: w * 0.0006,
            roughnessMap: coverSurface.roughness,
          })
          const back = new THREE.MeshStandardMaterial({
            map: backMap,
            roughness: 0.85,
            bumpMap: coverSurface.bump,
            bumpScale: w * 0.00065,
            roughnessMap: coverSurface.roughness,
          })
          for (const side of [-1, 1]) {
            const board = new THREE.Mesh(
              new THREE.BoxGeometry(w, h, 1.5 * ratio),
              [
                edge,
                edge,
                edge,
                edge,
                side === 1 ? front : edge,
                side === -1 ? back : edge,
              ]
            )
            board.position.z = (side * depth) / 2
            group.add(board)
          }
          const spine = new THREE.Mesh(
            new THREE.BoxGeometry(2 * ratio, h, depth),
            new THREE.MeshStandardMaterial({
              map: spineMap,
              roughness: 0.8,
              bumpMap: spineSurface.bump,
              bumpScale: w * 0.00065,
              roughnessMap: spineSurface.roughness,
            })
          )
          spine.position.x = w / 2 - ratio // Persian binding is on the right.
          group.add(spine)
          scene.add(group)
          return group
        }
        const draw = (time: number) => {
          if (!live) return
          frame = requestAnimationFrame(draw)
          if (document.hidden || contextLost) return
          const current = state.current
          const adventure = adventures[current.index]
          if (!adventure) return
          const small = window.innerWidth < 900
          const anchor = rootRef.current?.querySelector<HTMLElement>(
            small
              ? `[data-adventure-section="${adventure.id}"] [data-book-stage]`
              : "[data-active-book] [data-book-stage]"
          )
          const body = anchor?.querySelector<HTMLElement>("[data-book-body]")
          if (!anchor || !body || !anchor.offsetWidth) return
          load(current.index)
          load(current.index - 1)
          load(current.index + 1)
          const ratio = current.ratio
          if (width !== window.innerWidth || height !== window.innerHeight) {
            width = window.innerWidth
            height = window.innerHeight
            renderer.setSize(width, height, false)
          }
          camera.left = (-width * ratio) / 2
          camera.right = (width * ratio) / 2
          camera.top = (height * ratio) / 2
          camera.bottom = (-height * ratio) / 2
          camera.updateProjectionMatrix()
          const rect = anchor.getBoundingClientRect()
          const w = body.offsetWidth * ratio
          const h = body.offsetHeight * ratio
          const x = (rect.left + rect.width / 2 - width / 2) * ratio
          // Mobile uses overall clamped scroll; desktop uses measured Praise space.
          const baseY = small
            ? (height / 2 -
                (rect.top +
                  window.scrollY -
                  (window.scrollY - current.local) +
                  rect.height / 2)) *
              ratio
            : (height / 2 - rect.top - rect.height / 2) * ratio
          const delta = Math.min(3, (time - previousTime) / (1000 / 60))
          previousTime = time
          const targetY = -current.scroll * ratio
          cameraY =
            reduced || !cameraInitialized
              ? targetY
              : cameraY + (1 - Math.pow(0.82, delta)) * (targetY - cameraY)
          cameraInitialized = true
          camera.position.y = cameraY
          const pose = body.style.transform
          const deg = (axis: string) =>
            (Number(
              new RegExp(`rotate${axis}\\((-?[\\d.]+)deg\\)`).exec(pose)?.[1] ??
                0
            ) *
              Math.PI) /
            180
          const scrollRotation = reduced
            ? 0
            : current.activeScroll * (small ? 0.0008 : 0.0004)
          // Keep adjacent meshes in the same Praise-space. A changed index
          // changes pose/theme, never swaps one mesh's texture in-place.
          books.forEach(({ group }, index) => {
            group.visible = Math.abs(index - current.index) <= 1
          })
          for (
            let index = Math.max(0, current.index - 1);
            index <= Math.min(adventures.length - 1, current.index + 1);
            index++
          ) {
            const item = adventures[index]
            load(index)
            const key = `${w}:${h}`
            let record = books.get(index)
            if (!record || record.key !== key) {
              if (record) clearGroup(record.group)
              record = {
                group: buildBook(item, w, h, (w * item.depth) / 300, ratio),
                key,
              }
              books.set(index, record)
            }
            const book = record.group
            // Mobile books follow their own native-flow DOM anchors.
            const mobileAnchor = small
              ? rootRef.current?.querySelector<HTMLElement>(
                  `[data-adventure-section="${item.id}"] [data-book-stage]`
                )
              : null
            const mobileRect = mobileAnchor?.getBoundingClientRect()
            if (small && mobileRect) {
              book.position.set(
                (mobileRect.left + mobileRect.width / 2 - width / 2) * ratio,
                (height / 2 - mobileRect.top - mobileRect.height / 2) * ratio +
                  cameraY,
                0
              )
            } else {
              book.position.set(
                x,
                baseY -
                  (current.bookOffsets[index] ?? current.previous) * ratio,
                0
              )
            }
            const selected = index === current.index
            book.rotation.set(
              selected ? -deg("X") : (-12 * Math.PI) / 180,
              selected ? deg("Y") + scrollRotation : (-17 * Math.PI) / 180,
              (-3.5 * Math.PI) / 180
            )
          }
          const endingTop =
            rootRef.current
              ?.querySelector<HTMLElement>("[data-journey-ending]")
              ?.getBoundingClientRect().top ?? height
          const wipe = Math.min(1, Math.max(0, (height - endingTop) / height))
          renderer.domElement.style.clipPath = `inset(0px 0px ${wipe * 100}%)`
          if (rootRef.current)
            rootRef.current.dataset.bookOffscreen = String(
              endingTop <= 0 || (!small && current.local > height)
            )
          const signature = `${current.index}:${w}:${h}:${x}:${baseY}:${cameraY.toFixed(3)}:${pose}:${scrollRotation}:${wipe}`
          if (signature !== previousRender) {
            renderer.render(scene, camera)
            renderer.domElement.dataset.renderedBook = String(adventure.id)
            renderer.domElement.dataset.cameraScroll = String(current.scroll)
            renderer.domElement.dataset.modelCount = String(
              [...books.values()].filter(({ group }) => group.visible).length
            )
            previousRender = signature
          }
          if (!ready && textures.get(adventure.id)?.image) {
            ready = true
            onReady(true)
          }
        }
        frame = requestAnimationFrame(draw)
        const loseContext = (event: Event) => {
          event.preventDefault()
          contextLost = true
          ready = false
          onReady(false)
        }
        const restoreContext = () => {
          contextLost = false
          previousRender = ""
        }
        renderer.domElement.addEventListener("webglcontextlost", loseContext)
        renderer.domElement.addEventListener(
          "webglcontextrestored",
          restoreContext
        )
        dispose = () => {
          cancelAnimationFrame(frame)
          renderer.domElement.removeEventListener(
            "webglcontextlost",
            loseContext
          )
          renderer.domElement.removeEventListener(
            "webglcontextrestored",
            restoreContext
          )
          books.forEach(({ group }) => clearGroup(group))
          ownedTextures.forEach((texture) => texture.dispose())
          surfaces.dispose()
          renderer.dispose()
        }
      })
      .catch(() => onReady(false))
    return () => {
      live = false
      cancelAnimationFrame(frame)
      dispose()
    }
  }, [adventures, onReady, reduced, rootRef, state])
  return (
    <canvas
      ref={canvasRef}
      data-adventure-canvas=""
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-10 h-svh w-screen"
    />
  )
}
