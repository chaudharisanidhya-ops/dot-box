/**
 * Dots & Boxes Game Logic
 * Premium, polished implementation with Web Audio API sound and simulated-chain AI.
 */

// Sound effects synthesizer using Web Audio API
class GameSoundEffects {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('dots_boxes_muted') === 'true';
    this.updateMuteUI();
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('dots_boxes_muted', this.muted);
    this.updateMuteUI();
  }

  updateMuteUI() {
    const soundIcon = document.getElementById('mute-icon-sound');
    const silenceIcon = document.getElementById('mute-icon-silence');
    if (soundIcon && silenceIcon) {
      if (this.muted) {
        soundIcon.classList.add('hidden');
        silenceIcon.classList.remove('hidden');
      } else {
        soundIcon.classList.remove('hidden');
        silenceIcon.classList.add('hidden');
      }
    }
    const settingsSoundToggle = document.getElementById('settings-sound-toggle');
    if (settingsSoundToggle) {
      settingsSoundToggle.checked = !this.muted;
    }
  }

  playLine() {
    if (this.muted) return;
    this.init();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sine';
      // High-quality wood block / click tap: rapid frequency slide
      osc.frequency.setValueAtTime(650, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {
      console.warn("Audio failed to play", e);
    }
  }

  playBox() {
    if (this.muted) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const playNote = (freq, startTime, duration, type = 'triangle') => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.08, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // Play a lovely major third chime (C5 to E5)
      playNote(523.25, now, 0.18, 'sine');
      playNote(659.25, now + 0.07, 0.3, 'triangle');
    } catch (e) {
      console.warn("Audio failed to play", e);
    }
  }

  playWin() {
    if (this.muted) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const playNote = (freq, startTime, duration) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.06, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // Arpeggiated C-major scale (C5 -> E5 -> G5 -> C6)
      playNote(523.25, now, 0.2);
      playNote(659.25, now + 0.12, 0.2);
      playNote(783.99, now + 0.24, 0.2);
      playNote(1046.50, now + 0.36, 0.5);
    } catch (e) {
      console.warn("Audio failed to play", e);
    }
  }

  playLoss() {
    if (this.muted) return;
    this.init();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(196.00, this.ctx.currentTime); // G3
      osc.frequency.linearRampToValueAtTime(110.00, this.ctx.currentTime + 0.55); // A2

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.55);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.55);
    } catch (e) {
      console.warn("Audio failed to play", e);
    }
  }

  playTie() {
    if (this.muted) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const playNote = (freq, startTime, duration) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.08, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      playNote(392.00, now, 0.25); // G4
      playNote(392.00, now + 0.22, 0.35); // G4
    } catch (e) {
      console.warn("Audio failed to play", e);
    }
  }
}

// Particle FX engine for Game Over screen
class GameOverParticles {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.animationId = null;
    this.particles = [];
    this.type = null; // 'win', 'loss', 'tie'
    this.active = false;
    this.handleResize = this.handleResize.bind(this);
  }

  init(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    window.addEventListener('resize', this.handleResize);
  }

  resizeCanvas() {
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  }

  handleResize() {
    if (this.active) {
      this.resizeCanvas();
      this.spawnParticles();
    }
  }

  start(type) {
    this.stop();
    this.type = type;
    this.active = true;
    this.resizeCanvas();
    this.spawnParticles();
    this.loop();
  }

  stop() {
    this.active = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.particles = [];
    window.removeEventListener('resize', this.handleResize);
  }

  spawnParticles() {
    this.particles = [];
    const w = this.canvas.width;
    const h = this.canvas.height;

    if (this.type === 'win') {
      const colors = ['#6366f1', '#f43f5e', '#10b981', '#fbbf24', '#a855f7', '#06b6d4'];
      const count = 120;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 8;
        this.particles.push({
          x: w / 2,
          y: h * 0.4,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 5,
          width: 8 + Math.random() * 8,
          height: 12 + Math.random() * 10,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          rotationSpeed: -10 + Math.random() * 20,
          gravity: 0.15 + Math.random() * 0.1,
          drag: 0.97 + Math.random() * 0.02
        });
      }
    } else if (this.type === 'loss') {
      const colors = ['#ef4444', '#b91c1c', '#f87171', '#dc2626', '#991b1b', '#64748b'];
      const count = 120;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 8;
        this.particles.push({
          x: w / 2,
          y: h * 0.4,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 5,
          width: 8 + Math.random() * 8,
          height: 12 + Math.random() * 10,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          rotationSpeed: -10 + Math.random() * 20,
          gravity: 0.15 + Math.random() * 0.1,
          drag: 0.97 + Math.random() * 0.02
        });
      }
    } else if (this.type === 'tie') {
      const count = 30;
      const colors = ['rgba(99, 102, 241, 0.15)', 'rgba(244, 63, 94, 0.15)', 'rgba(100, 116, 139, 0.15)'];
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * w,
          y: h + Math.random() * 100,
          vx: -0.5 + Math.random(),
          vy: -0.5 - Math.random() * 1.5,
          radius: 10 + Math.random() * 30,
          color: colors[Math.floor(Math.random() * colors.length)],
          amplitude: 10 + Math.random() * 20,
          frequency: 0.01 + Math.random() * 0.02,
          phase: Math.random() * Math.PI * 2
        });
      }
    }
  }

  loop() {
    if (!this.active) return;
    this.update();
    this.draw();
    this.animationId = requestAnimationFrame(() => this.loop());
  }

  update() {
    const w = this.canvas.width;
    const h = this.canvas.height;

    if (this.type === 'win' || this.type === 'loss') {
      this.particles.forEach(p => {
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed * 0.1;

        if (p.y > h + 20) {
          p.x = w / 2;
          p.y = h * 0.4;
          const angle = Math.random() * Math.PI * 2;
          const speed = 3 + Math.random() * 6;
          p.vx = Math.cos(angle) * speed;
          p.vy = Math.sin(angle) * speed - 3;
        }
      });
    } else if (this.type === 'tie') {
      this.particles.forEach(p => {
        p.y += p.vy;
        p.phase += p.frequency;
        p.x += Math.sin(p.phase) * 0.3 + p.vx * 0.1;

        if (p.y < -p.radius) {
          p.y = h + p.radius + Math.random() * 50;
          p.x = Math.random() * w;
        }
      });
    }
  }

  draw() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.ctx.clearRect(0, 0, w, h);

    if (this.type === 'win' || this.type === 'loss') {
      this.particles.forEach(p => {
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        this.ctx.restore();
      });
    } else if (this.type === 'tie') {
      this.particles.forEach(p => {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.stroke();
      });
    }
  }
}

// Game Manager Object
const Game = {
  // Config & State
  gridSize: 5, // medium by default
  gameMode: 'ai',
  aiDifficulty: 'medium',
  p1Name: 'Player 1',
  p2Name: 'Computer',
  p1Color: '#3f47e0',
  p2Color: '#b91c1c',
  history: [],
  hapticsEnabled: localStorage.getItem('dots_boxes_haptics') !== 'false',
  dotStyle: localStorage.getItem('dots_boxes_dot_style') || 'classic',
  
  // Dynamic scores & Turn
  p1Score: 0,
  p2Score: 0,
  currentPlayer: 0, // 0 = P1, 1 = P2
  isGameOver: false,
  isAiThinking: false,

  // Local Stats persistence
  stats: {
    friends: {},
    ai: { wins: 0, losses: 0, draws: 0 }
  },

  // Grid states
  hLines: [], // size: (gridSize+1) x gridSize
  vLines: [], // size: gridSize x (gridSize+1)
  boxes: [],  // size: gridSize x gridSize (stores owner index 0/1 or null)

  // Audio Handler
  sounds: new GameSoundEffects(),

  // Particle Engine
  particles: new GameOverParticles(),

  // Funny Texts for Game Over screen
  funnyTexts: {
    aiWin: [
      "You beat a bucket of bolts! Skynet has postponed the apocalypse.",
      "Einstein would be proud... or extremely jealous of your dot-connecting skills.",
      "Victory! You proved that carbon-based life forms still rule this grid.",
      "Wow, you actually won! Did you secretly slide some cookies into my CPU?",
      "AI takes over the world? Not on your watch. Take that, silicon!"
    ],
    aiLoss: [
      "Defeated by a few lines of JavaScript. Go grab a coffee and reboot your brain.",
      "The computer outsmarted you. Maybe try tic-tac-toe next time?",
      "My developer is crying. You let a simple algorithm draw circles around you.",
      "Is your cursor lagging, or was that a 'tactical surrender'?",
      "Beep boop! The AI has conquered your grid and is now checking your browser history."
    ],
    aiTie: [
      "A tie! How anticlimactic. Did you both agree to be perfectly average?",
      "Neither won. You shook hands with a machine. How polite, and how boring.",
      "Perfect balance. You matched a computer step-for-step, yet nobody gets bragging rights."
    ],
    pvpWin: [
      "{winner} wins! {loser}, please go stand in the corner and think about your moves.",
      "Grid dominance achieved by {winner}! {loser} is officially banned from connecting dots.",
      "{winner} destroyed the board! {loser}, would you like some fries with all that salt?",
      "Victory for {winner}! {loser} was left connecting dots in the dark.",
      "{winner} reigns supreme! {loser}, maybe stick to coloring books?"
    ],
    pvpTie: [
      "It's a draw! You both fought valiantly to achieve absolutely nothing.",
      "A tie! You both deserve a gold star... and a rematch to end this mediocrity."
    ]
  },

  // Element Cache
  screens: {
    dashboard: null,
    setupComputer: null,
    setupPassPlay: null,
    game: null,
    profile: null,
    boxVault: null,
    leaderboard: null,
    howToPlay: null,
    settings: null,
    achievements: null
  },

  init() {
    window.Game = this;
    // Cache UI elements
    this.screens.dashboard = document.getElementById('dashboard-screen');
    this.screens.setupComputer = document.getElementById('setup-computer-screen');
    this.screens.setupPassPlay = document.getElementById('setup-pass-play-screen');
    this.screens.game = document.getElementById('game-screen');
    this.screens.profile = document.getElementById('tab-profile');
    this.screens.boxVault = document.getElementById('box-vault-screen');
    this.screens.leaderboard = document.getElementById('leaderboard-screen');
    this.screens.howToPlay = document.getElementById('how-to-play-screen');
    this.screens.settings = document.getElementById('settings-screen');
    this.screens.achievements = document.getElementById('achievements-screen');
    
    // Initialize stats & vault
    this.initCareerStats();
    this.initBoxVault();
    
    this.loadStats();
    this.setupMenuEventListeners();
    this.setupMenuEventListeners();
    this.setupGameEventListeners();
    this.sounds.updateMuteUI();

    // Initialize Box Points & Daily Challenge
    if (!localStorage.getItem('dots_boxes_bp')) {
      localStorage.setItem('dots_boxes_bp', '240');
    }
    this.initDailyChallenge();
    this.updateDashboardProgressionUI();

    // Theme initialization
    this.initTheme();
    this.initSettings();

    // Initialize Particles
    this.particles.init('game-over-particles');
  },

  // Color parsing helper for dynamic styling
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '79, 70, 229';
  },

  applyPlayerColorVariables() {
    document.documentElement.style.setProperty('--p1-color-rgb', this.hexToRgb(this.p1Color));
    document.documentElement.style.setProperty('--p2-color-rgb', this.hexToRgb(this.p2Color));
  },

  initTheme() {
    const savedTheme = localStorage.getItem('dots_boxes_theme') || 'light';
    if (savedTheme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    this.updateThemeIcons(savedTheme === 'dark');

    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark');
        const theme = isDark ? 'dark' : 'light';
        localStorage.setItem('dots_boxes_theme', theme);
        this.updateThemeIcons(isDark);
      });
    }
  },

  updateThemeIcons(isDark) {
    const sunIcon = document.querySelector('#theme-toggle-btn .sun-icon');
    const moonIcon = document.querySelector('#theme-toggle-btn .moon-icon');
    if (sunIcon && moonIcon) {
      if (isDark) {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
      } else {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
      }
    }
  },

  vibrate(duration = 15) {
    if (this.hapticsEnabled && navigator.vibrate) {
      try {
        navigator.vibrate(duration);
      } catch (e) {
        console.warn("Haptics failed", e);
      }
    }
  },

  updateDotStyles() {
    document.querySelectorAll('.board-dot').forEach(circle => {
      circle.classList.remove('dot-style-classic', 'dot-style-neon', 'dot-style-hollow');
      circle.classList.add(`dot-style-${this.dotStyle}`);
    });
  },

  initSettings() {
    // 1. Sync Sound Toggle
    const soundToggle = document.getElementById('settings-sound-toggle');
    if (soundToggle) {
      soundToggle.checked = !this.sounds.muted;
      soundToggle.addEventListener('change', (e) => {
        this.sounds.muted = !e.target.checked;
        localStorage.setItem('dots_boxes_muted', this.sounds.muted);
        this.sounds.updateMuteUI();
      });
    }

    // 2. Sync Haptics Toggle
    const hapticsToggle = document.getElementById('settings-haptics-toggle');
    if (hapticsToggle) {
      hapticsToggle.checked = this.hapticsEnabled;
      hapticsToggle.addEventListener('change', (e) => {
        this.hapticsEnabled = e.target.checked;
        localStorage.setItem('dots_boxes_haptics', this.hapticsEnabled);
        if (this.hapticsEnabled) {
          this.vibrate(20);
        }
      });
    }

    // 3. Sync Dot Style Selector
    const styleButtons = document.querySelectorAll('.settings-dot-style-control button');
    styleButtons.forEach(btn => {
      const btnStyle = btn.getAttribute('data-dot-style');
      if (btnStyle === this.dotStyle) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }

      btn.addEventListener('click', () => {
        styleButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.dotStyle = btnStyle;
        localStorage.setItem('dots_boxes_dot_style', this.dotStyle);
        this.updateDotStyles();
        this.vibrate(15);
      });
    });

    // 4. Setup About Accordion
    const aboutTrigger = document.getElementById('settings-about-trigger');
    const aboutContent = document.getElementById('settings-about-content');
    const aboutSection = aboutTrigger?.parentElement;
    if (aboutTrigger && aboutContent) {
      aboutTrigger.addEventListener('click', () => {
        const isHidden = aboutContent.classList.toggle('hidden');
        if (aboutSection) {
          aboutSection.classList.toggle('active', !isHidden);
        }
        // Collapse the privacy accordion if open
        const privacyContent = document.getElementById('settings-privacy-content');
        const privacySection = privacyContent?.parentElement;
        if (!isHidden && privacyContent && !privacyContent.classList.contains('hidden')) {
          privacyContent.classList.add('hidden');
          if (privacySection) privacySection.classList.remove('active');
        }
        this.vibrate(10);
      });
    }

    // 5. Setup Privacy Accordion
    const privacyTrigger = document.getElementById('settings-privacy-trigger');
    const privacyContent = document.getElementById('settings-privacy-content');
    const privacySection = privacyTrigger?.parentElement;
    if (privacyTrigger && privacyContent) {
      privacyTrigger.addEventListener('click', () => {
        const isHidden = privacyContent.classList.toggle('hidden');
        if (privacySection) {
          privacySection.classList.toggle('active', !isHidden);
        }
        // Collapse the about accordion if open
        const aboutContent = document.getElementById('settings-about-content');
        const aboutSection = aboutContent?.parentElement;
        if (!isHidden && aboutContent && !aboutContent.classList.contains('hidden')) {
          aboutContent.classList.add('hidden');
          if (aboutSection) aboutSection.classList.remove('active');
        }
        this.vibrate(10);
      });
    }
  },

  setupMenuEventListeners() {
    // Bottom nav switching
    document.querySelectorAll('.bottom-nav .nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    const dailyPreviewBtn = document.getElementById('daily-challenge-preview-btn');
    if (dailyPreviewBtn) {
      dailyPreviewBtn.addEventListener('click', () => {
        this.switchTab('daily');
      });
    }

    const dailyPlayBtn = document.getElementById('daily-play-btn');
    if (dailyPlayBtn) {
      dailyPlayBtn.addEventListener('click', () => {
        this.playDailyChallenge();
      });
    }

    // Dashboard actions
    const vsCompBtn = document.getElementById('dashboard-vs-computer-btn');
    const passPlayBtn = document.getElementById('dashboard-pass-play-btn');
    
    // Profile settings cog and settings item clicks
    const profileSettingsCog = document.getElementById('profile-settings-cog');
    if (profileSettingsCog) {
      profileSettingsCog.addEventListener('click', () => {
        this.transitionToScreen('settings');
        this.vibrate(15);
      });
    }

    // Profile menu stack items
    const menuVaultBtn = document.getElementById('profile-menu-vault');
    if (menuVaultBtn) {
      menuVaultBtn.addEventListener('click', () => {
        this.openBoxVault();
      });
    }

    const menuAchievementsBtn = document.getElementById('profile-menu-achievements');
    if (menuAchievementsBtn) {
      menuAchievementsBtn.addEventListener('click', () => {
        this.openAchievements();
      });
    }

    const menuSettingsBtn = document.getElementById('profile-menu-settings');
    if (menuSettingsBtn) {
      menuSettingsBtn.addEventListener('click', () => {
        this.transitionToScreen('settings');
        this.vibrate(15);
      });
    }

    // Settings back button
    const backSettingsBtn = document.getElementById('back-from-settings');
    if (backSettingsBtn) {
      backSettingsBtn.addEventListener('click', () => {
        this.transitionToScreen('profile');
        this.vibrate(15);
      });
    }

    // Achievements back button
    const backAchievementsBtn = document.getElementById('back-from-achievements');
    if (backAchievementsBtn) {
      backAchievementsBtn.addEventListener('click', () => {
        this.transitionToScreen('profile');
        this.vibrate(15);
      });
    }

    // Vault back button
    const backVaultBtn = document.getElementById('back-from-vault');
    if (backVaultBtn) {
      backVaultBtn.addEventListener('click', () => {
        this.transitionToScreen('profile');
        this.vibrate(15);
      });
    }

    // Leaderboard back button
    const backLeaderboardBtn = document.getElementById('back-from-leaderboard');
    if (backLeaderboardBtn) {
      backLeaderboardBtn.addEventListener('click', () => {
        this.transitionToScreen('home');
        this.vibrate(15);
      });
    }

    // How to Play back button & Got it button
    const backHowToPlayBtn = document.getElementById('back-from-how-to-play');
    if (backHowToPlayBtn) {
      backHowToPlayBtn.addEventListener('click', () => {
        this.transitionToScreen('home');
        this.vibrate(15);
      });
    }

    const howToPlayGotIt = document.getElementById('how-to-play-got-it');
    if (howToPlayGotIt) {
      howToPlayGotIt.addEventListener('click', () => {
        this.transitionToScreen('home');
        this.vibrate(15);
      });
    }

    // Profile screen navigation (Top left avatar on Home tab)
    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
      profileBtn.addEventListener('click', () => {
        this.transitionToScreen('profile');
        this.vibrate(15);
      });
    }

    if (vsCompBtn) {
      vsCompBtn.addEventListener('click', () => {
        this.gameMode = 'ai';
        this.aiDifficulty = 'medium';
        this.gridSize = 5;
        this.p1Color = '#3f47e0';
        this.p2Color = '#ef4444';
        
        document.querySelectorAll('#ai-difficulty-control .selector-pill').forEach(pill => {
          pill.classList.toggle('active', pill.getAttribute('data-difficulty') === 'medium');
        });
        document.querySelectorAll('#ai-size-control .selector-pill').forEach(pill => {
          pill.classList.toggle('active', parseInt(pill.getAttribute('data-size'), 10) === 5);
        });

        this.setupColorPalettes();
        this.applyPlayerColorVariables();
        this.transitionToScreen('setup-computer');
      });
    }

    if (passPlayBtn) {
      passPlayBtn.addEventListener('click', () => {
        this.gameMode = 'pvp';
        this.gridSize = 5;
        this.p1Color = '#3f47e0';
        this.p2Color = '#ef4444';
        
        document.getElementById('pvp-p1-name-input').value = 'Player One';
        document.getElementById('pvp-p2-name-input').value = 'Player Two';

        document.querySelectorAll('#pvp-size-control .selector-pill').forEach(pill => {
          pill.classList.toggle('active', parseInt(pill.getAttribute('data-size'), 10) === 5);
        });

        this.setupColorPalettes();
        this.applyPlayerColorVariables();
        this.transitionToScreen('setup-pass-play');
      });
    }

    // Back buttons inside setup
    const backAi = document.getElementById('back-to-dashboard-ai');
    if (backAi) {
      backAi.addEventListener('click', () => {
        this.transitionToScreen('dashboard');
      });
    }
    const backPvp = document.getElementById('back-to-dashboard-pvp');
    if (backPvp) {
      backPvp.addEventListener('click', () => {
        this.transitionToScreen('dashboard');
      });
    }

    // AI setup selection pills
    const diffButtons = document.querySelectorAll('#ai-difficulty-control .selector-pill');
    diffButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        diffButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.aiDifficulty = btn.getAttribute('data-difficulty');
        this.vibrate(10);
      });
    });

    const aiSizeButtons = document.querySelectorAll('#ai-size-control .selector-pill');
    aiSizeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        aiSizeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.gridSize = parseInt(btn.getAttribute('data-size'), 10);
        this.vibrate(10);
      });
    });

    // PvP setup selection pills
    const pvpSizeButtons = document.querySelectorAll('#pvp-size-control .selector-pill');
    pvpSizeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        pvpSizeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.gridSize = parseInt(btn.getAttribute('data-size'), 10);
        this.vibrate(10);
      });
    });

    // Start Games
    const startCompBtn = document.getElementById('start-computer-game-btn');
    if (startCompBtn) {
      startCompBtn.addEventListener('click', () => {
        this.sounds.init();
        this.p1Name = 'You';
        this.p2Name = 'Computer';
        this.launchGame();
      });
    }

    const startPvpBtn = document.getElementById('start-pass-play-btn');
    if (startPvpBtn) {
      startPvpBtn.addEventListener('click', () => {
        this.sounds.init();
        const p1Input = document.getElementById('pvp-p1-name-input');
        const p2Input = document.getElementById('pvp-p2-name-input');
        
        this.p1Name = p1Input ? p1Input.value.trim() : '';
        this.p2Name = p2Input ? p2Input.value.trim() : '';
        
        if (!this.p1Name) this.p1Name = 'Player One';
        if (!this.p2Name) this.p2Name = 'Player Two';
        
        this.launchGame();
      });
    }

    // View Leaderboard Button (secondary button on dashboard)
    const viewLeaderboardBtn = document.getElementById('view-leaderboard-btn');
    if (viewLeaderboardBtn) {
      viewLeaderboardBtn.addEventListener('click', () => {
        this.openLeaderboard();
      });
    }

    // Leaderboard Tabs (Global, Weekly, Friends)
    document.querySelectorAll('.leaderboard-tabs-bar .leaderboard-tab-item').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.leaderboard-tabs-bar .leaderboard-tab-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.getAttribute('data-lead-tab');
        this.renderLeaderboard(tab);
        this.vibrate(10);
      });
    });

    // Box Vault Shop Tabs clicks
    document.querySelectorAll('.shop-tabs-bar .shop-tab-item').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.shop-tabs-bar .shop-tab-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.getAttribute('data-shop-tab');
        
        // Hide all grids, show target grid
        document.querySelectorAll('#box-vault-screen .shop-grid').forEach(g => g.classList.remove('active'));
        const activeGrid = document.getElementById(`shop-tab-content-${tab}`);
        if (activeGrid) activeGrid.classList.add('active');
        this.vibrate(10);
      });
    });

    // Vault Purchase / Equip Buttons hookup
    document.querySelectorAll('.shop-buy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const itemStyle = btn.getAttribute('data-buy-item');
        const cost = parseInt(btn.getAttribute('data-cost') || '0', 10);
        this.purchaseDotStyle(itemStyle, cost);
      });
    });

    // Settings Clear Stats button
    const clearStatsBtn = document.getElementById('settings-clear-all');
    if (clearStatsBtn) {
      clearStatsBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to RESET all career stats, daily challenges, achievements, and equipped vault items? This cannot be undone.")) {
          localStorage.clear();
          alert("Statistics cleared! Reloading game...");
          window.location.reload();
        }
      });
    }
  },

  setupGameEventListeners() {
    // Back to Menu (Dashboard)
    const backMenuBtn = document.getElementById('back-to-menu-btn');
    if (backMenuBtn) {
      backMenuBtn.addEventListener('click', () => {
        this.transitionToScreen('dashboard');
      });
    }

    // Mute buttons (sync all class elements)
    const muteButtons = document.querySelectorAll('.mute-btn');
    muteButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.sounds.toggleMute();
      });
    });

    // Reset button
    const resetBtn = document.getElementById('reset-game-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.startNewGame();
      });
    }

    // Undo button
    const undoBtn = document.getElementById('undo-btn');
    if (undoBtn) {
      undoBtn.addEventListener('click', () => {
        this.undoLastMove();
      });
    }

    // Modal replay
    const replayBtn = document.getElementById('modal-replay-btn');
    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        const modal = document.getElementById('game-over-modal');
        if (modal) modal.classList.remove('active');
        this.particles.stop();
        this.startNewGame();
      });
    }

    const menuBtn = document.getElementById('modal-menu-btn');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        const modal = document.getElementById('game-over-modal');
        if (modal) modal.classList.remove('active');
        this.particles.stop();
        this.transitionToScreen('dashboard');
      });
    }
  },

  transitionToScreen(screenName) {
    if (screenName === 'profile') {
      this.switchTab('profile');
      screenName = 'dashboard';
    }
    if (screenName === 'daily') {
      this.switchTab('daily');
      screenName = 'dashboard';
    }
    if (screenName === 'home') {
      this.switchTab('home');
      screenName = 'dashboard';
    }

    const loader = document.getElementById('screen-loader');
    const screensMap = {
      dashboard: this.screens.dashboard,
      'setup-computer': this.screens.setupComputer,
      'setup-pass-play': this.screens.setupPassPlay,
      game: this.screens.game,
      'box-vault': this.screens.boxVault,
      leaderboard: this.screens.leaderboard,
      'how-to-play': this.screens.howToPlay,
      settings: this.screens.settings,
      achievements: this.screens.achievements
    };

    const activeScreen = screensMap[screenName];
    if (!activeScreen) return;

    const doTransition = () => {
      Object.values(screensMap).forEach(scr => {
        if (scr) {
          scr.classList.remove('active');
          scr.style.display = 'none';
        }
      });
      activeScreen.style.display = 'flex';
      void activeScreen.offsetWidth;
      activeScreen.classList.add('active');
    };

    if (!loader) {
      doTransition();
      return;
    }

    // Quick loader screen transition (<250ms total animation time)
    loader.classList.add('active');
    setTimeout(() => {
      doTransition();
      setTimeout(() => {
        loader.classList.remove('active');
      }, 70);
    }, 100);
  },

  launchGame() {
    // Update display names if elements exist
    const p1NameDisp = document.getElementById('p1-name-display');
    if (p1NameDisp) p1NameDisp.textContent = this.p1Name;
    const p2NameDisp = document.getElementById('p2-name-display');
    if (p2NameDisp) p2NameDisp.textContent = this.p2Name;
    
    // Set avatars initials if exist
    const p1Av = document.querySelector('.p1-avatar-initial');
    if (p1Av) p1Av.textContent = this.getInitials(this.p1Name);
    const p2Av = document.querySelector('.p2-avatar-initial');
    if (p2Av) p2Av.textContent = this.gameMode === 'ai' ? 'AI' : this.getInitials(this.p2Name);

    this.transitionToScreen('game');
    this.startNewGame();
  },

  getInitials(name) {
    if (!name || typeof name !== 'string') return '??';
    return name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();
  },

  startNewGame() {
    // Reset state
    this.p1Score = 0;
    this.p2Score = 0;
    this.currentPlayer = 0;
    this.isGameOver = false;
    this.isAiThinking = false;
    this.history = []; // Clear move history

    // Reset score displays
    document.getElementById('p1-score-display').textContent = '0';
    document.getElementById('p2-score-display').textContent = '0';

    // Clear board arrays
    this.hLines = Array(this.gridSize + 1).fill().map(() => Array(this.gridSize).fill(false));
    this.vLines = Array(this.gridSize).fill().map(() => Array(this.gridSize + 1).fill(false));
    this.boxes = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(null));

    // Render grid SVG board
    this.generateBoardSVG();

    // Set turn indicator classes
    this.updateUI();
  },

  generateBoardSVG() {
    const svg = document.getElementById('game-board-svg');
    svg.innerHTML = ''; // Clear existing elements

    const SVG_SIZE = 500;
    const padding = 40;
    const spacing = (SVG_SIZE - 2 * padding) / this.gridSize;

    svg.setAttribute('viewBox', `0 0 ${SVG_SIZE} ${SVG_SIZE}`);

    // 1. Render boxes (rectangles underneath lines)
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const x = padding + c * spacing;
        const y = padding + r * spacing;

        // Box visual rect
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('id', `box-${r}-${c}`);
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', spacing);
        rect.setAttribute('height', spacing);
        rect.setAttribute('class', 'board-box');
        svg.appendChild(rect);

        // Box initial text
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('id', `box-text-${r}-${c}`);
        text.setAttribute('x', x + spacing / 2);
        text.setAttribute('y', y + spacing / 2);
        text.setAttribute('class', 'box-text');
        svg.appendChild(text);
      }
    }

    // Helper function to create line visual and hit-test line
    const createLine = (type, r, c, startX, startY, endX, endY) => {
      // Visual line element
      const visualLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      visualLine.setAttribute('id', `line-${type}-${r}-${c}`);
      visualLine.setAttribute('x1', startX);
      visualLine.setAttribute('y1', startY);
      visualLine.setAttribute('x2', endX);
      visualLine.setAttribute('y2', endY);
      visualLine.setAttribute('class', 'board-line unclicked');
      // Set line thickness proportionate to board size
      const strokeWidth = Math.max(3, 7 - this.gridSize / 2);
      visualLine.setAttribute('stroke-width', strokeWidth);

      // Hitbox line element (thick and transparent for easy touch clicks)
      const hitbox = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      hitbox.setAttribute('x1', startX);
      hitbox.setAttribute('y1', startY);
      hitbox.setAttribute('x2', endX);
      hitbox.setAttribute('y2', endY);
      hitbox.setAttribute('class', 'line-hitbox');
      hitbox.setAttribute('stroke-width', 24); // easy to tap
      
      // Keep reference to line type and index coordinates
      hitbox.setAttribute('data-type', type);
      hitbox.setAttribute('data-row', r);
      hitbox.setAttribute('data-col', c);

      // Add interactivity hover indicators via JS dynamic colors
      hitbox.addEventListener('mouseenter', () => {
        if (this.isGameOver || this.isAiThinking) return;
        
        // Only show hover if line is not already placed
        const linePlaced = type === 'h' ? this.hLines[r][c] : this.vLines[r][c];
        if (!linePlaced) {
          hitbox.classList.add(this.currentPlayer === 0 ? 'p1-hover' : 'p2-hover');
        }
      });

      hitbox.addEventListener('mouseleave', () => {
        hitbox.classList.remove('p1-hover', 'p2-hover');
      });

      hitbox.addEventListener('click', () => {
        if (this.isGameOver || this.isAiThinking) return;
        
        const linePlaced = type === 'h' ? this.hLines[r][c] : this.vLines[r][c];
        if (linePlaced) return;

        hitbox.classList.remove('p1-hover', 'p2-hover');
        this.executeMove(type, r, c);
      });

      svg.appendChild(hitbox);
      svg.appendChild(visualLine);
    };

    // 2. Render horizontal lines
    for (let r = 0; r <= this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const startX = padding + c * spacing;
        const startY = padding + r * spacing;
        const endX = startX + spacing;
        const endY = startY;
        createLine('h', r, c, startX, startY, endX, endY);
      }
    }

    // 3. Render vertical lines
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c <= this.gridSize; c++) {
        const startX = padding + c * spacing;
        const startY = padding + r * spacing;
        const endX = startX;
        const endY = startY + spacing;
        createLine('v', r, c, startX, startY, endX, endY);
      }
    }

    // 4. Render dots (on top of lines)
    const dotRadius = Math.max(4, 9 - this.gridSize / 2);
    for (let r = 0; r <= this.gridSize; r++) {
      for (let c = 0; c <= this.gridSize; c++) {
        const x = padding + c * spacing;
        const y = padding + r * spacing;

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', dotRadius);
        circle.setAttribute('class', `board-dot dot-style-${this.dotStyle}`);
        circle.setAttribute('id', `dot-${r}-${c}`);
        svg.appendChild(circle);
      }
    }
  },

  executeMove(type, r, c) {
    // Record move in matrix
    if (type === 'h') {
      this.hLines[r][c] = true;
    } else {
      this.vLines[r][c] = true;
    }

    // Style the clicked visual line
    const lineEl = document.getElementById(`line-${type}-${r}-${c}`);
    if (lineEl) {
      lineEl.classList.remove('unclicked');
      lineEl.classList.add(this.currentPlayer === 0 ? 'p1-move' : 'p2-move');
    }

    // Play click sound
    this.sounds.playLine();

    // Animate neighboring dots on line completion for tactile feedback
    this.animateDotsForLine(type, r, c);

    // Check box completions
    const boxesCompleted = this.checkBoxCompletion(type, r, c);

    // Trigger haptic vibration feedback
    if (boxesCompleted.length > 0) {
      this.vibrate([25, 45, 25]);
    } else {
      this.vibrate(15);
    }

    // Record this move to the history stack BEFORE updating scores and turn
    this.history.push({
      type: type,
      r: r,
      c: c,
      currentPlayer: this.currentPlayer,
      p1Score: this.p1Score,
      p2Score: this.p2Score,
      boxesCaptured: boxesCompleted.map(b => ({ r: b.row, c: b.col }))
    });

    if (boxesCompleted.length > 0) {
      // Award completed boxes to player
      boxesCompleted.forEach(box => {
        const { row, col } = box;
        this.boxes[row][col] = this.currentPlayer;
        
        // Highlight box visually
        const rectEl = document.getElementById(`box-${row}-${col}`);
        const textEl = document.getElementById(`box-text-${row}-${col}`);
        if (rectEl) {
          rectEl.classList.add(this.currentPlayer === 0 ? 'p1-captured' : 'p2-captured');
        }
        if (textEl) {
          textEl.classList.add(this.currentPlayer === 0 ? 'p1-text' : 'p2-text');
          // Display "1" for Player 1, "C" or "2" for Player 2 / Computer
          textEl.textContent = this.currentPlayer === 0 ? "1" : (this.gameMode === 'ai' ? "C" : "2");
        }
      });

      // Update scores
      if (this.currentPlayer === 0) {
        this.p1Score += boxesCompleted.length;
        this.pulseScoreElement('p1-score-display');
      } else {
        this.p2Score += boxesCompleted.length;
        this.pulseScoreElement('p2-score-display');
      }

      this.sounds.playBox();

      // Check if board is complete (Game Over)
      if (this.isBoardComplete()) {
        this.endGame();
        return;
      }

      // Turn remains with current player. Re-evaluate AI if it is AI's extra turn
      this.updateUI();
      if (this.gameMode === 'ai' && this.currentPlayer === 1) {
        this.triggerAiMove();
      }
    } else {
      // Toggle active turn
      this.currentPlayer = this.currentPlayer === 0 ? 1 : 0;
      this.updateUI();

      // Check for AI opponent's turn
      if (this.gameMode === 'ai' && this.currentPlayer === 1 && !this.isGameOver) {
        this.triggerAiMove();
      }
    }
  },

  animateDotsForLine(type, r, c) {
    const triggerPulse = (id) => {
      const dot = document.getElementById(id);
      if (dot) {
        dot.classList.remove('pulse');
        // trigger reflow to restart animation
        void dot.offsetWidth;
        dot.classList.add('pulse');
      }
    };

    if (type === 'h') {
      triggerPulse(`dot-${r}-${c}`);
      triggerPulse(`dot-${r}-${c + 1}`);
    } else {
      triggerPulse(`dot-${r}-${c}`);
      triggerPulse(`dot-${r + 1}-${c}`);
    }
  },

  pulseScoreElement(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('pulse-score');
      void el.offsetWidth;
      el.classList.add('pulse-score');
    }
  },

  checkBoxCompletion(type, r, c) {
    const completed = [];

    // Horizontal line checking
    if (type === 'h') {
      // Box above line
      if (r > 0) {
        const topRow = r - 1;
        if (this.hLines[topRow][c] && this.vLines[topRow][c] && this.vLines[topRow][c + 1]) {
          completed.push({ row: topRow, col: c });
        }
      }
      // Box below line
      if (r < this.gridSize) {
        const bottomRow = r;
        if (this.hLines[bottomRow + 1][c] && this.vLines[bottomRow][c] && this.vLines[bottomRow][c + 1]) {
          completed.push({ row: bottomRow, col: c });
        }
      }
    } 
    // Vertical line checking
    else {
      // Box left of line
      if (c > 0) {
        const leftCol = c - 1;
        if (this.vLines[r][leftCol] && this.hLines[r][leftCol] && this.hLines[r + 1][leftCol]) {
          completed.push({ row: r, col: leftCol });
        }
      }
      // Box right of line
      if (c < this.gridSize) {
        const rightCol = c;
        if (this.vLines[r][rightCol + 1] && this.hLines[r][rightCol] && this.hLines[r + 1][rightCol]) {
          completed.push({ row: r, col: rightCol });
        }
      }
    }

    return completed;
  },

  isBoardComplete() {
    // Total lines drawn count verification
    let totalLinesPlaced = 0;
    const totalLinesPossible = 2 * this.gridSize * (this.gridSize + 1);

    for (let r = 0; r <= this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        if (this.hLines[r][c]) totalLinesPlaced++;
      }
    }
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c <= this.gridSize; c++) {
        if (this.vLines[r][c]) totalLinesPlaced++;
      }
    }

    return totalLinesPlaced === totalLinesPossible;
  },

  updateUI() {
    // Update scoreboard numerical text
    document.getElementById('p1-score-display').textContent = this.p1Score;
    document.getElementById('p2-score-display').textContent = this.p2Score;

    // Toggle active scorecard pulsing border
    const p1Card = document.getElementById('p1-card');
    const p2Card = document.getElementById('p2-card');
    const turnPill = document.getElementById('turn-indicator-pill');

    if (this.currentPlayer === 0) {
      if (p1Card) p1Card.classList.add('active');
      if (p2Card) p2Card.classList.remove('active');
      
      if (turnPill) {
        if (this.gameMode === 'ai') {
          turnPill.textContent = "Your Turn";
        } else {
          turnPill.textContent = `${this.p1Name || 'Player 1'}'s Turn`;
        }
        turnPill.style.backgroundColor = this.p1Color;
        turnPill.style.boxShadow = `0 4px 12px ${this.p1Color}40`;
      }
    } else {
      if (p2Card) p2Card.classList.add('active');
      if (p1Card) p1Card.classList.remove('active');

      if (turnPill) {
        if (this.gameMode === 'ai') {
          turnPill.textContent = "Computer's Turn";
        } else {
          turnPill.textContent = `${this.p2Name || 'Player 2'}'s Turn`;
        }
        turnPill.style.backgroundColor = this.p2Color;
        turnPill.style.boxShadow = `0 4px 12px ${this.p2Color}40`;
      }
    }
  },

  triggerAiMove() {
    this.isAiThinking = true;
    
    // Add brief tactical delay to match player expectation of game pacing
    const delay = Math.max(500, 900 - this.gridSize * 40);
    setTimeout(() => {
      if (this.isGameOver) return;
      
      const move = this.computeAiMove();
      this.isAiThinking = false;
      
      if (move) {
        this.executeMove(move.type, move.r, move.c);
      }
    }, delay);
  },

  // Dynamic AI Brain (Simulated minimax & Chain Length Minimization)
  computeAiMove() {
    const possibleMoves = [];

    // 1. Compile all available horizontal lines
    for (let r = 0; r <= this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        if (!this.hLines[r][c]) {
          possibleMoves.push({ type: 'h', r: r, c: c });
        }
      }
    }

    // 2. Compile all available vertical lines
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c <= this.gridSize; c++) {
        if (!this.vLines[r][c]) {
          possibleMoves.push({ type: 'v', r: r, c: c });
        }
      }
    }

    if (possibleMoves.length === 0) return null;

    // Easy level is completely random
    if (this.aiDifficulty === 'easy') {
      return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    }

    // Medium & Hard difficulty common lists
    const boxCompletingMoves = [];
    const safeMoves = [];
    const unsafeMoves = [];

    // Categorize moves
    possibleMoves.forEach(move => {
      const immediateCaptures = this.simulateImmediateCaptures(move);
      if (immediateCaptures > 0) {
        boxCompletingMoves.push(move);
      } else {
        const isSafe = this.isMoveSafe(move);
        if (isSafe) {
          safeMoves.push(move);
        } else {
          unsafeMoves.push(move);
        }
      }
    });

    // Strategy 1: If we can complete a box right now, ALWAYS do it.
    if (boxCompletingMoves.length > 0) {
      // Pick a random box-completer
      return boxCompletingMoves[Math.floor(Math.random() * boxCompletingMoves.length)];
    }

    // Strategy 2: If we have safe moves, pick one.
    if (safeMoves.length > 0) {
      // Medium picks random safe move
      return safeMoves[Math.floor(Math.random() * safeMoves.length)];
    }

    // Strategy 3: No safe moves! We are forced to open a chain for the player.
    if (unsafeMoves.length > 0) {
      if (this.aiDifficulty === 'medium') {
        // Medium difficulty just plays a random unsafe move
        return unsafeMoves[Math.floor(Math.random() * unsafeMoves.length)];
      }

      // Hard Difficulty: Minimize the size of the chain we yield to the player.
      let bestMove = unsafeMoves[0];
      let minChainSize = Infinity;
      const candidateBests = [];

      unsafeMoves.forEach(move => {
        const chainSize = this.simulateChainLength(move);
        if (chainSize < minChainSize) {
          minChainSize = chainSize;
          candidateBests.length = 0; // Clear array
          candidateBests.push(move);
        } else if (chainSize === minChainSize) {
          candidateBests.push(move);
        }
      });

      // Pick randomly from the set of moves that give the shortest chain
      return candidateBests[Math.floor(Math.random() * candidateBests.length)];
    }

    // Fallback just in case
    return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
  },

  // Simulates immediate boxes that would be created by drawing a line
  simulateImmediateCaptures(move) {
    let count = 0;
    const { type, r, c } = move;

    if (type === 'h') {
      if (r > 0) {
        const topRow = r - 1;
        if (this.hLines[topRow][c] && this.vLines[topRow][c] && this.vLines[topRow][c + 1]) count++;
      }
      if (r < this.gridSize) {
        const bottomRow = r;
        if (this.hLines[bottomRow + 1][c] && this.vLines[bottomRow][c] && this.vLines[bottomRow][c + 1]) count++;
      }
    } else {
      if (c > 0) {
        const leftCol = c - 1;
        if (this.vLines[r][leftCol] && this.hLines[r][leftCol] && this.hLines[r + 1][leftCol]) count++;
      }
      if (c < this.gridSize) {
        const rightCol = c;
        if (this.vLines[r][rightCol + 1] && this.hLines[r][rightCol] && this.hLines[r + 1][rightCol]) count++;
      }
    }
    return count;
  },

  // Evaluates if making this move leaves any neighboring box with exactly 3 edges completed
  isMoveSafe(move) {
    const { type, r, c } = move;

    // Helper checking number of lines on box (row, col)
    const getLineCount = (row, col) => {
      let count = 0;
      if (this.hLines[row][col]) count++;
      if (this.hLines[row + 1][col]) count++;
      if (this.vLines[row][col]) count++;
      if (this.vLines[row][col + 1]) count++;
      return count;
    };

    if (type === 'h') {
      // Check box above
      if (r > 0) {
        const count = getLineCount(r - 1, c);
        // Drawing this line adds 1 to count. If it becomes 3 (currently 2), it's unsafe.
        if (count === 2) return false;
      }
      // Check box below
      if (r < this.gridSize) {
        const count = getLineCount(r, c);
        if (count === 2) return false;
      }
    } else {
      // Check box left
      if (c > 0) {
        const count = getLineCount(r, c - 1);
        if (count === 2) return false;
      }
      // Check box right
      if (c < this.gridSize) {
        const count = getLineCount(r, c);
        if (count === 2) return false;
      }
    }
    return true;
  },

  // Simulates drawing a line and counts the size of the box chain that opens up
  simulateChainLength(candidateMove) {
    // Clone grid matrices
    const tempH = this.hLines.map(row => [...row]);
    const tempV = this.vLines.map(row => [...row]);
    
    // Apply candidate line
    if (candidateMove.type === 'h') {
      tempH[candidateMove.r][candidateMove.c] = true;
    } else {
      tempV[candidateMove.r][candidateMove.c] = true;
    }

    let chainBoxes = 0;
    let chainGrowing = true;

    // Simulate opponent completing boxes greedily
    while (chainGrowing) {
      chainGrowing = false;
      for (let r = 0; r < this.gridSize; r++) {
        for (let c = 0; c < this.gridSize; c++) {
          let count = 0;
          let emptySide = null;

          if (tempH[r][c]) count++; else emptySide = { type: 'h', r: r, c: c };
          if (tempH[r + 1][c]) count++; else emptySide = { type: 'h', r: r + 1, c: c };
          if (tempV[r][c]) count++; else emptySide = { type: 'v', r: r, c: c };
          if (tempV[r][c + 1]) count++; else emptySide = { type: 'v', r: r, c: c + 1 };

          // If box has exactly 3 lines, opponent completes it and continues turn
          if (count === 3 && emptySide) {
            if (emptySide.type === 'h') {
              tempH[emptySide.r][emptySide.c] = true;
            } else {
              tempV[emptySide.r][emptySide.c] = true;
            }
            chainBoxes++;
            chainGrowing = true;
            break; // Restart scan
          }
        }
        if (chainGrowing) break;
      }
    }

    return chainBoxes;
  },

  endGame() {
    this.isGameOver = true;

    // Determine Winner text & styling
    const modal = document.getElementById('game-over-modal');
    const title = document.getElementById('winner-title');
    const subtitle = document.getElementById('winner-subtitle');
    const modalScoreP1 = document.getElementById('summary-p1-score');
    const modalScoreP2 = document.getElementById('summary-p2-score');
    const modalNameP1 = document.getElementById('summary-p1-name');
    const modalNameP2 = document.getElementById('summary-p2-name');

    modalScoreP1.textContent = this.p1Score;
    modalScoreP2.textContent = this.p2Score;
    modalNameP1.textContent = this.p1Name;
    modalNameP2.textContent = this.p2Name;

    // Remove tie class by default
    modal.querySelector('.modal-card').classList.remove('tie');

    let animType = 'tie';
    if (this.p1Score > this.p2Score) {
      title.textContent = `${this.p1Name} Wins!`;
      animType = 'win';
      if (this.gameMode === 'ai') {
        const msgs = this.funnyTexts.aiWin;
        subtitle.textContent = msgs[Math.floor(Math.random() * msgs.length)];
      } else {
        const msgs = this.funnyTexts.pvpWin;
        subtitle.textContent = msgs[Math.floor(Math.random() * msgs.length)]
          .replace('{winner}', this.p1Name)
          .replace('{loser}', this.p2Name);
      }
      this.sounds.playWin();
      this.vibrate([100, 100, 100, 100, 200]);
    } else if (this.p2Score > this.p1Score) {
      title.textContent = `${this.p2Name} Wins!`;
      if (this.gameMode === 'ai') {
        animType = 'loss';
        const msgs = this.funnyTexts.aiLoss;
        subtitle.textContent = msgs[Math.floor(Math.random() * msgs.length)];
        this.sounds.playLoss();
        this.vibrate([300, 150, 300]);
      } else {
        animType = 'win';
        const msgs = this.funnyTexts.pvpWin;
        subtitle.textContent = msgs[Math.floor(Math.random() * msgs.length)]
          .replace('{winner}', this.p2Name)
          .replace('{loser}', this.p1Name);
        this.sounds.playWin();
        this.vibrate([100, 100, 100, 100, 200]);
      }
    } else {
      title.textContent = "It's a Draw!";
      animType = 'tie';
      modal.querySelector('.modal-card').classList.add('tie');
      if (this.gameMode === 'ai') {
        const msgs = this.funnyTexts.aiTie;
        subtitle.textContent = msgs[Math.floor(Math.random() * msgs.length)];
      } else {
        const msgs = this.funnyTexts.pvpTie;
        subtitle.textContent = msgs[Math.floor(Math.random() * msgs.length)];
      }
      this.sounds.playTie();
      this.vibrate([150, 150, 150]);
    }

    // Record matchup results (PVP or AI)
    let result = 'draw';
    if (this.p1Score > this.p2Score) {
      result = 'win';
    } else if (this.p2Score > this.p1Score) {
      result = 'loss';
    }

    if (this.gameMode === 'pvp') {
      this.recordMatchup(this.p2Name, result);
    } else if (this.gameMode === 'ai') {
      this.recordAIResult(result);
    }

    // Reward Box Points (BP)
    let bpGained = 0;
    if (this.gameMode === 'ai') {
      if (result === 'win') {
        if (this.aiDifficulty === 'easy') bpGained = 20;
        else if (this.aiDifficulty === 'medium') bpGained = 50;
        else if (this.aiDifficulty === 'hard') bpGained = 100;
        
        // Progress challenge
        this.updateChallengeProgress('win_ai', 1);
      } else if (result === 'draw') {
        bpGained = 15;
      } else {
        bpGained = 10;
      }
    } else if (this.gameMode === 'pvp') {
      bpGained = result === 'win' ? 30 : 10;
      this.updateChallengeProgress('complete_pvp', 1);
    }
    
    // Progress box captures daily challenge (P1 captures P1Score boxes)
    this.updateChallengeProgress('capture_boxes', this.p1Score);
    
    let currentBp = parseInt(localStorage.getItem('dots_boxes_bp') || '240', 10);
    currentBp += bpGained;
    localStorage.setItem('dots_boxes_bp', currentBp.toString());
    
    // Update Career Stats
    const statsObj = JSON.parse(localStorage.getItem('dots_boxes_career_stats') || '{"gamesPlayed":24,"wins":16,"boxesCompleted":342,"bestScore":18,"maxStreak":5}');
    statsObj.gamesPlayed++;
    if (result === 'win') {
      statsObj.wins++;
      this.unlockAchievement('first_win');
    }
    statsObj.boxesCompleted += this.p1Score;
    if (this.p1Score > statsObj.bestScore) {
      statsObj.bestScore = this.p1Score;
    }
    // Pull daily streak as maxStreak
    const streak = parseInt(localStorage.getItem('dots_boxes_streak') || '0', 10);
    if (streak > statsObj.maxStreak) {
      statsObj.maxStreak = streak;
    }
    if (streak >= 3) {
      this.unlockAchievement('streak_start');
    }
    localStorage.setItem('dots_boxes_career_stats', JSON.stringify(statsObj));
    
    // Update game over BP reward text
    const gameOverBpText = document.getElementById('game-over-bp-earned-text');
    if (gameOverBpText) {
      gameOverBpText.textContent = `+${bpGained} BP`;
    }
    
    this.updateDashboardProgressionUI();

    // Display modal
    setTimeout(() => {
      modal.classList.add('active');
    }, 600);
  },

  loadStats() {
    try {
      const saved = localStorage.getItem('dots_boxes_matchups');
      if (saved) {
        this.stats = JSON.parse(saved);
      }
    } catch (e) {
      console.error("Error parsing stats", e);
    }
    
    // Ensure all required fields exist to prevent runtime errors
    if (!this.stats || typeof this.stats !== 'object') {
      this.stats = { friends: {}, ai: { wins: 0, losses: 0, draws: 0 } };
    }
    if (!this.stats.friends || typeof this.stats.friends !== 'object') {
      this.stats.friends = {};
    }
    if (!this.stats.ai || typeof this.stats.ai !== 'object') {
      this.stats.ai = { wins: 0, losses: 0, draws: 0 };
    }
  },

  saveStats() {
    localStorage.setItem('dots_boxes_matchups', JSON.stringify(this.stats));
  },

  recordMatchup(friendName, result) {
    if (!this.stats || !this.stats.friends) {
      this.loadStats();
    }
    const cleanName = (friendName || '').trim() || 'Player 2';
    if (!this.stats.friends[cleanName]) {
      this.stats.friends[cleanName] = { wins: 0, losses: 0, draws: 0 };
    }
    if (result === 'win') {
      this.stats.friends[cleanName].wins++;
    } else if (result === 'loss') {
      this.stats.friends[cleanName].losses++;
    } else {
      this.stats.friends[cleanName].draws++;
    }
    this.saveStats();
  },

  recordAIResult(result) {
    if (!this.stats || !this.stats.ai) {
      this.loadStats();
    }
    if (result === 'win') {
      this.stats.ai.wins++;
    } else if (result === 'loss') {
      this.stats.ai.losses++;
    } else {
      this.stats.ai.draws++;
    }
    this.saveStats();
  },

  openLeaderboard() {
    this.loadStats();
    const modal = document.getElementById('leaderboard-modal');
    const listContainer = document.getElementById('leaderboard-list');
    if (!modal || !listContainer) return;

    listContainer.innerHTML = '';
    
    // 1. Render Computer Matchups Card at the top
    const aiStats = this.stats.ai || { wins: 0, losses: 0, draws: 0 };
    const aiTotal = (aiStats.wins || 0) + (aiStats.losses || 0) + (aiStats.draws || 0);
    const aiWinRate = aiTotal > 0 ? Math.round(((aiStats.wins || 0) / aiTotal) * 100) : 0;
    
    const aiWinPct = aiTotal > 0 ? ((aiStats.wins || 0) / aiTotal) * 100 : 0;
    const aiLossPct = aiTotal > 0 ? ((aiStats.losses || 0) / aiTotal) * 100 : 0;
    const aiDrawPct = aiTotal > 0 ? ((aiStats.draws || 0) / aiTotal) * 100 : 0;

    const aiCard = document.createElement('div');
    aiCard.className = 'computer-stats-card';
    aiCard.innerHTML = `
      <div class="computer-card-header">
        <div class="computer-avatar">🤖</div>
        <div class="computer-info">
          <div class="computer-title">vs. Computer (AI)</div>
          <div class="computer-record-text">${aiStats.wins || 0} Wins &middot; ${aiStats.losses || 0} Losses${(aiStats.draws || 0) > 0 ? ` &middot; ${aiStats.draws} Draws` : ''}</div>
        </div>
        <div class="computer-winrate">
          <span class="winrate-num">${aiWinRate}%</span>
          <span class="winrate-lbl">Win Rate</span>
        </div>
      </div>
      <div class="wl-ratio-bar computer-ratio-bar">
        <div class="wl-ratio-win" style="width: ${aiWinPct}%"></div>
        <div class="wl-ratio-draw" style="width: ${aiDrawPct}%"></div>
        <div class="wl-ratio-loss" style="width: ${aiLossPct}%"></div>
      </div>
    `;
    listContainer.appendChild(aiCard);

    // Section title for Friends
    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'leaderboard-section-title';
    sectionTitle.innerHTML = `<span>Friends Matchups</span>`;
    listContainer.appendChild(sectionTitle);

    // 2. Render Friends Matchups
    const friends = Object.entries(this.stats.friends || {});
    
    if (friends.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'leaderboard-empty-state';
      emptyState.innerHTML = `
        <svg class="empty-state-icon" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <div class="empty-state-text" style="font-size: 0.9rem; max-width: 240px; margin: 8px auto 0;">No matchups against friends yet. Play a Pass & Play match!</div>
      `;
      listContainer.appendChild(emptyState);
    } else {
      // Convert to array and sort by Win Rate, then wins, then total matches
      const sortedFriends = friends.map(([name, data]) => {
        const wins = data?.wins || 0;
        const losses = data?.losses || 0;
        const draws = data?.draws || 0;
        const total = wins + losses + draws;
        const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
        return { name, wins, losses, draws, total, winRate };
      }).sort((a, b) => {
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.total - a.total;
      });

      sortedFriends.forEach((friend, index) => {
        const initials = this.getInitials(friend.name);
        const winPct = friend.total > 0 ? (friend.wins / friend.total) * 100 : 0;
        const lossPct = friend.total > 0 ? (friend.losses / friend.total) * 100 : 0;
        const drawPct = friend.total > 0 ? (friend.draws / friend.total) * 100 : 0;

        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        item.innerHTML = `
          <div class="friend-rank">#${index + 1}</div>
          <div class="friend-avatar">${initials}</div>
          <div class="friend-info">
            <div class="friend-name">${friend.name}</div>
            <div class="friend-stats-summary">
              <span class="stat-badge w">${friend.wins}W</span>
              <span class="stat-badge l">${friend.losses}L</span>
              ${friend.draws > 0 ? `<span class="stat-badge d">${friend.draws}D</span>` : ''}
            </div>
          </div>
          <div class="friend-performance">
            <div class="win-rate-text">${friend.winRate}%</div>
            <div class="win-rate-label">Win Rate</div>
            <div class="wl-ratio-bar">
              <div class="wl-ratio-win" style="width: ${winPct}%"></div>
              <div class="wl-ratio-draw" style="width: ${drawPct}%"></div>
              <div class="wl-ratio-loss" style="width: ${lossPct}%"></div>
            </div>
          </div>
        `;
        listContainer.appendChild(item);
      });
    }

    modal.classList.add('active');
  },

  closeLeaderboard() {
    const modal = document.getElementById('leaderboard-modal');
    if (modal) modal.classList.remove('active');
  },

  resetLeaderboard() {
    if (confirm("Are you sure you want to clear all matchup history? This will clear both Computer and Friends statistics.")) {
      this.stats.friends = {};
      this.stats.ai = { wins: 0, losses: 0, draws: 0 };
      this.saveStats();
      this.openLeaderboard();
    }
  }
,
  setupColorPalettes() {
    const PALETTE = ['#3f47e0', '#b91c1c', '#f97316', '#10b981', '#8b5cf6', '#ec4899'];

    const render = (containerId, previewId, selectedColor, onSelect) => {
      const container = document.getElementById(containerId);
      const preview = document.getElementById(previewId);
      if (!container) return;
      
      container.innerHTML = '';
      if (preview) {
        preview.style.backgroundColor = selectedColor;
      }

      PALETTE.forEach(color => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `color-dot ${color === selectedColor ? 'active' : ''}`;
        btn.style.backgroundColor = color;
        btn.style.setProperty('--selected-color', color);
        btn.setAttribute('data-color', color);
        
        btn.addEventListener('click', () => {
          onSelect(color);
        });
        
        container.appendChild(btn);
      });
    };

    if (this.gameMode === 'ai') {
      render('ai-p1-color-palette', 'ai-p1-preview-dot', this.p1Color, (color) => {
        this.p1Color = color;
        // Collision auto-resolution: You overrides Computer color
        if (this.p2Color === color) {
          const nextIndex = (PALETTE.indexOf(color) + 1) % PALETTE.length;
          this.p2Color = PALETTE[nextIndex];
        }
        this.setupColorPalettes();
        this.applyPlayerColorVariables();
      });

      render('ai-p2-color-palette', 'ai-p2-preview-dot', this.p2Color, (color) => {
        this.p2Color = color;
        // Collision auto-resolution: Computer overrides You color
        if (this.p1Color === color) {
          const nextIndex = (PALETTE.indexOf(color) + 1) % PALETTE.length;
          this.p1Color = PALETTE[nextIndex];
        }
        this.setupColorPalettes();
        this.applyPlayerColorVariables();
      });
    } else {
      render('pvp-p1-color-palette', 'pvp-p1-preview-dot', this.p1Color, (color) => {
        this.p1Color = color;
        // Collision auto-resolution: Player 1 overrides Player 2 color
        if (this.p2Color === color) {
          const nextIndex = (PALETTE.indexOf(color) + 1) % PALETTE.length;
          this.p2Color = PALETTE[nextIndex];
        }
        this.setupColorPalettes();
        this.applyPlayerColorVariables();
      });

      render('pvp-p2-color-palette', 'pvp-p2-preview-dot', this.p2Color, (color) => {
        this.p2Color = color;
        // Collision auto-resolution: Player 2 overrides Player 1 color
        if (this.p1Color === color) {
          const nextIndex = (PALETTE.indexOf(color) + 1) % PALETTE.length;
          this.p1Color = PALETTE[nextIndex];
        }
        this.setupColorPalettes();
        this.applyPlayerColorVariables();
      });
    }
  },



  undoLastMove() {
    if (this.isGameOver || this.isAiThinking || !this.history || this.history.length === 0) return;

    const undoSingleMove = () => {
      const lastMove = this.history.pop();
      if (!lastMove) return null;

      // Revert grid line state
      if (lastMove.type === 'h') {
        this.hLines[lastMove.r][lastMove.c] = false;
      } else {
        this.vLines[lastMove.r][lastMove.c] = false;
      }

      // Revert SVG visual line styling
      const lineEl = document.getElementById(`line-${lastMove.type}-${lastMove.r}-${lastMove.c}`);
      if (lineEl) {
        lineEl.classList.remove('p1-move', 'p2-move');
        lineEl.classList.add('unclicked');
      }

      // Revert boxes captured in this move
      lastMove.boxesCaptured.forEach(box => {
        this.boxes[box.r][box.c] = null;
        const rectEl = document.getElementById(`box-${box.r}-${box.c}`);
        const textEl = document.getElementById(`box-text-${box.r}-${box.c}`);
        if (rectEl) {
          rectEl.classList.remove('p1-captured', 'p2-captured');
        }
        if (textEl) {
          textEl.classList.remove('p1-text', 'p2-text');
          textEl.textContent = '';
        }
      });

      // Revert scores
      this.p1Score = lastMove.p1Score;
      this.p2Score = lastMove.p2Score;

      // Revert current player
      this.currentPlayer = lastMove.currentPlayer;

      return lastMove;
    };

    if (this.gameMode === 'ai') {
      // In AI mode, undo the computer's moves first, then the player's move
      let undoneMove = null;
      do {
        undoneMove = undoSingleMove();
      } while (undoneMove && undoneMove.currentPlayer !== 0 && this.history.length > 0);
    } else {
      // PVP mode: just undo one move
      undoSingleMove();
    }

    this.updateUI();
  },

  getProgression() {
    let bp = parseInt(localStorage.getItem('dots_boxes_bp') || '240', 10);
    const bpPerLevel = 500;
    const level = Math.floor(bp / bpPerLevel) + 1;
    const currentLevelBp = bp % bpPerLevel;
    const progressPercent = (currentLevelBp / bpPerLevel) * 100;
    
    // Level Titles
    const titles = [
      "Beginner", "Dot Amateur", "Line Drawer", "Box Builder", 
      "Grid Strategist", "Box Collector", "Chain Master", 
      "Dot Conqueror", "Grid Overlord", "Dot Box Legend"
    ];
    const title = titles[Math.min(level - 1, titles.length - 1)];
    
    // Avatars
    const avatars = ["👤", "🎯", "⚡", "🏆", "🌟", "👑", "🤖", "⚔️", "💎", "🔮"];
    const avatar = avatars[Math.min(level - 1, avatars.length - 1)];
    
    return {
      bp: bp,
      level: level,
      title: title,
      avatar: avatar,
      currentLevelBp: currentLevelBp,
      nextLevelBp: bpPerLevel,
      progressPercent: progressPercent
    };
  },

  updateDashboardProgressionUI() {
    const prog = this.getProgression();
    
    const dashLevelVal = document.getElementById('dash-level-val');
    const dashTitleVal = document.getElementById('dash-title-val');
    const dashBpVal = document.getElementById('dash-bp-val');
    const dashBpSub = document.getElementById('dash-bp-sub');
    const dashProgressFill = document.getElementById('dash-level-progress-fill');
    
    if (dashLevelVal) dashLevelVal.textContent = prog.level;
    if (dashTitleVal) dashTitleVal.textContent = prog.title;
    if (dashBpVal) dashBpVal.textContent = prog.bp.toLocaleString();
    if (dashBpSub) {
      dashBpSub.textContent = `${prog.bp.toLocaleString()} / ${(prog.level * 500).toLocaleString()} to Level ${prog.level + 1}`;
    }
    if (dashProgressFill) {
      dashProgressFill.style.width = `${prog.progressPercent}%`;
    }
    
    // Also sync to Profile tab elements
    const profileLevel = document.getElementById('profile-level-str');
    const profileBpVal = document.getElementById('profile-bp-val-str');
    const profileXpFill = document.getElementById('profile-xp-bar-fill');
    
    if (profileLevel) profileLevel.textContent = `Level ${prog.level} • ${prog.title}`;
    if (profileBpVal) {
      profileBpVal.textContent = `${prog.bp.toLocaleString()} / ${(prog.level * 500).toLocaleString()} XP`;
    }
    if (profileXpFill) {
      profileXpFill.style.width = `${prog.progressPercent}%`;
    }
    
    this.updateStatsGridUI();
    this.updateDailyChallengeUI();
  },

  initCareerStats() {
    const statsObj = localStorage.getItem('dots_boxes_career_stats');
    if (!statsObj) {
      const defaults = {
        gamesPlayed: 24,
        wins: 16,
        boxesCompleted: 342,
        bestScore: 18,
        maxStreak: 5
      };
      localStorage.setItem('dots_boxes_career_stats', JSON.stringify(defaults));
    }
  },

  initBoxVault() {
    const purchased = localStorage.getItem('dots_boxes_purchased_styles');
    if (!purchased) {
      localStorage.setItem('dots_boxes_purchased_styles', JSON.stringify(['classic']));
    }
  },

  updateStatsGridUI() {
    const statsObj = JSON.parse(localStorage.getItem('dots_boxes_career_stats') || '{}');
    const gp = statsObj.gamesPlayed || 0;
    const wins = statsObj.wins || 0;
    const wr = gp > 0 ? Math.round((wins / gp) * 100) : 0;
    const bc = statsObj.boxesCompleted || 0;
    const bs = statsObj.bestScore || 0;
    const ms = statsObj.maxStreak || 0;
    
    const gpEl = document.getElementById('stats-games-played');
    const winsEl = document.getElementById('stats-wins');
    const wrEl = document.getElementById('stats-win-rate');
    const bcEl = document.getElementById('stats-boxes-completed');
    const bsEl = document.getElementById('stats-best-score');
    const msEl = document.getElementById('stats-max-streak');
    
    if (gpEl) gpEl.textContent = gp;
    if (winsEl) winsEl.textContent = wins;
    if (wrEl) wrEl.textContent = `${wr}%`;
    if (bcEl) bcEl.textContent = bc;
    if (bsEl) bsEl.textContent = bs;
    if (msEl) msEl.textContent = ms;
  },

  openBoxVault() {
    this.updateBoxVaultUI();
    this.transitionToScreen('box-vault');
    this.vibrate(15);
  },

  updateBoxVaultUI() {
    const prog = this.getProgression();
    const currencyBpEl = document.getElementById('vault-currency-bp');
    if (currencyBpEl) currencyBpEl.textContent = prog.bp.toLocaleString();

    const purchased = JSON.parse(localStorage.getItem('dots_boxes_purchased_styles') || '["classic"]');
    
    document.querySelectorAll('.shop-item-card').forEach(card => {
      const style = card.getAttribute('data-shop-item');
      const btn = card.querySelector('.shop-buy-btn');
      if (!btn) return;

      if (this.dotStyle === style) {
        btn.textContent = 'Equipped';
        btn.className = 'shop-buy-btn equipped';
        btn.disabled = true;
      } else if (purchased.includes(style)) {
        btn.textContent = 'Equip';
        btn.className = 'shop-buy-btn owned';
        btn.disabled = false;
      } else {
        const cost = btn.getAttribute('data-cost');
        btn.textContent = `${cost} BP`;
        btn.className = 'shop-buy-btn';
        btn.disabled = false;
      }
    });
  },

  purchaseDotStyle(style, cost) {
    const purchased = JSON.parse(localStorage.getItem('dots_boxes_purchased_styles') || '["classic"]');
    
    if (purchased.includes(style)) {
      // Equip item
      this.dotStyle = style;
      localStorage.setItem('dots_boxes_dot_style', style);
      this.updateDotStyles();
      this.updateBoxVaultUI();
      this.vibrate(15);
      
      // Trigger achievement
      if (style === 'neon') {
        this.unlockAchievement('neon_dream');
      }
      return;
    }

    const prog = this.getProgression();
    if (prog.bp < cost) {
      alert(`Not enough BP! You need ${cost} BP, but currently have ${prog.bp} BP. Complete missions or win matches to earn more!`);
      this.vibrate([100, 100]);
      return;
    }

    // Buy style
    let newBp = prog.bp - cost;
    localStorage.setItem('dots_boxes_bp', newBp.toString());
    purchased.push(style);
    localStorage.setItem('dots_boxes_purchased_styles', JSON.stringify(purchased));
    
    this.dotStyle = style;
    localStorage.setItem('dots_boxes_dot_style', style);
    this.updateDotStyles();

    // Update progression displays
    this.updateDashboardProgressionUI();
    this.updateBoxVaultUI();
    this.sounds.playBox();
    this.vibrate(30);
  },

  openAchievements() {
    this.renderAchievementsList();
    this.transitionToScreen('achievements');
    this.vibrate(15);
  },

  renderAchievementsList() {
    const container = document.getElementById('achievements-list-container');
    if (!container) return;

    const list = [
      { id: 'first_win', name: 'First Win', desc: 'Defeat the Computer AI in a matches grid.', badge: '🏆' },
      { id: 'grid_master', name: 'Grid Master', desc: 'Reach Level 5 progression status.', badge: '👑' },
      { id: 'collector', name: 'Collectionist', desc: 'Capture over 100 boxes in total matches.', badge: '🎯' },
      { id: 'streak_start', name: 'Streak Starter', desc: 'Sustain a 3-day daily challenge streak.', badge: '⚡' },
      { id: 'neon_dream', name: 'Neon Dream', desc: 'Equip the Neon Glow dots in Box Vault.', badge: '💎' }
    ];

    const unlocked = JSON.parse(localStorage.getItem('dots_boxes_unlocked_achievements') || '[]');
    
    // Dynamic Level 5 auto-unlock
    const prog = this.getProgression();
    if (prog.level >= 5 && !unlocked.includes('grid_master')) {
      unlocked.push('grid_master');
      localStorage.setItem('dots_boxes_unlocked_achievements', JSON.stringify(unlocked));
    }
    // Dynamic Collector check
    const careerStats = JSON.parse(localStorage.getItem('dots_boxes_career_stats') || '{}');
    if ((careerStats.boxesCompleted || 0) >= 100 && !unlocked.includes('collector')) {
      unlocked.push('collector');
      localStorage.setItem('dots_boxes_unlocked_achievements', JSON.stringify(unlocked));
    }

    container.innerHTML = '';
    list.forEach(item => {
      const isUnlocked = unlocked.includes(item.id);
      const card = document.createElement('div');
      card.className = `achievement-card ${isUnlocked ? '' : 'locked'}`;
      card.innerHTML = `
        <div class="achievement-badge-container">${isUnlocked ? item.badge : '🔒'}</div>
        <div class="achievement-details">
          <span class="achievement-name">${item.name}</span>
          <span class="achievement-desc">${item.desc}</span>
        </div>
        <span class="achievement-status-badge ${isUnlocked ? 'status-unlocked' : 'status-locked'}">
          ${isUnlocked ? 'Unlocked' : 'Locked'}
        </span>
      `;
      container.appendChild(card);
    });
  },

  unlockAchievement(id) {
    const unlocked = JSON.parse(localStorage.getItem('dots_boxes_unlocked_achievements') || '[]');
    if (!unlocked.includes(id)) {
      unlocked.push(id);
      localStorage.setItem('dots_boxes_unlocked_achievements', JSON.stringify(unlocked));
    }
  },

  openLeaderboard() {
    this.renderLeaderboard('global');
    this.transitionToScreen('leaderboard');
    this.vibrate(15);
  },

  renderLeaderboard(tab) {
    const container = document.getElementById('leaderboard-list');
    if (!container) return;
    container.innerHTML = '';

    const prog = this.getProgression();

    if (tab === 'global') {
      const mockGlobal = [
        { rank: 1, name: 'Olivia', lvl: 8, bp: 2450, avatar: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23fee2e2"/><path d="M20 80c0-15 12-22 30-22s30 7 30 22z" fill="%23ca8a04"/><circle cx="50" cy="40" r="18" fill="%23ca8a04"/></svg>' },
        { rank: 2, name: 'Liam', lvl: 7, bp: 2120, avatar: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23dbeafe"/><path d="M20 80c0-15 12-22 30-22s30 7 30 22z" fill="%231e3a8a"/><circle cx="50" cy="40" r="18" fill="%231e3a8a"/></svg>' },
        { rank: 3, name: 'Noah', lvl: 7, bp: 1950, avatar: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23e0f2fe"/><path d="M20 80c0-15 12-22 30-22s30 7 30 22z" fill="%230369a1"/><circle cx="50" cy="40" r="18" fill="%230369a1"/></svg>' },
        { rank: 4, name: 'Emma', lvl: 6, bp: 1650, avatar: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23fce7f3"/><path d="M20 80c0-15 12-22 30-22s30 7 30 22z" fill="%23be185d"/><circle cx="50" cy="40" r="18" fill="%23be185d"/></svg>' },
        { rank: 5, name: 'James', lvl: 6, bp: 1420, avatar: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23fef3c7"/><path d="M20 80c0-15 12-22 30-22s30 7 30 22z" fill="%23b45309"/><circle cx="50" cy="40" r="18" fill="%23b45309"/></svg>' }
      ];

      // Add user rank dynamically
      let userRankAdded = false;
      mockGlobal.forEach(player => {
        if (prog.bp > player.bp && !userRankAdded) {
          // User ranks higher than this player!
          // Realistically just push "You" before this rank
        }
      });

      mockGlobal.forEach(p => {
        const item = document.createElement('div');
        item.className = 'lead-item-card';
        const rankClass = p.rank === 1 ? 'first' : (p.rank === 2 ? 'second' : (p.rank === 3 ? 'third' : ''));
        item.innerHTML = `
          <span class="lead-rank-num ${rankClass}">${p.rank}</span>
          <img class="lead-avatar-img" src="${p.avatar}" alt="${p.name}">
          <div class="lead-user-details">
            <span class="lead-name-text">${p.name}</span>
            <span class="lead-level-text">Level ${p.lvl}</span>
          </div>
          <span class="lead-score-val">${p.bp.toLocaleString()} BP</span>
        `;
        container.appendChild(item);
      });

      // Add "You" at the bottom as rank #23
      const userItem = document.createElement('div');
      userItem.className = 'lead-item-card highlighted';
      userItem.innerHTML = `
        <span class="lead-rank-num">23</span>
        <img class="lead-avatar-img" src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='48' fill='%23dbeafe'/><circle cx='50' cy='42' r='20' fill='%231e3a8a'/><path d='M20 80c0-18 15-25 30-25s30 7 30 25z' fill='%231e3a8a'/></svg>" alt="You">
        <div class="lead-user-details">
          <span class="lead-name-text">You</span>
          <span class="lead-level-text">Level ${prog.level} • ${prog.title}</span>
        </div>
        <span class="lead-score-val">${prog.bp.toLocaleString()} BP</span>
      `;
      container.appendChild(userItem);

    } else if (tab === 'weekly') {
      const mockWeekly = [
        { rank: 1, name: 'Noah', lvl: 7, bp: 850, avatar: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23e0f2fe"/><path d="M20 80c0-15 12-22 30-22s30 7 30 22z" fill="%230369a1"/><circle cx="50" cy="40" r="18" fill="%230369a1"/></svg>' },
        { rank: 2, name: 'Olivia', lvl: 8, bp: 720, avatar: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23fee2e2"/><path d="M20 80c0-15 12-22 30-22s30 7 30 22z" fill="%23ca8a04"/><circle cx="50" cy="40" r="18" fill="%23ca8a04"/></svg>' },
        { rank: 3, name: 'Emma', lvl: 6, bp: 500, avatar: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23fce7f3"/><path d="M20 80c0-15 12-22 30-22s30 7 30 22z" fill="%23be185d"/><circle cx="50" cy="40" r="18" fill="%23be185d"/></svg>' }
      ];

      mockWeekly.forEach(p => {
        const item = document.createElement('div');
        item.className = 'lead-item-card';
        const rankClass = p.rank === 1 ? 'first' : (p.rank === 2 ? 'second' : (p.rank === 3 ? 'third' : ''));
        item.innerHTML = `
          <span class="lead-rank-num ${rankClass}">${p.rank}</span>
          <img class="lead-avatar-img" src="${p.avatar}" alt="${p.name}">
          <div class="lead-user-details">
            <span class="lead-name-text">${p.name}</span>
            <span class="lead-level-text">Level ${p.lvl}</span>
          </div>
          <span class="lead-score-val">${p.bp.toLocaleString()} BP</span>
        `;
        container.appendChild(item);
      });

      // Weekly user rank
      const userItem = document.createElement('div');
      userItem.className = 'lead-item-card highlighted';
      userItem.innerHTML = `
        <span class="lead-rank-num">14</span>
        <img class="lead-avatar-img" src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='48' fill='%23dbeafe'/><circle cx='50' cy='42' r='20' fill='%231e3a8a'/><path d='M20 80c0-18 15-25 30-25s30 7 30 25z' fill='%231e3a8a'/></svg>" alt="You">
        <div class="lead-user-details">
          <span class="lead-name-text">You</span>
          <span class="lead-level-text">This week progress</span>
        </div>
        <span class="lead-score-val">240 BP</span>
      `;
      container.appendChild(userItem);

    } else if (tab === 'friends') {
      // Local Matchup history translated as ranking
      this.loadStats();
      const aiStats = this.stats.ai || { wins: 0, losses: 0, draws: 0 };
      const friendsEntries = Object.entries(this.stats.friends || {});

      // Add AI matchup row
      const aiRow = document.createElement('div');
      aiRow.className = 'lead-item-card';
      aiRow.innerHTML = `
        <span class="lead-rank-num first">#</span>
        <div class="achievement-badge-container" style="background:rgba(59,130,246,0.08); width:36px; height:36px; border-radius:50%; font-size:1.1rem; flex-shrink:0;">🤖</div>
        <div class="lead-user-details" style="margin-left:8px;">
          <span class="lead-name-text">vs. Computer (AI)</span>
          <span class="lead-level-text">${aiStats.wins} Wins • ${aiStats.losses} Losses • ${aiStats.draws} Draws</span>
        </div>
      `;
      container.appendChild(aiRow);

      if (friendsEntries.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'shop-empty-state';
        empty.textContent = "No friends matchups recorded yet. Play a local Pass & Play game!";
        container.appendChild(empty);
      } else {
        friendsEntries.forEach(([name, data], idx) => {
          const item = document.createElement('div');
          item.className = 'lead-item-card';
          item.innerHTML = `
            <span class="lead-rank-num">${idx + 1}</span>
            <div class="achievement-badge-container" style="background:rgba(16,185,129,0.08); width:36px; height:36px; border-radius:50%; font-size:1.1rem; flex-shrink:0; color:#10b981;">👤</div>
            <div class="lead-user-details" style="margin-left:8px;">
              <span class="lead-name-text">${name}</span>
              <span class="lead-level-text">${data.wins} Wins • ${data.losses} Losses • ${data.draws} Draws</span>
            </div>
          `;
          container.appendChild(item);
        });
      }
    }
  },

  initDailyChallenge() {
    const today = new Date().toDateString();
    let challenge = null;
    try {
      const saved = localStorage.getItem('dots_boxes_daily_challenge');
      if (saved) {
        challenge = JSON.parse(saved);
      }
    } catch (e) {
      console.error("Error reading daily challenge", e);
    }
    
    if (!challenge || challenge.lastDate !== today) {
      const challenges = [
        { desc: "Complete 20 Boxes", type: "capture_boxes", target: 20, progress: 12, reward: 100, completed: false },
        { desc: "Win a game vs Computer", type: "win_ai", target: 1, progress: 0, reward: 100, completed: false },
        { desc: "Complete a local PvP match", type: "complete_pvp", target: 1, progress: 0, reward: 100, completed: false }
      ];
      const selected = challenges[Math.floor(Math.random() * challenges.length)];
      selected.lastDate = today;
      challenge = selected;
      localStorage.setItem('dots_boxes_daily_challenge', JSON.stringify(challenge));
    }
  },
  
  updateDailyChallengeUI() {
    let challenge = null;
    try {
      challenge = JSON.parse(localStorage.getItem('dots_boxes_daily_challenge'));
    } catch (e) {
      console.error(e);
    }
    if (!challenge) return;
    
    // Today's date formatting
    const dateStrEl = document.getElementById('daily-detail-date-str');
    if (dateStrEl) {
      const options = { month: 'long', day: 'numeric', year: 'numeric' };
      dateStrEl.textContent = new Date().toLocaleDateString('en-US', options);
    }
    
    // --- Sync Dedicated Daily Tab Pane ---
    const detailDescEl = document.getElementById('daily-detail-challenge-desc');
    const detailRewardEl = document.getElementById('daily-detail-reward');
    const detailStatusEl = document.getElementById('daily-detail-status');
    const detailProgressFill = document.getElementById('daily-detail-progress-fill');
    const dailyPlayBtn = document.getElementById('daily-play-btn');
    
    if (detailDescEl) detailDescEl.textContent = challenge.desc;
    if (detailRewardEl) {
      if (challenge.completed) {
        detailRewardEl.textContent = "CLAIMED";
        detailRewardEl.parentElement.style.color = "#10b981";
      } else {
        detailRewardEl.textContent = `+${challenge.reward} BP`;
        detailRewardEl.parentElement.style.color = "";
      }
    }
    if (detailStatusEl) {
      if (challenge.completed) {
        detailStatusEl.textContent = "Completed! Come back tomorrow.";
        detailStatusEl.style.color = "#10b981";
      } else {
        detailStatusEl.textContent = `${challenge.progress} / ${challenge.target}`;
        detailStatusEl.style.color = "";
      }
    }
    if (detailProgressFill) {
      const pct = challenge.completed ? 100 : (challenge.progress / challenge.target) * 100;
      detailProgressFill.style.width = `${pct}%`;
    }
    if (dailyPlayBtn) {
      if (challenge.completed) {
        dailyPlayBtn.disabled = true;
        const btnText = dailyPlayBtn.querySelector('span');
        if (btnText) btnText.textContent = "Completed";
        dailyPlayBtn.style.opacity = "0.6";
        dailyPlayBtn.style.cursor = "default";
      } else {
        dailyPlayBtn.disabled = false;
        const btnText = dailyPlayBtn.querySelector('span');
        if (btnText) btnText.textContent = "PLAY CHALLENGE";
        dailyPlayBtn.style.opacity = "";
        dailyPlayBtn.style.cursor = "";
      }
    }
    
    // --- Update Streak Display ---
    this.updateStreakUI();
  },
  
  updateChallengeProgress(type, amount) {
    let challenge = null;
    try {
      challenge = JSON.parse(localStorage.getItem('dots_boxes_daily_challenge'));
    } catch (e) {
      console.error(e);
    }
    if (!challenge || challenge.completed || challenge.type !== type) return;
    
    challenge.progress += amount;
    if (challenge.progress >= challenge.target) {
      challenge.progress = challenge.target;
      challenge.completed = true;
      
      // Award reward
      let bp = parseInt(localStorage.getItem('dots_boxes_bp') || '240', 10);
      bp += challenge.reward;
      localStorage.setItem('dots_boxes_bp', bp.toString());
      
      // Update streak
      this.updateStreak();
      
      // Play sound
      this.sounds.playBox();
      
      // Vibrate to indicate success
      this.vibrate([100, 50, 100]);
    }
    
    localStorage.setItem('dots_boxes_daily_challenge', JSON.stringify(challenge));
  },

  updateStreak() {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    let streak = parseInt(localStorage.getItem('dots_boxes_streak') || '0', 10);
    const lastCompleted = localStorage.getItem('dots_boxes_last_challenge_date');
    
    if (lastCompleted === today) {
      // Already completed today
    } else if (lastCompleted === yesterday) {
      streak++;
      localStorage.setItem('dots_boxes_streak', streak.toString());
      localStorage.setItem('dots_boxes_last_challenge_date', today);
    } else {
      streak = 1;
      localStorage.setItem('dots_boxes_streak', streak.toString());
      localStorage.setItem('dots_boxes_last_challenge_date', today);
    }
  },

  updateStreakUI() {
    let streak = parseInt(localStorage.getItem('dots_boxes_streak') || '0', 10);
    const lastCompleted = localStorage.getItem('dots_boxes_last_challenge_date');
    const today = new Date().toDateString();
    
    // Check if streak was broken yesterday
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (lastCompleted !== today && lastCompleted !== yesterday) {
      streak = 0;
      localStorage.setItem('dots_boxes_streak', '0');
    }
    
    const descEl = document.getElementById('daily-streak-desc');
    if (descEl) {
      if (streak === 0) {
        descEl.textContent = "Complete today's challenge to start a streak!";
      } else {
        descEl.textContent = `You are on a ${streak}-day streak!`;
      }
    }
    
    const dayContainers = document.querySelectorAll('.streak-days .streak-day');
    const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const currentDayIndex = (new Date().getDay() + 6) % 7; // Monday = 0, Sunday = 6
    
    dayContainers.forEach((day, index) => {
      const span = day.querySelector('span');
      if (span) span.textContent = daysOfWeek[index];
      
      const check = day.querySelector('.check');
      let isCompleted = false;
      
      if (index === currentDayIndex) {
        isCompleted = (lastCompleted === today);
        day.id = "streak-today-indicator";
      } else if (index < currentDayIndex) {
        const diff = currentDayIndex - index;
        isCompleted = (streak > diff);
        day.removeAttribute('id');
      } else {
        day.removeAttribute('id');
      }
      
      day.classList.toggle('active', isCompleted);
      if (check) {
        check.textContent = isCompleted ? "✓" : "";
      }
    });
  },

  switchTab(tabName) {
    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-tab') === tabName);
    });
    
    document.querySelectorAll('#dashboard-screen .tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `tab-${tabName}`);
    });
    
    this.vibrate(10);
  },

  playDailyChallenge() {
    let challenge = null;
    try {
      challenge = JSON.parse(localStorage.getItem('dots_boxes_daily_challenge'));
    } catch (e) {
      console.error(e);
    }
    if (!challenge) return;
    
    if (challenge.completed) {
      alert("You have already completed today's challenge! Come back tomorrow.");
      return;
    }
    
    this.sounds.init();
    
    if (challenge.type === 'win_ai') {
      this.gameMode = 'ai';
      this.aiDifficulty = 'medium';
      this.gridSize = 5;
      this.p1Color = '#3f47e0';
      this.p2Color = '#b91c1c';
      this.p1Name = 'You';
      this.p2Name = 'Computer';
      this.applyPlayerColorVariables();
      this.launchGame();
    } else if (challenge.type === 'capture_boxes') {
      this.gameMode = 'ai';
      this.aiDifficulty = 'medium';
      this.gridSize = 5;
      this.p1Color = '#3f47e0';
      this.p2Color = '#b91c1c';
      this.p1Name = 'You';
      this.p2Name = 'Computer';
      this.applyPlayerColorVariables();
      this.launchGame();
    } else if (challenge.type === 'complete_pvp') {
      this.gameMode = 'pvp';
      this.gridSize = 5;
      this.p1Color = '#3f47e0';
      this.p2Color = '#b91c1c';
      const p1In = document.getElementById('pvp-p1-name-input');
      const p2In = document.getElementById('pvp-p2-name-input');
      if (p1In) p1In.value = '';
      if (p2In) p2In.value = '';
      this.setupColorPalettes();
      this.applyPlayerColorVariables();
      this.transitionToScreen('setup-pass-play');
    }
  }
};

// Initialize App on DOM Content Loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    Game.init();
  });
} else {
  Game.init();
}
