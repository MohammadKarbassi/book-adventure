/** Locally hosted CC BY recording; credits in public/audio/README.md. */
export function createIntroScore(durationMs = 4700) {
  const startedAt = performance.now()
  let context: AudioContext | null = null
  let master: GainNode | null = null
  let source: AudioBufferSourceNode | null = null
  let buffer: Promise<AudioBuffer> | null = null
  let stopped = false
  let muted = false

  return {
    async start(): Promise<boolean> {
      if (stopped) return false
      muted = false
      try {
        context ??= new AudioContext()
        const resumed = context.resume().catch(() => {})
        buffer ??= fetch("/audio/adventure-intro.mp3")
          .then((response) => {
            if (!response.ok) throw new Error("Intro music unavailable")
            return response.arrayBuffer()
          })
          .then((bytes) => context!.decodeAudioData(bytes))
        const decoded = await buffer
        await Promise.race([
          resumed,
          new Promise((resolve) => window.setTimeout(resolve, 250)),
        ])
        if (stopped || muted || context.state !== "running") return false
        const elapsed = (performance.now() - startedAt) / 1000
        const remaining = durationMs / 1000 - elapsed
        if (remaining <= 0) return false
        if (!master) {
          master = context.createGain()
          master.gain.value = 0
          master.connect(context.destination)
        }
        master.gain.setTargetAtTime(0.55, context.currentTime, 0.06)
        if (!source) {
          source = context.createBufferSource()
          source.buffer = decoded
          source.connect(master)
          source.start(0, elapsed)
          const end = context.currentTime + remaining
          source.stop(end)
        }
        const end = context.currentTime + remaining
        master.gain.setValueAtTime(
          0.55,
          Math.max(context.currentTime, end - 0.9)
        )
        master.gain.linearRampToValueAtTime(0, end)
        return true
      } catch {
        buffer = null
        return false
      }
    },
    mute() {
      muted = true
      if (context && master) {
        master.gain.cancelScheduledValues(context.currentTime)
        master.gain.setTargetAtTime(0, context.currentTime, 0.04)
      }
    },
    fadeOut(durationMs: number) {
      if (!context || !master) return
      master.gain.cancelAndHoldAtTime(context.currentTime)
      master.gain.linearRampToValueAtTime(
        0,
        context.currentTime + durationMs / 1000
      )
    },
    stop() {
      if (stopped) return
      stopped = true
      const closingContext = context
      if (!closingContext) return
      if (master && closingContext.state === "running") {
        master.gain.setTargetAtTime(0, closingContext.currentTime, 0.035)
        window.setTimeout(
          () => void closingContext.close().catch(() => {}),
          180
        )
      } else {
        void closingContext.close().catch(() => {})
      }
    },
  }
}
