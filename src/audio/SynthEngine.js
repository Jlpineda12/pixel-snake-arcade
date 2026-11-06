// Web Audio API Core Synthesizer
// Zero external audio files: 100% procedurally synthesized in real-time.

export class SynthEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.isMuted = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    // Master Bus
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Music Bus
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);

    // SFX Bus
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(0.65, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    // Cached noise buffer for 8-bit drums and explosions
    this.noiseBuffer = this.createNoiseBuffer(2); // 2 seconds of white noise
    this.initialized = true;
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      return this.ctx.resume();
    }
    return Promise.resolve();
  }

  createNoiseBuffer(duration = 1) {
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // Play an 8-bit synthesized tone with ADSR envelope
  playTone({
    freq = 440,
    type = 'square',
    duration = 0.15,
    attack = 0.01,
    decay = 0.05,
    sustain = 0.3,
    release = 0.08,
    volume = 0.5,
    bus = 'sfx',
    detune = 0,
    pitchDrop = 0
  }) {
    if (!this.initialized || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.detune.setValueAtTime(detune, now);

    if (pitchDrop > 0) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, freq - pitchDrop),
        now + duration
      );
    }

    // Envelope
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + attack);
    gain.gain.linearRampToValueAtTime(volume * sustain, now + attack + decay);
    gain.gain.setValueAtTime(volume * sustain, Math.max(now + attack + decay, now + duration - release));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    const targetBus = bus === 'music' ? this.musicGain : this.sfxGain;
    gain.connect(targetBus);

    osc.start(now);
    osc.stop(now + duration + 0.05);

    // Auto cleanup
    setTimeout(() => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch (e) {}
    }, (duration + 0.1) * 1000);
  }

  // Play 8-bit Noise burst (snare, hi-hat, explosion)
  playNoise({
    duration = 0.1,
    volume = 0.4,
    playbackRate = 1.0,
    filterFreq = 3000,
    filterType = 'bandpass',
    bus = 'sfx'
  }) {
    if (!this.initialized || this.isMuted || !this.noiseBuffer) return;

    const now = this.ctx.currentTime;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.playbackRate.setValueAtTime(playbackRate, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    const targetBus = bus === 'music' ? this.musicGain : this.sfxGain;
    gain.connect(targetBus);

    source.start(now);
    source.stop(now + duration + 0.02);

    setTimeout(() => {
      try {
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch (e) {}
    }, (duration + 0.05) * 1000);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(
        this.isMuted ? 0 : 0.7,
        this.ctx.currentTime
      );
    }
    return this.isMuted;
  }
}
