/** Locally hosted CC BY recording; credits in public/audio/README.md. */
export function createIntroScore() {
  let context: AudioContext | null = null
  let master: GainNode | null = null
  let source: AudioBufferSourceNode | null = null
  let buffer: Promise<AudioBuffer> | null = null
  let stopped = false

  return {
    async start(): Promise<boolean> {
      if (stopped) return false
      try {
        context ??= new AudioContext()
        const resumed = context.resume()
        buffer ??= fetch("/audio/adventure-intro.mp3")
          .then((response) => {
            if (!response.ok) throw new Error("Intro music unavailable")
            return response.arrayBuffer()
          })
          .then((bytes) => context!.decodeAudioData(bytes))
        const [decoded] = await Promise.all([buffer, resumed])
        if (stopped || context.state !== "running") return false
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
          source.start()
        }
        return true
      } catch {
        buffer = null
        return false
      }
    },
    mute() {
      if (context && master)
        master.gain.setTargetAtTime(0, context.currentTime, 0.04)
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
