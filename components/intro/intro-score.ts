/** Original five-second adventure sting, synthesized locally with no downloads. */
export function createIntroScore() {
  let context: AudioContext | null = null
  let master: GainNode | null = null
  let scheduled = false
  let stopped = false

  function note(
    at: number,
    frequency: number,
    duration: number,
    volume: number,
    type: OscillatorType
  ) {
    if (!context || !master) return
    const oscillator = context.createOscillator()
    const envelope = context.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, at)
    envelope.gain.setValueAtTime(0, at)
    envelope.gain.linearRampToValueAtTime(volume, at + 0.015)
    envelope.gain.exponentialRampToValueAtTime(0.001, at + duration)
    oscillator.connect(envelope).connect(master)
    oscillator.start(at)
    oscillator.stop(at + duration + 0.02)
  }

  return {
    async start(): Promise<boolean> {
      if (stopped) return false
      try {
        context ??= new AudioContext()
        await context.resume()
        if (stopped || context.state !== "running") return false
        master ??= context.createGain()
        master.connect(context.destination)
        master.gain.setTargetAtTime(0.28, context.currentTime, 0.04)
        if (!scheduled) {
          scheduled = true
          const start = context.currentTime + 0.03
          // D minor: low heartbeat drums beneath a rising, bright arpeggio.
          const melody = [
            293.66, 349.23, 440, 587.33, 349.23, 440, 523.25, 698.46, 440,
            587.33, 698.46, 880,
          ]
          melody.forEach((frequency, index) =>
            note(start + index * 0.28, frequency, 0.42, 0.16, "triangle")
          )
          for (let beat = 0; beat < 12; beat++) {
            note(
              start + beat * 0.28,
              beat % 3 === 0 ? 73.42 : 146.83,
              0.16,
              beat % 3 === 0 ? 0.65 : 0.2,
              "sine"
            )
          }
          ;[146.83, 220, 293.66, 440].forEach((frequency) =>
            note(start + 3.36, frequency, 1.1, 0.18, "triangle")
          )
        }
        return true
      } catch {
        return false
      }
    },
    mute() {
      if (context && master)
        master.gain.setTargetAtTime(0, context.currentTime, 0.04)
    },
    stop() {
      stopped = true
      if (context) void context.close().catch(() => {})
    },
  }
}
