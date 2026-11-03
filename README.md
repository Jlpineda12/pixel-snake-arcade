# 🕹️ Pixel Snake Arcade 1984 — Chiptune Edition

[![GitHub Pages Demo](https://img.shields.io/badge/LIVE%20DEMO-PLAY%20NOW-00f5d4?style=for-the-badge&logo=googlechrome&logoColor=black)](https://jlpineda12.github.io/pixel-snake-arcade/)
[![Web Audio API](https://img.shields.io/badge/Audio-Procedural%20Synthesis-ff0055?style=for-the-badge&logo=soundcharts&logoColor=white)](https://jlpineda12.github.io/pixel-snake-arcade/)
[![Vanilla JS](https://img.shields.io/badge/Zero%20Dependencies-100%25%20Vanilla%20ES6-fee440?style=for-the-badge&logo=javascript&logoColor=black)](https://jlpineda12.github.io/pixel-snake-arcade/)
[![Degree](https://img.shields.io/badge/Ingeniería%20en%20Multimedia-Colombia-blue?style=for-the-badge)](https://github.com/Jlpineda12)

> **Un videojuego arcade retro de Snake inspirado en los gabinetes arcade de 1984, con una banda sonora chiptune de 8-bits generada 100% procedimentalmente en tiempo real usando la Web Audio API (cero archivos de audio externos).**

---

## 🎮 [► Jugar en Vivo en GitHub Pages](https://jlpineda12.github.io/pixel-snake-arcade/)

---

## ⚡ Características Principales

### 1. 🎵 Motor de Audio Procedimental (Web Audio API)
* **Cero archivos MP3/WAV externos:** Toda la música y los efectos de sonido se sintetizan matemáticamente en tiempo real en el navegador mediante osciladores y buffers de ruido.
* **Secuenciador Chiptune de 4 Pistas:**
  1. **Línea de Bajo (Walking Bass):** Onda triangular sincopada en modo menor/dórico.
  2. **Arpegiador de Semicorcheas:** Onda cuadrada con ciclo de trabajo que recorre las notas del acorde.
  3. **Melodía Líder Algorítmica:** Generación procedural de frases y motivos melódicos cada 4 compases.
  4. **Percusión 8-bits:** Bombo por barrido exponencial de frecuencia (*pitch drop*), caja con ruido filtrado paso-banda y charles con ruido paso-alto.
* **Intensidad Dinámica:** El tempo (BPM) y la tensión musical aumentan en tiempo real a medida que la serpiente crece y se acumulan combos.

### 2. 🕹️ Experiencia Arcade 1984 ("Game Juice")
* **Menú Retro Arcade Completo:** Efecto parpadeante *"INSERT COIN / START"*, selector interactivo de paletas, toggle de filtro CRT y tabla de récords.
* **Salón de la Fama (*Hall of Fame*):** Guardado persistente de las mejores puntuaciones con iniciales arcade en `localStorage`.
* **Juice & Sensación de Impacto:**
  * *Screen Shake* dinámico al comer y al chocar.
  * Sistema de partículas de píxeles para explosiones y colisiones.
  * Ojos de la serpiente que siguen la dirección del movimiento.
  * Manzanas Doradas especiales con temporizador de cuenta regresiva y multiplicador de combo.
* **Selector de 4 Paletas de Color Retro:**
  * **Cyber Arcade (Default):** Fondo obsidiana con acentos cyan y magenta neón.
  * **Game Boy DMG:** Cuatro tonos verdes clásicos monocromáticos.
  * **PICO-8 Retro:** Tonos nostálgicos cálidos inspirados en la consola de fantasía.
  * **Synthwave 84:** Púrpura profundo y degradados vaporwave.
* **Filtro CRT Scanlines:** Simulación de tubo de rayos catódicos con líneas de escaneo y viñeta radial.

### 3. 📱 Adaptabilidad Móvil y Teclado
* Controles completos de teclado: `[W, A, S, D]` o `[Flechas]`, `[Enter / Espacio]`, `[P / Esc]`.
* D-Pad y botones arcade virtuales en pantalla para smartphones y tablets.
* Buffer de entrada direccional (*Input Queue*): Evita muertes accidentales por pulsar dos flechas muy rápido antes del siguiente tick de la cuadrícula.

---

## 🏛️ Arquitectura del Proyecto

```
pixel-snake-arcade/
├── index.html              # Estructura del gabinete arcade y canvas nativo 480x480
├── style.css               # Estilos del monitor CRT, scanlines, marquee y controles
├── src/
│   ├── main.js             # Punto de entrada, bucle 60 FPS y mapeo de eventos
│   ├── audio/
│   │   ├── SynthEngine.js     # Núcleo Web Audio: Envolventes ADSR, osciladores y ruido
│   │   ├── SoundEffects.js    # SFX procedimentales: Monedas, pasos, comida, Game Over
│   │   └── ProceduralMusic.js # Secuenciador chiptune dinámico multicanal
│   └── game/
│       ├── Game.js            # Máquina de estados (Menu, Playing, Paused, GameOver, Scores)
│       ├── Snake.js           # Lógica de la cuadrícula, render de píxeles y buffer de inputs
│       ├── Food.js            # Gestión de manzanas clásicas y bonus dorados con temporizador
│       ├── Particles.js       # Sistema de físicas de partículas 2D de píxeles
│       └── Palettes.js        # Diccionario de paletas de color retro intercambiables
```

---

## 🚀 Ejecución en Local

No requiere Node.js, Webpack ni dependencias externas. Puedes abrirlo directamente con cualquier servidor local:

```bash
# Opción con Python
python3 -m http.server 8080

# Opción con Node / npx
npx serve .
```

Abre `http://localhost:8080` en tu navegador y haz clic para iniciar el audio.

---

## 👤 Autor

**Jose Luis Pineda Barrera**
* 🎓 Ingeniería en Multimedia — Universidad Militar Nueva Granada (Colombia)
* 🎮 Enfoque: Videojuegos (Unreal, Unity), Computación Gráfica (Three.js/WebGL), Audio Digital e Inteligencia Artificial Aplicada.
* 🐙 GitHub: [@Jlpineda12](https://github.com/Jlpineda12)
* ✉️ Contacto: [joseluispinead177@gmail.com](mailto:joseluispinead177@gmail.com)

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. ¡Siéntete libre de clonarlo, aprender de él y construir sobre su motor de audio procedimental!
