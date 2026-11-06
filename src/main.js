// Application Entry Point for PIXEL SNAKE
import { SynthEngine } from './audio/SynthEngine.js';
import { SoundEffects } from './audio/SoundEffects.js';
import { ProceduralMusic } from './audio/ProceduralMusic.js';
import { Game } from './game/Game.js';
import { RetroShell } from './shell/RetroShell.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const synth = new SynthEngine();
  const sfx = new SoundEffects(synth);
  const music = new ProceduralMusic(synth);
  const game = new Game(canvas, synth, sfx, music);

  // Audio can only start after a user gesture (browser autoplay policy)
  const startAudio = () => {
    if (!synth.initialized) {
      synth.init();
      music.start('menu');
    } else {
      synth.resume();
    }
  };

  // Presentation layer: synthwave room, neon marquee, CRT, boot sequence,
  // touch gamepad on phones and the terminal status bar.
  new RetroShell({
    id: 'snake',
    title: 'PIXEL SNAKE',
    year: '1976',
    accent: '#00f5d4',
    accent2: '#ff2e88',
    joystickColor: '#ff2a44',
    repo: 'https://github.com/Jlpineda12/pixel-snake-arcade',
    buttons: { A: { code: 'Enter', alt: ['Space'], label: 'START' }, B: { code: 'KeyP', alt: ['Escape'], label: 'PAUSE' } },
    ticker: ["COME · CRECE · NO CHOQUES", "MÚSICA CHIPTUNE GENERADA EN TIEMPO REAL", "FRUTA DORADA = +500 PTS", "4 PALETAS RETRO", "VANILLA JS + WEB AUDIO API"],
    onFirstInput: startAudio
  }).init();

  window.addEventListener('click', startAudio, { once: true });
  window.addEventListener('keydown', startAudio, { once: true });

  // Main 60 FPS loop
  function loop(timestamp) {
    game.update(timestamp);
    game.render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
});
