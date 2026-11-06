<div align="center">

<a href="https://jlpineda12.github.io/pixel-snake-arcade/"><img src="docs/screenshots/attract.gif" alt="PIXEL SNAKE — pantalla de título animada" width="560"></a>

# 🐍 PIXEL SNAKE · 1976

**El clásico de la serpiente con banda sonora chiptune que se compone sola mientras juegas.**

[![Jugar ahora](https://img.shields.io/badge/▶%20JUGAR%20AHORA-00f5d4?style=for-the-badge&labelColor=0d0221)](https://jlpineda12.github.io/pixel-snake-arcade/)
[![Arcade Station](https://img.shields.io/badge/🕹️%20Arcade%20Station-5%20juegos-ff2e88?style=for-the-badge&labelColor=0d0221)](https://jlpineda12.github.io/arcade-station/)

[![Deploy](https://github.com/Jlpineda12/pixel-snake-arcade/actions/workflows/deploy.yml/badge.svg)](https://github.com/Jlpineda12/pixel-snake-arcade/actions/workflows/deploy.yml)
![Tests](https://img.shields.io/badge/tests-41%20passing-39ff14?style=flat-square&labelColor=0d0221)
![Dependencias](https://img.shields.io/badge/dependencias-0-00f5d4?style=flat-square&labelColor=0d0221)
![Audio](https://img.shields.io/badge/audio-Web%20Audio%20API-ff2e88?style=flat-square&labelColor=0d0221)
![License](https://img.shields.io/badge/license-MIT-fda415?style=flat-square&labelColor=0d0221)

</div>

---

## 📺 Así se ve

| Menú animado | Partida |
| :---: | :---: |
| <img src="docs/screenshots/menu.png" width="400" alt="Menú"> | <img src="docs/screenshots/gameplay.gif" width="400" alt="Gameplay"> |
| **Guía de controles** | **En el celular** |
| <img src="docs/screenshots/controls.png" width="400" alt="Controles"> | <img src="docs/screenshots/mobile.png" width="200" alt="Versión móvil"> |

La pantalla CRT flota sobre un escenario *synthwave* animado, con secuencia de arranque tipo BIOS, marquesina de neón y una barra de estado estilo terminal de los 90.

## 🕹️ Controles

| Teclado | Panel táctil (móvil) | Acción |
| :--- | :--- | :--- |
| `← ↑ → ↓ / W A S D` | Joystick | Mover la serpiente |
| `Enter / Space` | START · A | Empezar / confirmar |
| `P / Esc` | B (PAUSE) | Pausa |
| `C` | SELECT | Guía de controles |

> En el celular aparece debajo de la pantalla un joystick y botones táctiles; en escritorio se usa el teclado.

## ✨ Características

- **Música 100% procedural**: bajo, arpegiador, melodía algorítmica y batería de 8 bits sintetizados en tiempo real; el tempo sube a medida que la serpiente crece.
- **Manzana dorada** cada 5 manzanas: +500 puntos con cuenta regresiva.
- **Input buffer**: cola de direcciones que evita muertes injustas por pulsar dos flechas muy rápido.
- **Game juice**: sacudida de pantalla, partículas de píxeles y ojos que siguen la dirección.
- **5 vidas**, récord persistente en `localStorage`.

## 📊 Resultados

| Métrica | Resultado |
| :--- | :--- |
| Pruebas automatizadas (`npm test`) | ✅ **41 / 41** pasan en cada despliegue |
| Archivos de audio / imagen | **0** — todo se genera con código |
| Dependencias de npm | **0** — JavaScript puro (ES modules) |
| Rendimiento | **60 FPS** estables en Canvas 2D |
| Responsivo | Escritorio y móvil (panel táctil) |

## 🏛️ Estructura del proyecto

```
pixel-snake-arcade/
├── index.html                # Página: marquesina, pantalla CRT, panel y barra de estado
├── src/
│   ├── main.js               # Arranque: audio, juego, shell y bucle a 60 FPS
│   ├── game/
│   │   ├── Game.js           # Máquina de estados (menú, partida, pausa, game over)
│   │   ├── MenuFX.js         # Menú animado: fondo temático, título en onda, attract mode
│       ├── Snake.js        # Cuadrícula, movimiento e input buffer
│       ├── Food.js         # Manzanas y bonus dorado temporizado
│       ├── Particles.js    # Partículas de píxeles
│       ├── Palettes.js     # Paleta de colores del juego
│   ├── audio/
│   │   ├── SynthEngine.js    # Osciladores, envolventes y ruido (Web Audio API)
│   │   ├── SoundEffects.js   # Efectos de sonido procedurales
│   │   └── ProceduralMusic.js# Música chiptune generada en tiempo real
│   └── shell/
│       ├── RetroShell.js     # Presentación: arranque BIOS, CRT, panel táctil, terminal
│       └── shell.css         # Sistema visual synthwave / CRT compartido
├── test/qa-runner.js         # Suite de pruebas sin dependencias
├── docs/screenshots/         # Capturas y GIFs de este README
└── .github/workflows/        # Pruebas + despliegue automático a GitHub Pages
```

## 🚀 Ejecutar en local

No necesita instalar nada. Sirve la carpeta con cualquier servidor estático:

```bash
python3 -m http.server 8080
```

y abre `http://localhost:8080`. Para correr las pruebas:

```bash
npm test
```

## 👤 Autor

**Jose Luis Pineda Barrera** · [@Jlpineda12](https://github.com/Jlpineda12) · Ingeniería en Multimedia, Colombia 🇨🇴

Este juego también vive dentro de **[Arcade Station](https://github.com/Jlpineda12/arcade-station)**, el gabinete que reúne los 5 juegos.
