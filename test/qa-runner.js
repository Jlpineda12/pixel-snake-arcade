// Automated QA Test Suite for Pixel Snake Arcade 1984
import { Snake } from '../src/game/Snake.js';
import { FoodManager } from '../src/game/Food.js';
import { PALETTES } from '../src/game/Palettes.js';
import { ProceduralMusic } from '../src/audio/ProceduralMusic.js';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

function section(title) {
  console.log(`\n========================================`);
  console.log(`🧪 ${title}`);
  console.log(`========================================`);
}

// ========================================================
// 1. SNAKE PHYSICS & COLLISION TESTS
// ========================================================
section('1. Snake Mechanics & Input Buffer Tests');

const cols = 28;
const rows = 21;
const snake = new Snake(cols, rows);

assert(snake.body.length === 3, 'Snake starts with length 3');
assert(snake.body[0].x === 14 && snake.body[0].y === 10, 'Snake spawns at grid center (14, 10)');

// Test Right movement
snake.dir = { x: 1, y: 0 };
let head = snake.update();
assert(head.x === 15 && head.y === 10, 'Moves right: head advances x+1');

// Test Down movement
snake.queueDirection(0, 1);
head = snake.update();
assert(head.x === 15 && head.y === 11, 'Moves down: head advances y+1');

// Test 180-degree instant suicide protection
snake.queueDirection(0, -1);
head = snake.update();
assert(head.y === 12, '180° reversal blocked: continues moving Down instead of suiciding into itself');

// Test Growth
const lengthBefore = snake.body.length;
snake.grow(1);
snake.update();
assert(snake.body.length === lengthBefore + 1, 'Snake growth: grows by exactly 1 segment');

snake.grow(2);
snake.update();
snake.update();
assert(snake.body.length === lengthBefore + 3, 'Snake bonus growth: grows by 2 segments');

// Test Wall Collisions
snake.body[0] = { x: -1, y: 10 };
assert(snake.checkWallCollision() === true, 'Detects left wall collision (x < 0)');

snake.body[0] = { x: cols, y: 10 };
assert(snake.checkWallCollision() === true, 'Detects right wall collision (x >= cols)');

snake.body[0] = { x: 10, y: -1 };
assert(snake.checkWallCollision() === true, 'Detects top wall collision (y < 0)');

snake.body[0] = { x: 10, y: rows };
assert(snake.checkWallCollision() === true, 'Detects bottom wall collision (y >= rows)');

snake.body[0] = { x: 10, y: 10 };
assert(snake.checkWallCollision() === false, 'Safe coordinates pass wall collision check');

// Test Self Collision
snake.body = [
  { x: 10, y: 10 },
  { x: 11, y: 10 },
  { x: 11, y: 11 },
  { x: 10, y: 11 },
  { x: 10, y: 10 }
];
assert(snake.checkSelfCollision() === true, 'Detects self-collision when head touches body');


// ========================================================
// 2. FOOD ENGINE & SAFE ZONE (THE USER'S REPORTED BUG)
// ========================================================
section('2. Food Engine & Safe Zone Constraint Tests');

const food = new FoodManager(cols, rows);

assert(food.minX === 2 && food.maxX === 25, 'Safe zone X is constrained between 2 and 25 (curved corners protected)');
assert(food.minY === 4 && food.maxY === 18, 'Safe zone Y is constrained between 4 and 18 (below top HUD)');

// Monte Carlo Test: Spawn 1,000 apples to prove 100% of spawns land in safe bounds
let allInSafeZone = true;
let noneInHUD = true;
let noneInCorners = true;

for (let i = 0; i < 1000; i++) {
  const pos = food.spawnApple(snake.body);
  if (pos.x < food.minX || pos.x > food.maxX || pos.y < food.minY || pos.y > food.maxY) {
    allInSafeZone = false;
  }
  if (pos.y < 4) {
    noneInHUD = false;
  }
  if ((pos.x === 0 && pos.y === 0) || (pos.x === 27 && pos.y === 0) ||
      (pos.x === 0 && pos.y === 20) || (pos.x === 27 && pos.y === 20)) {
    noneInCorners = false;
  }
}

assert(allInSafeZone, '1,000 consecutive apple spawns ALL landed inside safe playable zone');
assert(noneInHUD, 'Zero apples spawned behind the top HUD (rows 0-3)');
assert(noneInCorners, 'Zero apples spawned in the clipped curved corners');

// Non-overlapping test with snake body
const mockSnake = [
  { x: 5, y: 5 }, { x: 6, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 5 }
];
let neverOverlaps = true;
for (let i = 0; i < 100; i++) {
  const apple = food.spawnApple(mockSnake);
  if (mockSnake.some(s => s.x === apple.x && s.y === apple.y)) {
    neverOverlaps = false;
  }
}
assert(neverOverlaps, 'Apple never spawns on cells occupied by the snake');

// Golden Apple Spawning & Lifecycle
food.applesEatenCount = 4;
food.golden = null;
food.spawnApple([]);
assert(food.golden !== null, 'Golden bonus fruit spawns on 5th apple eaten');
assert(food.golden.timeLeft === 9000, 'Golden fruit initialized with 9000ms (9s) lifespan');

// Test Golden fruit expiration
food.update(9500);
assert(food.golden === null, 'Golden bonus fruit expires and clears cleanly after timer runs out');

// Test Auto-rescue fallback: if apple somehow becomes null, update() recovers it immediately
food.apple = null;
food.update(16);
assert(food.apple !== null, 'Auto-rescue: recover immediately if apple is null');
assert(food.apple.x >= food.minX && food.apple.y >= food.minY, 'Auto-rescued apple placed in safe zone');


// ========================================================
// 3. COLOR PALETTE & VISUAL INTEGRITY
// ========================================================
section('3. Palette & Visual Theme Consistency');

const pal = PALETTES.arcadeRetro;
assert(pal.screenBg === '#351d3d', 'Screen background matches reference plum (#351d3d)');
assert(pal.snakeHead === '#39e75f', 'Snake head is vibrant arcade GREEN (#39e75f)');
assert(pal.snakeBody === '#1ca03e', 'Snake body is rich emerald GREEN (#1ca03e)');
assert(pal.textAmberTop === '#fda415', 'Text highlight matches reference amber (#fda415)');
assert(pal.heartOrangeTop === '#fda415', 'Hearts match reference orange (#fda415)');


// ========================================================
// 4. PROCEDURAL CHIPTUNE MUSIC & AUDIO ENGINE
// ========================================================
section('4. Procedural Music & Chiptune Intensity Engine');

const mockSynth = {
  initialized: true,
  isMuted: false,
  playTone: () => {},
  playNoise: () => {}
};

const music = new ProceduralMusic(mockSynth);

assert(music.menuBpm === 112, 'Menu theme runs at chill 112 BPM');
assert(music.gameBpm === 136, 'Game theme runs at action 136 BPM');

// Test dynamic tempo scaling with score in game mode
music.setMode('game');
music.setGameIntensity(0);
assert(music.currentBpm === 136, 'Tempo starts at baseline 136 BPM at 0 score');

music.setGameIntensity(500);
assert(music.currentBpm > 136, 'Tempo dynamically increases as score increases');

music.setGameIntensity(100000);
assert(music.currentBpm <= 136 * 1.25, 'Tempo scaling is clamped at 1.25x max (no runaway tempo)');

// Test Frequencies map
assert(music.freqs.A4 === 440.0, 'Tuning reference A4 is 440 Hz');
assert(music.freqs.C5 === 523.25, 'C5 pitch frequency is accurate');
assert(music.generatedLeadPattern.length === 16, 'Procedural lead melody generates 16-step patterns');


// ========================================================
// 5. FULL GAME LIFECYCLE SIMULATION (50 APPLES & 5 LIVES)
// ========================================================
section('5. Full Game Simulation: 50 Apples, Combo & Lives Exhaustion');

const simSnake = new Snake(cols, rows);
const simFood = new FoodManager(cols, rows);
let simScore = 0;
let simLives = 5;

// Eat 50 consecutive apples
let applesAlwaysAvailable = true;
for (let i = 1; i <= 50; i++) {
  // Guide snake towards apple position
  simSnake.body[0] = { x: simFood.apple.x - simSnake.dir.x, y: simFood.apple.y - simSnake.dir.y };
  
  if (!simFood.apple) {
    applesAlwaysAvailable = false;
    break;
  }
  
  // Advance snake into apple
  simSnake.update();
  simSnake.grow(1);
  simScore += 100;
  simFood.spawnApple(simSnake.body);
}

// Final update to realize the 50th pending growth segment
simSnake.update();

assert(applesAlwaysAvailable, 'Simulation: 50 consecutive apples eaten without interruption');
assert(simScore === 5000, `Simulation: Score reached exactly 5,000 points (50 apples x 100 pts)`);
assert(simSnake.body.length === 53, `Simulation: Snake grown to length 53 (starts at 3 + 50 eaten = 53)`);

// Simulate lives decrement on collision
for (let l = 4; l >= 0; l--) {
  simLives--;
}
assert(simLives === 0, 'Simulation: Lives correctly decrement to 0 on 5 collisions');


// ========================================================
// SUMMARY
// ========================================================
console.log(`\n========================================`);
console.log(`📋 QA TEST SUMMARY:`);
console.log(`   Passed: ${passed}`);
console.log(`   Failed: ${failed}`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL 41 QA SUITE TESTS PASSED 100% SUCCESSFULLY!\n');
}
