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

  // Audio start trigger (browsers require user interaction)
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

  // Virtual Mobile Arcade Controls
  const btnUp = document.getElementById('btn-up');
  const btnDown = document.getElementById('btn-down');
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const btnA = document.getElementById('btn-a');
  const btnB = document.getElementById('btn-b');

  if (btnUp) {
    btnUp.addEventListener('click', (e) => {
      e.preventDefault();
      startAudio();
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowUp' }));
    });
  }
  if (btnDown) {
    btnDown.addEventListener('click', (e) => {
      e.preventDefault();
      startAudio();
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown' }));
    });
  }
  if (btnLeft) {
    btnLeft.addEventListener('click', (e) => {
      e.preventDefault();
      startAudio();
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowLeft' }));
    });
  }
  if (btnRight) {
    btnRight.addEventListener('click', (e) => {
      e.preventDefault();
      startAudio();
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' }));
    });
  }
  if (btnA) {
    btnA.addEventListener('click', (e) => {
      e.preventDefault();
      startAudio();
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
    });
  }
  if (btnB) {
    btnB.addEventListener('click', (e) => {
      e.preventDefault();
      startAudio();
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }));
    });
  }

  // Main 60 FPS animation loop
  function loop(timestamp) {
    game.update(timestamp);
    game.render();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});
