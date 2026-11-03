// Application Entry Point
import { SynthEngine } from './audio/SynthEngine.js';
import { SoundEffects } from './audio/SoundEffects.js';
import { ProceduralMusic } from './audio/ProceduralMusic.js';
import { Game } from './game/Game.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const synth = new SynthEngine();
  const sfx = new SoundEffects(synth);
  const music = new ProceduralMusic(synth);
  const game = new Game(canvas, synth, sfx, music);

  // Audio start trigger on first user interaction
  const startAudio = () => {
    if (!synth.initialized) {
      synth.init();
      music.start('menu');
    } else {
      synth.resume();
    }
  };

  window.addEventListener('click', startAudio, { once: true });
  window.addEventListener('touchstart', startAudio, { once: true });
  window.addEventListener('keydown', startAudio, { once: true });

  // Main 60 FPS animation loop
  function loop(timestamp) {
    game.update(timestamp);
    game.render();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});
