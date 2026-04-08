let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

function playPop(ctx: AudioContext, time: number, volume: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(800 + Math.random() * 600, time)
  osc.frequency.exponentialRampToValueAtTime(200 + Math.random() * 100, time + 0.15)

  gain.gain.setValueAtTime(volume, time)
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(time)
  osc.stop(time + 0.15)
}

function playCrackle(ctx: AudioContext, time: number, volume: number) {
  const bufferSize = ctx.sampleRate * 0.08
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3)
  }

  const source = ctx.createBufferSource()
  const gain = ctx.createGain()
  const filter = ctx.createBiquadFilter()

  source.buffer = buffer
  filter.type = 'highpass'
  filter.frequency.value = 2000 + Math.random() * 3000

  gain.gain.setValueAtTime(volume * 0.6, time)
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08)

  source.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  source.start(time)
}

function playWhistle(ctx: AudioContext, time: number, volume: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(400 + Math.random() * 200, time)
  osc.frequency.linearRampToValueAtTime(1200 + Math.random() * 800, time + 0.3)

  gain.gain.setValueAtTime(volume * 0.15, time)
  gain.gain.linearRampToValueAtTime(volume * 0.3, time + 0.15)
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(time)
  osc.stop(time + 0.35)
}

export function playFireworksSound(durationMs: number = 2500): void {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime
    const duration = durationMs / 1000
    const volume = 0.25

    playWhistle(ctx, now, volume)
    playPop(ctx, now + 0.35, volume)

    for (let i = 0; i < 4; i++) {
      playCrackle(ctx, now + 0.35 + Math.random() * 0.2, volume)
    }

    const burstCount = Math.floor(duration / 0.6)
    for (let b = 1; b <= burstCount; b++) {
      const t = now + b * 0.6

      if (Math.random() > 0.4) {
        playWhistle(ctx, t - 0.35, volume * 0.8)
      }

      playPop(ctx, t, volume * (0.7 + Math.random() * 0.3))

      const crackles = 2 + Math.floor(Math.random() * 4)
      for (let c = 0; c < crackles; c++) {
        playCrackle(ctx, t + 0.02 + Math.random() * 0.25, volume * (0.5 + Math.random() * 0.5))
      }
    }
  } catch {
    // Audio not available — silently skip
  }
}
