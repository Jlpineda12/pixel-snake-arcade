// Real-Time Procedural Chiptune Music Generator
// Generates infinite dynamic 8-bit arcade soundtrack using Web Audio API

export class ProceduralMusic {
  constructor(synth) {
    this.synth = synth;
    this.isPlaying = false;
    this.currentMode = 'menu'; // 'menu' | 'game'
    this.step = 0;
    this.bar = 0;
    this.timerId = null;

    // Base tempo
    this.menuBpm = 112;
    this.gameBpm = 136;
    this.currentBpm = this.menuBpm;

    // Frequencies (Hz) for an authentic 8-bit A minor / Dorian scale
    this.freqs = {
      // Bass octave (A1 - G2)
      A1: 55.00, C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00,
      // Mid octave (A2 - G3)
      A2: 110.00, C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00,
      // Harmony / Arp octave (A3 - G4)
      A3: 220.00, B3: 246.94, C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00,
      // Lead octave (A4 - C6)
      A4: 440.00, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99,
      A5: 880.00, C6: 1046.50
    };

    // Chord progressions (4-bar cycles)
    // Progression A: Am -> F -> C -> G (Classic Epic Arcade)
    // Progression B: Am -> Dm -> Em -> Am (Dark Cyberpunk)
    this.progressions = [
      {
        name: 'epic',
        chords: [
          { bass: 'A1', root: 'A3', notes: ['A3', 'C4', 'E4', 'A4'] },
          { bass: 'F2', root: 'F3', notes: ['F3', 'A3', 'C4', 'F4'] },
          { bass: 'C2', root: 'C4', notes: ['C4', 'E4', 'G4', 'C5'] },
          { bass: 'G2', root: 'G3', notes: ['G3', 'B3', 'D4', 'G4'] }
        ]
      },
      {
        name: 'cyber',
        chords: [
          { bass: 'A1', root: 'A3', notes: ['A3', 'C4', 'E4', 'G4'] },
          { bass: 'D2', root: 'D4', notes: ['D4', 'F4', 'A4', 'C5'] },
          { bass: 'E2', root: 'E4', notes: ['E4', 'G4', 'B4', 'E5'] },
          { bass: 'A1', root: 'A3', notes: ['A3', 'C4', 'E4', 'A4'] }
        ]
      }
    ];

    this.currentProgIndex = 0;
    this.intensity = 1.0; // scales with snake length
    this.generatedLeadPattern = [];
    this.generateNewLeadPhrase();
  }

  // Generates a 16-step procedural melody using pentatonic scale motifs
  generateNewLeadPhrase() {
    const scale = ['A4', 'C5', 'D5', 'E5', 'G5', 'A5'];
    this.generatedLeadPattern = [];

    for (let i = 0; i < 16; i++) {
      // 50% chance of rest on 16th notes to give rhythm space
      if (i % 2 !== 0 && Math.random() < 0.6) {
        this.generatedLeadPattern.push(null);
      } else {
        const note = scale[Math.floor(Math.random() * scale.length)];
        this.generatedLeadPattern.push(note);
      }
    }
  }

  start(mode = 'menu') {
    this.currentMode = mode;
    this.currentBpm = mode === 'menu' ? this.menuBpm : this.gameBpm;
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.step = 0;
    this.bar = 0;
    this.scheduleNextTick();
  }

  stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  setMode(mode) {
    this.currentMode = mode;
    this.currentBpm = mode === 'menu' ? this.menuBpm : (this.gameBpm * this.intensity);
    if (!this.isPlaying) {
      this.start(mode);
    }
  }

  setGameIntensity(score = 0) {
    // Dynamically accelerate tempo as snake eats apples (up to 1.25x)
    const factor = Math.min(1.25, 1.0 + (score * 0.008));
    this.intensity = factor;
    if (this.currentMode === 'game') {
      this.currentBpm = this.gameBpm * this.intensity;
    }
  }

  scheduleNextTick() {
    if (!this.isPlaying) return;

    // 16th note duration in ms
    const stepDurationMs = (60000 / this.currentBpm) / 4;

    this.tick();

    this.step = (this.step + 1) % 16;
    if (this.step === 0) {
      this.bar = (this.bar + 1) % 4;
      if (this.bar === 0) {
        // Change progression or generate new melody every 4 bars
        if (Math.random() > 0.5) {
          this.currentProgIndex = (this.currentProgIndex + 1) % this.progressions.length;
        }
        this.generateNewLeadPhrase();
      }
    }

    this.timerId = setTimeout(() => this.scheduleNextTick(), stepDurationMs);
  }

  tick() {
    if (!this.synth.initialized || this.synth.isMuted) return;

    const prog = this.progressions[this.currentProgIndex];
    const currentChord = prog.chords[this.bar];

    // Track 1: Bassline (Triangle wave, punchy 8-bit walking bass)
    this.playBassTrack(currentChord);

    // Track 2: 16th Note Arpeggio (Square wave)
    this.playArpTrack(currentChord);

    // Track 3: Lead Melody (Procedural 8-bit square wave)
    this.playLeadTrack();

    // Track 4: 8-bit Drums / Percussion
    this.playDrumTrack();
  }

  playBassTrack(currentChord) {
    // Bass plays on steps 0, 3, 6, 8, 11, 14 (classic syncopated groove)
    const bassSteps = [0, 3, 6, 8, 11, 14];
    if (bassSteps.includes(this.step)) {
      const freq = this.freqs[currentChord.bass] || 55.0;
      this.synth.playTone({
        freq,
        type: 'triangle',
        duration: 0.12,
        attack: 0.005,
        decay: 0.08,
        sustain: 0.5,
        release: 0.03,
        volume: 0.45,
        bus: 'music'
      });
    }
  }

  playArpTrack(currentChord) {
    // Fast arpeggiated 16th notes running through chord
    const noteIndex = this.step % currentChord.notes.length;
    const noteName = currentChord.notes[noteIndex];
    const freq = this.freqs[noteName];

    if (freq) {
      this.synth.playTone({
        freq,
        type: 'square',
        duration: 0.05,
        attack: 0.003,
        decay: 0.03,
        sustain: 0.2,
        release: 0.015,
        volume: this.currentMode === 'menu' ? 0.16 : 0.22,
        bus: 'music'
      });
    }
  }

  playLeadTrack() {
    // Only play lead during game or selected bars in menu
    if (this.currentMode === 'menu' && this.bar % 2 !== 0) return;

    const noteName = this.generatedLeadPattern[this.step];
    if (noteName && this.freqs[noteName]) {
      this.synth.playTone({
        freq: this.freqs[noteName],
        type: 'sawtooth',
        duration: 0.13,
        attack: 0.008,
        decay: 0.05,
        sustain: 0.4,
        release: 0.04,
        volume: 0.28,
        bus: 'music'
      });
    }
  }

  playDrumTrack() {
    // Step 0, 8: Kick drum (8-bit sine pitch sweep)
    if (this.step === 0 || this.step === 8) {
      this.synth.playTone({
        freq: 140,
        type: 'sine',
        duration: 0.09,
        attack: 0.002,
        decay: 0.06,
        sustain: 0.01,
        release: 0.02,
        volume: 0.55,
        pitchDrop: 110,
        bus: 'music'
      });
    }

    // Step 4, 12: Snare drum (8-bit noise burst)
    if (this.step === 4 || this.step === 12) {
      this.synth.playNoise({
        duration: 0.07,
        volume: 0.35,
        filterFreq: 2400,
        filterType: 'bandpass',
        bus: 'music'
      });
    }

    // Every even step: Closed Hi-Hat (Crisp short noise)
    if (this.step % 2 === 0 && this.step !== 4 && this.step !== 12) {
      this.synth.playNoise({
        duration: 0.025,
        volume: 0.14,
        filterFreq: 6000,
        filterType: 'highpass',
        bus: 'music'
      });
    }
  }
}
