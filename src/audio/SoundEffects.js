// Retro Arcade Procedural Sound Effects (SFX)

export class SoundEffects {
  constructor(synth) {
    this.synth = synth;
  }

  // Classic Arcade "INSERT COIN" / Start sound
  coinInsert() {
    this.synth.playTone({
      freq: 987.77, // B5
      type: 'square',
      duration: 0.08,
      attack: 0.005,
      decay: 0.04,
      volume: 0.6,
      bus: 'sfx'
    });
    setTimeout(() => {
      this.synth.playTone({
        freq: 1318.51, // E6
        type: 'square',
        duration: 0.25,
        attack: 0.005,
        decay: 0.15,
        volume: 0.7,
        bus: 'sfx'
      });
    }, 75);
  }

  // Menu cursor move (subtle blip)
  menuMove() {
    this.synth.playTone({
      freq: 493.88, // B4
      type: 'square',
      duration: 0.04,
      attack: 0.002,
      decay: 0.02,
      volume: 0.35,
      bus: 'sfx'
    });
  }

  // Menu confirm
  menuConfirm() {
    this.synth.playTone({
      freq: 587.33, // D5
      type: 'square',
      duration: 0.06,
      volume: 0.5,
      bus: 'sfx'
    });
    setTimeout(() => {
      this.synth.playTone({
        freq: 880.00, // A5
        type: 'square',
        duration: 0.12,
        volume: 0.6,
        bus: 'sfx'
      });
    }, 60);
  }

  // Snake step (very subtle tactile feedback)
  step() {
    this.synth.playTone({
      freq: 120,
      type: 'triangle',
      duration: 0.025,
      attack: 0.001,
      decay: 0.02,
      volume: 0.12,
      bus: 'sfx'
    });
  }

  // Normal Apple Eat: 8-bit classic rising chime
  eat() {
    this.synth.playTone({
      freq: 659.25, // E5
      type: 'square',
      duration: 0.06,
      volume: 0.55,
      bus: 'sfx'
    });
    setTimeout(() => {
      this.synth.playTone({
        freq: 987.77, // B5
        type: 'square',
        duration: 0.12,
        volume: 0.65,
        bus: 'sfx'
      });
    }, 55);
  }

  // Golden Apple / Combo bonus: rapid ascending 4-note arpeggio
  eatGolden() {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.synth.playTone({
          freq,
          type: 'square',
          duration: 0.08,
          attack: 0.005,
          decay: 0.06,
          volume: 0.7,
          bus: 'sfx'
        });
      }, idx * 45);
    });
  }

  // Game Over: Noise explosion + sub-bass pitch drop
  gameOver() {
    // Noise blast
    this.synth.playNoise({
      duration: 0.45,
      volume: 0.75,
      playbackRate: 0.7,
      filterFreq: 1800,
      filterType: 'lowpass',
      bus: 'sfx'
    });

    // Pitch dive
    this.synth.playTone({
      freq: 300,
      type: 'sawtooth',
      duration: 0.6,
      attack: 0.01,
      decay: 0.3,
      sustain: 0.2,
      release: 0.2,
      volume: 0.7,
      pitchDrop: 260,
      bus: 'sfx'
    });
  }

  // Pause sound
  pause() {
    this.synth.playTone({
      freq: 660,
      type: 'square',
      duration: 0.08,
      volume: 0.4,
      bus: 'sfx'
    });
    setTimeout(() => {
      this.synth.playTone({
        freq: 440,
        type: 'square',
        duration: 0.1,
        volume: 0.4,
        bus: 'sfx'
      });
    }, 70);
  }
}
