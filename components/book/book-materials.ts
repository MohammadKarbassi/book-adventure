import type * as Three from "three"

/** Original, deterministic cloth relief; no reference-site maps or invented foil. */
export function createBookSurfaceTextures(
  THREE: typeof Three,
  onLoad = () => {}
) {
  const make = (paper = false, matte = false) => {
    const canvas = document.createElement("canvas")
    canvas.width = canvas.height = 256
    const context = canvas.getContext("2d")!
    const pixels = context.createImageData(256, 256)
    let seed = 1937
    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 256; x++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) | 0
        const grain = ((seed >>> 24) / 255 - 0.5) * 30
        const weave = paper
          ? Math.sin(y * Math.PI) * 7 + (y % 4 === 0 ? -18 : 0)
          : Math.sin((x * Math.PI) / 2) * 10 + Math.sin((y * Math.PI) / 2) * 8
        const value = matte
          ? 232 + grain * 0.2 + weave * 0.25
          : 154 + grain + weave
        const offset = (y * 256 + x) * 4
        pixels.data.set([value, value, value, 255], offset)
      }
    }
    context.putImageData(pixels, 0, 0)
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(paper ? 8 : 2, paper ? 2 : 2)
    return texture
  }
  const bump: Three.Texture = make()
  bump.wrapS = bump.wrapT = THREE.MirroredRepeatWrapping
  const roughness = make(false, true)
  const paper = make(true)
  const aspects = new Map<
    string,
    { bump: Three.Texture; roughness: Three.Texture }
  >()
  // UV density must follow physical face aspect; repeating a square tile
  // equally on a broad, shallow spine crushes the yarns below one pixel.
  const forAspect = (aspect: number) => {
    const key = aspect.toFixed(2)
    let maps = aspects.get(key)
    if (!maps) {
      maps = { bump: bump.clone(), roughness: roughness.clone() }
      for (const map of Object.values(maps)) {
        const repeatX = 4 * Math.min(1, aspect)
        map.repeat.set(repeatX, repeatX / Math.max(0.01, aspect))
        map.needsUpdate = true
      }
      aspects.set(key, maps)
    }
    return maps
  }
  let disposed = false
  new THREE.TextureLoader().load(
    "/materials/book-cloth-height.webp",
    (loaded) => {
      if (!disposed) {
        bump.image = loaded.image
        bump.needsUpdate = true
        aspects.forEach((maps) => {
          maps.bump.image = loaded.image
          maps.bump.needsUpdate = true
        })
        onLoad()
      }
      loaded.dispose()
    },
    undefined,
    () => {}
  ) // The deterministic relief remains a safe fallback.
  return {
    bump,
    roughness,
    paper,
    forAspect,
    dispose() {
      disposed = true
      aspects.forEach((maps) => {
        maps.bump.dispose()
        maps.roughness.dispose()
      })
      bump.dispose()
      roughness.dispose()
      paper.dispose()
    },
  }
}
