import { describe, expect, it } from "vitest"
import * as THREE from "three"
import {
  renderShelfLayers,
  setShelfForeground,
} from "@/components/home/shelf-render"

describe("shelf foreground compositing", () => {
  it("draws a pulled book after its neighbors with fresh depth but intact self-occlusion", () => {
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera()
    camera.layers.enable(1)
    const resting = new THREE.Group()
    const pulled = new THREE.Group()
    resting.add(
      new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial())
    )
    pulled.add(
      new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial())
    )
    scene.add(resting, pulled)
    setShelfForeground(pulled, true)
    const passes: string[] = []
    const renderer = {
      render(_scene: THREE.Scene, view: THREE.Camera) {
        const a = view.layers.test(resting.children[0].layers)
        const b = view.layers.test(pulled.children[0].layers)
        passes.push(`${a}:${b}`)
      },
      clearDepth() {
        passes.push("clear-depth")
      },
    }
    renderShelfLayers(renderer, scene, camera, true)
    expect(passes).toEqual(["true:false", "clear-depth", "false:true"])
    expect(camera.layers.mask).toBe(3)
    expect((pulled.children[0] as THREE.Mesh).material).toHaveProperty(
      "depthTest",
      true
    )
    setShelfForeground(pulled, false)
    passes.length = 0
    renderShelfLayers(renderer, scene, camera, false)
    expect(passes).toEqual(["true:true"])
  })
})
