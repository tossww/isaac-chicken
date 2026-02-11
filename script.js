const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants that can be changed by levels
let PIPE_WIDTH = 50;
let PIPE_GAP = 150;
let PIPE_SPEED = 3;
let PIPE_INTERVAL = 1400;
let backgroundColor = '#1a1a2e';
let pipeColor = '#00ffff';
let pipeOutlineColor = '#00aaaa';

const GROUND_HEIGHT = 50;
const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;

// ==================== GD-STYLE AUDIO SYSTEM ====================
const GDAudio = {
    ctx: null,
    masterGain: null,
    musicGain: null,
    sfxGain: null,
    muted: false,
    musicPlaying: false,
    _schedulerTimer: null,
    _nextBeatTime: 0,
    _currentStep: 0,
    _scheduledSources: [],
    _tempo: 140,
    _musicConfig: null,

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.35;
        this.musicGain.connect(this.masterGain);
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.5;
        this.sfxGain.connect(this.masterGain);
    },

    ensureResumed() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    toggleMute() {
        this.init();
        this.muted = !this.muted;
        this.masterGain.gain.value = this.muted ? 0 : 1;
    },

    // --- SFX ---
    playJump() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.08);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.08);
    },

    playDeath() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        // Noise burst
        const bufferSize = this.ctx.sampleRate * 0.3;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.4, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        noise.connect(noiseGain);
        noiseGain.connect(this.sfxGain);
        noise.start(t);
        noise.stop(t + 0.3);
        // Low drop
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.3);
        oscGain.gain.setValueAtTime(0.3, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.3);
    },

    playScore() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(1320, t + 0.15);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1760, t);
        osc2.frequency.exponentialRampToValueAtTime(2640, t + 0.15);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.15);
        osc2.start(t);
        osc2.stop(t + 0.15);
    },

    playLevelComplete() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5 E5 G5 C6 E6
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = freq;
            const start = t + i * 0.12;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(start);
            osc.stop(start + 0.25);
        });
    },

    playBossAppear() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        for (let i = 0; i < 3; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = 80;
            const start = t + i * 0.2;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.3, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(start);
            osc.stop(start + 0.15);
        }
        // Sub rumble
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sine';
        sub.frequency.value = 40;
        subGain.gain.setValueAtTime(0.25, t);
        subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        sub.connect(subGain);
        subGain.connect(this.sfxGain);
        sub.start(t);
        sub.stop(t + 0.6);
    },

    playBossDefeated() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const chord = [261.63, 329.63, 392.00, 523.25]; // C E G C
        chord.forEach((freq) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(t);
            osc.stop(t + 0.8);
        });
    },

    playMenuClick() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = 600;
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.03);
    },

    playPause() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(500, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.2);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.2);
    },

    // --- MUSIC SYSTEM (Step Sequencer) ---
    // 20 unique level music configs — each level has its own key, tempo, patterns, and timbre
    _levelConfigs: [
        // Lvl 1 — Neon Genesis: driving electronic, C minor
        { bpm: 128, scale: [130.81,146.83,155.56,174.61,196.00,207.65,233.08],
          melody:  [0,2,4,5, -1,3,5,6, 4,2,0,3, -1,5,4,2],
          bass:    [0,-1,0,-1, 3,-1,3,-1, 4,-1,4,-1, 3,-1,0,-1],
          kick:    [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
          hat:     [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          leadWave:'square', bassWave:'sawtooth', bassFilter:400, leadOct:2, bassOct:0.5 },

        // Lvl 2 — Solar Flare: warm swinging groove, D dorian
        { bpm: 135, scale: [146.83,164.81,174.61,196.00,220.00,246.94,261.63],
          melody:  [0,-1,3,2, 4,-1,5,4, 2,-1,0,3, 5,-1,4,-1],
          bass:    [0,-1,-1,0, -1,3,-1,-1, 4,-1,-1,4, -1,0,-1,-1],
          kick:    [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0],
          hat:     [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          leadWave:'sawtooth', bassWave:'sawtooth', bassFilter:500, leadOct:2, bassOct:0.5 },

        // Lvl 3 — Violet Storm: dark descending, E phrygian
        { bpm: 140, scale: [164.81,174.61,196.00,220.00,246.94,261.63,293.66],
          melody:  [6,5,4,3, 2,1,0,-1, 6,4,2,0, -1,3,5,6],
          bass:    [0,0,-1,2, 2,-1,3,3, -1,4,4,-1, 0,-1,2,-1],
          kick:    [1,0,1,0, 0,0,1,0, 1,0,1,0, 0,0,1,0],
          hat:     [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1],
          leadWave:'square', bassWave:'square', bassFilter:350, leadOct:2, bassOct:0.5 },

        // Lvl 4 — Toxic Rush: playful bouncing, F major
        { bpm: 120, scale: [174.61,196.00,220.00,233.08,261.63,293.66,329.63],
          melody:  [0,4,2,4, 0,5,3,5, 0,6,4,6, 0,4,2,-1],
          bass:    [0,-1,0,0, -1,3,-1,3, 4,-1,4,4, -1,0,-1,0],
          kick:    [1,0,0,0, 1,0,0,0, 1,0,1,0, 0,0,0,0],
          hat:     [1,0,0,1, 1,0,0,1, 1,0,0,1, 1,0,0,1],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          leadWave:'triangle', bassWave:'sawtooth', bassFilter:600, leadOct:2, bassOct:0.5 },

        // Lvl 5 — Crimson Blaze: aggressive stabs, A minor
        { bpm: 148, scale: [220.00,246.94,261.63,293.66,329.63,349.23,392.00],
          melody:  [0,-1,-1,4, -1,-1,3,-1, 0,-1,-1,5, -1,-1,4,-1],
          bass:    [0,0,-1,0, 0,-1,3,3, -1,3,3,-1, 4,4,-1,0],
          kick:    [1,0,1,0, 0,0,0,0, 1,0,1,0, 0,0,0,0],
          hat:     [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,1,0],
          leadWave:'sawtooth', bassWave:'sawtooth', bassFilter:300, leadOct:2, bassOct:0.5 },

        // Lvl 6 — Magenta Pulse: pulsing trance, Bb minor
        { bpm: 138, scale: [233.08,261.63,277.18,311.13,349.23,369.99,415.30],
          melody:  [0,0,4,4, 0,0,5,5, 0,0,3,3, 0,0,6,6],
          bass:    [0,0,0,0, 3,3,3,3, 4,4,4,4, 3,3,3,3],
          kick:    [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,1,0],
          hat:     [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          leadWave:'square', bassWave:'square', bassFilter:450, leadOct:2, bassOct:0.5 },

        // Lvl 7 — Aqua Depths: flowing underwater, C# minor
        { bpm: 110, scale: [138.59,155.56,164.81,185.00,207.65,220.00,246.94],
          melody:  [2,3,4,5, 6,5,4,3, 2,1,0,1, 2,3,4,-1],
          bass:    [0,-1,-1,-1, 0,-1,-1,-1, 3,-1,-1,-1, 4,-1,-1,-1],
          kick:    [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
          hat:     [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,0],
          leadWave:'sine', bassWave:'triangle', bassFilter:300, leadOct:2, bassOct:0.5 },

        // Lvl 8 — Frozen Circuit: glitchy stutter, F# minor
        { bpm: 150, scale: [185.00,207.65,220.00,246.94,277.18,293.66,329.63],
          melody:  [0,0,-1,3, 3,-1,5,5, -1,4,4,-1, 6,-1,0,0],
          bass:    [0,0,-1,-1, 3,-1,3,-1, -1,4,-1,4, 0,-1,-1,0],
          kick:    [1,0,0,0, 0,0,1,0, 0,0,1,0, 0,0,0,0],
          hat:     [1,1,0,0, 1,0,0,1, 0,1,1,0, 0,0,1,1],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1],
          leadWave:'square', bassWave:'sawtooth', bassFilter:350, leadOct:2, bassOct:0.5 },

        // Lvl 9 — Gold Rush: triumphant march, G major
        { bpm: 132, scale: [196.00,220.00,246.94,261.63,293.66,329.63,369.99],
          melody:  [0,2,4,6, 4,2,0,4, 6,4,2,0, 2,4,6,-1],
          bass:    [0,-1,0,-1, 2,-1,2,-1, 4,-1,4,-1, 2,-1,0,-1],
          kick:    [1,0,0,0, 1,0,0,0, 1,0,1,0, 0,0,0,0],
          hat:     [0,0,1,0, 0,0,1,0, 0,0,1,1, 0,0,1,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          leadWave:'sawtooth', bassWave:'sawtooth', bassFilter:500, leadOct:2, bassOct:0.5 },

        // Lvl 10 — Phantom Edge: eerie drifting, Bb phrygian
        { bpm: 118, scale: [233.08,246.94,277.18,311.13,349.23,369.99,415.30],
          melody:  [0,-1,1,-1, 2,-1,1,-1, 3,-1,2,-1, 1,-1,0,-1],
          bass:    [0,-1,-1,-1, -1,-1,-1,-1, 3,-1,-1,-1, -1,-1,-1,-1],
          kick:    [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
          hat:     [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
          leadWave:'triangle', bassWave:'sine', bassFilter:250, leadOct:1, bassOct:0.5 },

        // Lvl 11 — Electric Dawn: bright climbing, D major
        { bpm: 142, scale: [146.83,164.81,185.00,196.00,220.00,246.94,277.18],
          melody:  [0,1,2,3, 4,5,6,5, 4,3,2,1, 0,2,4,6],
          bass:    [0,-1,1,-1, 2,-1,3,-1, 4,-1,3,-1, 2,-1,0,-1],
          kick:    [1,0,0,0, 1,0,0,0, 1,0,0,1, 0,0,0,0],
          hat:     [1,0,1,0, 0,1,1,0, 1,0,1,0, 0,1,1,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          leadWave:'sawtooth', bassWave:'sawtooth', bassFilter:550, leadOct:2, bassOct:0.5 },

        // Lvl 12 — Cherry Blossom: gentle melody, Eb major
        { bpm: 112, scale: [155.56,174.61,196.00,207.65,233.08,261.63,293.66],
          melody:  [4,2,0,-1, 3,5,4,-1, 2,0,2,-1, 4,5,6,-1],
          bass:    [0,-1,-1,2, -1,-1,4,-1, -1,3,-1,-1, 0,-1,-1,-1],
          kick:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
          hat:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
          leadWave:'sine', bassWave:'triangle', bassFilter:400, leadOct:2, bassOct:0.5 },

        // Lvl 13 — Matrix Code: precise tech, A dorian
        { bpm: 146, scale: [220.00,246.94,261.63,293.66,329.63,369.99,392.00],
          melody:  [0,4,0,4, 2,5,2,5, 3,6,3,6, 4,0,4,0],
          bass:    [0,-1,0,-1, 0,-1,3,-1, 3,-1,3,-1, 3,-1,0,-1],
          kick:    [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,1,0],
          hat:     [1,0,1,0, 1,0,1,0, 0,1,0,1, 1,0,1,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          leadWave:'square', bassWave:'square', bassFilter:380, leadOct:2, bassOct:0.5 },

        // Lvl 14 — Sunset Strip: warm groovy, E major
        { bpm: 124, scale: [164.81,185.00,207.65,220.00,246.94,277.18,311.13],
          melody:  [0,2,4,-1, 6,4,2,-1, 0,3,5,-1, 6,5,3,-1],
          bass:    [0,-1,0,0, -1,0,-1,4, 3,-1,3,3, -1,3,-1,0],
          kick:    [1,0,0,0, 0,0,0,1, 1,0,0,0, 0,0,0,1],
          hat:     [0,0,1,0, 0,1,0,0, 0,0,1,0, 1,0,0,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          leadWave:'triangle', bassWave:'sawtooth', bassFilter:500, leadOct:2, bassOct:0.5 },

        // Lvl 15 — Shadow Realm: heavy dark, B phrygian
        { bpm: 136, scale: [246.94,261.63,293.66,329.63,369.99,392.00,440.00],
          melody:  [0,-1,0,3, -1,0,2,-1, 0,-1,0,4, -1,0,3,-1],
          bass:    [0,0,-1,0, 0,-1,3,3, -1,3,3,-1, 4,4,-1,0],
          kick:    [1,0,1,0, 0,0,1,0, 1,0,0,0, 1,0,1,0],
          hat:     [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1],
          leadWave:'sawtooth', bassWave:'sawtooth', bassFilter:280, leadOct:1, bassOct:0.5 },

        // Lvl 16 — Plasma Core: chaotic energy, Ab minor
        { bpm: 155, scale: [207.65,233.08,246.94,277.18,311.13,329.63,369.99],
          melody:  [5,2,6,0, 3,5,1,4, 6,0,3,5, 2,4,1,6],
          bass:    [0,-1,4,-1, 2,-1,5,-1, 3,-1,6,-1, 1,-1,0,-1],
          kick:    [1,0,0,1, 0,0,1,0, 0,1,0,0, 1,0,0,1],
          hat:     [1,0,1,1, 0,1,0,1, 1,1,0,1, 0,1,1,0],
          snare:   [0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,1,0],
          leadWave:'square', bassWave:'square', bassFilter:320, leadOct:2, bassOct:0.5 },

        // Lvl 17 — Arctic Glow: ethereal sparse, Gb major
        { bpm: 105, scale: [185.00,207.65,233.08,246.94,277.18,311.13,349.23],
          melody:  [-1,0,-1,4, -1,-1,6,-1, -1,2,-1,5, -1,-1,3,-1],
          bass:    [0,-1,-1,-1, -1,-1,-1,-1, -1,-1,-1,-1, 0,-1,-1,-1],
          kick:    [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
          hat:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
          leadWave:'sine', bassWave:'sine', bassFilter:250, leadOct:2, bassOct:0.5 },

        // Lvl 18 — Lava Flow: heavy driving, C# harmonic minor
        { bpm: 144, scale: [138.59,155.56,164.81,185.00,207.65,220.00,261.63],
          melody:  [0,0,3,3, 5,5,3,3, 0,0,4,4, 6,6,4,4],
          bass:    [0,0,-1,0, 3,3,-1,3, 4,4,-1,4, 3,3,-1,0],
          kick:    [1,0,0,0, 1,0,1,0, 0,0,1,0, 1,0,0,0],
          hat:     [0,0,1,0, 0,0,1,0, 1,0,1,0, 0,0,1,0],
          snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
          leadWave:'sawtooth', bassWave:'sawtooth', bassFilter:400, leadOct:2, bassOct:0.5 },

        // Lvl 19 — Star Field: dreamy floating, F# dorian
        { bpm: 115, scale: [185.00,207.65,220.00,246.94,277.18,311.13,329.63],
          melody:  [0,2,4,6, -1,5,3,1, 0,4,6,5, -1,3,1,0],
          bass:    [0,-1,-1,2, -1,-1,4,-1, 6,-1,-1,4, -1,-1,2,-1],
          kick:    [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,1,0],
          hat:     [0,0,0,1, 0,0,0,0, 0,0,0,1, 0,0,0,0],
          snare:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,0],
          leadWave:'triangle', bassWave:'triangle', bassFilter:350, leadOct:2, bassOct:0.5 },

        // Lvl 20 — Final Void: epic intense, D harmonic minor
        { bpm: 160, scale: [146.83,164.81,174.61,196.00,220.00,233.08,277.18],
          melody:  [0,4,6,4, 0,5,6,5, 0,3,6,3, 0,2,6,2],
          bass:    [0,-1,0,0, -1,0,-1,0, 4,-1,4,4, -1,4,-1,0],
          kick:    [1,0,0,0, 1,0,1,0, 1,0,0,0, 1,0,1,0],
          hat:     [1,0,1,0, 1,0,1,1, 1,0,1,0, 1,1,1,0],
          snare:   [0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,1,0],
          leadWave:'sawtooth', bassWave:'sawtooth', bassFilter:450, leadOct:2, bassOct:0.5 },
    ],

    getMusicConfig(levelIndex) {
        return this._levelConfigs[levelIndex % this._levelConfigs.length];
    },

    startMusic(levelIndex) {
        if (!this.ctx) return;
        this.stopMusic();
        this._musicConfig = this.getMusicConfig(levelIndex);
        this._tempo = this._musicConfig.bpm;
        this._currentStep = 0;
        this._nextBeatTime = this.ctx.currentTime + 0.05;
        this.musicPlaying = true;
        this._schedulerLoop();
    },

    stopMusic() {
        this.musicPlaying = false;
        if (this._schedulerTimer) {
            clearTimeout(this._schedulerTimer);
            this._schedulerTimer = null;
        }
        for (const src of this._scheduledSources) {
            try { src.stop(); } catch (e) {}
        }
        this._scheduledSources = [];
    },

    _schedulerLoop() {
        if (!this.musicPlaying) return;
        const lookAhead = 0.1;
        while (this._nextBeatTime < this.ctx.currentTime + lookAhead) {
            this._scheduleBeat(this._nextBeatTime, this._currentStep);
            const secPerBeat = 60.0 / this._tempo / 4;
            this._nextBeatTime += secPerBeat;
            this._currentStep = (this._currentStep + 1) % 16;
        }
        this._schedulerTimer = setTimeout(() => this._schedulerLoop(), 25);
    },

    _scheduleBeat(time, step) {
        const cfg = this._musicConfig;
        if (!cfg) return;
        const beatDur = 60.0 / this._tempo / 4;

        // Kick drum
        if (cfg.kick[step]) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(150, time);
            osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
            gain.gain.setValueAtTime(0.4, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
            osc.connect(gain);
            gain.connect(this.musicGain);
            osc.start(time);
            osc.stop(time + 0.12);
            this._scheduledSources.push(osc);
        }

        // Snare (noise burst + tone)
        if (cfg.snare && cfg.snare[step]) {
            const bufLen = this.ctx.sampleRate * 0.08;
            const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
            const d = buf.getChannelData(0);
            for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1);
            const src = this.ctx.createBufferSource();
            src.buffer = buf;
            const bpf = this.ctx.createBiquadFilter();
            bpf.type = 'bandpass';
            bpf.frequency.value = 3000;
            bpf.Q.value = 0.8;
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.2, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
            src.connect(bpf);
            bpf.connect(gain);
            gain.connect(this.musicGain);
            src.start(time);
            src.stop(time + 0.08);
            this._scheduledSources.push(src);
            // Snare tone body
            const osc = this.ctx.createOscillator();
            const tGain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, time);
            osc.frequency.exponentialRampToValueAtTime(120, time + 0.05);
            tGain.gain.setValueAtTime(0.15, time);
            tGain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
            osc.connect(tGain);
            tGain.connect(this.musicGain);
            osc.start(time);
            osc.stop(time + 0.06);
            this._scheduledSources.push(osc);
        }

        // Hi-hat
        if (cfg.hat[step]) {
            const bufLen = this.ctx.sampleRate * 0.04;
            const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
            const d = buf.getChannelData(0);
            for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1);
            const src = this.ctx.createBufferSource();
            src.buffer = buf;
            const hpf = this.ctx.createBiquadFilter();
            hpf.type = 'highpass';
            hpf.frequency.value = 8000;
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.15, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
            src.connect(hpf);
            hpf.connect(gain);
            gain.connect(this.musicGain);
            src.start(time);
            src.stop(time + 0.04);
            this._scheduledSources.push(src);
        }

        // Bass — per-level wave type and filter
        if (cfg.bass[step] >= 0) {
            const noteIdx = cfg.bass[step] % cfg.scale.length;
            const freq = cfg.scale[noteIdx] * (cfg.bassOct || 0.5);
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = cfg.bassWave || 'sawtooth';
            osc.frequency.value = freq;
            const dur = beatDur * 0.8;
            gain.gain.setValueAtTime(0.18, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
            const lpf = this.ctx.createBiquadFilter();
            lpf.type = 'lowpass';
            lpf.frequency.value = cfg.bassFilter || 400;
            osc.connect(lpf);
            lpf.connect(gain);
            gain.connect(this.musicGain);
            osc.start(time);
            osc.stop(time + dur);
            this._scheduledSources.push(osc);
        }

        // Lead melody — per-level wave type and octave
        const noteIdx = cfg.melody[step];
        if (noteIdx >= 0) {
            const freq = cfg.scale[noteIdx % cfg.scale.length] * (cfg.leadOct || 2);
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = cfg.leadWave || 'square';
            osc.frequency.value = freq;
            const dur = beatDur * 0.6;
            gain.gain.setValueAtTime(0.08, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
            osc.connect(gain);
            gain.connect(this.musicGain);
            osc.start(time);
            osc.stop(time + dur);
            this._scheduledSources.push(osc);
        }

        // Clean up old sources
        this._scheduledSources = this._scheduledSources.filter(s => {
            try { return s.context.currentTime < s._stopTime || true; } catch (e) { return false; }
        });
        if (this._scheduledSources.length > 64) {
            this._scheduledSources = this._scheduledSources.slice(-32);
        }
    }
};

// GD-style neon color palettes for all 20 levels
const levels = [
    { scoreToAdvance: 5, pipeSpeed: 3, pipeGap: 150, pipeInterval: 1400,
      bgColor: '#0a1628', pipeColor: '#00e5ff', pipeOutline: '#006680', theme: 'Neon Genesis',
      accent: '#00e5ff', accent2: '#004d66', groundColor1: '#0d1f3c', groundColor2: '#091428', groundLine: '#00e5ff',
      playerColor: '#00e5ff',
      decorations: [
          { type: 'grid', color: '#00e5ff', scrollFactor: 0.3 },
          { type: 'geoTriangle', color: '#00e5ff', minSize: 15, maxSize: 40, minY: 30, maxY: 200, count: 5, scrollFactor: 0.2 },
          { type: 'pulsingDot', color: '#00e5ff', minSize: 2, maxSize: 5, minY: 20, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 30, count: 12, scrollFactor: 0.1 },
          { type: 'bgPillar', color: '#00e5ff', minSize: 40, maxSize: 100, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 100, maxY: CANVAS_HEIGHT - GROUND_HEIGHT, count: 3, scrollFactor: 0.4 }
      ],
      boss: { name: 'Neon Genesis', color: '#003344', eyeColor: '#00e5ff', size: 50, attackType: 'aimed' } },
    { scoreToAdvance: 10, pipeSpeed: 3.5, pipeGap: 130, pipeInterval: 1300,
      bgColor: '#1a0f00', pipeColor: '#ff8c00', pipeOutline: '#804600', theme: 'Solar Flare',
      accent: '#ff8c00', accent2: '#663800', groundColor1: '#2a1800', groundColor2: '#1a0f00', groundLine: '#ff8c00',
      playerColor: '#ff8c00',
      decorations: [
          { type: 'grid', color: '#ff8c00', scrollFactor: 0.3 },
          { type: 'geoDiamond', color: '#ff8c00', minSize: 12, maxSize: 35, minY: 40, maxY: 180, count: 5, scrollFactor: 0.15 },
          { type: 'pulsingDot', color: '#ffaa33', minSize: 2, maxSize: 4, minY: 20, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 30, count: 10, scrollFactor: 0.08 },
          { type: 'bgPillar', color: '#ff8c00', minSize: 50, maxSize: 90, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 90, maxY: CANVAS_HEIGHT - GROUND_HEIGHT, count: 3, scrollFactor: 0.5 }
      ],
      boss: { name: 'Solar Flare', color: '#4d2600', eyeColor: '#ff8c00', size: 50, attackType: 'spread' } },
    { scoreToAdvance: 15, pipeSpeed: 4, pipeGap: 110, pipeInterval: 1200,
      bgColor: '#10002b', pipeColor: '#b44aff', pipeOutline: '#5a2580', theme: 'Violet Storm',
      accent: '#b44aff', accent2: '#5a2580', groundColor1: '#1a0040', groundColor2: '#10002b', groundLine: '#b44aff',
      playerColor: '#b44aff',
      decorations: [
          { type: 'grid', color: '#b44aff', scrollFactor: 0.25 },
          { type: 'geoHexagon', color: '#b44aff', minSize: 15, maxSize: 40, minY: 30, maxY: 160, count: 4, scrollFactor: 0.2 },
          { type: 'pulsingDot', color: '#d480ff', minSize: 2, maxSize: 5, minY: 10, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 20, count: 15, scrollFactor: 0.05 },
          { type: 'bgPillar', color: '#b44aff', minSize: 40, maxSize: 80, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 80, maxY: CANVAS_HEIGHT - GROUND_HEIGHT, count: 4, scrollFactor: 0.35 }
      ],
      boss: { name: 'Violet Storm', color: '#2d0066', eyeColor: '#d480ff', size: 55, attackType: 'lightning' } },
    { scoreToAdvance: 20, pipeSpeed: 3, pipeGap: 160, pipeInterval: 1500,
      bgColor: '#001a0a', pipeColor: '#39ff14', pipeOutline: '#1a8009', theme: 'Toxic Rush',
      accent: '#39ff14', accent2: '#1a8009', groundColor1: '#002a10', groundColor2: '#001a0a', groundLine: '#39ff14',
      playerColor: '#39ff14',
      decorations: [
          { type: 'grid', color: '#39ff14', scrollFactor: 0.3 },
          { type: 'geoTriangle', color: '#39ff14', minSize: 10, maxSize: 30, minY: 40, maxY: 200, count: 6, scrollFactor: 0.2 },
          { type: 'pulsingDot', color: '#66ff44', minSize: 2, maxSize: 4, minY: 20, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 30, count: 10, scrollFactor: 0.1 },
          { type: 'bgPillar', color: '#39ff14', minSize: 50, maxSize: 100, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 100, maxY: CANVAS_HEIGHT - GROUND_HEIGHT, count: 3, scrollFactor: 0.45 }
      ],
      boss: { name: 'Toxic Rush', color: '#003300', eyeColor: '#39ff14', size: 55, attackType: 'bounce' } },
    { scoreToAdvance: 25, pipeSpeed: 4.5, pipeGap: 120, pipeInterval: 1100,
      bgColor: '#1a0000', pipeColor: '#ff1744', pipeOutline: '#800b22', theme: 'Crimson Blaze',
      accent: '#ff1744', accent2: '#800b22', groundColor1: '#2a0505', groundColor2: '#1a0000', groundLine: '#ff1744',
      playerColor: '#ff1744',
      decorations: [
          { type: 'grid', color: '#ff1744', scrollFactor: 0.25 },
          { type: 'geoDiamond', color: '#ff1744', minSize: 12, maxSize: 30, minY: 30, maxY: 180, count: 5, scrollFactor: 0.18 },
          { type: 'pulsingDot', color: '#ff4466', minSize: 2, maxSize: 5, minY: 10, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 20, count: 12, scrollFactor: 0.06 },
          { type: 'bgPillar', color: '#ff1744', minSize: 40, maxSize: 90, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 90, maxY: CANVAS_HEIGHT - GROUND_HEIGHT, count: 4, scrollFactor: 0.4 }
      ],
      boss: { name: 'Crimson Blaze', color: '#330000', eyeColor: '#ff4466', size: 60, attackType: 'rain' } },
    { scoreToAdvance: 30, pipeSpeed: 5, pipeGap: 110, pipeInterval: 1000,
      bgColor: '#1a001a', pipeColor: '#ff00ff', pipeOutline: '#800080', theme: 'Magenta Pulse',
      accent: '#ff00ff', accent2: '#800080', groundColor1: '#2a0028', groundColor2: '#1a001a', groundLine: '#ff00ff',
      playerColor: '#ff00ff',
      decorations: [
          { type: 'grid', color: '#ff00ff', scrollFactor: 0.3 },
          { type: 'geoHexagon', color: '#ff00ff', minSize: 15, maxSize: 35, minY: 30, maxY: 170, count: 4, scrollFactor: 0.2 },
          { type: 'pulsingDot', color: '#ff66ff', minSize: 2, maxSize: 5, minY: 10, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 20, count: 14, scrollFactor: 0.05 },
          { type: 'bgPillar', color: '#ff00ff', minSize: 40, maxSize: 80, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 80, maxY: CANVAS_HEIGHT - GROUND_HEIGHT, count: 3, scrollFactor: 0.35 }
      ],
      boss: { name: 'Magenta Pulse', color: '#330033', eyeColor: '#ff66ff', size: 60, attackType: 'burst' } },
    { scoreToAdvance: 35, pipeSpeed: 4, pipeGap: 150, pipeInterval: 1400,
      bgColor: '#001a1a', pipeColor: '#00ffcc', pipeOutline: '#008066', theme: 'Aqua Depths',
      accent: '#00ffcc', accent2: '#008066', groundColor1: '#002a28', groundColor2: '#001a1a', groundLine: '#00ffcc',
      playerColor: '#00ffcc',
      decorations: [
          { type: 'grid', color: '#00ffcc', scrollFactor: 0.25 },
          { type: 'geoTriangle', color: '#00ffcc', minSize: 12, maxSize: 35, minY: 40, maxY: 190, count: 5, scrollFactor: 0.15 },
          { type: 'pulsingDot', color: '#66ffdd', minSize: 2, maxSize: 4, minY: 20, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 30, count: 10, scrollFactor: 0.08 },
          { type: 'bgPillar', color: '#00ffcc', minSize: 50, maxSize: 100, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 100, maxY: CANVAS_HEIGHT - GROUND_HEIGHT, count: 3, scrollFactor: 0.4 }
      ],
      boss: { name: 'Aqua Depths', color: '#003333', eyeColor: '#00ffcc', size: 55, attackType: 'wave' } },
    { scoreToAdvance: 40, pipeSpeed: 5.5, pipeGap: 110, pipeInterval: 950,
      bgColor: '#000d1a', pipeColor: '#4488ff', pipeOutline: '#224480', theme: 'Frozen Circuit',
      accent: '#4488ff', accent2: '#224480', groundColor1: '#001428', groundColor2: '#000d1a', groundLine: '#4488ff',
      playerColor: '#4488ff',
      decorations: [
          { type: 'grid', color: '#4488ff', scrollFactor: 0.3 },
          { type: 'geoDiamond', color: '#4488ff', minSize: 12, maxSize: 30, minY: 30, maxY: 160, count: 5, scrollFactor: 0.2 },
          { type: 'pulsingDot', color: '#88aaff', minSize: 2, maxSize: 5, minY: 10, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 20, count: 12, scrollFactor: 0.05 },
          { type: 'bgPillar', color: '#4488ff', minSize: 40, maxSize: 90, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 90, maxY: CANVAS_HEIGHT - GROUND_HEIGHT, count: 4, scrollFactor: 0.35 }
      ],
      boss: { name: 'Frozen Circuit', color: '#001133', eyeColor: '#88aaff', size: 60, attackType: 'spiral' } },
    { scoreToAdvance: 45, pipeSpeed: 6, pipeGap: 100, pipeInterval: 900,
      bgColor: '#0d0022', pipeColor: '#7b68ee', pipeOutline: '#3d3477', theme: 'Shadow Realm',
      accent: '#7b68ee', accent2: '#3d3477', groundColor1: '#140033', groundColor2: '#0d0022', groundLine: '#7b68ee',
      playerColor: '#7b68ee',
      decorations: [
          { type: 'grid', color: '#7b68ee', scrollFactor: 0.2 },
          { type: 'geoHexagon', color: '#7b68ee', minSize: 15, maxSize: 40, minY: 20, maxY: 150, count: 4, scrollFactor: 0.15 },
          { type: 'pulsingDot', color: '#a090ff', minSize: 2, maxSize: 5, minY: 10, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 20, count: 18, scrollFactor: 0.04 },
          { type: 'bgPillar', color: '#7b68ee', minSize: 40, maxSize: 80, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 80, maxY: CANVAS_HEIGHT - GROUND_HEIGHT, count: 4, scrollFactor: 0.3 }
      ],
      boss: { name: 'Shadow Realm', color: '#1a0044', eyeColor: '#a090ff', size: 65, attackType: 'homing' } },
    { scoreToAdvance: 50, pipeSpeed: 6.5, pipeGap: 90, pipeInterval: 850,
      bgColor: '#0d0d2b', pipeColor: '#e040fb', pipeOutline: '#70207d', theme: 'Cosmic Void',
      accent: '#e040fb', accent2: '#70207d', groundColor1: '#14143a', groundColor2: '#0d0d2b', groundLine: '#e040fb',
      playerColor: '#e040fb',
      decorations: [
          { type: 'grid', color: '#e040fb', scrollFactor: 0.15 },
          { type: 'geoTriangle', color: '#e040fb', minSize: 10, maxSize: 35, minY: 20, maxY: 180, count: 6, scrollFactor: 0.1 },
          { type: 'pulsingDot', color: '#ffffff', minSize: 1, maxSize: 4, minY: 0, maxY: CANVAS_HEIGHT - GROUND_HEIGHT, count: 30, scrollFactor: 0.03 },
          { type: 'bgPillar', color: '#e040fb', minSize: 50, maxSize: 100, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 100, maxY: CANVAS_HEIGHT - GROUND_HEIGHT, count: 3, scrollFactor: 0.25 }
      ],
      boss: { name: 'Cosmic Void', color: '#1a0033', eyeColor: '#ff80ff', size: 70, attackType: 'chaos' } },
    // --- LEVELS 11-20 ---
    { scoreToAdvance: 10, pipeSpeed: 3.5, pipeGap: 160, pipeInterval: 1500,
      bgColor: '#001a1a', pipeColor: '#00fff0', pipeOutline: '#007a77', theme: 'Crystal Matrix',
      accent: '#00fff0', accent2: '#007a77', groundColor1: '#002828', groundColor2: '#001a1a', groundLine: '#00fff0',
      playerColor: '#00fff0',
      decorations: [
          { type: 'grid', color: '#00fff0', scrollFactor: 0.3 },
          { type: 'geoDiamond', color: '#00fff0', minSize: 12, maxSize: 30, minY: 30, maxY: 200, count: 5, scrollFactor: 0.2 },
          { type: 'pulsingDot', color: '#66ffee', minSize: 2, maxSize: 5, minY: 20, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 30, count: 12, scrollFactor: 0.1 },
          { type: 'bgPillar', color: '#00fff0', minSize: 40, maxSize: 90, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 90, maxY: CANVAS_HEIGHT - GROUND_HEIGHT, count: 3, scrollFactor: 0.4 }
      ],
      boss: { name: 'Crystal Guardian', color: '#004040', eyeColor: '#66ffee', size: 55, attackType: 'bounce' } },
    { scoreToAdvance: 20, pipeSpeed: 4.5, pipeGap: 120, pipeInterval: 1100,
      bgColor: '#1a1a2e', pipeColor: '#e94560', pipeOutline: '#752230', theme: 'Neon City',
      accent: '#e94560', accent2: '#752230', groundColor1: '#22223a', groundColor2: '#1a1a2e', groundLine: '#e94560',
      playerColor: '#e94560',
      decorations: [
          { type: 'grid', color: '#e94560', scrollFactor: 0.25 },
          { type: 'geoTriangle', color: '#e94560', minSize: 12, maxSize: 35, minY: 30, maxY: 180, count: 5, scrollFactor: 0.18 },
          { type: 'pulsingDot', color: '#16c79a', minSize: 2, maxSize: 4, minY: 10, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 20, count: 14, scrollFactor: 0.06 },
          { type: 'bgPillar', color: '#e94560', minSize: 50, maxSize: 90, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 90, maxY: CANVAS_HEIGHT - GROUND_HEIGHT, count: 4, scrollFactor: 0.35 }
      ],
      boss: { name: 'Neon Overlord', color: '#440018', eyeColor: '#16c79a', size: 60, attackType: 'spread' } },
    { scoreToAdvance: 30, pipeSpeed: 5.5, pipeGap: 100, pipeInterval: 950,
      bgColor: '#001a00', pipeColor: '#00ff88', pipeOutline: '#008044', theme: 'Emerald Abyss',
      accent: '#00ff88', accent2: '#008044', groundColor1: '#002800', groundColor2: '#001a00', groundLine: '#00ff88',
      playerColor: '#00ff88',
      decorations: [
          { type: 'grid', color: '#00ff88', scrollFactor: 0.2 },
          { type: 'geoHexagon', color: '#00ff88', minSize: 15, maxSize: 40, minY: 30, maxY: 160, count: 4, scrollFactor: 0.15 },
          { type: 'pulsingDot', color: '#66ffaa', minSize: 2, maxSize: 5, minY: 10, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 20, count: 12, scrollFactor: 0.05 },
          { type: 'bgPillar', color: '#00ff88', minSize: 40, maxSize: 80, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 80, maxY: CANVAS_HEIGHT - GROUND_HEIGHT, count: 4, scrollFactor: 0.3 }
      ],
      boss: { name: 'Forest Wraith', color: '#003300', eyeColor: '#66ffaa', size: 60, attackType: 'homing' } },
    { scoreToAdvance: 15, pipeSpeed: 3, pipeGap: 150, pipeInterval: 1400,
      bgColor: '#00101a', pipeColor: '#44ccff', pipeOutline: '#226680', theme: 'Frozen Lake',
      accent: '#44ccff', accent2: '#226680', groundColor1: '#001828', groundColor2: '#00101a', groundLine: '#44ccff',
      playerColor: '#44ccff',
      decorations: [
          { type: 'grid', color: '#44ccff', scrollFactor: 0.3 },
          { type: 'geoTriangle', color: '#44ccff', minSize: 10, maxSize: 30, minY: 40, maxY: 200, count: 5, scrollFactor: 0.2 },
          { type: 'pulsingDot', color: '#88ddff', minSize: 2, maxSize: 5, minY: 20, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 30, count: 10, scrollFactor: 0.08 },
          { type: 'bgPillar', color: '#44ccff', minSize: 50, maxSize: 100, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 100, maxY: CANVAS_HEIGHT - GROUND_HEIGHT, count: 3, scrollFactor: 0.4 }
      ],
      boss: { name: 'Frost Giant', color: '#002244', eyeColor: '#88ddff', size: 55, attackType: 'aimed' } },
    { scoreToAdvance: 35, pipeSpeed: 5.5, pipeGap: 105, pipeInterval: 900,
      bgColor: '#1a0500', pipeColor: '#ff3300', pipeOutline: '#801a00', theme: 'Magma Core',
      accent: '#ff3300', accent2: '#801a00', groundColor1: '#2a0a00', groundColor2: '#1a0500', groundLine: '#ff3300',
      playerColor: '#ff3300',
      decorations: [
          { type: 'grid', color: '#ff3300', scrollFactor: 0.25 },
          { type: 'geoDiamond', color: '#ff3300', minSize: 12, maxSize: 35, minY: 30, maxY: 180, count: 5, scrollFactor: 0.18 },
          { type: 'pulsingDot', color: '#ff6633', minSize: 2, maxSize: 5, minY: 10, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 20, count: 14, scrollFactor: 0.05 },
          { type: 'bgPillar', color: '#ff3300', minSize: 40, maxSize: 90, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 90, maxY: CANVAS_HEIGHT - GROUND_HEIGHT, count: 4, scrollFactor: 0.35 }
      ],
      boss: { name: 'Magma Lord', color: '#440000', eyeColor: '#ff6633', size: 65, attackType: 'rain' } },
    { scoreToAdvance: 20, pipeSpeed: 4, pipeGap: 140, pipeInterval: 1200,
      bgColor: '#0a0a23', pipeColor: '#00ff41', pipeOutline: '#008020', theme: 'Cyber Grid',
      accent: '#00ff41', accent2: '#008020', groundColor1: '#101030', groundColor2: '#0a0a23', groundLine: '#00ff41',
      playerColor: '#00ff41',
      decorations: [
          { type: 'grid', color: '#00ff41', scrollFactor: 0.3 },
          { type: 'geoHexagon', color: '#00ff41', minSize: 12, maxSize: 35, minY: 30, maxY: 170, count: 4, scrollFactor: 0.2 },
          { type: 'pulsingDot', color: '#39ff14', minSize: 1, maxSize: 3, minY: 0, maxY: CANVAS_HEIGHT - GROUND_HEIGHT, count: 20, scrollFactor: 0.08 },
          { type: 'bgPillar', color: '#00ff41', minSize: 50, maxSize: 100, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 100, maxY: CANVAS_HEIGHT - GROUND_HEIGHT, count: 3, scrollFactor: 0.4 }
      ],
      boss: { name: 'Cyber Sentinel', color: '#002200', eyeColor: '#39ff14', size: 55, attackType: 'lightning' } },
    { scoreToAdvance: 40, pipeSpeed: 5, pipeGap: 110, pipeInterval: 950,
      bgColor: '#14001a', pipeColor: '#cc44ff', pipeOutline: '#662280', theme: 'Toxic Swamp',
      accent: '#cc44ff', accent2: '#662280', groundColor1: '#1e0028', groundColor2: '#14001a', groundLine: '#cc44ff',
      playerColor: '#cc44ff',
      decorations: [
          { type: 'grid', color: '#cc44ff', scrollFactor: 0.2 },
          { type: 'geoTriangle', color: '#cc44ff', minSize: 12, maxSize: 35, minY: 30, maxY: 180, count: 5, scrollFactor: 0.15 },
          { type: 'pulsingDot', color: '#dd77ff', minSize: 2, maxSize: 5, minY: 10, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 20, count: 14, scrollFactor: 0.04 },
          { type: 'bgPillar', color: '#cc44ff', minSize: 40, maxSize: 80, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 80, maxY: CANVAS_HEIGHT - GROUND_HEIGHT, count: 4, scrollFactor: 0.3 }
      ],
      boss: { name: 'Swamp Horror', color: '#220033', eyeColor: '#dd77ff', size: 65, attackType: 'wave' } },
    { scoreToAdvance: 15, pipeSpeed: 3.5, pipeGap: 145, pipeInterval: 1350,
      bgColor: '#0c0c3a', pipeColor: '#ffd700', pipeOutline: '#806c00', theme: 'Starfall Galaxy',
      accent: '#ffd700', accent2: '#806c00', groundColor1: '#121248', groundColor2: '#0c0c3a', groundLine: '#ffd700',
      playerColor: '#ffd700',
      decorations: [
          { type: 'grid', color: '#ffd700', scrollFactor: 0.15 },
          { type: 'geoDiamond', color: '#ffd700', minSize: 10, maxSize: 30, minY: 20, maxY: 180, count: 6, scrollFactor: 0.1 },
          { type: 'pulsingDot', color: '#ffffff', minSize: 1, maxSize: 4, minY: 0, maxY: CANVAS_HEIGHT / 2, count: 30, scrollFactor: 0.03 },
          { type: 'bgPillar', color: '#ffd700', minSize: 50, maxSize: 100, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 100, maxY: CANVAS_HEIGHT - GROUND_HEIGHT, count: 3, scrollFactor: 0.25 }
      ],
      boss: { name: 'Star Keeper', color: '#1a1a00', eyeColor: '#ffd700', size: 55, attackType: 'spread' } },
    { scoreToAdvance: 50, pipeSpeed: 6, pipeGap: 95, pipeInterval: 850,
      bgColor: '#1a0000', pipeColor: '#ff0044', pipeOutline: '#800022', theme: 'Blood Moon',
      accent: '#ff0044', accent2: '#800022', groundColor1: '#280005', groundColor2: '#1a0000', groundLine: '#ff0044',
      playerColor: '#ff0044',
      decorations: [
          { type: 'grid', color: '#ff0044', scrollFactor: 0.2 },
          { type: 'geoHexagon', color: '#ff0044', minSize: 15, maxSize: 40, minY: 20, maxY: 150, count: 4, scrollFactor: 0.15 },
          { type: 'pulsingDot', color: '#ff3366', minSize: 2, maxSize: 5, minY: 10, maxY: CANVAS_HEIGHT - GROUND_HEIGHT - 20, count: 16, scrollFactor: 0.04 },
          { type: 'bgPillar', color: '#ff0044', minSize: 40, maxSize: 90, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 90, maxY: CANVAS_HEIGHT - GROUND_HEIGHT, count: 4, scrollFactor: 0.3 }
      ],
      boss: { name: 'Blood Moon Titan', color: '#330000', eyeColor: '#ff3366', size: 70, attackType: 'burst' } },
    { scoreToAdvance: Infinity, pipeSpeed: 7, pipeGap: 85, pipeInterval: 800,
      bgColor: '#050510', pipeColor: '#ffffff', pipeOutline: '#666666', theme: 'The Void',
      accent: '#ffffff', accent2: '#666666', groundColor1: '#0a0a18', groundColor2: '#050510', groundLine: '#ffffff',
      playerColor: '#ffffff',
      decorations: [
          { type: 'grid', color: '#ffffff', scrollFactor: 0.1 },
          { type: 'geoTriangle', color: '#ffffff', minSize: 10, maxSize: 35, minY: 20, maxY: 180, count: 5, scrollFactor: 0.08 },
          { type: 'pulsingDot', color: 'rgba(255,255,255,0.5)', minSize: 1, maxSize: 3, minY: 0, maxY: CANVAS_HEIGHT, count: 40, scrollFactor: 0.02 },
          { type: 'bgPillar', color: '#ffffff', minSize: 40, maxSize: 80, minY: CANVAS_HEIGHT - GROUND_HEIGHT - 80, maxY: CANVAS_HEIGHT - GROUND_HEIGHT, count: 3, scrollFactor: 0.2 }
      ],
      boss: { name: 'The Void King', color: '#222222', eyeColor: '#ffffff', size: 75, attackType: 'chaos' } },
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

// Touch/mobile detection
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

// Touch button areas (set during draw, used for hit testing)
const touchButtons = {
    pause: null,   // { x, y, w, h }
    restart: null,
    back: null
};

// Game variables
let score = 0;
let levelScore = 0;
let currentLevel = 0;
let pipes = [];
let activeDecorations = [];
let lastPipeTime = 0;
let levelTransitionTimer = 0;
let boss = null;
let bossProjectiles = [];
let bossShootTimer = 0;
let bossFightTimer = 0;
let bossFightDuration = 0;
let bossDefeated = false;
let bossDefeatTimer = 0;
let bossBeams = [];
let bossBeamTimer = 0;

// GD-style player state
let playerRotation = 0;
let playerTrail = []; // Array of { x, y, alpha, size, color }
let groundScrollOffset = 0;
let gameTime = 0; // Global frame counter for animations

// Death particle system
let deathParticles = [];
let deathAnimationTimer = 0;
const DEATH_ANIMATION_DURATION = 40;

// Player (Chicken) object
const player = {
    x: 50,
    y: CANVAS_HEIGHT / 2,
    width: 30,
    height: 30,
    color: '#00e5ff',
    velocityY: 0,
    gravity: 0.5,
    lift: -8,
    onGround: false,
    onPipe: false,
};

function loadLevel(levelIndex) {
    if (levelIndex >= levels.length) {
        endGame(true);
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
    activeDecorations = [];
    player.y = CANVAS_HEIGHT / 2;
    player.velocityY = 0;
    player.color = level.playerColor || level.accent || '#00e5ff';
    playerRotation = 0;
    playerTrail = [];
    deathParticles = [];
    deathAnimationTimer = 0;

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
            if (decoConfig.type === 'grid') continue; // Grid is drawn directly, not as individual decorations
            if (decoConfig.count) {
                for (let i = 0; i < decoConfig.count; i++) {
                    activeDecorations.push(createDecoration(decoConfig, i * (CANVAS_WIDTH / decoConfig.count)));
                }
            }
        }
    }

    GDAudio.playLevelComplete();
    GDAudio.stopMusic();
    gameState = GAME_STATE.LEVEL_COMPLETE;
    levelTransitionTimer = 120;
}

function createDecoration(config, initialX) {
    let size = Math.random() * (config.maxSize - config.minSize) + config.minSize;
    let y = Math.random() * (config.maxY - config.minY) + config.minY;
    let x = initialX !== undefined ? initialX : CANVAS_WIDTH + Math.random() * CANVAS_WIDTH;

    const deco = {
        type: config.type,
        color: config.color,
        x: x,
        y: y,
        size: size,
        scrollFactor: config.scrollFactor,
        config: config,
        phase: Math.random() * Math.PI * 2, // Random phase for pulsing animations
        rotationSpeed: (Math.random() - 0.5) * 0.02
    };

    return deco;
}


function initGame() {
    gameState = GAME_STATE.START_SCREEN;
    gameLoop();
}

function startGame(levelIndex = 0) {
    score = 0;
    loadLevel(levelIndex);
    lastPipeTime = Date.now();
    gameState = GAME_STATE.PLAYING;
    GDAudio.startMusic(levelIndex);
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
    requestAnimationFrame(gameLoop);
}

function update() {
    gameTime++;

    switch (gameState) {
        case GAME_STATE.PLAYING:
            player.velocityY += player.gravity;
            player.y += player.velocityY;

            // Update player rotation (GD-style: rotate toward velocity)
            if (!player.onGround && !player.onPipe) {
                playerRotation += 0.08; // Constant rotation while airborne
            } else {
                // Snap rotation to nearest 90 degrees when on ground
                const target = Math.round(playerRotation / (Math.PI / 2)) * (Math.PI / 2);
                playerRotation += (target - playerRotation) * 0.3;
            }

            // Update ground scroll
            groundScrollOffset = (groundScrollOffset + PIPE_SPEED) % 30;

            // Update player trail
            if (gameTime % 2 === 0) {
                playerTrail.push({
                    x: player.x + player.width / 2,
                    y: player.y + player.height / 2,
                    alpha: 0.7,
                    size: player.width * 0.6,
                    color: player.color
                });
            }
            for (let i = playerTrail.length - 1; i >= 0; i--) {
                playerTrail[i].alpha -= 0.04;
                playerTrail[i].size *= 0.95;
                if (playerTrail[i].alpha <= 0) {
                    playerTrail.splice(i, 1);
                }
            }

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
                        GDAudio.playScore();
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
                    bossFightDuration = 1800;
                    bossFightTimer = bossFightDuration;
                    bossDefeated = false;
                    bossDefeatTimer = 0;
                    GDAudio.playBossAppear();
                }

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
                    lastPipeTime = Date.now();

                    if (boss.x > boss.targetX) {
                        boss.x -= 2;
                        if (boss.x < boss.targetX) boss.x = boss.targetX;
                    }
                    boss.time += 0.03;
                    const centerY = (CANVAS_HEIGHT - GROUND_HEIGHT) / 2;
                    boss.y = centerY + Math.sin(boss.time) * 80;
                    if (boss.warningTimer > 0) boss.warningTimer--;

                    if (boss.x <= boss.targetX) {
                        bossFightTimer--;
                        if (bossFightTimer <= 0) {
                            bossDefeated = true;
                            bossDefeatTimer = 0;
                            bossProjectiles = [];
                            bossBeams = [];
                            GDAudio.playBossDefeated();
                        }

                        bossBeamTimer++;
                        const beamInterval = Math.max(120, 360 - currentLevel * 25);
                        if (bossBeamTimer >= beamInterval && bossBeams.length === 0) {
                            bossBeamTimer = 0;
                            const targetY = Math.max(30, Math.min(player.y + player.height / 2, CANVAS_HEIGHT - GROUND_HEIGHT - 30));
                            bossBeams.push({
                                y: targetY,
                                phase: 'anticipation',
                                timer: 0,
                                anticipationDuration: Math.max(60, 120 - currentLevel * 4),
                                fireDuration: 30 + currentLevel * 4,
                                beamHeight: 28 + currentLevel * 4,
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
                        if (beam.phase === 'firing') {
                            const playerCY = player.y + player.height / 2;
                            if (Math.abs(playerCY - beam.y) < beam.beamHeight / 2 + player.height / 2) {
                                endGame();
                            }
                        }
                    }

                    // Boss-player collision
                    const hitSize = boss.size * 0.8;
                    const playerCenterX = player.x + player.width / 2;
                    const playerCenterY = player.y + player.height / 2;
                    const dx = Math.abs(playerCenterX - boss.x);
                    const dy = Math.abs(playerCenterY - boss.y);
                    if (dx < hitSize + player.width / 2 && dy < hitSize + player.height / 2) {
                        endGame();
                    }

                    // Boss attack
                    const diff = 1 + currentLevel * 0.05;
                    bossShootTimer++;
                    const aimDx = playerCenterX - boss.x;
                    const aimDy = playerCenterY - boss.y;
                    const aimDist = Math.sqrt(aimDx * aimDx + aimDy * aimDy);

                    switch (boss.attackType) {
                        case 'aimed': {
                            if (bossShootTimer >= 150) {
                                bossShootTimer = 0;
                                const spd = 3.5 * diff;
                                bossProjectiles.push({ x: boss.x, y: boss.y, vx: (aimDx / aimDist) * spd, vy: (aimDy / aimDist) * spd, size: 8, type: 'normal', color: '#66BB6A' });
                            }
                            break;
                        }
                        case 'spread': {
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
                        case 'lightning': {
                            if (bossShootTimer >= 100) {
                                bossShootTimer = 0;
                                const strikeY = 30 + Math.random() * (CANVAS_HEIGHT - GROUND_HEIGHT - 60);
                                bossProjectiles.push({ x: CANVAS_WIDTH + 10, y: strikeY, vx: -7 * diff, vy: 0, size: 6, type: 'lightning', color: '#E040FB' });
                            }
                            break;
                        }
                        case 'bounce': {
                            if (bossShootTimer >= 140) {
                                bossShootTimer = 0;
                                const spd = 3.5 * diff;
                                bossProjectiles.push({ x: boss.x, y: boss.y, vx: (aimDx / aimDist) * spd, vy: (aimDy / aimDist) * spd, size: 9, type: 'bounce', color: '#FFB74D', bounces: 0 });
                            }
                            break;
                        }
                        case 'rain': {
                            if (bossShootTimer >= 50) {
                                bossShootTimer = 0;
                                const ry = 20 + Math.random() * (CANVAS_HEIGHT - GROUND_HEIGHT - 40);
                                bossProjectiles.push({ x: CANVAS_WIDTH + 10, y: ry, vx: -(3 + Math.random() * 2) * diff, vy: (Math.random() - 0.5) * 2, size: 6, type: 'normal', color: '#FF3D00' });
                            }
                            break;
                        }
                        case 'burst': {
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
                        case 'wave': {
                            if (bossShootTimer >= 110) {
                                bossShootTimer = 0;
                                const spd = 3.5 * diff;
                                bossProjectiles.push({ x: boss.x, y: boss.y, vx: -spd, vy: 0, size: 8, type: 'wave', color: '#00B0FF', waveTime: 0, baseY: boss.y });
                            }
                            break;
                        }
                        case 'spiral': {
                            if (bossShootTimer >= 14) {
                                bossShootTimer = 0;
                                boss.spiralAngle += 0.35;
                                const spd = 3 * diff;
                                bossProjectiles.push({ x: boss.x, y: boss.y, vx: Math.cos(boss.spiralAngle) * spd, vy: Math.sin(boss.spiralAngle) * spd, size: 5, type: 'normal', color: '#448AFF' });
                            }
                            break;
                        }
                        case 'homing': {
                            if (bossShootTimer >= 120) {
                                bossShootTimer = 0;
                                const spd = 2.5 * diff;
                                const angle = Math.atan2(aimDy, aimDx) + (Math.random() - 0.5) * 1.5;
                                bossProjectiles.push({ x: boss.x, y: boss.y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, size: 10, type: 'homing', color: '#B388FF' });
                            }
                            break;
                        }
                        case 'chaos': {
                            if (bossShootTimer >= 70) {
                                bossShootTimer = 0;
                                const pick = Math.floor(Math.random() * 5);
                                const spd = 4 * diff;
                                if (pick === 0) {
                                    bossProjectiles.push({ x: boss.x, y: boss.y, vx: (aimDx / aimDist) * spd, vy: (aimDy / aimDist) * spd, size: 8, type: 'normal', color: '#EA80FC' });
                                } else if (pick === 1) {
                                    const baseAngle = Math.atan2(aimDy, aimDx);
                                    for (let a = -1; a <= 1; a++) {
                                        const angle = baseAngle + a * 0.3;
                                        bossProjectiles.push({ x: boss.x, y: boss.y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, size: 7, type: 'normal', color: '#EA80FC' });
                                    }
                                } else if (pick === 2) {
                                    for (let i = 0; i < 6; i++) {
                                        const angle = (i / 6) * Math.PI * 2;
                                        bossProjectiles.push({ x: boss.x, y: boss.y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, size: 6, type: 'normal', color: '#EA80FC' });
                                    }
                                } else if (pick === 3) {
                                    const strikeY = 30 + Math.random() * (CANVAS_HEIGHT - GROUND_HEIGHT - 60);
                                    bossProjectiles.push({ x: CANVAS_WIDTH + 10, y: strikeY, vx: -8 * diff, vy: 0, size: 7, type: 'lightning', color: '#EA80FC' });
                                } else {
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

                if (proj.type === 'homing') {
                    proj.life = (proj.life || 0) + 1;
                    // Homing only tracks for ~3 seconds, then flies straight
                    if (proj.life < 180) {
                        const pCX = player.x + player.width / 2;
                        const pCY = player.y + player.height / 2;
                        const hdx = pCX - proj.x;
                        const hdy = pCY - proj.y;
                        const hd = Math.sqrt(hdx * hdx + hdy * hdy);
                        if (hd > 0) {
                            const homingStrength = Math.min(0.06 + currentLevel * 0.005, 0.12);
                            proj.vx += (hdx / hd) * homingStrength;
                            proj.vy += (hdy / hd) * homingStrength;
                        }
                    }
                    const maxSpd = Math.min(3 + currentLevel * 0.12, 4.5);
                    const speed = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy);
                    if (speed > maxSpd) { proj.vx = (proj.vx / speed) * maxSpd; proj.vy = (proj.vy / speed) * maxSpd; }
                } else if (proj.type === 'wave') {
                    proj.waveTime += 0.1;
                    proj.y = proj.baseY + Math.sin(proj.waveTime) * 60;
                } else if (proj.type === 'bounce') {
                    if (proj.y - proj.size <= 0) { proj.vy = Math.abs(proj.vy); proj.bounces++; }
                    if (proj.y + proj.size >= CANVAS_HEIGHT - GROUND_HEIGHT) { proj.vy = -Math.abs(proj.vy); proj.bounces++; }
                }

                proj.x += proj.vx;
                proj.y += proj.vy;

                const offscreen = proj.x < -30 || proj.x > CANVAS_WIDTH + 30 || proj.y < -30 || proj.y > CANVAS_HEIGHT + 30;
                if (proj.type === 'bounce' && proj.bounces >= 3) {
                    bossProjectiles.splice(i, 1);
                    continue;
                }
                if (offscreen && proj.type !== 'bounce') {
                    bossProjectiles.splice(i, 1);
                    continue;
                }

                const pCX = player.x + player.width / 2;
                const pCY = player.y + player.height / 2;
                const pdx = proj.x - pCX;
                const pdy = proj.y - pCY;
                if (Math.sqrt(pdx * pdx + pdy * pdy) < proj.size + player.width / 2) {
                    endGame();
                    break;
                }
            }

            // Only advance by score if boss isn't active
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
                gameState = GAME_STATE.PLAYING;
                GDAudio.startMusic(currentLevel);
            }
            break;
        case GAME_STATE.GAME_OVER:
            // Update death particles
            if (deathParticles.length > 0) {
                deathAnimationTimer++;
                for (let i = deathParticles.length - 1; i >= 0; i--) {
                    const p = deathParticles[i];
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += 0.15; // gravity
                    p.alpha -= 0.02;
                    p.rotation += p.rotSpeed;
                    if (p.alpha <= 0) deathParticles.splice(i, 1);
                }
            }
            break;
        case GAME_STATE.PAUSED:
            break;
        case GAME_STATE.START_SCREEN:
        case GAME_STATE.MAP_SCREEN:
            break;
    }
}

// ==================== DRAW ====================

function draw() {
    // Dark background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw GD-style grid lines in background
    const level = levels[currentLevel];
    if (level && level.decorations) {
        const gridDeco = level.decorations.find(d => d.type === 'grid');
        if (gridDeco && (gameState === GAME_STATE.PLAYING || gameState === GAME_STATE.PAUSED || gameState === GAME_STATE.LEVEL_COMPLETE || gameState === GAME_STATE.GAME_OVER)) {
            drawBackgroundGrid(gridDeco.color, gridDeco.scrollFactor);
        }
    }

    // Draw decorations (geometric GD style)
    for (const deco of activeDecorations) {
        switch (deco.type) {
            case 'geoTriangle':
                drawGeoTriangle(deco);
                break;
            case 'geoDiamond':
                drawGeoDiamond(deco);
                break;
            case 'geoHexagon':
                drawGeoHexagon(deco);
                break;
            case 'pulsingDot':
                drawPulsingDot(deco);
                break;
            case 'bgPillar':
                drawBgPillar(deco);
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
        case GAME_STATE.LEVEL_COMPLETE:
            // Draw player trail
            for (const t of playerTrail) {
                ctx.save();
                ctx.globalAlpha = t.alpha * 0.5;
                ctx.fillStyle = t.color;
                ctx.shadowColor = t.color;
                ctx.shadowBlur = 6;
                ctx.fillRect(t.x - t.size / 2, t.y - t.size / 2, t.size, t.size);
                ctx.restore();
            }

            // Draw player (GD-style rotating cube)
            drawPlayer();

            // Draw pipes (neon geometric columns)
            for (const pipe of pipes) {
                drawNeonPipe(pipe);
            }

            // Draw checkerboard ground
            drawCheckerboardGround();

            // Draw boss
            if (boss && boss.active) {
                ctx.save();
                if (bossDefeated) {
                    ctx.globalAlpha = Math.max(0, 1 - bossDefeatTimer / 90);
                    if (Math.floor(bossDefeatTimer / 4) % 2 === 0) {
                        ctx.filter = 'brightness(3)';
                    }
                }
                drawBoss(boss);
                ctx.restore();

                // Warning text
                if (boss.warningTimer > 0 && !bossDefeated) {
                    const alpha = Math.min(1, boss.warningTimer / 60);
                    ctx.save();
                    ctx.globalAlpha = alpha;
                    ctx.font = "bold 36px 'Orbitron', sans-serif";
                    ctx.textAlign = 'center';
                    ctx.shadowColor = levels[currentLevel].accent;
                    ctx.shadowBlur = 20;
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 4;
                    ctx.strokeText('BOSS INCOMING!', CANVAS_WIDTH / 2, 120);
                    ctx.fillStyle = levels[currentLevel].accent;
                    ctx.fillText('BOSS INCOMING!', CANVAS_WIDTH / 2, 120);
                    ctx.textAlign = 'left';
                    ctx.restore();
                }

                // "BOSS DEFEATED!" text
                if (bossDefeated) {
                    ctx.save();
                    const alpha = Math.min(1, bossDefeatTimer / 20);
                    ctx.globalAlpha = alpha;
                    ctx.font = "bold 42px 'Orbitron', sans-serif";
                    ctx.textAlign = 'center';
                    ctx.shadowColor = '#00ff88';
                    ctx.shadowBlur = 25;
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 5;
                    ctx.strokeText('BOSS DEFEATED!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
                    ctx.fillStyle = '#00ff88';
                    ctx.fillText('BOSS DEFEATED!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
                    ctx.textAlign = 'left';
                    ctx.restore();
                }

                // Survival timer bar
                if (!bossDefeated && bossFightDuration > 0 && boss.x <= boss.targetX) {
                    const barWidth = 300;
                    const barHeight = 16;
                    const barX = (CANVAS_WIDTH - barWidth) / 2;
                    const barY = 80;
                    const progress = bossFightTimer / bossFightDuration;

                    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                    ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

                    const r = Math.floor(255 * progress);
                    const g = Math.floor(255 * (1 - progress));
                    ctx.fillStyle = `rgb(${r}, ${g}, 50)`;
                    ctx.fillRect(barX, barY, barWidth * progress, barHeight);

                    // Neon border
                    ctx.strokeStyle = levels[currentLevel].accent;
                    ctx.lineWidth = 2;
                    ctx.shadowColor = levels[currentLevel].accent;
                    ctx.shadowBlur = 8;
                    ctx.strokeRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
                    ctx.shadowBlur = 0;

                    const secondsLeft = Math.ceil(bossFightTimer / 60);
                    ctx.font = "bold 14px 'Orbitron', sans-serif";
                    ctx.textAlign = 'center';
                    ctx.fillStyle = levels[currentLevel].accent;
                    ctx.shadowColor = levels[currentLevel].accent;
                    ctx.shadowBlur = 8;
                    ctx.fillText(`SURVIVE: ${secondsLeft}s`, CANVAS_WIDTH / 2, barY + barHeight + 18);
                    ctx.shadowBlur = 0;
                    ctx.textAlign = 'left';
                }
            }

            // Draw beam attacks
            for (const beam of bossBeams) {
                ctx.save();
                const bColor = beam.color || '#FF0000';
                if (beam.phase === 'anticipation') {
                    const flashAlpha = 0.3 + Math.sin(beam.timer * 0.4) * 0.25;
                    const progress = beam.timer / beam.anticipationDuration;

                    ctx.globalAlpha = flashAlpha;
                    ctx.fillStyle = levels[currentLevel].accent;
                    const warningH = 4 + progress * (beam.beamHeight * 0.3);
                    ctx.fillRect(0, beam.y - warningH / 2, CANVAS_WIDTH, warningH);

                    ctx.globalAlpha = 0.5 + progress * 0.5;
                    ctx.strokeStyle = levels[currentLevel].accent;
                    ctx.lineWidth = 2;
                    ctx.setLineDash([12, 8]);
                    ctx.beginPath();
                    ctx.moveTo(0, beam.y);
                    ctx.lineTo(CANVAS_WIDTH, beam.y);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    ctx.globalAlpha = flashAlpha + 0.3;
                    ctx.font = "bold 20px 'Orbitron', sans-serif";
                    ctx.textAlign = 'center';
                    ctx.fillStyle = levels[currentLevel].accent;
                    for (let wx = 60; wx < CANVAS_WIDTH; wx += 120) {
                        ctx.fillText('!', wx, beam.y + 7);
                    }

                    if (boss) {
                        const chargeSize = 10 + progress * 25;
                        const chargeGrad = ctx.createRadialGradient(boss.x, beam.y, 0, boss.x, beam.y, chargeSize);
                        chargeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                        chargeGrad.addColorStop(0.4, levels[currentLevel].accent + 'CC');
                        chargeGrad.addColorStop(1, levels[currentLevel].accent + '00');
                        ctx.globalAlpha = 1;
                        ctx.fillStyle = chargeGrad;
                        ctx.beginPath();
                        ctx.arc(boss.x, beam.y, chargeSize, 0, Math.PI * 2);
                        ctx.fill();
                    }
                } else if (beam.phase === 'firing') {
                    const fadeIn = Math.min(1, beam.timer / 5);
                    const fadeOut = Math.max(0, 1 - (beam.timer - beam.fireDuration + 10) / 10);
                    const alpha = Math.min(fadeIn, fadeOut);
                    const h = beam.beamHeight;

                    if (beam.timer < 8) {
                        ctx.translate(0, (Math.random() - 0.5) * 4);
                    }

                    ctx.globalAlpha = alpha * 0.2;
                    ctx.fillStyle = levels[currentLevel].accent;
                    ctx.fillRect(0, beam.y - h * 1.5, CANVAS_WIDTH, h * 3);

                    ctx.globalAlpha = alpha * 0.4;
                    const outerGrad = ctx.createLinearGradient(0, beam.y - h, 0, beam.y + h);
                    outerGrad.addColorStop(0, levels[currentLevel].accent + '00');
                    outerGrad.addColorStop(0.3, levels[currentLevel].accent + 'AA');
                    outerGrad.addColorStop(0.5, levels[currentLevel].accent);
                    outerGrad.addColorStop(0.7, levels[currentLevel].accent + 'AA');
                    outerGrad.addColorStop(1, levels[currentLevel].accent + '00');
                    ctx.fillStyle = outerGrad;
                    ctx.fillRect(0, beam.y - h, CANVAS_WIDTH, h * 2);

                    ctx.globalAlpha = alpha * 0.85;
                    const beamGrad = ctx.createLinearGradient(0, beam.y - h / 2, 0, beam.y + h / 2);
                    beamGrad.addColorStop(0, levels[currentLevel].accent + '44');
                    beamGrad.addColorStop(0.3, levels[currentLevel].accent);
                    beamGrad.addColorStop(0.5, 'white');
                    beamGrad.addColorStop(0.7, levels[currentLevel].accent);
                    beamGrad.addColorStop(1, levels[currentLevel].accent + '44');
                    ctx.fillStyle = beamGrad;
                    ctx.fillRect(0, beam.y - h / 2, CANVAS_WIDTH, h);

                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                    ctx.fillRect(0, beam.y - h * 0.12, CANVAS_WIDTH, h * 0.24);
                }
                ctx.restore();
            }

            // Draw boss projectiles
            for (const proj of bossProjectiles) {
                ctx.save();
                const c = proj.color || '#FF4400';
                const s = proj.size;
                const px = proj.x;
                const py = proj.y;
                const angle = Math.atan2(proj.vy, proj.vx);
                const t = Date.now() / 1000;

                if (proj.type === 'lightning') {
                    const pulse = 1 + Math.sin(t * 20) * 0.3;
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
                    const pulse = 1 + Math.sin(t * 6) * 0.15;
                    ctx.shadowColor = c;
                    ctx.shadowBlur = 18;
                    ctx.strokeStyle = c;
                    ctx.lineWidth = 2.5;
                    ctx.globalAlpha = 0.6;
                    ctx.beginPath();
                    ctx.arc(px, py, s * 1.5 * pulse, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                    const eyeGrad = ctx.createRadialGradient(px, py, 0, px, py, s);
                    eyeGrad.addColorStop(0, '#220033');
                    eyeGrad.addColorStop(0.7, c);
                    eyeGrad.addColorStop(1, c + '88');
                    ctx.fillStyle = eyeGrad;
                    ctx.beginPath();
                    ctx.arc(px, py, s, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = 'white';
                    ctx.beginPath();
                    ctx.ellipse(px, py, s * 0.15, s * 0.5, angle, 0, Math.PI * 2);
                    ctx.fill();
                } else if (proj.type === 'wave') {
                    const ripple = Math.sin(t * 10) * 0.25;
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
                    ctx.translate(px, py);
                    ctx.rotate(t * 5);
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
                    const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.6);
                    coreGrad.addColorStop(0, 'white');
                    coreGrad.addColorStop(1, c);
                    ctx.fillStyle = coreGrad;
                    ctx.beginPath();
                    ctx.arc(0, 0, s * 0.6, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.globalAlpha = 0.15;
                    ctx.fillStyle = c;
                    for (let tr = 1; tr <= 3; tr++) {
                        const trX = px - Math.cos(angle) * s * tr * 1.2;
                        const trY = py - Math.sin(angle) * s * tr * 1.2;
                        ctx.beginPath();
                        ctx.arc(trX, trY, s * (1 - tr * 0.2), 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.globalAlpha = 0.4;
                    ctx.shadowColor = c;
                    ctx.shadowBlur = 15;
                    ctx.fillStyle = c;
                    ctx.beginPath();
                    ctx.arc(px, py, s * 1.5, 0, Math.PI * 2);
                    ctx.fill();
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
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
                    ctx.beginPath();
                    ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }

            // HUD - neon style
            const accent = levels[currentLevel].accent;
            ctx.save();
            ctx.shadowColor = accent;
            ctx.shadowBlur = 10;
            ctx.fillStyle = accent;
            ctx.font = "bold 22px 'Orbitron', sans-serif";
            ctx.fillText(`LVL ${currentLevel + 1}`, 10, 30);
            ctx.fillText(`${score}`, 10, 58);
            ctx.shadowBlur = 0;
            ctx.restore();

            // Control hints / touch buttons
            if (isTouchDevice) {
                // Draw touch buttons in top-right corner
                const btnW = 44, btnH = 34, btnGap = 8, btnY = 6;
                const buttons = [
                    { key: 'back', label: '\u25C0', x: CANVAS_WIDTH - (btnW + btnGap) * 3 },
                    { key: 'restart', label: '\u21BB', x: CANVAS_WIDTH - (btnW + btnGap) * 2 },
                    { key: 'pause', label: '\u23F8', x: CANVAS_WIDTH - (btnW + btnGap) * 1 }
                ];
                for (const btn of buttons) {
                    const bx = btn.x;
                    ctx.fillStyle = 'rgba(255,255,255,0.1)';
                    ctx.fillRect(bx, btnY, btnW, btnH);
                    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(bx, btnY, btnW, btnH);
                    ctx.fillStyle = 'rgba(255,255,255,0.7)';
                    ctx.font = "16px 'Orbitron', sans-serif";
                    ctx.textAlign = 'center';
                    ctx.fillText(btn.label, bx + btnW / 2, btnY + btnH / 2 + 6);
                    touchButtons[btn.key] = { x: bx, y: btnY, w: btnW, h: btnH };
                }
                ctx.textAlign = 'left';
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.font = "11px 'Orbitron', sans-serif";
                ctx.textAlign = 'right';
                ctx.fillText('[SPACE/\u2191] Jump  [P] Pause  [ESC] Map  [R] Restart  [M] Mute', CANVAS_WIDTH - 10, 20);
                if (GDAudio.muted) {
                    ctx.fillStyle = 'rgba(255, 100, 100, 0.6)';
                    ctx.fillText('[MUTED]', CANVAS_WIDTH - 10, 35);
                }
                ctx.textAlign = 'left';
            }

            if (gameState === GAME_STATE.LEVEL_COMPLETE) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

                ctx.save();
                ctx.textAlign = 'center';
                ctx.shadowColor = accent;
                ctx.shadowBlur = 20;
                ctx.fillStyle = accent;
                ctx.font = "bold 42px 'Orbitron', sans-serif";
                ctx.fillText(`Level ${currentLevel + 1}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
                ctx.font = "bold 22px 'Orbitron', sans-serif";
                ctx.shadowBlur = 10;
                ctx.fillStyle = '#ffffff';
                ctx.fillText(levels[currentLevel].theme, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 15);
                ctx.font = "16px 'Orbitron', sans-serif";
                ctx.shadowBlur = 0;
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.fillText(isTouchDevice ? 'Tap to Continue' : 'Press SPACE or ENTER to Continue', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 55);
                ctx.textAlign = 'left';
                ctx.restore();
            }

            if (gameState === GAME_STATE.PAUSED) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

                ctx.save();
                ctx.textAlign = 'center';
                ctx.shadowColor = accent;
                ctx.shadowBlur = 25;
                ctx.fillStyle = accent;
                ctx.font = "bold 48px 'Orbitron', sans-serif";
                ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
                ctx.font = "16px 'Orbitron', sans-serif";
                ctx.shadowBlur = 8;
                ctx.fillStyle = '#ffffff';
                ctx.fillText(isTouchDevice ? 'Tap anywhere to Resume' : '[P] Resume    [Q] Quit to Map    [R] Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
                ctx.textAlign = 'left';
                ctx.restore();
            }
            break;
        case GAME_STATE.GAME_OVER:
            drawGameOverScreen();
            break;
    }
}

// ==================== GD-STYLE DRAWING FUNCTIONS ====================

function drawBackgroundGrid(color, scrollFactor) {
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    const gridSize = 60;
    const offset = (gameTime * PIPE_SPEED * scrollFactor) % gridSize;

    // Vertical lines
    for (let x = -offset; x < CANVAS_WIDTH; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT - GROUND_HEIGHT);
        ctx.stroke();
    }
    // Horizontal lines
    for (let y = 0; y < CANVAS_HEIGHT - GROUND_HEIGHT; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
    }
    ctx.restore();
}

function drawGeoTriangle(deco) {
    ctx.save();
    ctx.globalAlpha = 0.12 + Math.sin(gameTime * 0.02 + deco.phase) * 0.05;
    ctx.strokeStyle = deco.color;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = deco.color;
    ctx.shadowBlur = 8;

    const s = deco.size;
    ctx.beginPath();
    ctx.moveTo(deco.x, deco.y - s);
    ctx.lineTo(deco.x - s * 0.866, deco.y + s * 0.5);
    ctx.lineTo(deco.x + s * 0.866, deco.y + s * 0.5);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}

function drawGeoDiamond(deco) {
    ctx.save();
    ctx.globalAlpha = 0.1 + Math.sin(gameTime * 0.025 + deco.phase) * 0.05;
    ctx.strokeStyle = deco.color;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = deco.color;
    ctx.shadowBlur = 8;

    const s = deco.size;
    ctx.beginPath();
    ctx.moveTo(deco.x, deco.y - s);
    ctx.lineTo(deco.x + s * 0.6, deco.y);
    ctx.lineTo(deco.x, deco.y + s);
    ctx.lineTo(deco.x - s * 0.6, deco.y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}

function drawGeoHexagon(deco) {
    ctx.save();
    ctx.globalAlpha = 0.1 + Math.sin(gameTime * 0.02 + deco.phase) * 0.05;
    ctx.strokeStyle = deco.color;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = deco.color;
    ctx.shadowBlur = 8;

    const s = deco.size;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const px = deco.x + Math.cos(angle) * s;
        const py = deco.y + Math.sin(angle) * s;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}

function drawPulsingDot(deco) {
    ctx.save();
    const pulse = 0.4 + Math.sin(gameTime * 0.05 + deco.phase) * 0.4;
    ctx.globalAlpha = pulse * 0.6;
    ctx.fillStyle = deco.color;
    ctx.shadowColor = deco.color;
    ctx.shadowBlur = deco.size * 3;
    ctx.beginPath();
    ctx.arc(deco.x, deco.y, deco.size * (0.8 + pulse * 0.4), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawBgPillar(deco) {
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = deco.color;
    const w = 20;
    const h = deco.size;
    ctx.fillRect(deco.x - w / 2, CANVAS_HEIGHT - GROUND_HEIGHT - h, w, h);
    // Top glow line
    ctx.globalAlpha = 0.15;
    ctx.shadowColor = deco.color;
    ctx.shadowBlur = 10;
    ctx.fillRect(deco.x - w / 2 - 2, CANVAS_HEIGHT - GROUND_HEIGHT - h - 2, w + 4, 3);
    ctx.restore();
}

function drawPlayer() {
    const cx = player.x + player.width / 2;
    const cy = player.y + player.height / 2;
    const halfW = player.width / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(playerRotation);

    // Outer glow
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 15;

    // Main cube body - dark fill with neon border
    ctx.fillStyle = darkenColor(player.color, 0.3);
    ctx.fillRect(-halfW, -halfW, player.width, player.height);

    // Neon outline
    ctx.strokeStyle = player.color;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-halfW, -halfW, player.width, player.height);

    // Inner detail - smaller square
    ctx.strokeStyle = player.color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    const inner = halfW * 0.55;
    ctx.strokeRect(-inner, -inner, inner * 2, inner * 2);
    ctx.globalAlpha = 1;

    // GD-style face - simple eyes
    ctx.shadowBlur = 0;
    const eyeSize = halfW * 0.22;
    const eyeY = -halfW * 0.15;
    const eyeSpacing = halfW * 0.35;

    // White eye backgrounds
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-eyeSpacing, eyeY, eyeSize * 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeSpacing, eyeY, eyeSize * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Dark pupils
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(-eyeSpacing + eyeSize * 0.2, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeSpacing + eyeSize * 0.2, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawNeonPipe(pipe) {
    ctx.save();
    const accent = levels[currentLevel].accent;
    const isTop = pipe.y === 0;

    // Dark fill
    ctx.fillStyle = darkenColor(pipeColor, 0.15);
    ctx.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);

    // Inner horizontal line pattern
    ctx.strokeStyle = pipeColor;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.15;
    const lineSpacing = 12;
    const startY = isTop ? pipe.height % lineSpacing : pipe.y;
    for (let ly = startY; ly < pipe.y + pipe.height; ly += lineSpacing) {
        if (ly > pipe.y && ly < pipe.y + pipe.height) {
            ctx.beginPath();
            ctx.moveTo(pipe.x + 3, ly);
            ctx.lineTo(pipe.x + pipe.width - 3, ly);
            ctx.stroke();
        }
    }
    ctx.globalAlpha = 1;

    // Neon outline with glow
    ctx.shadowColor = pipeColor;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = pipeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(pipe.x, pipe.y, pipe.width, pipe.height);

    ctx.restore();
}

function drawCheckerboardGround() {
    ctx.save();
    const level = levels[currentLevel];
    const color1 = level.groundColor1 || '#1a1a2e';
    const color2 = level.groundColor2 || '#111122';
    const lineColor = level.groundLine || level.accent || '#00e5ff';
    const tileSize = 15;
    const groundY = CANVAS_HEIGHT - GROUND_HEIGHT;

    for (let row = 0; row < Math.ceil(GROUND_HEIGHT / tileSize); row++) {
        for (let col = -1; col < Math.ceil(CANVAS_WIDTH / tileSize) + 1; col++) {
            const x = col * tileSize - (groundScrollOffset % tileSize);
            const y = groundY + row * tileSize;
            ctx.fillStyle = (row + col) % 2 === 0 ? color1 : color2;
            ctx.fillRect(x, y, tileSize + 1, tileSize + 1);
        }
    }

    // Bright neon line on top edge
    ctx.shadowColor = lineColor;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(CANVAS_WIDTH, groundY);
    ctx.stroke();
    ctx.restore();
}

function drawBoss(b) {
    const x = b.x;
    const y = b.y;
    const size = b.size;
    const accent = levels[currentLevel].accent;

    ctx.save();

    // Pulsing neon glow/aura
    const pulseScale = 1 + Math.sin(b.time * 3) * 0.15;
    const glowGrad = ctx.createRadialGradient(x, y, size * 0.3, x, y, size * 1.8 * pulseScale);
    glowGrad.addColorStop(0, accent + '44');
    glowGrad.addColorStop(0.5, accent + '11');
    glowGrad.addColorStop(1, accent + '00');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(x, y, size * 1.8 * pulseScale, 0, Math.PI * 2);
    ctx.fill();

    // Geometric body (hexagonal outline)
    ctx.fillStyle = b.color;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const px = x + Math.cos(angle) * size;
        const py = y + Math.sin(angle) * size;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Neon outline glow
    ctx.shadowColor = accent;
    ctx.shadowBlur = 15;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Inner hexagonal detail
    ctx.shadowBlur = 0;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const px = x + Math.cos(angle) * size * 0.6;
        const py = y + Math.sin(angle) * size * 0.6;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.globalAlpha = 1;

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

    // Pupils with neon glow
    ctx.shadowColor = b.eyeColor;
    ctx.shadowBlur = 8;
    ctx.fillStyle = b.eyeColor;
    ctx.beginPath();
    ctx.arc(x - eyeOffsetX, y - eyeOffsetY, eyeW * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + eyeOffsetX, y - eyeOffsetY, eyeW * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Angry eyebrows
    ctx.strokeStyle = accent;
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
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.moveTo(x - size * 0.3, y + size * 0.3);
    ctx.quadraticCurveTo(x, y + size * 0.15, x + size * 0.3, y + size * 0.3);
    ctx.quadraticCurveTo(x, y + size * 0.55, x - size * 0.3, y + size * 0.3);
    ctx.fill();
    ctx.fillStyle = 'white';
    const teethY = y + size * 0.3;
    for (let i = -2; i <= 2; i++) {
        ctx.fillRect(x + i * size * 0.08 - size * 0.03, teethY - size * 0.06, size * 0.06, size * 0.08);
    }

    // Name label - neon style
    ctx.font = `bold ${Math.floor(size * 0.35)}px 'Orbitron', sans-serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = accent;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText(b.name, x, y - size - 10);
    ctx.fillStyle = accent;
    ctx.fillText(b.name, x, y - size - 10);
    ctx.textAlign = 'left';

    ctx.restore();
}

function drawStartScreen() {
    // Dark background already drawn
    ctx.save();
    ctx.textAlign = 'center';

    // Title with neon glow
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#00e5ff';
    ctx.font = "bold 36px 'Orbitron', sans-serif";
    ctx.fillText("Isaac's Chicken Game", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);

    // Subtitle
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ff00ff';
    ctx.font = "20px 'Orbitron', sans-serif";
    ctx.fillText(isTouchDevice ? 'Tap to Start' : 'Press SPACE or ENTER to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 15);

    // Sub-subtitle
    ctx.shadowBlur = 5;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = "14px 'Orbitron', sans-serif";
    ctx.fillText(isTouchDevice ? 'Touch controls enabled!' : 'Fully keyboard controlled!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);

    // Decorative pulsing shapes
    const t = gameTime * 0.03;
    ctx.globalAlpha = 0.15 + Math.sin(t) * 0.1;
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 10;

    // Rotating triangle left
    ctx.save();
    ctx.translate(150, CANVAS_HEIGHT / 2);
    ctx.rotate(t);
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(-26, 15);
    ctx.lineTo(26, 15);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Rotating diamond right
    ctx.save();
    ctx.translate(CANVAS_WIDTH - 150, CANVAS_HEIGHT / 2);
    ctx.rotate(-t);
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(20, 0);
    ctx.lineTo(0, 30);
    ctx.lineTo(-20, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    ctx.textAlign = 'left';
    ctx.restore();
}

function drawMapScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#00e5ff';
    ctx.font = "bold 32px 'Orbitron', sans-serif";
    ctx.fillText('Select a Level', CANVAS_WIDTH / 2, 55);
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';

    const levelBoxWidth = 130;
    const levelBoxHeight = 65;
    const padding = 15;
    const startX = (CANVAS_WIDTH - (MAP_COLUMNS * levelBoxWidth + (MAP_COLUMNS - 1) * padding)) / 2;
    const startY = 85;

    for (let i = 0; i < levels.length; i++) {
        const row = Math.floor(i / MAP_COLUMNS);
        const col = i % MAP_COLUMNS;
        const x = startX + col * (levelBoxWidth + padding);
        const y = startY + row * (levelBoxHeight + padding);
        const isSelected = (i === selectedLevel);
        const lvlAccent = levels[i].accent;

        // Dark box with neon accent
        ctx.fillStyle = levels[i].bgColor;
        ctx.fillRect(x, y, levelBoxWidth, levelBoxHeight);

        if (isSelected) {
            const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
            ctx.save();
            ctx.shadowColor = lvlAccent;
            ctx.shadowBlur = 15;
            ctx.strokeStyle = lvlAccent;
            ctx.lineWidth = 3;
            ctx.globalAlpha = pulse;
            ctx.strokeRect(x - 2, y - 2, levelBoxWidth + 4, levelBoxHeight + 4);
            ctx.restore();

            // Selection arrow
            ctx.fillStyle = lvlAccent;
            ctx.font = "18px 'Orbitron', sans-serif";
            ctx.textAlign = 'center';
            ctx.fillText('\u25B6', x - 14, y + levelBoxHeight / 2 + 6);
        } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, levelBoxWidth, levelBoxHeight);
        }

        ctx.fillStyle = isSelected ? lvlAccent : 'rgba(255,255,255,0.7)';
        ctx.font = isSelected ? "bold 18px 'Orbitron', sans-serif" : "16px 'Orbitron', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText(`Lvl ${i + 1}`, x + levelBoxWidth / 2, y + levelBoxHeight / 2 - 8);
        ctx.font = isSelected ? "bold 9px 'Orbitron', sans-serif" : "9px 'Orbitron', sans-serif";
        ctx.fillText(levels[i].theme, x + levelBoxWidth / 2, y + levelBoxHeight / 2 + 12);
        ctx.textAlign = 'left';

        levels[i].clickableArea = { x: x, y: y, width: levelBoxWidth, height: levelBoxHeight };
    }

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = "12px 'Orbitron', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(
        isTouchDevice ? 'Tap a level to play' : '\u2190 \u2191 \u2193 \u2192  Navigate    ENTER  Select    1-0  Quick Pick    ESC  Back',
        CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20
    );
    ctx.textAlign = 'left';
    ctx.restore();
}


function drawGameOverScreen(isWin = false) {
    // Draw the game state behind the overlay
    const accent = levels[currentLevel].accent;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw death particles
    for (const p of deathParticles) {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
    }

    ctx.save();
    ctx.textAlign = 'center';

    if (isWin) {
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#00ff88';
        ctx.font = "bold 48px 'Orbitron', sans-serif";
        ctx.fillText('YOU WIN!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    } else {
        ctx.shadowColor = '#ff1744';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#ff1744';
        ctx.font = "bold 48px 'Orbitron', sans-serif";
        ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    }

    ctx.shadowColor = accent;
    ctx.shadowBlur = 15;
    ctx.fillStyle = accent;
    ctx.font = "bold 30px 'Orbitron', sans-serif";
    ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 5);

    ctx.shadowBlur = 5;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = "16px 'Orbitron', sans-serif";
    if (isTouchDevice) {
        ctx.fillText('Tap above to go to Map', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
        ctx.fillText('Tap below to Retry', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 72);
    } else {
        ctx.fillText('[SPACE] Map    [R] Retry Level', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    }

    ctx.textAlign = 'left';
    ctx.restore();
}

function spawnDeathParticles() {
    const cx = player.x + player.width / 2;
    const cy = player.y + player.height / 2;
    const color = player.color;
    const accent = levels[currentLevel].accent;

    for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2 + Math.random() * 0.3;
        const speed = 2 + Math.random() * 5;
        deathParticles.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            size: 3 + Math.random() * 6,
            alpha: 1,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.3,
            color: i % 2 === 0 ? color : accent
        });
    }
}

function endGame(isWin = false) {
    if (gameState !== GAME_STATE.LEVEL_COMPLETE) {
        if (!isWin) {
            spawnDeathParticles();
            deathAnimationTimer = 0;
            GDAudio.playDeath();
            GDAudio.stopMusic();
            gameState = GAME_STATE.GAME_OVER;
        }
    }
}

// Utility: darken a hex color
function darkenColor(hex, factor) {
    // Handle rgba colors
    if (hex.startsWith('rgba')) return hex;
    // Remove # if present
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    const r = Math.floor(parseInt(hex.substring(0, 2), 16) * factor);
    const g = Math.floor(parseInt(hex.substring(2, 4), 16) * factor);
    const b = Math.floor(parseInt(hex.substring(4, 6), 16) * factor);
    return `rgb(${r},${g},${b})`;
}

document.addEventListener('keydown', (e) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
    }

    GDAudio.init();
    GDAudio.ensureResumed();

    // Mute toggle in all states
    if (e.code === 'KeyM') {
        GDAudio.toggleMute();
        return;
    }

    switch (gameState) {
        case GAME_STATE.START_SCREEN:
            if (e.code === 'Space' || e.code === 'Enter') {
                GDAudio.playMenuClick();
                gameState = GAME_STATE.MAP_SCREEN;
            }
            break;

        case GAME_STATE.MAP_SCREEN:
            if (e.code === 'ArrowRight') {
                selectedLevel = Math.min(selectedLevel + 1, levels.length - 1);
                GDAudio.playMenuClick();
            } else if (e.code === 'ArrowLeft') {
                selectedLevel = Math.max(selectedLevel - 1, 0);
                GDAudio.playMenuClick();
            } else if (e.code === 'ArrowDown') {
                if (selectedLevel + MAP_COLUMNS < levels.length) {
                    selectedLevel += MAP_COLUMNS;
                    GDAudio.playMenuClick();
                }
            } else if (e.code === 'ArrowUp') {
                if (selectedLevel - MAP_COLUMNS >= 0) {
                    selectedLevel -= MAP_COLUMNS;
                    GDAudio.playMenuClick();
                }
            } else if (e.code === 'Enter' || e.code === 'Space') {
                startGame(selectedLevel);
            } else if (e.code === 'Escape') {
                gameState = GAME_STATE.START_SCREEN;
            }
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
                // Add extra rotation burst on jump (GD-style)
                playerRotation -= 0.3;
                GDAudio.playJump();
            } else if (e.code === 'Escape') {
                GDAudio.stopMusic();
                gameState = GAME_STATE.MAP_SCREEN;
            } else if (e.code === 'KeyP') {
                gameState = GAME_STATE.PAUSED;
                GDAudio.playPause();
                GDAudio.stopMusic();
            } else if (e.code === 'KeyR') {
                startGame(currentLevel);
            }
            if (e.code === 'KeyB' && boss && !boss.active) {
                boss.active = true;
                boss.warningTimer = 120;
                pipes = [];
                bossFightDuration = 1800;
                bossFightTimer = bossFightDuration;
                bossDefeated = false;
                bossDefeatTimer = 0;
                bossBeams = [];
                bossBeamTimer = 0;
                GDAudio.playBossAppear();
            }
            break;

        case GAME_STATE.PAUSED:
            if (e.code === 'KeyP' || e.code === 'Escape') {
                gameState = GAME_STATE.PLAYING;
                GDAudio.startMusic(currentLevel);
            } else if (e.code === 'KeyQ') {
                GDAudio.stopMusic();
                gameState = GAME_STATE.MAP_SCREEN;
            } else if (e.code === 'KeyR') {
                startGame(currentLevel);
            }
            break;

        case GAME_STATE.GAME_OVER:
            if (e.code === 'Space' || e.code === 'Enter') {
                gameState = GAME_STATE.MAP_SCREEN;
            } else if (e.code === 'KeyR') {
                startGame(currentLevel);
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

// Convert a client-coordinate event (mouse or touch) to canvas coordinates
function getCanvasCoords(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
    };
}

// Check if a point is inside a rect {x, y, w, h}
function hitTest(px, py, rect) {
    return rect && px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

// Shared tap/click handler for non-keyboard interactions
function handleTap(canvasX, canvasY) {
    switch (gameState) {
        case GAME_STATE.START_SCREEN:
            GDAudio.playMenuClick();
            gameState = GAME_STATE.MAP_SCREEN;
            break;

        case GAME_STATE.MAP_SCREEN:
            for (let i = 0; i < levels.length; i++) {
                const area = levels[i].clickableArea;
                if (area && canvasX >= area.x && canvasX <= area.x + area.width &&
                    canvasY >= area.y && canvasY <= area.y + area.height) {
                    startGame(i);
                    break;
                }
            }
            break;

        case GAME_STATE.PLAYING:
            // Check on-screen buttons first
            if (hitTest(canvasX, canvasY, touchButtons.pause)) {
                gameState = GAME_STATE.PAUSED;
                GDAudio.playPause();
                GDAudio.stopMusic();
            } else if (hitTest(canvasX, canvasY, touchButtons.restart)) {
                startGame(currentLevel);
            } else if (hitTest(canvasX, canvasY, touchButtons.back)) {
                GDAudio.stopMusic();
                gameState = GAME_STATE.MAP_SCREEN;
            } else {
                // Tap anywhere else = jump
                player.velocityY = player.lift;
                playerRotation -= 0.3;
                GDAudio.playJump();
            }
            break;

        case GAME_STATE.PAUSED:
            // Tap anywhere to resume
            gameState = GAME_STATE.PLAYING;
            GDAudio.startMusic(currentLevel);
            break;

        case GAME_STATE.GAME_OVER:
            // Check restart button area (bottom half = retry, otherwise map)
            if (canvasY > CANVAS_HEIGHT / 2 + 30) {
                startGame(currentLevel);
            } else {
                gameState = GAME_STATE.MAP_SCREEN;
            }
            break;

        case GAME_STATE.LEVEL_COMPLETE:
            if (levelTransitionTimer <= 0) {
                if (currentLevel < levels.length - 1) {
                    loadLevel(currentLevel + 1);
                } else {
                    gameState = GAME_STATE.MAP_SCREEN;
                }
            }
            break;
    }
}

document.addEventListener('mousedown', (e) => {
    GDAudio.init();
    GDAudio.ensureResumed();
    const coords = getCanvasCoords(e.clientX, e.clientY);
    handleTap(coords.x, coords.y);
});

// Touch events
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    GDAudio.init();
    GDAudio.ensureResumed();
    const touch = e.touches[0];
    const coords = getCanvasCoords(touch.clientX, touch.clientY);
    handleTap(coords.x, coords.y);
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });


initGame();
