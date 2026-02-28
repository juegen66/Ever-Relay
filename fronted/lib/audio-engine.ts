// Web Audio API synthesizer for generating real music

type WaveType = OscillatorType

interface NoteEvent {
  freq: number       // Hz
  start: number      // seconds from beginning
  duration: number   // seconds
  velocity: number   // 0-1
  wave: WaveType
  detune?: number
}

// Note frequencies (middle octave)
const N: Record<string, number> = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  C6: 1046.50,
  // Sharps/flats
  Cs3: 138.59, Ds3: 155.56, Fs3: 185.00, Gs3: 207.65, As3: 233.08,
  Cs4: 277.18, Ds4: 311.13, Fs4: 369.99, Gs4: 415.30, As4: 466.16,
  Cs5: 554.37, Ds5: 622.25, Fs5: 739.99, Gs5: 830.61, As5: 932.33,
  Eb4: 311.13, Bb4: 466.16, Ab4: 415.30, Eb5: 622.25, Bb3: 233.08, Eb3: 155.56,
}

// Generate melody note events
function melody(notes: [string, number, number][], wave: WaveType, vel = 0.5, offset = 0): NoteEvent[] {
  return notes.map(([note, start, dur]) => ({
    freq: N[note] || 440,
    start: start + offset,
    duration: dur,
    velocity: vel,
    wave,
  }))
}

// Generate a looping pattern
function loop(pattern: [string, number, number][], wave: WaveType, vel: number, loopLen: number, totalLen: number): NoteEvent[] {
  const events: NoteEvent[] = []
  for (let t = 0; t < totalLen; t += loopLen) {
    events.push(...melody(pattern, wave, vel, t))
  }
  return events
}

// Track 1: "Sunset Dreams" - warm ambient melody in C major
function sunsetDreams(): NoteEvent[] {
  const dur = 45
  // Soft pad chords
  const chords = loop([
    ["C4", 0, 1.8], ["E4", 0, 1.8], ["G4", 0, 1.8],
    ["A3", 2, 1.8], ["C4", 2, 1.8], ["E4", 2, 1.8],
    ["F3", 4, 1.8], ["A3", 4, 1.8], ["C4", 4, 1.8],
    ["G3", 6, 1.8], ["B3", 6, 1.8], ["D4", 6, 1.8],
  ], "sine", 0.15, 8, dur)

  // Lead melody
  const lead = loop([
    ["E5", 0, 0.5], ["G5", 0.6, 0.4], ["A5", 1.2, 0.8], ["G5", 2.2, 0.5],
    ["E5", 3, 0.4], ["D5", 3.5, 0.8], ["C5", 4.5, 1],
    ["D5", 6, 0.5], ["E5", 6.8, 0.8], ["D5", 7.8, 0.6],
  ], "sine", 0.25, 8, dur)

  // Bass
  const bass = loop([
    ["C3", 0, 1.5], ["A3", 2, 1.5], ["F3", 4, 1.5], ["G3", 6, 1.5],
  ], "triangle", 0.2, 8, dur)

  return [...chords, ...lead, ...bass]
}

// Track 2: "Neon Lights" - synthwave in A minor
function neonLights(): NoteEvent[] {
  const dur = 45
  // Arpeggiated synth
  const arp = loop([
    ["A4", 0, 0.15], ["C5", 0.2, 0.15], ["E5", 0.4, 0.15], ["A5", 0.6, 0.15],
    ["E5", 0.8, 0.15], ["C5", 1.0, 0.15],
    ["F4", 1.2, 0.15], ["A4", 1.4, 0.15], ["C5", 1.6, 0.15], ["F5", 1.8, 0.15],
    ["C5", 2.0, 0.15], ["A4", 2.2, 0.15],
    ["G4", 2.4, 0.15], ["B4", 2.6, 0.15], ["D5", 2.8, 0.15], ["G5", 3.0, 0.15],
    ["D5", 3.2, 0.15], ["B4", 3.4, 0.15],
  ], "sawtooth", 0.08, 3.6, dur)

  // Big bass
  const bass = loop([
    ["A3", 0, 0.3], ["A3", 0.5, 0.2], ["A3", 1.0, 0.1],
    ["F3", 1.2, 0.3], ["F3", 1.7, 0.2],
    ["G3", 2.4, 0.3], ["G3", 2.9, 0.2], ["G3", 3.3, 0.1],
  ], "sawtooth", 0.2, 3.6, dur)

  // Pad
  const pad = loop([
    ["A3", 0, 1], ["C4", 0, 1], ["E4", 0, 1],
    ["F3", 1.2, 1], ["A3", 1.2, 1], ["C4", 1.2, 1],
    ["G3", 2.4, 1], ["B3", 2.4, 1], ["D4", 2.4, 1],
  ], "sine", 0.08, 3.6, dur)

  return [...arp, ...bass, ...pad]
}

// Track 3: "Ocean Waves" - very calm ambient in D major
function oceanWaves(): NoteEvent[] {
  const dur = 50
  const pad = loop([
    ["D4", 0, 3], ["Fs4", 0, 3], ["A4", 0, 3],
    ["G4", 3.5, 3], ["B4", 3.5, 3], ["D5", 3.5, 3],
    ["A3", 7, 3], ["Cs4", 7, 3], ["E4", 7, 3],
    ["D4", 10.5, 3], ["Fs4", 10.5, 3], ["A4", 10.5, 3],
  ], "sine", 0.1, 14, dur)

  const shimmer = loop([
    ["D5", 0, 1.5], ["A5", 2, 1], ["Fs5", 4, 1.5],
    ["G5", 7, 1], ["D5", 9, 1.5], ["E5", 11, 1],
  ], "sine", 0.12, 14, dur)

  const deep = loop([
    ["D3", 0, 6], ["A3", 7, 6],
  ], "triangle", 0.15, 14, dur)

  return [...pad, ...shimmer, ...deep]
}

// Track 4: "City Pulse" - upbeat electronic in E minor
function cityPulse(): NoteEvent[] {
  const dur = 40
  // Kick pattern (low freq hit)
  const kick = loop([
    ["E3", 0, 0.1], ["E3", 0.5, 0.1], ["E3", 1, 0.1], ["E3", 1.5, 0.1],
  ], "sine", 0.35, 2, dur)

  // Synth riff
  const riff = loop([
    ["E4", 0, 0.2], ["G4", 0.25, 0.2], ["B4", 0.5, 0.15],
    ["E5", 0.75, 0.1], ["D5", 1, 0.3],
    ["C5", 1.5, 0.2], ["B4", 1.75, 0.15],
  ], "square", 0.08, 2, dur)

  // Lead
  const lead = loop([
    ["E5", 0, 0.4], ["D5", 0.5, 0.3], ["B4", 1, 0.5],
    ["G4", 2, 0.4], ["A4", 2.5, 0.3], ["B4", 3, 0.8],
  ], "sawtooth", 0.1, 4, dur)

  const bass = loop([
    ["E3", 0, 0.4], ["E3", 0.5, 0.1], ["G3", 1, 0.4], ["G3", 1.5, 0.1],
  ], "triangle", 0.22, 2, dur)

  return [...kick, ...riff, ...lead, ...bass]
}

// Track 5: "Starlight" - ethereal arpeggios in C major
function starlight(): NoteEvent[] {
  const dur = 50
  const arp1 = loop([
    ["C5", 0, 0.3], ["E5", 0.35, 0.3], ["G5", 0.7, 0.3], ["C6", 1.05, 0.4],
    ["G5", 1.6, 0.3], ["E5", 1.95, 0.3], ["C5", 2.3, 0.3],
  ], "sine", 0.15, 2.8, dur)

  const arp2 = loop([
    ["A4", 0, 0.3], ["C5", 0.35, 0.3], ["E5", 0.7, 0.3], ["A5", 1.05, 0.4],
    ["E5", 1.6, 0.3], ["C5", 1.95, 0.3],
  ], "sine", 0.12, 2.8, dur / 2)

  const bass = loop([
    ["C3", 0, 2.5], ["A3", 2.8, 2.5], ["F3", 5.6, 2.5], ["G3", 8.4, 2.5],
  ], "triangle", 0.12, 11.2, dur)

  return [...arp1, ...arp2, ...bass]
}

// Track 6: "Jazz Cafe" - jazz chords in Eb major
function jazzCafe(): NoteEvent[] {
  const dur = 45
  const chords = loop([
    // Eb maj7
    ["Eb4", 0, 0.6], ["G4", 0.05, 0.6], ["Bb4", 0.1, 0.6], ["D5", 0.15, 0.6],
    // Ab maj7
    ["Ab4", 1.2, 0.6], ["C5", 1.25, 0.6], ["Eb5", 1.3, 0.6],
    // Bb7
    ["Bb3", 2.4, 0.6], ["D4", 2.45, 0.6], ["F4", 2.5, 0.6], ["Ab4", 2.55, 0.6],
    // Eb maj
    ["Eb4", 3.6, 0.8], ["G4", 3.65, 0.8], ["Bb4", 3.7, 0.8],
  ], "triangle", 0.12, 4.8, dur)

  const walk = loop([
    ["Eb3", 0, 0.5], ["F3", 0.6, 0.5], ["G3", 1.2, 0.5], ["Ab4", 1.8, 0.5],
    ["Bb3", 2.4, 0.5], ["Ab4", 3, 0.5], ["G3", 3.6, 0.5], ["F3", 4.2, 0.5],
  ], "triangle", 0.18, 4.8, dur)

  const lead = loop([
    ["Bb4", 0.5, 0.25], ["G4", 0.9, 0.3], ["Eb5", 1.5, 0.4],
    ["D5", 2.2, 0.25], ["C5", 2.7, 0.5], ["Bb4", 3.5, 0.3], ["G4", 4, 0.6],
  ], "sine", 0.15, 4.8, dur)

  return [...chords, ...walk, ...lead]
}

// Track 7: "Pixel Journey" - 8-bit chiptune in C major
function pixelJourney(): NoteEvent[] {
  const dur = 40
  const lead = loop([
    ["C5", 0, 0.12], ["C5", 0.15, 0.12], ["C5", 0.35, 0.2],
    ["E5", 0.6, 0.12], ["G5", 0.8, 0.25],
    ["E5", 1.2, 0.15], ["C5", 1.5, 0.12], ["D5", 1.7, 0.12], ["E5", 1.9, 0.3],
    ["D5", 2.4, 0.15], ["C5", 2.6, 0.12], ["A4", 2.8, 0.25],
    ["G4", 3.2, 0.2], ["A4", 3.5, 0.15], ["B4", 3.7, 0.25],
  ], "square", 0.1, 4, dur)

  const bass = loop([
    ["C3", 0, 0.1], ["C3", 0.25, 0.1], ["C3", 0.5, 0.1], ["C3", 0.75, 0.1],
    ["F3", 1, 0.1], ["F3", 1.25, 0.1], ["F3", 1.5, 0.1], ["F3", 1.75, 0.1],
    ["G3", 2, 0.1], ["G3", 2.25, 0.1], ["G3", 2.5, 0.1], ["G3", 2.75, 0.1],
    ["C3", 3, 0.1], ["C3", 3.25, 0.1], ["G3", 3.5, 0.1], ["G3", 3.75, 0.1],
  ], "square", 0.12, 4, dur)

  const arp = loop([
    ["C4", 0, 0.08], ["E4", 0.12, 0.08], ["G4", 0.24, 0.08],
    ["F4", 1, 0.08], ["A4", 1.12, 0.08], ["C5", 1.24, 0.08],
    ["G4", 2, 0.08], ["B4", 2.12, 0.08], ["D5", 2.24, 0.08],
    ["E4", 3, 0.08], ["G4", 3.12, 0.08], ["C5", 3.24, 0.08],
  ], "square", 0.06, 4, dur)

  return [...lead, ...bass, ...arp]
}

// Track 8: "Midnight Piano" - expressive piano-like in F minor
function midnightPiano(): NoteEvent[] {
  const dur = 50
  // Right hand melody
  const rh = loop([
    ["F4", 0, 0.8], ["Ab4", 1, 0.4], ["C5", 1.5, 0.8],
    ["Bb4", 2.5, 0.4], ["Ab4", 3, 0.8], ["G4", 4, 0.6],
    ["F4", 5, 0.4], ["Eb4", 5.5, 0.8], ["F4", 6.5, 1],
    ["Ab4", 8, 0.8], ["G4", 9, 0.6], ["F4", 10, 0.8],
    ["Eb4", 11, 0.4], ["D4", 11.5, 0.4], ["C4", 12, 1.2],
  ], "triangle", 0.2, 14, dur)

  // Left hand chords
  const lh = loop([
    ["F3", 0, 1.5], ["Ab3", 0, 1.5], ["C4", 0, 1.5],
    ["Bb3", 3.5, 1.5], ["D4", 3.5, 1.5],
    ["Eb3", 7, 1.5], ["G3", 7, 1.5], ["Bb3", 7, 1.5],
    ["C3", 10.5, 1.5], ["E3", 10.5, 1.5], ["G3", 10.5, 1.5],
  ], "sine", 0.12, 14, dur)

  // Deep bass
  const bass = loop([
    ["F3", 0, 3], ["Bb3", 3.5, 3], ["Eb3", 7, 3], ["C3", 10.5, 3],
  ], "sine", 0.1, 14, dur)

  return [...rh, ...lh, ...bass]
}

// Track registry
const TRACK_GENERATORS: Record<string, () => NoteEvent[]> = {
  "1": sunsetDreams,
  "2": neonLights,
  "3": oceanWaves,
  "4": cityPulse,
  "5": starlight,
  "6": jazzCafe,
  "7": pixelJourney,
  "8": midnightPiano,
}

export class AudioEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private scheduledNodes: { osc: OscillatorNode; gain: GainNode }[] = []
  private startTime = 0
  private _volume = 0.75
  private _isPlaying = false
  private currentTrackId = ""
  private trackEvents: NoteEvent[] = []
  private scheduleTimer: ReturnType<typeof setInterval> | null = null
  private scheduledUpTo = 0
  private readonly LOOK_AHEAD = 0.5 // seconds to schedule ahead

  get isPlaying() { return this._isPlaying }

  private ensureContext() {
    if (!this.ctx || this.ctx.state === "closed") {
      this.ctx = new AudioContext()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = this._volume
      this.masterGain.connect(this.ctx.destination)
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume()
    }
    return this.ctx
  }

  play(trackId: string, fromTime = 0) {
    this.stop()
    const ctx = this.ensureContext()
    const gen = TRACK_GENERATORS[trackId]
    if (!gen) return

    this.currentTrackId = trackId
    this.trackEvents = gen()
    this._isPlaying = true
    this.startTime = ctx.currentTime - fromTime
    this.scheduledUpTo = fromTime

    // Schedule notes in small batches
    this.scheduleTimer = setInterval(() => this.scheduleNotes(), 100)
    this.scheduleNotes()
  }

  private scheduleNotes() {
    if (!this.ctx || !this.masterGain || !this._isPlaying) return
    const currentPlayTime = this.ctx.currentTime - this.startTime
    const scheduleEnd = currentPlayTime + this.LOOK_AHEAD

    for (const event of this.trackEvents) {
      if (event.start >= this.scheduledUpTo && event.start < scheduleEnd) {
        this.scheduleNote(event)
      }
    }
    this.scheduledUpTo = scheduleEnd
  }

  private scheduleNote(event: NoteEvent) {
    if (!this.ctx || !this.masterGain) return
    const absStart = this.startTime + event.start
    const now = this.ctx.currentTime
    if (absStart + event.duration < now) return // Already passed

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = event.wave
    osc.frequency.value = event.freq
    if (event.detune) osc.detune.value = event.detune

    // ADSR-ish envelope
    const attackTime = Math.min(0.02, event.duration * 0.1)
    const releaseTime = Math.min(0.08, event.duration * 0.3)
    const startAt = Math.max(absStart, now)
    const endAt = absStart + event.duration

    gain.gain.setValueAtTime(0, startAt)
    gain.gain.linearRampToValueAtTime(event.velocity * 0.3, startAt + attackTime)
    gain.gain.setValueAtTime(event.velocity * 0.3, endAt - releaseTime)
    gain.gain.linearRampToValueAtTime(0, endAt)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start(startAt)
    osc.stop(endAt + 0.01)

    this.scheduledNodes.push({ osc, gain })

    // Cleanup old nodes
    osc.onended = () => {
      this.scheduledNodes = this.scheduledNodes.filter((n) => n.osc !== osc)
      try {
        gain.disconnect()
        osc.disconnect()
      } catch { /* already disconnected */ }
    }
  }

  pause() {
    if (this.ctx) this.ctx.suspend()
    this._isPlaying = false
    if (this.scheduleTimer) clearInterval(this.scheduleTimer)
  }

  resume() {
    if (!this.ctx || !this.currentTrackId) return
    this.ctx.resume()
    this._isPlaying = true
    this.scheduleTimer = setInterval(() => this.scheduleNotes(), 100)
    this.scheduleNotes()
  }

  stop() {
    this._isPlaying = false
    if (this.scheduleTimer) {
      clearInterval(this.scheduleTimer)
      this.scheduleTimer = null
    }
    for (const node of this.scheduledNodes) {
      try { node.osc.stop(); node.osc.disconnect(); node.gain.disconnect() } catch { /* ok */ }
    }
    this.scheduledNodes = []
  }

  getCurrentTime(): number {
    if (!this.ctx) return 0
    return this.ctx.currentTime - this.startTime
  }

  setVolume(v: number) {
    this._volume = v
    if (this.masterGain) this.masterGain.gain.value = v
  }

  getVolume() { return this._volume }

  destroy() {
    this.stop()
    if (this.ctx && this.ctx.state !== "closed") {
      this.ctx.close()
    }
    this.ctx = null
    this.masterGain = null
  }
}
