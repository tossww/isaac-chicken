const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants that can be changed by levels
let PIPE_WIDTH = 50;
let PIPE_GAP = 150;
let PIPE_SPEED = 3;
let PIPE_INTERVAL = 1400;
let backgroundColor = '#7ED9EE';
let pipeColor = '#228B22';
let pipeOutlineColor = '#006400';

const GROUND_HEIGHT = 50;
const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;

// Level Configuration
const levels = [
    { scoreToAdvance: 5, pipeSpeed: 3, pipeGap: 150, pipeInterval: 1400, bgColor: '#5EC8E5', pipeColor: '#2ECC40', pipeOutline: '#1A9926', theme: 'Grassy Hills',
      decorations: [
          { type: 'cloud', color: 'white', minSize: 30, maxSize: 70, minY: 50, maxY: 150, count: 6, scrollFactor: 0.5 },
          { type: 'tree', color: '#228B22', minSize: 40, maxSize: 70, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 70, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 40, count: 4, scrollFactor: 0.9 },
          { type: 'sun', color: '#FFD700', size: 50, x: CANVAS_WIDTH - 70, y: 60, scrollFactor: 0 }
      ],
      boss: { name: 'Grassy Hills', color: '#2E7D32', eyeColor: '#1B5E20', size: 50, attackType: 'aimed' } }, // Lvl 1: Easy
    { scoreToAdvance: 10, pipeSpeed: 3.5, pipeGap: 130, pipeInterval: 1300, bgColor: '#87CEEB', pipeColor: '#FF6B35', pipeOutline: '#CC4400', theme: 'Sunny Skies',
      decorations: [
          { type: 'cloud', color: '#FFF5E6', minSize: 40, maxSize: 80, minY: 30, maxY: 120, count: 5, scrollFactor: 0.6 },
          { type: 'sun', color: '#FF8C00', size: 70, x: CANVAS_WIDTH - 90, y: 80, scrollFactor: 0 },
          { type: 'tree', color: '#32CD32', minSize: 35, maxSize: 60, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 60, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 35, count: 3, scrollFactor: 0.8 }
      ],
      boss: { name: 'Sunny Skies', color: '#E65100', eyeColor: '#BF360C', size: 50, attackType: 'spread' } }, // Lvl 2: Medium
    { scoreToAdvance: 15, pipeSpeed: 4, pipeGap: 110, pipeInterval: 1200, bgColor: '#B0C4DE', pipeColor: '#6A5ACD', pipeOutline: '#483D8B', theme: 'Cloudy Heights',
      decorations: [
          { type: 'cloud', color: '#D8BFD8', minSize: 50, maxSize: 100, minY: 20, maxY: 100, count: 7, scrollFactor: 0.7 },
          { type: 'cloud', color: '#E6E6FA', minSize: 30, maxSize: 60, minY: 80, maxY: 180, count: 4, scrollFactor: 0.4 },
          { type: 'star', color: '#DDA0DD', minSize: 3, maxSize: 6, minY: 10, maxY: 80, count: 15, scrollFactor: 0.1 }
      ],
      boss: { name: 'Cloudy Heights', color: '#4A148C', eyeColor: '#311B92', size: 55, attackType: 'lightning' } }, // Lvl 3: Hard
    { scoreToAdvance: 20, pipeSpeed: 3, pipeGap: 160, pipeInterval: 1500, bgColor: '#FFECD2', pipeColor: '#E8A838', pipeOutline: '#B8860B', theme: 'Desert Oasis',
      decorations: [
          { type: 'cactus', color: '#3CB371', minSize: 30, maxSize: 60, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 60, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 30, count: 5, scrollFactor: 1 },
          { type: 'pyramid', color: '#DAA520', size: 80, x: CANVAS_WIDTH - 150, y: CANVAS_HEIGHT - GROUND_HEIGHT - 80, scrollFactor: 0.2 },
          { type: 'sun', color: '#FF4500', size: 55, x: CANVAS_WIDTH - 80, y: 60, scrollFactor: 0 },
          { type: 'rock', color: '#D2B48C', minSize: 15, maxSize: 35, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 35, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 15, count: 4, scrollFactor: 1 }
      ],
      boss: { name: 'Desert Oasis', color: '#BF360C', eyeColor: '#8D6E63', size: 55, attackType: 'bounce' } }, // Lvl 4: Breather (Easier)
    { scoreToAdvance: 25, pipeSpeed: 4.5, pipeGap: 120, pipeInterval: 1100, bgColor: '#FF6347', pipeColor: '#FF4500', pipeOutline: '#8B0000', theme: 'Volcanic Peaks',
      decorations: [
          { type: 'volcano', color: '#B22222', minSize: 50, maxSize: 90, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 90, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 50, count: 4, scrollFactor: 1 },
          { type: 'lava', color: '#FF4500', minSize: 4, maxSize: 8, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 90, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 50, count: 12, scrollFactor: 1 },
          { type: 'smoke', color: 'rgba(80, 80, 80, 0.6)', minSize: 20, maxSize: 50, minY: 20, maxY: 100, count: 5, scrollFactor: 0.8 },
          { type: 'rock', color: '#4A0000', minSize: 15, maxSize: 40, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 40, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 15, count: 6, scrollFactor: 1 },
          { type: 'star', color: '#FF8C00', minSize: 2, maxSize: 4, minY: 10, maxY: 60, count: 8, scrollFactor: 0.1 }
      ],
      boss: { name: 'Volcanic Peaks', color: '#1A0033', eyeColor: '#FF5722', size: 60, attackType: 'rain' } }, // Lvl 5: Harder
    { scoreToAdvance: 30, pipeSpeed: 5, pipeGap: 110, pipeInterval: 1000, bgColor: '#E25555', pipeColor: '#DC143C', pipeOutline: '#800020', theme: 'Crimson Canyons',
      decorations: [
          { type: 'rock', color: '#A0522D', minSize: 20, maxSize: 50, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 50, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 20, count: 6, scrollFactor: 1 },
          { type: 'rock', color: '#8B0000', minSize: 30, maxSize: 70, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 70, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 30, count: 3, scrollFactor: 0.6 },
          { type: 'smoke', color: 'rgba(60, 0, 0, 0.4)', minSize: 25, maxSize: 55, minY: 30, maxY: 120, count: 4, scrollFactor: 0.5 },
          { type: 'cactus', color: '#800000', minSize: 20, maxSize: 45, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 45, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 20, count: 3, scrollFactor: 1 }
      ],
      boss: { name: 'Crimson Canyons', color: '#0D0D2B', eyeColor: '#F50057', size: 60, attackType: 'burst' } }, // Lvl 6: Very Hard
    { scoreToAdvance: 35, pipeSpeed: 4, pipeGap: 150, pipeInterval: 1400, bgColor: '#1E90FF', pipeColor: '#00CED1', pipeOutline: '#008B8B', theme: 'Ocean Depths',
      decorations: [
          { type: 'fish', color: '#FF69B4', minSize: 10, maxSize: 25, minY: CANVAS_HEIGHT / 3, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 30, count: 5, scrollFactor: 0.9 },
          { type: 'fish', color: '#00FF7F', minSize: 8, maxSize: 20, minY: CANVAS_HEIGHT / 2, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 40, count: 4, scrollFactor: 0.7 },
          { type: 'coral', color: '#FF6347', minSize: 20, maxSize: 40, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 40, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 20, count: 4, scrollFactor: 1 },
          { type: 'coral', color: '#FFD700', minSize: 15, maxSize: 30, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 30, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 15, count: 3, scrollFactor: 1 }
      ],
      boss: { name: 'Ocean Depths', color: '#1A0033', eyeColor: '#00B0FF', size: 55, attackType: 'wave' } }, // Lvl 7: Breather
    { scoreToAdvance: 40, pipeSpeed: 5.5, pipeGap: 110, pipeInterval: 950, bgColor: '#B0D4F1', pipeColor: '#4169E1', pipeOutline: '#191970', theme: 'Winter Wonderland',
      decorations: [
          { type: 'snowflake', color: 'white', minSize: 5, maxSize: 15, minY: 0, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 20, count: 15, scrollFactor: 0.5 },
          { type: 'snowflake', color: '#ADD8E6', minSize: 3, maxSize: 10, minY: 0, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 20, count: 10, scrollFactor: 0.3 },
          { type: 'tree', color: '#228B22', minSize: 50, maxSize: 80, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 80, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 50, count: 4, scrollFactor: 0.8 },
          { type: 'cloud', color: '#E0E8F0', minSize: 40, maxSize: 80, minY: 20, maxY: 90, count: 3, scrollFactor: 0.4 }
      ],
      boss: { name: 'Winter Wonderland', color: '#1A237E', eyeColor: '#448AFF', size: 60, attackType: 'spiral' } }, // Lvl 8: Intense
    { scoreToAdvance: 45, pipeSpeed: 6, pipeGap: 100, pipeInterval: 900, bgColor: '#2C2C54', pipeColor: '#474787', pipeOutline: '#1B1B3A', theme: 'Shadow Realm',
      decorations: [
          { type: 'ghost', color: 'rgba(255,255,255,0.3)', minSize: 20, maxSize: 40, minY: 50, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 50, count: 6, scrollFactor: 0.7 },
          { type: 'ghost', color: 'rgba(150,100,255,0.25)', minSize: 15, maxSize: 30, minY: 80, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 80, count: 3, scrollFactor: 0.5 },
          { type: 'star', color: '#7B68EE', minSize: 2, maxSize: 5, minY: 0, maxY: CANVAS_HEIGHT / 2, count: 20, scrollFactor: 0.1 },
          { type: 'smoke', color: 'rgba(100, 50, 150, 0.4)', minSize: 30, maxSize: 60, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 100, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 40, count: 4, scrollFactor: 0.6 }
      ],
      boss: { name: 'Shadow Realm', color: '#8E24AA', eyeColor: '#B388FF', size: 65, attackType: 'homing' } }, // Lvl 9: Very Intense
    { scoreToAdvance: 50, pipeSpeed: 6.5, pipeGap: 90, pipeInterval: 850, bgColor: '#0D0D2B', pipeColor: '#9B59B6', pipeOutline: '#6C3483', theme: 'Cosmic Void',
      decorations: [
          { type: 'star', color: '#FFFFFF', minSize: 1, maxSize: 4, minY: 0, maxY: CANVAS_HEIGHT / 2, count: 60, scrollFactor: 0.05 },
          { type: 'star', color: '#FFD700', minSize: 2, maxSize: 6, minY: 0, maxY: CANVAS_HEIGHT / 3, count: 15, scrollFactor: 0.15 },
          { type: 'planet', color: '#E74C3C', minSize: 40, maxSize: 80, minY: 40, maxY: 140, count: 2, scrollFactor: 0.2 },
          { type: 'planet', color: '#3498DB', minSize: 30, maxSize: 60, minY: 60, maxY: 160, count: 1, scrollFactor: 0.15 }
      ],
      boss: { name: 'Cosmic Void', color: '#C62828', eyeColor: '#EA80FC', size: 70, attackType: 'chaos' } }, // Lvl 10: Hard
    // --- LEVELS 11-20 ---
    { scoreToAdvance: 10, pipeSpeed: 3.5, pipeGap: 160, pipeInterval: 1500, bgColor: '#E8F5E9', pipeColor: '#66BB6A', pipeOutline: '#388E3C', theme: 'Crystal Caves',
      decorations: [
          { type: 'rock', color: '#80CBC4', minSize: 20, maxSize: 50, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 50, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 20, count: 5, scrollFactor: 0.8 },
          { type: 'star', color: '#B2EBF2', minSize: 3, maxSize: 8, minY: 20, maxY: CANVAS_HEIGHT / 2, count: 20, scrollFactor: 0.2 },
          { type: 'rock', color: '#4DB6AC', minSize: 30, maxSize: 60, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 60, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 30, count: 3, scrollFactor: 0.5 }
      ],
      boss: { name: 'Crystal Guardian', color: '#00897B', eyeColor: '#E0F7FA', size: 55, attackType: 'bounce' } }, // Lvl 11: Breather
    { scoreToAdvance: 20, pipeSpeed: 4.5, pipeGap: 120, pipeInterval: 1100, bgColor: '#1A1A2E', pipeColor: '#E94560', pipeOutline: '#0F3460', theme: 'Neon City',
      decorations: [
          { type: 'rock', color: '#E94560', minSize: 10, maxSize: 30, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 30, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 10, count: 5, scrollFactor: 1 },
          { type: 'star', color: '#16C79A', minSize: 2, maxSize: 5, minY: 10, maxY: 60, count: 12, scrollFactor: 0.1 },
          { type: 'star', color: '#E94560', minSize: 1, maxSize: 3, minY: 0, maxY: CANVAS_HEIGHT / 2, count: 25, scrollFactor: 0.15 }
      ],
      boss: { name: 'Neon Overlord', color: '#E94560', eyeColor: '#16C79A', size: 60, attackType: 'spread' } }, // Lvl 12: Medium
    { scoreToAdvance: 30, pipeSpeed: 5.5, pipeGap: 100, pipeInterval: 950, bgColor: '#1B4332', pipeColor: '#2D6A4F', pipeOutline: '#081C15', theme: 'Enchanted Forest',
      decorations: [
          { type: 'tree', color: '#40916C', minSize: 50, maxSize: 90, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 90, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 50, count: 5, scrollFactor: 0.9 },
          { type: 'tree', color: '#52B788', minSize: 30, maxSize: 60, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 60, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 30, count: 3, scrollFactor: 0.6 },
          { type: 'ghost', color: 'rgba(180,255,180,0.2)', minSize: 15, maxSize: 30, minY: 50, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 60, count: 4, scrollFactor: 0.4 },
          { type: 'star', color: '#B7E4C7', minSize: 2, maxSize: 5, minY: 10, maxY: 80, count: 10, scrollFactor: 0.1 }
      ],
      boss: { name: 'Forest Wraith', color: '#C62828', eyeColor: '#95D5B2', size: 60, attackType: 'homing' } }, // Lvl 13: Hard
    { scoreToAdvance: 15, pipeSpeed: 3, pipeGap: 150, pipeInterval: 1400, bgColor: '#CAF0F8', pipeColor: '#90E0EF', pipeOutline: '#0077B6', theme: 'Frozen Lake',
      decorations: [
          { type: 'snowflake', color: 'white', minSize: 5, maxSize: 12, minY: 0, maxY: CANVAS_HEIGHT - GROUND_HEIGHT, count: 12, scrollFactor: 0.4 },
          { type: 'cloud', color: '#E0F7FA', minSize: 40, maxSize: 70, minY: 20, maxY: 80, count: 4, scrollFactor: 0.3 },
          { type: 'rock', color: '#ADE8F4', minSize: 15, maxSize: 35, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 35, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 15, count: 5, scrollFactor: 1 }
      ],
      boss: { name: 'Frost Giant', color: '#0077B6', eyeColor: '#CAF0F8', size: 55, attackType: 'aimed' } }, // Lvl 14: Breather
    { scoreToAdvance: 35, pipeSpeed: 5.5, pipeGap: 105, pipeInterval: 900, bgColor: '#3D0000', pipeColor: '#D32F2F', pipeOutline: '#1A0000', theme: 'Magma Core',
      decorations: [
          { type: 'volcano', color: '#B71C1C', minSize: 50, maxSize: 80, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 80, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 50, count: 3, scrollFactor: 0.8 },
          { type: 'lava', color: '#FF6F00', minSize: 4, maxSize: 9, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 80, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 40, count: 15, scrollFactor: 1 },
          { type: 'smoke', color: 'rgba(50, 0, 0, 0.5)', minSize: 25, maxSize: 60, minY: 20, maxY: 120, count: 5, scrollFactor: 0.6 },
          { type: 'rock', color: '#4E342E', minSize: 15, maxSize: 40, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 40, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 15, count: 4, scrollFactor: 1 }
      ],
      boss: { name: 'Magma Lord', color: '#FFD600', eyeColor: '#FF6F00', size: 65, attackType: 'rain' } }, // Lvl 15: Very Hard
    { scoreToAdvance: 20, pipeSpeed: 4, pipeGap: 140, pipeInterval: 1200, bgColor: '#0A0A23', pipeColor: '#00FF41', pipeOutline: '#003B00', theme: 'Cyber Grid',
      decorations: [
          { type: 'star', color: '#00FF41', minSize: 1, maxSize: 3, minY: 0, maxY: CANVAS_HEIGHT / 2, count: 30, scrollFactor: 0.1 },
          { type: 'rock', color: '#00FF41', minSize: 5, maxSize: 15, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 15, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 5, count: 8, scrollFactor: 1.2 },
          { type: 'star', color: '#39FF14', minSize: 2, maxSize: 4, minY: CANVAS_HEIGHT / 3, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 30, count: 10, scrollFactor: 0.3 }
      ],
      boss: { name: 'Cyber Sentinel', color: '#00E676', eyeColor: '#00FF41', size: 55, attackType: 'lightning' } }, // Lvl 16: Medium
    { scoreToAdvance: 40, pipeSpeed: 5, pipeGap: 110, pipeInterval: 950, bgColor: '#4A235A', pipeColor: '#7D3C98', pipeOutline: '#2C003E', theme: 'Toxic Swamp',
      decorations: [
          { type: 'coral', color: '#7D3C98', minSize: 20, maxSize: 45, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 45, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 20, count: 5, scrollFactor: 1 },
          { type: 'smoke', color: 'rgba(125, 60, 152, 0.3)', minSize: 30, maxSize: 60, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 100, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 40, count: 4, scrollFactor: 0.5 },
          { type: 'fish', color: '#A569BD', minSize: 8, maxSize: 18, minY: CANVAS_HEIGHT / 2, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 30, count: 4, scrollFactor: 0.7 },
          { type: 'lava', color: '#8E44AD', minSize: 3, maxSize: 7, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 60, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 30, count: 8, scrollFactor: 0.8 }
      ],
      boss: { name: 'Swamp Horror', color: '#FFD600', eyeColor: '#D2B4DE', size: 65, attackType: 'wave' } }, // Lvl 17: Hard
    { scoreToAdvance: 15, pipeSpeed: 3.5, pipeGap: 145, pipeInterval: 1350, bgColor: '#0C0C3A', pipeColor: '#FFD700', pipeOutline: '#B8860B', theme: 'Starfall Galaxy',
      decorations: [
          { type: 'star', color: '#FFFFFF', minSize: 1, maxSize: 4, minY: 0, maxY: CANVAS_HEIGHT / 2, count: 50, scrollFactor: 0.05 },
          { type: 'planet', color: '#FF6B6B', minSize: 30, maxSize: 60, minY: 40, maxY: 130, count: 2, scrollFactor: 0.15 },
          { type: 'planet', color: '#48BFE3', minSize: 25, maxSize: 50, minY: 60, maxY: 150, count: 1, scrollFactor: 0.1 },
          { type: 'star', color: '#FFD700', minSize: 3, maxSize: 7, minY: 0, maxY: CANVAS_HEIGHT / 3, count: 12, scrollFactor: 0.2 }
      ],
      boss: { name: 'Star Keeper', color: '#1A237E', eyeColor: '#FFD700', size: 55, attackType: 'spread' } }, // Lvl 18: Breather
    { scoreToAdvance: 50, pipeSpeed: 6, pipeGap: 95, pipeInterval: 850, bgColor: '#1A0000', pipeColor: '#C62828', pipeOutline: '#4A0000', theme: 'Blood Moon',
      decorations: [
          { type: 'ghost', color: 'rgba(200,0,0,0.25)', minSize: 20, maxSize: 40, minY: 50, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 50, count: 5, scrollFactor: 0.6 },
          { type: 'smoke', color: 'rgba(100, 0, 0, 0.4)', minSize: 25, maxSize: 55, minY: 30, maxY: 120, count: 5, scrollFactor: 0.5 },
          { type: 'rock', color: '#4A0000', minSize: 20, maxSize: 50, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 50, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 20, count: 5, scrollFactor: 1 },
          { type: 'star', color: '#FF1744', minSize: 2, maxSize: 5, minY: 0, maxY: CANVAS_HEIGHT / 3, count: 15, scrollFactor: 0.1 }
      ],
      boss: { name: 'Blood Moon Titan', color: '#E0E0E0', eyeColor: '#FF1744', size: 70, attackType: 'burst' } }, // Lvl 19: Very Intense
    { scoreToAdvance: Infinity, pipeSpeed: 7, pipeGap: 85, pipeInterval: 800, bgColor: '#000000', pipeColor: '#FFFFFF', pipeOutline: '#666666', theme: 'The Void',
      decorations: [
          { type: 'star', color: 'rgba(255,255,255,0.5)', minSize: 1, maxSize: 3, minY: 0, maxY: CANVAS_HEIGHT, count: 40, scrollFactor: 0.03 },
          { type: 'ghost', color: 'rgba(255,255,255,0.1)', minSize: 25, maxSize: 50, minY: 30, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 50, count: 4, scrollFactor: 0.4 },
          { type: 'smoke', color: 'rgba(255,255,255,0.08)', minSize: 40, maxSize: 80, minY: 20, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 40, count: 3, scrollFactor: 0.2 }
      ],
      boss: { name: 'The Void King', color: '#B0BEC5', eyeColor: '#FFFFFF', size: 75, attackType: 'chaos' } }, // Lvl 20: Final Boss (Endless)
];

// Game states
const GAME_STATE = {
    START_SCREEN: 'START_SCREEN',
    MAP_SCREEN: 'MAP_SCREEN',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER',
    LEVEL_COMPLETE: 'LEVEL_COMPLETE'
};
let gameState = GAME_STATE.START_SCREEN;

// Map screen keyboard navigation
let selectedLevel = 0;
const MAP_COLUMNS = 5;

// Game variables
let score = 0;
let levelScore = 0; // Score within the current level
let currentLevel = 0;
let pipes = [];
let activeDecorations = []; // Array to hold active decoration objects
let lastPipeTime = 0;
let levelTransitionTimer = 0;
let boss = null; // { x, y, size, name, color, eyeColor, velocityY, active, appearScore, time, warningTimer, targetX }
let bossProjectiles = []; // Array of boss projectiles { x, y, vx, vy, size }
let bossShootTimer = 0; // Timer for boss shooting interval
let bossFightTimer = 0; // Frames remaining to survive
let bossFightDuration = 0; // Total frames for the fight (used for progress bar)
let bossDefeated = false; // True when boss is dying
let bossDefeatTimer = 0; // Frames of defeat animation
let bossBeams = []; // Full-screen laser beams { y, phase, timer, color }
let bossBeamTimer = 0; // Timer to spawn next beam attack

// Player (Chicken) object
const player = {
    x: 50,
    y: CANVAS_HEIGHT / 2,
    width: 30,
    height: 30,
    color: '#FFD700',
    velocityY: 0,
    gravity: 0.5,
    lift: -8,
    onGround: false,
    onPipe: false,
};

function loadLevel(levelIndex) {
    if (levelIndex >= levels.length) {
        endGame(true); // Win the game
        return;
    }

    const level = levels[levelIndex];
    PIPE_SPEED = level.pipeSpeed;
    PIPE_GAP = level.pipeGap;
    PIPE_INTERVAL = level.pipeInterval;
    backgroundColor = level.bgColor;
    pipeColor = level.pipeColor;
    pipeOutlineColor = level.pipeOutline;

    currentLevel = levelIndex;
    levelScore = 0;
    pipes = [];
    bossProjectiles = [];
    bossShootTimer = 0;
    bossFightTimer = 0;
    bossFightDuration = 0;
    bossDefeated = false;
    bossDefeatTimer = 0;
    bossBeams = [];
    bossBeamTimer = 0;
    activeDecorations = []; // Clear decorations from previous level
    player.y = CANVAS_HEIGHT / 2;
    player.velocityY = 0;
    
    // Initialize boss for this level
    const bossConfig = level.boss;
    const appearScore = level.scoreToAdvance === Infinity ? 5 : Math.floor(level.scoreToAdvance * 0.75);
    boss = {
        x: CANVAS_WIDTH + 100,
        y: (CANVAS_HEIGHT - GROUND_HEIGHT) / 2,
        size: bossConfig.size,
        name: bossConfig.name,
        color: bossConfig.color,
        eyeColor: bossConfig.eyeColor,
        attackType: bossConfig.attackType,
        active: false,
        appearScore: appearScore,
        time: 0,
        warningTimer: 0,
        spiralAngle: 0,
        targetX: CANVAS_WIDTH - 120
    };

    // Generate initial decorations for the new level
    if (level.decorations) {
        for (const decoConfig of level.decorations) {
            for (let i = 0; i < decoConfig.count; i++) {
                // Initial placement across the screen
                activeDecorations.push(createDecoration(decoConfig, i * (CANVAS_WIDTH / decoConfig.count)));
            }
        }
    }

    gameState = GAME_STATE.LEVEL_COMPLETE; // Indicate level complete for brief display
    levelTransitionTimer = 120; // 2 seconds at 60fps
}

function createDecoration(config, initialX) {
    let size = Math.random() * (config.maxSize - config.minSize) + config.minSize;
    let y = Math.random() * (config.maxY - config.minY) + config.minY;
    let x = initialX !== undefined ? initialX : CANVAS_WIDTH + Math.random() * CANVAS_WIDTH; // Start off-screen or at initialX

    // Specific adjustments for decoration types
    switch (config.type) {
        case 'volcano':
            size = Math.random() * (config.maxSize - config.minSize) + config.minSize;
            y = CANVAS_HEIGHT - GROUND_HEIGHT - size; // Place on ground
            break;
        case 'cactus':
            size = Math.random() * (config.maxSize - config.minSize) + config.minSize;
            y = CANVAS_HEIGHT - GROUND_HEIGHT - size; // Place on ground
            break;
        case 'pyramid':
            size = config.size;
            y = CANVAS_HEIGHT - GROUND_HEIGHT - size;
            break;
        case 'fish':
            size = Math.random() * (config.maxSize - config.minSize) + config.minSize;
            y = Math.random() * (config.maxY - config.minY) + config.minY;
            break;
        case 'coral':
            size = Math.random() * (config.maxSize - config.minSize) + config.minSize;
            y = CANVAS_HEIGHT - GROUND_HEIGHT - size;
            break;
        case 'snowflake':
            size = Math.random() * (config.maxSize - config.minSize) + config.minSize;
            y = Math.random() * (config.maxY - config.minY) + config.minY;
            break;
        case 'tree':
            size = Math.random() * (config.maxSize - config.minSize) + config.minSize;
            y = CANVAS_HEIGHT - GROUND_HEIGHT - size;
            break;
        case 'ghost':
            size = Math.random() * (config.maxSize - config.minSize) + config.minSize;
            y = Math.random() * (config.maxY - config.minY) + config.minY;
            break;
        case 'lava':
            size = Math.random() * (config.maxSize - config.minSize) + config.minSize;
            y = config.minY;
            break;
        case 'star':
            size = Math.random() * (config.maxSize - config.minSize) + config.minSize;
            y = Math.random() * (config.maxY - config.minY) + config.minY;
            break;
        case 'planet':
            size = Math.random() * (config.maxSize - config.minSize) + config.minSize;
            y = Math.random() * (config.maxY - config.minY) + config.minY;
            break;
    }

    const deco = {
        type: config.type,
        color: config.color,
        x: x,
        y: y,
        size: size,
        scrollFactor: config.scrollFactor,
        config: config
    };

    // Lava particles get extra animation properties
    if (config.type === 'lava') {
        deco.life = Math.floor(Math.random() * 60); // Stagger start so they don't all sync
        deco.maxLife = 80 + Math.floor(Math.random() * 40);
        deco.velocityY = -(1.5 + Math.random() * 2);
        deco.velocityX = (Math.random() - 0.5) * 1.5;
        deco.originY = y;
    }

    return deco;
}


function initGame() {
    gameState = GAME_STATE.START_SCREEN;
    gameLoop(); // Start the game loop immediately
}

function startGame(levelIndex = 0) { // Can now specify starting level
    score = 0;
    loadLevel(levelIndex);
    lastPipeTime = Date.now();
    gameState = GAME_STATE.PLAYING;
}

function generatePipe() {
    const minHeight = 50;
    const maxHeight = CANVAS_HEIGHT - PIPE_GAP - minHeight - GROUND_HEIGHT;
    const topPipeHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
    const bottomPipeHeight = CANVAS_HEIGHT - topPipeHeight - PIPE_GAP - GROUND_HEIGHT;

    pipes.push({ x: CANVAS_WIDTH, y: 0, width: PIPE_WIDTH, height: topPipeHeight, passed: false });
    pipes.push({ x: CANVAS_WIDTH, y: topPipeHeight + PIPE_GAP, width: PIPE_WIDTH, height: bottomPipeHeight, passed: false });
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop); // Always request frame, state machine handles pausing
}

function update() {
    switch (gameState) {
        case GAME_STATE.PLAYING:
            player.velocityY += player.gravity;
            player.y += player.velocityY;

            if (player.y < 0) {
                player.y = 0;
                player.velocityY = 0;
            }

            if (player.y + player.height > CANVAS_HEIGHT - GROUND_HEIGHT) {
                player.y = CANVAS_HEIGHT - GROUND_HEIGHT - player.height;
                player.velocityY = 0;
                player.onGround = true;
            } else {
                player.onGround = false;
            }

            const currentTime = Date.now();
            if (currentTime - lastPipeTime > PIPE_INTERVAL) {
                generatePipe();
                lastPipeTime = currentTime;
            }

            player.onPipe = false;
            let collisionWithPipeSide = false;

            for (let i = pipes.length - 1; i >= 0; i--) {
                const pipe = pipes[i];
                pipe.x -= PIPE_SPEED;

                if (pipe.x + pipe.width < player.x && !pipe.passed) {
                    if (pipe.y === 0) {
                        score++;
                        levelScore++;
                    }
                    pipe.passed = true;
                }

                const playerRight = player.x + player.width;
                const playerBottom = player.y + player.height;
                const pipeRight = pipe.x + pipe.width;
                const pipeBottom = pipe.y + pipe.height;

                if (playerRight > pipe.x && player.x < pipeRight && playerBottom > pipe.y && player.y < pipeBottom) {
                    const onTopSurfaceOfBottomPipe = (pipe.y !== 0 && playerBottom > pipe.y && player.y < pipe.y + 10 && player.velocityY >= 0);
                    const onBottomSurfaceOfTopPipe = (pipe.y === 0 && player.y < pipeBottom && playerBottom > pipeBottom - 10 && player.velocityY <= 0);

                    if (onTopSurfaceOfBottomPipe) {
                        player.y = pipe.y - player.height;
                        player.velocityY = 0;
                        player.onPipe = true;
                    } else if (onBottomSurfaceOfTopPipe) {
                        player.y = pipeBottom;
                        player.velocityY = 0;
                        player.onPipe = true;
                    } else {
                        collisionWithPipeSide = true;
                    }
                }
                
                if (pipe.x + PIPE_WIDTH < 0) {
                    pipes.splice(i, 1);
                }
            }

            if (collisionWithPipeSide && !player.onPipe) {
                endGame();
            }

            // Update decorations
            for (let i = activeDecorations.length - 1; i >= 0; i--) {
                const deco = activeDecorations[i];
                deco.x -= PIPE_SPEED * deco.scrollFactor;

                // Animate lava particles
                if (deco.type === 'lava') {
                    deco.life++;
                    deco.y += deco.velocityY;
                    deco.x += deco.velocityX;
                    // Reset when life expires
                    if (deco.life >= deco.maxLife) {
                        deco.life = 0;
                        deco.y = deco.originY;
                        deco.velocityY = -(1.5 + Math.random() * 2);
                        deco.velocityX = (Math.random() - 0.5) * 1.5;
                        deco.maxLife = 80 + Math.floor(Math.random() * 40);
                    }
                }

                // If decoration goes off-screen, respawn it on the right
                if (deco.x + deco.size < 0) {
                    activeDecorations.splice(i, 1);
                    activeDecorations.push(createDecoration(deco.config, CANVAS_WIDTH + Math.random() * CANVAS_WIDTH));
                }
            }

            // Update boss
            if (boss) {
                if (!boss.active && levelScore >= boss.appearScore) {
                    boss.active = true;
                    boss.warningTimer = 120;
                    pipes = [];
                    // Set survival duration: 10 seconds (600 frames) for lvl 1, scaling up to ~20s for lvl 10
                    bossFightDuration = 1800; // 30 seconds at 60fps
                    bossFightTimer = bossFightDuration;
                    bossDefeated = false;
                    bossDefeatTimer = 0;
                }

                // Boss defeat animation
                if (bossDefeated) {
                    bossDefeatTimer++;
                    boss.y -= 4;
                    boss.x += Math.sin(bossDefeatTimer * 0.5) * 5;
                    boss.time += 0.2;
                    if (bossDefeatTimer >= 90) {
                        bossProjectiles = [];
                        bossBeams = [];
                        if (currentLevel < levels.length - 1) {
                            loadLevel(currentLevel + 1);
                        } else {
                            endGame(true);
                        }
                    }
                } else if (boss.active) {
                    // Stop spawning new pipes during boss fight
                    lastPipeTime = Date.now();

                    // Slide in from the right
                    if (boss.x > boss.targetX) {
                        boss.x -= 2;
                        if (boss.x < boss.targetX) boss.x = boss.targetX;
                    }
                    // Bob up and down
                    boss.time += 0.03;
                    const centerY = (CANVAS_HEIGHT - GROUND_HEIGHT) / 2;
                    boss.y = centerY + Math.sin(boss.time) * 80;
                    // Decrease warning timer
                    if (boss.warningTimer > 0) boss.warningTimer--;

                    // Survival timer countdown
                    if (boss.x <= boss.targetX) { // Only count down after boss finishes sliding in
                        bossFightTimer--;
                        if (bossFightTimer <= 0) {
                            // Boss defeated!
                            bossDefeated = true;
                            bossDefeatTimer = 0;
                            bossProjectiles = [];
                            bossBeams = [];
                        }

                        // Spawn full-screen beam attacks periodically (only one at a time)
                        bossBeamTimer++;
                        const beamInterval = Math.max(120, 360 - currentLevel * 25); // Lvl1: ~6s, Lvl10: ~2s
                        if (bossBeamTimer >= beamInterval && bossBeams.length === 0) {
                            bossBeamTimer = 0;
                            // Target the player's current Y, clamped to playable area
                            const targetY = Math.max(30, Math.min(player.y + player.height / 2, CANVAS_HEIGHT - GROUND_HEIGHT - 30));
                            bossBeams.push({
                                y: targetY,
                                phase: 'anticipation',
                                timer: 0,
                                anticipationDuration: Math.max(60, 120 - currentLevel * 4), // Lvl1: ~2s warning, Lvl10: ~1.3s
                                fireDuration: 30 + currentLevel * 4, // Lvl1: 0.57s, Lvl10: 1.17s
                                beamHeight: 28 + currentLevel * 4, // Lvl1: 28px, Lvl10: 64px
                                color: boss.color
                            });
                        }
                    }

                    // Update beams
                    for (let i = bossBeams.length - 1; i >= 0; i--) {
                        const beam = bossBeams[i];
                        beam.timer++;
                        if (beam.phase === 'anticipation' && beam.timer >= beam.anticipationDuration) {
                            beam.phase = 'firing';
                            beam.timer = 0;
                        } else if (beam.phase === 'firing' && beam.timer >= beam.fireDuration) {
                            bossBeams.splice(i, 1);
                            continue;
                        }
                        // Beam collision — only during firing phase
                        if (beam.phase === 'firing') {
                            const playerCY = player.y + player.height / 2;
                            if (Math.abs(playerCY - beam.y) < beam.beamHeight / 2 + player.height / 2) {
                                endGame();
                            }
                        }
                    }

                    // Collision detection
                    const hitSize = boss.size * 0.8;
                    const playerCenterX = player.x + player.width / 2;
                    const playerCenterY = player.y + player.height / 2;
                    const dx = Math.abs(playerCenterX - boss.x);
                    const dy = Math.abs(playerCenterY - boss.y);
                    if (dx < hitSize + player.width / 2 && dy < hitSize + player.height / 2) {
                        endGame();
                    }

                    // Boss attack - unique per boss type
                    // Difficulty scaling: lvl 0 = 1.0x, lvl 9 = 1.45x
                    const diff = 1 + currentLevel * 0.05; // speed multiplier (gentle)
                    bossShootTimer++;
                    const aimDx = playerCenterX - boss.x;
                    const aimDy = playerCenterY - boss.y;
                    const aimDist = Math.sqrt(aimDx * aimDx + aimDy * aimDy);

                    switch (boss.attackType) {
                        case 'aimed': { // Lvl 1 - Simple aimed shots
                            if (bossShootTimer >= 150) {
                                bossShootTimer = 0;
                                const spd = 3.5 * diff;
                                bossProjectiles.push({ x: boss.x, y: boss.y, vx: (aimDx / aimDist) * spd, vy: (aimDy / aimDist) * spd, size: 8, type: 'normal', color: '#66BB6A' });
                            }
                            break;
                        }
                        case 'spread': { // Lvl 2 - 3-way fan shot
                            if (bossShootTimer >= 140) {
                                bossShootTimer = 0;
                                const baseAngle = Math.atan2(aimDy, aimDx);
                                const spd = 3.5 * diff;
                                for (let a = -1; a <= 1; a++) {
                                    const angle = baseAngle + a * 0.3;
                                    bossProjectiles.push({ x: boss.x, y: boss.y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, size: 7, type: 'normal', color: '#FF8C00' });
                                }
                            }
                            break;
                        }
                        case 'lightning': { // Lvl 3 - Bolts shoot horizontally from right
                            if (bossShootTimer >= 100) {
                                bossShootTimer = 0;
                                const strikeY = 30 + Math.random() * (CANVAS_HEIGHT - GROUND_HEIGHT - 60);
                                bossProjectiles.push({ x: CANVAS_WIDTH + 10, y: strikeY, vx: -7 * diff, vy: 0, size: 6, type: 'lightning', color: '#E040FB' });
                            }
                            break;
                        }
                        case 'bounce': { // Lvl 4 - Bouncing sand balls
                            if (bossShootTimer >= 140) {
                                bossShootTimer = 0;
                                const spd = 3.5 * diff;
                                bossProjectiles.push({ x: boss.x, y: boss.y, vx: (aimDx / aimDist) * spd, vy: (aimDy / aimDist) * spd, size: 9, type: 'bounce', color: '#FFB74D', bounces: 0 });
                            }
                            break;
                        }
                        case 'rain': { // Lvl 5 - Lava barrage from the right
                            if (bossShootTimer >= 50) {
                                bossShootTimer = 0;
                                const ry = 20 + Math.random() * (CANVAS_HEIGHT - GROUND_HEIGHT - 40);
                                bossProjectiles.push({ x: CANVAS_WIDTH + 10, y: ry, vx: -(3 + Math.random() * 2) * diff, vy: (Math.random() - 0.5) * 2, size: 6, type: 'normal', color: '#FF3D00' });
                            }
                            break;
                        }
                        case 'burst': { // Lvl 6 - Ring of 6 projectiles
                            if (bossShootTimer >= 120) {
                                bossShootTimer = 0;
                                const spd = 3.5 * diff;
                                for (let i = 0; i < 6; i++) {
                                    const angle = (i / 6) * Math.PI * 2;
                                    bossProjectiles.push({ x: boss.x, y: boss.y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, size: 7, type: 'normal', color: '#F50057' });
                                }
                            }
                            break;
                        }
                        case 'wave': { // Lvl 7 - Sine wave projectiles
                            if (bossShootTimer >= 110) {
                                bossShootTimer = 0;
                                const spd = 3.5 * diff;
                                bossProjectiles.push({ x: boss.x, y: boss.y, vx: -spd, vy: 0, size: 8, type: 'wave', color: '#00B0FF', waveTime: 0, baseY: boss.y });
                            }
                            break;
                        }
                        case 'spiral': { // Lvl 8 - Spiral of projectiles
                            if (bossShootTimer >= 14) {
                                bossShootTimer = 0;
                                boss.spiralAngle += 0.35;
                                const spd = 3 * diff;
                                bossProjectiles.push({ x: boss.x, y: boss.y, vx: Math.cos(boss.spiralAngle) * spd, vy: Math.sin(boss.spiralAngle) * spd, size: 5, type: 'normal', color: '#448AFF' });
                            }
                            break;
                        }
                        case 'homing': { // Lvl 9 - Slow homing projectile
                            if (bossShootTimer >= 120) {
                                bossShootTimer = 0;
                                const spd = 2.5 * diff;
                                const angle = Math.atan2(aimDy, aimDx) + (Math.random() - 0.5) * 1.5;
                                bossProjectiles.push({ x: boss.x, y: boss.y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, size: 10, type: 'homing', color: '#B388FF' });
                            }
                            break;
                        }
                        case 'chaos': { // Lvl 10 - Randomly picks from all attack types
                            if (bossShootTimer >= 70) {
                                bossShootTimer = 0;
                                const pick = Math.floor(Math.random() * 5);
                                const spd = 4 * diff;
                                if (pick === 0) { // aimed
                                    bossProjectiles.push({ x: boss.x, y: boss.y, vx: (aimDx / aimDist) * spd, vy: (aimDy / aimDist) * spd, size: 8, type: 'normal', color: '#EA80FC' });
                                } else if (pick === 1) { // spread
                                    const baseAngle = Math.atan2(aimDy, aimDx);
                                    for (let a = -1; a <= 1; a++) {
                                        const angle = baseAngle + a * 0.3;
                                        bossProjectiles.push({ x: boss.x, y: boss.y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, size: 7, type: 'normal', color: '#EA80FC' });
                                    }
                                } else if (pick === 2) { // burst
                                    for (let i = 0; i < 6; i++) {
                                        const angle = (i / 6) * Math.PI * 2;
                                        bossProjectiles.push({ x: boss.x, y: boss.y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, size: 6, type: 'normal', color: '#EA80FC' });
                                    }
                                } else if (pick === 3) { // lightning
                                    const strikeY = 30 + Math.random() * (CANVAS_HEIGHT - GROUND_HEIGHT - 60);
                                    bossProjectiles.push({ x: CANVAS_WIDTH + 10, y: strikeY, vx: -8 * diff, vy: 0, size: 7, type: 'lightning', color: '#EA80FC' });
                                } else { // homing
                                    const angle = Math.atan2(aimDy, aimDx) + (Math.random() - 0.5);
                                    bossProjectiles.push({ x: boss.x, y: boss.y, vx: Math.cos(angle) * 3 * diff, vy: Math.sin(angle) * 3 * diff, size: 9, type: 'homing', color: '#EA80FC' });
                                }
                            }
                            break;
                        }
                    }
                }
            }

            // Update boss projectiles
            for (let i = bossProjectiles.length - 1; i >= 0; i--) {
                const proj = bossProjectiles[i];

                // Special movement per type
                if (proj.type === 'homing') {
                    const pCX = player.x + player.width / 2;
                    const pCY = player.y + player.height / 2;
                    const hdx = pCX - proj.x;
                    const hdy = pCY - proj.y;
                    const hd = Math.sqrt(hdx * hdx + hdy * hdy);
                    if (hd > 0) {
                        const homingStrength = 0.1 + currentLevel * 0.02; // Turns harder at higher levels
                        proj.vx += (hdx / hd) * homingStrength;
                        proj.vy += (hdy / hd) * homingStrength;
                        const maxSpd = 4 + currentLevel * 0.3;
                        const speed = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy);
                        if (speed > maxSpd) { proj.vx = (proj.vx / speed) * maxSpd; proj.vy = (proj.vy / speed) * maxSpd; }
                    }
                } else if (proj.type === 'wave') {
                    proj.waveTime += 0.1;
                    proj.y = proj.baseY + Math.sin(proj.waveTime) * 60;
                } else if (proj.type === 'bounce') {
                    if (proj.y - proj.size <= 0) { proj.vy = Math.abs(proj.vy); proj.bounces++; }
                    if (proj.y + proj.size >= CANVAS_HEIGHT - GROUND_HEIGHT) { proj.vy = -Math.abs(proj.vy); proj.bounces++; }
                }

                proj.x += proj.vx;
                proj.y += proj.vy;

                // Remove if off-screen (bouncing gets extra life)
                const offscreen = proj.x < -30 || proj.x > CANVAS_WIDTH + 30 || proj.y < -30 || proj.y > CANVAS_HEIGHT + 30;
                if (proj.type === 'bounce' && proj.bounces >= 3) {
                    bossProjectiles.splice(i, 1);
                    continue;
                }
                if (offscreen && proj.type !== 'bounce') {
                    bossProjectiles.splice(i, 1);
                    continue;
                }

                // Collision with player
                const pCX = player.x + player.width / 2;
                const pCY = player.y + player.height / 2;
                const pdx = proj.x - pCX;
                const pdy = proj.y - pCY;
                if (Math.sqrt(pdx * pdx + pdy * pdy) < proj.size + player.width / 2) {
                    endGame();
                    break;
                }
            }

            // Only advance by score if boss isn't active (boss fight handles its own advancement)
            if (!boss || !boss.active) {
                const currentLevelData = levels[currentLevel];
                if (levelScore >= currentLevelData.scoreToAdvance && currentLevel < levels.length - 1) {
                    loadLevel(currentLevel + 1);
                }
            }
            break;

        case GAME_STATE.LEVEL_COMPLETE:
            levelTransitionTimer--;
            if (levelTransitionTimer <= 0) {
                gameState = GAME_STATE.PLAYING; // Go back to playing after transition
            }
            break;
        case GAME_STATE.GAME_OVER:
            // No updates during game over, waiting for restart input
            break;
        case GAME_STATE.PAUSED:
            // No updates while paused
            break;
        case GAME_STATE.START_SCREEN:
        case GAME_STATE.MAP_SCREEN:
            // No updates, just drawing the screen
            break;
    }
}

function draw() {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw decorations (background and foreground)
    for (const deco of activeDecorations) {
        ctx.fillStyle = deco.color;
        switch (deco.type) {
            case 'cloud':
                drawCloud(deco.x, deco.y, deco.size);
                break;
            case 'volcano':
                drawVolcano(deco.x, deco.y, deco.size);
                break;
            case 'cactus':
                drawCactus(deco.x, deco.y, deco.size);
                break;
            case 'pyramid':
                drawPyramid(deco.x, deco.y, deco.size);
                break;
            case 'sun':
                drawSun(deco.x, deco.y, deco.size);
                break;
            case 'fish':
                drawFish(deco.x, deco.y, deco.size);
                break;
            case 'coral':
                drawCoral(deco.x, deco.y, deco.size);
                break;
            case 'snowflake':
                drawSnowflake(deco.x, deco.y, deco.size);
                break;
            case 'tree':
                drawTree(deco.x, deco.y, deco.size);
                break;
            case 'ghost':
                drawGhost(deco.x, deco.y, deco.size);
                break;
            case 'star':
                drawStar(deco.x, deco.y, deco.size);
                break;
            case 'planet':
                drawPlanet(deco.x, deco.y, deco.size);
                break;
            case 'rock':
                drawRock(deco.x, deco.y, deco.size);
                break;
            case 'smoke':
                drawSmoke(deco.x, deco.y, deco.size, deco.color);
                break;
            case 'lava':
                drawLava(deco.x, deco.y, deco.size, deco);
                break;
        }
    }

    switch (gameState) {
        case GAME_STATE.START_SCREEN:
            drawStartScreen();
            break;
        case GAME_STATE.MAP_SCREEN:
            drawMapScreen();
            break;
        case GAME_STATE.PAUSED:
        case GAME_STATE.PLAYING:
        case GAME_STATE.LEVEL_COMPLETE: // Draw game elements during level transition too
            ctx.fillStyle = player.color;
            ctx.fillRect(player.x, player.y, player.width, player.height);

            for (const pipe of pipes) {
                ctx.fillStyle = pipeColor;
                ctx.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);
                ctx.strokeStyle = pipeOutlineColor;
                ctx.lineWidth = 2;
                ctx.strokeRect(pipe.x, pipe.y, pipe.width, pipe.height);
            }

            ctx.fillStyle = '#D2B48C';
            ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);

            // Draw boss
            if (boss && boss.active) {
                ctx.save();
                // Flash the boss white during defeat animation
                if (bossDefeated) {
                    ctx.globalAlpha = Math.max(0, 1 - bossDefeatTimer / 90);
                    if (Math.floor(bossDefeatTimer / 4) % 2 === 0) {
                        // Draw white flash version
                        ctx.filter = 'brightness(3)';
                    }
                }
                drawBoss(boss);
                ctx.restore();

                // Warning text when boss first appears
                if (boss.warningTimer > 0 && !bossDefeated) {
                    const alpha = Math.min(1, boss.warningTimer / 60);
                    ctx.save();
                    ctx.globalAlpha = alpha;
                    ctx.font = 'bold 36px Arial';
                    ctx.textAlign = 'center';
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 4;
                    ctx.strokeText('BOSS INCOMING!', CANVAS_WIDTH / 2, 120);
                    ctx.fillStyle = '#FF0000';
                    ctx.fillText('BOSS INCOMING!', CANVAS_WIDTH / 2, 120);
                    ctx.textAlign = 'left';
                    ctx.restore();
                }

                // "BOSS DEFEATED!" text
                if (bossDefeated) {
                    ctx.save();
                    const alpha = Math.min(1, bossDefeatTimer / 20);
                    ctx.globalAlpha = alpha;
                    ctx.font = 'bold 42px Arial';
                    ctx.textAlign = 'center';
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 5;
                    ctx.strokeText('BOSS DEFEATED!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
                    ctx.fillStyle = '#00FF88';
                    ctx.fillText('BOSS DEFEATED!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
                    ctx.textAlign = 'left';
                    ctx.restore();
                }

                // Survival timer bar (only during active fight, not during defeat)
                if (!bossDefeated && bossFightDuration > 0 && boss.x <= boss.targetX) {
                    const barWidth = 300;
                    const barHeight = 16;
                    const barX = (CANVAS_WIDTH - barWidth) / 2;
                    const barY = 80;
                    const progress = bossFightTimer / bossFightDuration;

                    // Bar background
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

                    // Bar fill — goes from red (full) to green (almost done)
                    const r = Math.floor(255 * progress);
                    const g = Math.floor(255 * (1 - progress));
                    ctx.fillStyle = `rgb(${r}, ${g}, 50)`;
                    ctx.fillRect(barX, barY, barWidth * progress, barHeight);

                    // Bar border
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

                    // Timer text
                    const secondsLeft = Math.ceil(bossFightTimer / 60);
                    ctx.font = 'bold 14px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = 'white';
                    ctx.fillText(`SURVIVE: ${secondsLeft}s`, CANVAS_WIDTH / 2, barY + barHeight + 16);
                    ctx.textAlign = 'left';
                }
            }

            // Draw full-screen beam attacks
            for (const beam of bossBeams) {
                ctx.save();
                const bColor = beam.color || '#FF0000';
                if (beam.phase === 'anticipation') {
                    // Flashing warning line across the screen
                    const flashAlpha = 0.3 + Math.sin(beam.timer * 0.4) * 0.25;
                    const progress = beam.timer / beam.anticipationDuration;

                    // Warning stripe background (thin, pulsing)
                    ctx.globalAlpha = flashAlpha;
                    ctx.fillStyle = '#FF0000';
                    const warningH = 4 + progress * (beam.beamHeight * 0.3);
                    ctx.fillRect(0, beam.y - warningH / 2, CANVAS_WIDTH, warningH);

                    // Dashed center line
                    ctx.globalAlpha = 0.5 + progress * 0.5;
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([12, 8]);
                    ctx.beginPath();
                    ctx.moveTo(0, beam.y);
                    ctx.lineTo(CANVAS_WIDTH, beam.y);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    // "!" warning icons along the line
                    ctx.globalAlpha = flashAlpha + 0.3;
                    ctx.font = 'bold 20px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#FF4444';
                    for (let wx = 60; wx < CANVAS_WIDTH; wx += 120) {
                        ctx.fillText('!', wx, beam.y + 7);
                    }

                    // Charging glow at boss position
                    if (boss) {
                        const chargeSize = 10 + progress * 25;
                        const chargeGrad = ctx.createRadialGradient(boss.x, beam.y, 0, boss.x, beam.y, chargeSize);
                        chargeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                        chargeGrad.addColorStop(0.4, bColor + 'CC');
                        chargeGrad.addColorStop(1, bColor + '00');
                        ctx.globalAlpha = 1;
                        ctx.fillStyle = chargeGrad;
                        ctx.beginPath();
                        ctx.arc(boss.x, beam.y, chargeSize, 0, Math.PI * 2);
                        ctx.fill();
                    }
                } else if (beam.phase === 'firing') {
                    // Full-screen laser beam!
                    const fadeIn = Math.min(1, beam.timer / 5); // Quick fade in
                    const fadeOut = Math.max(0, 1 - (beam.timer - beam.fireDuration + 10) / 10);
                    const alpha = Math.min(fadeIn, fadeOut);
                    const h = beam.beamHeight;

                    // Screen shake effect (slight)
                    if (beam.timer < 8) {
                        ctx.translate(0, (Math.random() - 0.5) * 4);
                    }

                    // Outermost glow
                    ctx.globalAlpha = alpha * 0.2;
                    ctx.fillStyle = bColor;
                    ctx.fillRect(0, beam.y - h * 1.5, CANVAS_WIDTH, h * 3);

                    // Wide colored glow
                    ctx.globalAlpha = alpha * 0.4;
                    const outerGrad = ctx.createLinearGradient(0, beam.y - h, 0, beam.y + h);
                    outerGrad.addColorStop(0, bColor + '00');
                    outerGrad.addColorStop(0.3, bColor + 'AA');
                    outerGrad.addColorStop(0.5, bColor);
                    outerGrad.addColorStop(0.7, bColor + 'AA');
                    outerGrad.addColorStop(1, bColor + '00');
                    ctx.fillStyle = outerGrad;
                    ctx.fillRect(0, beam.y - h, CANVAS_WIDTH, h * 2);

                    // Main beam body
                    ctx.globalAlpha = alpha * 0.85;
                    const beamGrad = ctx.createLinearGradient(0, beam.y - h / 2, 0, beam.y + h / 2);
                    beamGrad.addColorStop(0, bColor + '44');
                    beamGrad.addColorStop(0.3, bColor);
                    beamGrad.addColorStop(0.5, 'white');
                    beamGrad.addColorStop(0.7, bColor);
                    beamGrad.addColorStop(1, bColor + '44');
                    ctx.fillStyle = beamGrad;
                    ctx.fillRect(0, beam.y - h / 2, CANVAS_WIDTH, h);

                    // White-hot core
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                    ctx.fillRect(0, beam.y - h * 0.12, CANVAS_WIDTH, h * 0.24);
                }
                ctx.restore();
            }

            // Draw boss projectiles as fancy bullets
            for (const proj of bossProjectiles) {
                ctx.save();
                const c = proj.color || '#FF4400';
                const s = proj.size;
                const px = proj.x;
                const py = proj.y;
                const angle = Math.atan2(proj.vy, proj.vx);
                const t = Date.now() / 1000;

                if (proj.type === 'lightning') {
                    // Electric orb with crackling bolts
                    const pulse = 1 + Math.sin(t * 20) * 0.3;
                    // Outer electric field
                    ctx.shadowColor = c;
                    ctx.shadowBlur = 20;
                    ctx.strokeStyle = c;
                    ctx.lineWidth = 2;
                    ctx.globalAlpha = 0.5;
                    for (let i = 0; i < 6; i++) {
                        const a = (i / 6) * Math.PI * 2 + t * 8;
                        const len = s * 2 * pulse;
                        const midR = len * 0.5;
                        const jitterX = (Math.random() - 0.5) * s * 0.8;
                        const jitterY = (Math.random() - 0.5) * s * 0.8;
                        ctx.beginPath();
                        ctx.moveTo(px, py);
                        ctx.lineTo(px + Math.cos(a) * midR + jitterX, py + Math.sin(a) * midR + jitterY);
                        ctx.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len);
                        ctx.stroke();
                    }
                    // Core orb
                    ctx.globalAlpha = 1;
                    ctx.shadowBlur = 15;
                    const orbGrad = ctx.createRadialGradient(px, py, 0, px, py, s);
                    orbGrad.addColorStop(0, 'white');
                    orbGrad.addColorStop(0.4, c);
                    orbGrad.addColorStop(1, c + '00');
                    ctx.fillStyle = orbGrad;
                    ctx.beginPath();
                    ctx.arc(px, py, s * pulse, 0, Math.PI * 2);
                    ctx.fill();

                } else if (proj.type === 'homing') {
                    // Sinister eye that tracks the player
                    // Outer pulsing ring
                    const pulse = 1 + Math.sin(t * 6) * 0.15;
                    ctx.shadowColor = c;
                    ctx.shadowBlur = 18;
                    ctx.strokeStyle = c;
                    ctx.lineWidth = 2.5;
                    ctx.globalAlpha = 0.6;
                    ctx.beginPath();
                    ctx.arc(px, py, s * 1.5 * pulse, 0, Math.PI * 2);
                    ctx.stroke();
                    // Dark body
                    ctx.globalAlpha = 1;
                    const eyeGrad = ctx.createRadialGradient(px, py, 0, px, py, s);
                    eyeGrad.addColorStop(0, '#220033');
                    eyeGrad.addColorStop(0.7, c);
                    eyeGrad.addColorStop(1, c + '88');
                    ctx.fillStyle = eyeGrad;
                    ctx.beginPath();
                    ctx.arc(px, py, s, 0, Math.PI * 2);
                    ctx.fill();
                    // Slit pupil
                    ctx.fillStyle = 'white';
                    ctx.beginPath();
                    ctx.ellipse(px, py, s * 0.15, s * 0.5, angle, 0, Math.PI * 2);
                    ctx.fill();

                } else if (proj.type === 'wave') {
                    // Rippling water ring
                    const ripple = Math.sin(t * 10) * 0.25;
                    // Outer ripples
                    ctx.strokeStyle = c;
                    ctx.lineWidth = 1.5;
                    ctx.globalAlpha = 0.3;
                    ctx.beginPath();
                    ctx.arc(px, py, s * (2 + ripple), 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.globalAlpha = 0.5;
                    ctx.beginPath();
                    ctx.arc(px, py, s * (1.5 - ripple * 0.5), 0, Math.PI * 2);
                    ctx.stroke();
                    // Core droplet
                    ctx.globalAlpha = 1;
                    ctx.shadowColor = c;
                    ctx.shadowBlur = 12;
                    const dropGrad = ctx.createRadialGradient(px - s * 0.2, py - s * 0.2, 0, px, py, s);
                    dropGrad.addColorStop(0, 'white');
                    dropGrad.addColorStop(0.5, c);
                    dropGrad.addColorStop(1, c + '66');
                    ctx.fillStyle = dropGrad;
                    ctx.beginPath();
                    ctx.arc(px, py, s, 0, Math.PI * 2);
                    ctx.fill();

                } else if (proj.type === 'bounce') {
                    // Spiky bouncing ball
                    ctx.translate(px, py);
                    ctx.rotate(t * 5);
                    // Spikes
                    ctx.fillStyle = c;
                    ctx.shadowColor = c;
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    const spikes = 8;
                    for (let i = 0; i < spikes; i++) {
                        const a = (i / spikes) * Math.PI * 2;
                        const outerR = s * 1.6;
                        const innerR = s * 0.7;
                        if (i === 0) ctx.moveTo(Math.cos(a) * outerR, Math.sin(a) * outerR);
                        else ctx.lineTo(Math.cos(a) * outerR, Math.sin(a) * outerR);
                        const midA = a + Math.PI / spikes;
                        ctx.lineTo(Math.cos(midA) * innerR, Math.sin(midA) * innerR);
                    }
                    ctx.closePath();
                    ctx.fill();
                    // Bright core
                    const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.6);
                    coreGrad.addColorStop(0, 'white');
                    coreGrad.addColorStop(1, c);
                    ctx.fillStyle = coreGrad;
                    ctx.beginPath();
                    ctx.arc(0, 0, s * 0.6, 0, Math.PI * 2);
                    ctx.fill();

                } else {
                    // Default: spinning star bullet with trail
                    // Motion trail
                    ctx.globalAlpha = 0.15;
                    ctx.fillStyle = c;
                    for (let tr = 1; tr <= 3; tr++) {
                        const trX = px - Math.cos(angle) * s * tr * 1.2;
                        const trY = py - Math.sin(angle) * s * tr * 1.2;
                        ctx.beginPath();
                        ctx.arc(trX, trY, s * (1 - tr * 0.2), 0, Math.PI * 2);
                        ctx.fill();
                    }
                    // Outer glow
                    ctx.globalAlpha = 0.4;
                    ctx.shadowColor = c;
                    ctx.shadowBlur = 15;
                    ctx.fillStyle = c;
                    ctx.beginPath();
                    ctx.arc(px, py, s * 1.5, 0, Math.PI * 2);
                    ctx.fill();
                    // Spinning spiky star shape
                    ctx.globalAlpha = 1;
                    ctx.translate(px, py);
                    ctx.rotate(t * 6);
                    ctx.fillStyle = c;
                    ctx.beginPath();
                    const points = 10;
                    for (let i = 0; i < points; i++) {
                        const outerA = (i / points) * Math.PI * 2 - Math.PI / 2;
                        const innerA = outerA + Math.PI / points;
                        ctx.lineTo(Math.cos(outerA) * s * 1.4, Math.sin(outerA) * s * 1.4);
                        ctx.lineTo(Math.cos(innerA) * s * 0.3, Math.sin(innerA) * s * 0.3);
                    }
                    ctx.closePath();
                    ctx.fill();
                    // White-hot center
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
                    ctx.beginPath();
                    ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }

            ctx.fillStyle = 'black';
            ctx.font = '24px Arial';
            ctx.fillText(`Level: ${currentLevel + 1}`, 10, 30);
            ctx.fillText(`Score: ${score}`, 10, 60);

            // Subtle control hints in top-right
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.font = '12px Arial';
            ctx.textAlign = 'right';
            ctx.fillText('[SPACE/\u2191] Jump  [P] Pause  [ESC] Map  [R] Restart', CANVAS_WIDTH - 10, 20);
            ctx.textAlign = 'left';

            if (gameState === GAME_STATE.LEVEL_COMPLETE) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                ctx.fillStyle = 'white';
                ctx.font = '48px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`Level ${currentLevel + 1} - ${levels[currentLevel].theme}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
                ctx.font = '24px Arial';
                ctx.fillText('Press SPACE or ENTER to Continue', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
                ctx.textAlign = 'left';
            }

            if (gameState === GAME_STATE.PAUSED) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                ctx.fillStyle = 'white';
                ctx.font = '48px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
                ctx.font = '20px Arial';
                ctx.fillText('[P] Resume    [Q] Quit to Map    [R] Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
                ctx.textAlign = 'left';
            }
            break;
        case GAME_STATE.GAME_OVER:
            drawGameOverScreen(); // This will also draw the game elements beneath
            break;
    }
}

// Decoration drawing functions
function drawCloud(x, y, size) {
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
    ctx.arc(x + size * 0.5, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x - size * 0.4, y + size * 0.2, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.3, y + size * 0.3, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
}

function drawVolcano(x, y, size) {
    // Lava glow behind volcano
    const glowGrad = ctx.createRadialGradient(x + size / 2, y, size * 0.1, x + size / 2, y, size * 0.8);
    glowGrad.addColorStop(0, 'rgba(255, 100, 0, 0.4)');
    glowGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(x + size / 2, y, size * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Volcano body
    ctx.fillStyle = '#8B0000';
    ctx.beginPath();
    ctx.moveTo(x, y + size);
    ctx.lineTo(x + size / 2, y);
    ctx.lineTo(x + size, y + size);
    ctx.closePath();
    ctx.fill();

    // Darker shading on right side
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.moveTo(x + size / 2, y);
    ctx.lineTo(x + size, y + size);
    ctx.lineTo(x + size * 0.6, y + size);
    ctx.closePath();
    ctx.fill();

    // Glowing crater
    const craterGrad = ctx.createRadialGradient(x + size / 2, y + 3, size * 0.05, x + size / 2, y + 3, size * 0.18);
    craterGrad.addColorStop(0, '#FFFF00');
    craterGrad.addColorStop(0.4, '#FF6600');
    craterGrad.addColorStop(1, '#CC2200');
    ctx.fillStyle = craterGrad;
    ctx.beginPath();
    ctx.arc(x + size / 2, y + 3, size * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Lava drip down the side
    ctx.fillStyle = '#FF4500';
    ctx.beginPath();
    ctx.moveTo(x + size * 0.42, y + 2);
    ctx.quadraticCurveTo(x + size * 0.35, y + size * 0.4, x + size * 0.38, y + size * 0.55);
    ctx.lineTo(x + size * 0.45, y + size * 0.5);
    ctx.quadraticCurveTo(x + size * 0.43, y + size * 0.3, x + size * 0.48, y + 2);
    ctx.closePath();
    ctx.fill();
}

function drawLava(x, y, size, deco) {
    // Animated lava blob that rises and fades
    const life = deco.life || 0;
    const alpha = Math.max(0, 1 - life / deco.maxLife);

    // Outer glow
    ctx.fillStyle = `rgba(255, 80, 0, ${alpha * 0.3})`;
    ctx.beginPath();
    ctx.arc(x, y, size * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Core blob
    ctx.fillStyle = `rgba(255, ${150 + Math.floor(105 * (1 - life / deco.maxLife))}, 0, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    // Hot center
    ctx.fillStyle = `rgba(255, 255, ${Math.floor(100 * (1 - life / deco.maxLife))}, ${alpha * 0.8})`;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
}

function drawSmoke(x, y, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x - size * 0.3, y + size * 0.1, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
}


function drawCactus(x, y, size) {
    ctx.fillStyle = '#556B2F'; // Dark green
    ctx.fillRect(x + size * 0.4, y, size * 0.2, size); // Main body
    ctx.fillRect(x, y + size * 0.3, size * 0.4, size * 0.2); // Left arm
    ctx.fillRect(x + size * 0.6, y + size * 0.2, size * 0.4, size * 0.2); // Right arm
}

function drawPyramid(x, y, size) {
    ctx.fillStyle = '#DAA520'; // Goldenrod
    ctx.beginPath();
    ctx.moveTo(x, y + size);
    ctx.lineTo(x + size / 2, y);
    ctx.lineTo(x + size, y + size);
    ctx.closePath();
    ctx.fill();
}

function drawSun(x, y, size) {
    ctx.fillStyle = '#FFD700'; // Gold
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
}

function drawFish(x, y, size) {
    ctx.fillStyle = '#00BFFF'; // Deep sky blue
    ctx.beginPath();
    ctx.ellipse(x, y, size, size / 2, 0, 0, Math.PI * 2); // Body
    ctx.moveTo(x + size, y);
    ctx.lineTo(x + size + size / 2, y - size / 4);
    ctx.lineTo(x + size + size / 2, y + size / 4);
    ctx.closePath();
    ctx.fill();
}

function drawCoral(x, y, size) {
    ctx.fillStyle = '#FF6347'; // Tomato
    ctx.fillRect(x, y, size / 4, size);
    ctx.fillRect(x - size / 4, y + size / 2, size / 4, size / 2);
    ctx.fillRect(x + size / 4, y + size / 3, size / 4, size / 3);
}

function drawSnowflake(x, y, size) {
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3;
        ctx.moveTo(x + Math.cos(Math.PI / 2 + angle) * size / 2, y + Math.sin(Math.PI / 2 + angle) * size / 2);
        ctx.lineTo(x + Math.cos(Math.PI / 2 + angle + Math.PI) * size / 2, y + Math.sin(Math.PI / 2 + angle + Math.PI) * size / 2);
    }
    ctx.stroke();
}

function drawTree(x, y, size) {
    ctx.fillStyle = '#8B4513'; // SaddleBrown for trunk
    ctx.fillRect(x + size * 0.4, y + size * 0.8, size * 0.2, size * 0.2);
    ctx.fillStyle = '#228B22'; // ForestGreen for leaves
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.8);
    ctx.lineTo(x + size / 2, y);
    ctx.lineTo(x + size, y + size * 0.8);
    ctx.closePath();
    ctx.fill();
}

function drawGhost(x, y, size) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, Math.PI, 0, false);
    ctx.lineTo(x + size, y + size);
    ctx.lineTo(x + size * 0.75, y + size * 0.75);
    ctx.lineTo(x + size * 0.5, y + size);
    ctx.lineTo(x + size * 0.25, y + size * 0.75);
    ctx.lineTo(x, y + size);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(x + size * 0.35, y + size * 0.4, size * 0.1, 0, Math.PI * 2);
    ctx.arc(x + size * 0.65, y + size * 0.4, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
}

function drawStar(x, y, size) {
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    for (let i = 0; i < 5; i++) {
        ctx.lineTo(x + Math.cos(Math.PI / 2 + i * 2 * Math.PI / 5 + Math.PI / 5) * size / 2, y + Math.sin(Math.PI / 2 + i * 2 * Math.PI / 5 + Math.PI / 5) * size / 2);
        ctx.lineTo(x + Math.cos(Math.PI / 2 + (i + 1) * 2 * Math.PI / 5) * size, y + Math.sin(Math.PI / 2 + (i + 1) * 2 * Math.PI / 5) * size);
    }
    ctx.fill();
}

function drawPlanet(x, y, size) {
    ctx.fillStyle = '#8A2BE2'; // Blue violet
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.1, size / 1.5, size * 0.2, -Math.PI / 6, 0, Math.PI * 2);
    ctx.stroke();
}

function drawRock(x, y, size) {
    ctx.fillStyle = '#8B4513'; // SaddleBrown
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.7);
    ctx.lineTo(x + size * 0.2, y);
    ctx.lineTo(x + size * 0.8, y);
    ctx.lineTo(x + size, y + size * 0.7);
    ctx.lineTo(x + size * 0.7, y + size);
    ctx.lineTo(x + size * 0.3, y + size);
    ctx.closePath();
    ctx.fill();
}


function drawBoss(b) {
    const x = b.x;
    const y = b.y;
    const size = b.size;

    ctx.save();

    // Pulsing glow/shadow behind
    const pulseScale = 1 + Math.sin(b.time * 3) * 0.1;
    const glowGrad = ctx.createRadialGradient(x, y, size * 0.5, x, y, size * 1.5 * pulseScale);
    glowGrad.addColorStop(0, 'rgba(255, 0, 0, 0.3)');
    glowGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(x, y, size * 1.5 * pulseScale, 0, Math.PI * 2);
    ctx.fill();

    // Body with thick contrasting outline
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    // White outline so boss is visible on any background
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    ctx.stroke();
    // Dark inner outline for definition
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, size - 3, 0, Math.PI * 2);
    ctx.stroke();

    // Angry eyes - white sclera
    const eyeOffsetX = size * 0.3;
    const eyeOffsetY = size * 0.2;
    const eyeW = size * 0.25;
    const eyeH = size * 0.2;

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(x - eyeOffsetX, y - eyeOffsetY, eyeW, eyeH, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + eyeOffsetX, y - eyeOffsetY, eyeW, eyeH, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = b.eyeColor;
    ctx.beginPath();
    ctx.arc(x - eyeOffsetX, y - eyeOffsetY, eyeW * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + eyeOffsetX, y - eyeOffsetY, eyeW * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Angry eyebrows
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - eyeOffsetX - eyeW, y - eyeOffsetY - eyeH * 1.2);
    ctx.lineTo(x - eyeOffsetX + eyeW * 0.5, y - eyeOffsetY - eyeH * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + eyeOffsetX + eyeW, y - eyeOffsetY - eyeH * 1.2);
    ctx.lineTo(x + eyeOffsetX - eyeW * 0.5, y - eyeOffsetY - eyeH * 0.5);
    ctx.stroke();

    // Frown mouth with teeth
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(x - size * 0.3, y + size * 0.3);
    ctx.quadraticCurveTo(x, y + size * 0.15, x + size * 0.3, y + size * 0.3);
    ctx.quadraticCurveTo(x, y + size * 0.55, x - size * 0.3, y + size * 0.3);
    ctx.fill();
    // Teeth
    ctx.fillStyle = 'white';
    const teethY = y + size * 0.3;
    for (let i = -2; i <= 2; i++) {
        ctx.fillRect(x + i * size * 0.08 - size * 0.03, teethY - size * 0.06, size * 0.06, size * 0.08);
    }

    // Name label above
    ctx.font = `bold ${Math.floor(size * 0.35)}px Arial`;
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;
    ctx.strokeText(b.name, x, y - size - 10);
    ctx.fillStyle = 'white';
    ctx.fillText(b.name, x, y - size - 10);
    ctx.textAlign = 'left';

    ctx.restore();
}

function drawStartScreen() {
    ctx.fillStyle = 'black';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Isaac\'s Chicken Game', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    ctx.font = '24px Arial';
    ctx.fillText('Press SPACE or ENTER to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    ctx.font = '16px Arial';
    ctx.fillStyle = '#555';
    ctx.fillText('Fully keyboard controlled!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 55);
    ctx.textAlign = 'left';
}

function drawMapScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = 'white';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Select a Level', CANVAS_WIDTH / 2, 60);
    ctx.textAlign = 'left';

    const levelBoxWidth = 130;
    const levelBoxHeight = 65;
    const padding = 15;
    const startX = (CANVAS_WIDTH - (MAP_COLUMNS * levelBoxWidth + (MAP_COLUMNS - 1) * padding)) / 2;
    const startY = 90;

    for (let i = 0; i < levels.length; i++) {
        const row = Math.floor(i / MAP_COLUMNS);
        const col = i % MAP_COLUMNS;
        const x = startX + col * (levelBoxWidth + padding);
        const y = startY + row * (levelBoxHeight + padding);

        const isSelected = (i === selectedLevel);

        ctx.fillStyle = levels[i].bgColor;
        ctx.fillRect(x, y, levelBoxWidth, levelBoxHeight);

        // Highlight selected level with a bright animated border
        if (isSelected) {
            const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
            ctx.strokeStyle = `rgba(255, 255, 0, ${pulse})`;
            ctx.lineWidth = 5;
            ctx.strokeRect(x - 3, y - 3, levelBoxWidth + 6, levelBoxHeight + 6);
            // Selection arrow
            ctx.fillStyle = '#FFD700';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('\u25B6', x - 15, y + levelBoxHeight / 2 + 7);
        } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, levelBoxWidth, levelBoxHeight);
        }

        ctx.fillStyle = isSelected ? 'white' : 'black';
        ctx.font = isSelected ? 'bold 22px Arial' : '22px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Lvl ${i + 1}`, x + levelBoxWidth / 2, y + levelBoxHeight / 2 - 8);
        ctx.font = isSelected ? 'bold 11px Arial' : '11px Arial';
        ctx.fillText(levels[i].theme, x + levelBoxWidth / 2, y + levelBoxHeight / 2 + 14);
        ctx.textAlign = 'left';

        // Store clickable area for later
        levels[i].clickableArea = { x: x, y: y, width: levelBoxWidth, height: levelBoxHeight };
    }

    // Keyboard hints at the bottom
    ctx.fillStyle = '#AAA';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('\u2190 \u2191 \u2193 \u2192  Navigate    ENTER  Select    1-0  Quick Pick    ESC  Back', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 25);
    ctx.textAlign = 'left';
}


function drawGameOverScreen(isWin = false) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';

    if (isWin) {
        ctx.fillText('YOU WIN!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    } else {
        ctx.fillText('GAME OVER!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    }

    ctx.font = '36px Arial';
    ctx.fillText(`Total Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.font = '20px Arial';
    ctx.fillText('[SPACE] Map    [R] Retry Level', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    ctx.textAlign = 'left';
}

function endGame(isWin = false) {
    // Only transition to GAME_OVER if not already in LEVEL_COMPLETE state (from winning a level)
    if (gameState !== GAME_STATE.LEVEL_COMPLETE) {
        // If it's a win, we set gameState to LEVEL_COMPLETE first, then let loadLevel handle the transition.
        // If it's a game over (not a win), then directly set to GAME_OVER.
        if (!isWin) {
            gameState = GAME_STATE.GAME_OVER;
        }
    }
}

document.addEventListener('keydown', (e) => {
    // Prevent page scrolling for game keys
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
    }

    switch (gameState) {
        case GAME_STATE.START_SCREEN:
            if (e.code === 'Space' || e.code === 'Enter') {
                gameState = GAME_STATE.MAP_SCREEN;
            }
            break;

        case GAME_STATE.MAP_SCREEN:
            // Arrow key navigation in a 3-column grid
            if (e.code === 'ArrowRight') {
                selectedLevel = Math.min(selectedLevel + 1, levels.length - 1);
            } else if (e.code === 'ArrowLeft') {
                selectedLevel = Math.max(selectedLevel - 1, 0);
            } else if (e.code === 'ArrowDown') {
                if (selectedLevel + MAP_COLUMNS < levels.length) {
                    selectedLevel += MAP_COLUMNS;
                }
            } else if (e.code === 'ArrowUp') {
                if (selectedLevel - MAP_COLUMNS >= 0) {
                    selectedLevel -= MAP_COLUMNS;
                }
            } else if (e.code === 'Enter' || e.code === 'Space') {
                startGame(selectedLevel);
            } else if (e.code === 'Escape') {
                gameState = GAME_STATE.START_SCREEN;
            }
            // Number keys 1-9 and 0 for quick level select
            if (e.code >= 'Digit1' && e.code <= 'Digit9') {
                const lvl = parseInt(e.code.replace('Digit', '')) - 1;
                if (lvl < levels.length) {
                    selectedLevel = lvl;
                    startGame(lvl);
                }
            }
            if (e.code === 'Digit0' && levels.length >= 10) {
                selectedLevel = 9;
                startGame(9);
            }
            break;

        case GAME_STATE.PLAYING:
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
                player.velocityY = player.lift;
            } else if (e.code === 'Escape') {
                gameState = GAME_STATE.MAP_SCREEN;
            } else if (e.code === 'KeyP') {
                gameState = GAME_STATE.PAUSED;
            } else if (e.code === 'KeyR') {
                startGame(currentLevel); // Restart current level
            }
            // Press B to spawn boss immediately (for testing)
            if (e.code === 'KeyB' && boss && !boss.active) {
                boss.active = true;
                boss.warningTimer = 120;
                pipes = [];
                bossFightDuration = 1800; // 30 seconds at 60fps
                bossFightTimer = bossFightDuration;
                bossDefeated = false;
                bossDefeatTimer = 0;
                bossBeams = [];
                bossBeamTimer = 0;
            }
            break;

        case GAME_STATE.PAUSED:
            if (e.code === 'KeyP' || e.code === 'Escape') {
                gameState = GAME_STATE.PLAYING;
            } else if (e.code === 'KeyQ') {
                gameState = GAME_STATE.MAP_SCREEN;
            } else if (e.code === 'KeyR') {
                startGame(currentLevel);
            }
            break;

        case GAME_STATE.GAME_OVER:
            if (e.code === 'Space' || e.code === 'Enter') {
                gameState = GAME_STATE.MAP_SCREEN;
            } else if (e.code === 'KeyR') {
                startGame(currentLevel); // Retry same level
            }
            break;

        case GAME_STATE.LEVEL_COMPLETE:
            if (levelTransitionTimer <= 0) {
                if (e.code === 'Space' || e.code === 'Enter') {
                    if (currentLevel < levels.length - 1) {
                        loadLevel(currentLevel + 1);
                    } else {
                        gameState = GAME_STATE.MAP_SCREEN;
                    }
                }
            }
            break;
    }
});

document.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;    // Relationship bitmap vs. layout size
    const scaleY = canvas.height / rect.height;  // Relationship bitmap vs. layout size

    const mouseX = (e.clientX - rect.left) * scaleX; // Scale mouse coordinates
    const mouseY = (e.clientY - rect.top) * scaleY; // Scale mouse coordinates

    console.log(`[Mouse Click] Coords: (${mouseX}, ${mouseY}), Current State: ${gameState}`);

    if (gameState === GAME_STATE.MAP_SCREEN) {
        console.log('[MAP_SCREEN] Click detected.');
        let levelClicked = false;
        for (let i = 0; i < levels.length; i++) {
            const area = levels[i].clickableArea;
            console.log(`[MAP_SCREEN] Checking Level ${i + 1} Area: (${area.x}, ${area.y}) - ${area.width}x${area.height}`);
            if (mouseX >= area.x && mouseX <= area.x + area.width &&
                mouseY >= area.y && mouseY <= area.y + area.height) {
                console.log(`[MAP_SCREEN] Level ${i + 1} box clicked. Calling startGame(${i}).`);
                startGame(i); // Start selected level
                levelClicked = true;
                break;
            }
        }
        if (!levelClicked) {
            console.log('[MAP_SCREEN] Clicked outside any level box.');
        }
    } else if (gameState === GAME_STATE.LEVEL_COMPLETE) {
        console.log(`[LEVEL_COMPLETE] Click detected, Timer: ${levelTransitionTimer}`);
        if (levelTransitionTimer <= 0) { // Only allow click after timer runs out
            if (currentLevel < levels.length -1) {
                console.log(`[LEVEL_COMPLETE] Advancing to next level: ${currentLevel + 2}. Calling loadLevel(${currentLevel + 1}).`);
                loadLevel(currentLevel + 1);
            } else {
                console.log('[LEVEL_COMPLETE] Last level completed. Transitioning to MAP_SCREEN.');
                gameState = GAME_STATE.MAP_SCREEN;
            }
        } else {
            console.log(`[LEVEL_COMPLETE] Click ignored: Level transition still active (${levelTransitionTimer} frames remaining).`);
        }
    } else if (gameState === GAME_STATE.GAME_OVER) {
        console.log('[GAME_OVER] Click detected. Transitioning to MAP_SCREEN.');
        gameState = GAME_STATE.MAP_SCREEN;
    } else if (gameState === GAME_STATE.START_SCREEN) {
        console.log('[START_SCREEN] Click detected. No action for click in START_SCREEN.');
    } else {
        console.log(`[UNKNOWN STATE] Click detected in state: ${gameState}. No action.`);
    }
});


initGame();