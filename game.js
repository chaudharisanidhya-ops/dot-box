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

// Game Manager Object
const Game = {
  // Config & State
  gridSize: 5, // medium by default
  gameMode: 'ai',
  aiDifficulty: 'medium',
  p1Name: 'Player 1',
  p2Name: 'Computer',
  p1Color: '#4f46e5',
  p2Color: '#e11d48',
  
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

  // Element Cache
  screens: {
    menu: null,
    game: null
  },

  init() {
    window.Game = this;
    // Cache UI elements
    this.screens.menu = document.getElementById('menu-screen');
    this.screens.game = document.getElementById('game-screen');
    
    this.loadStats();
    this.setupMenuEventListeners();
    this.setupGameEventListeners();
    this.sounds.updateMuteUI();
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

  setupMenuEventListeners() {
    // Game Mode segment controllers
    const btnModeAi = document.getElementById('btn-mode-ai');
    const btnModePvp = document.getElementById('btn-mode-pvp');
    const diffGroup = document.getElementById('difficulty-group');
    const p2NameInput = document.getElementById('p2-name-input');

    if (btnModeAi) {
      btnModeAi.addEventListener('click', () => {
        btnModeAi.classList.add('active');
        if (btnModePvp) btnModePvp.classList.remove('active');
        if (diffGroup) diffGroup.classList.remove('hidden');
        if (p2NameInput) p2NameInput.value = 'Computer';
        this.gameMode = 'ai';
      });
    }

    if (btnModePvp) {
      btnModePvp.addEventListener('click', () => {
        btnModePvp.classList.add('active');
        if (btnModeAi) btnModeAi.classList.remove('active');
        if (diffGroup) diffGroup.classList.add('hidden');
        if (p2NameInput) p2NameInput.value = 'Player 2';
        this.gameMode = 'pvp';
      });
    }

    // Difficulty control
    const diffButtons = document.querySelectorAll('#difficulty-control button');
    diffButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        diffButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.aiDifficulty = btn.getAttribute('data-difficulty');
      });
    });

    // Grid size control
    const sizeButtons = document.querySelectorAll('#size-control button');
    sizeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        sizeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.gridSize = parseInt(btn.getAttribute('data-size'), 10);
      });
    });

    // Customizer color palettes
    const setupPalette = (configClass, colorKey) => {
      const paletteContainer = document.querySelector(`.${configClass} .color-palette`);
      const indicator = document.querySelector(`.${configClass} .color-indicator`);
      if (!paletteContainer || !indicator) return;
      const dots = paletteContainer.querySelectorAll('.color-dot');
      
      dots.forEach(dot => {
        dot.addEventListener('click', () => {
          dots.forEach(d => d.classList.remove('active'));
          dot.classList.add('active');
          const color = dot.getAttribute('data-color');
          this[colorKey] = color;
          indicator.style.backgroundColor = color;
          this.applyPlayerColorVariables();
        });
      });
    };

    setupPalette('p1-config', 'p1Color');
    setupPalette('p2-config', 'p2Color');

    // Start Button
    const startBtn = document.getElementById('start-game-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.sounds.init();
        // Read names
        const p1Input = document.getElementById('p1-name-input');
        const p2Input = document.getElementById('p2-name-input');
        this.p1Name = p1Input ? p1Input.value.trim() : 'Player 1';
        this.p2Name = p2Input ? p2Input.value.trim() : (this.gameMode === 'ai' ? 'Computer' : 'Player 2');
        if (!this.p1Name) this.p1Name = 'Player 1';
        if (!this.p2Name) this.p2Name = (this.gameMode === 'ai' ? 'Computer' : 'Player 2');
        this.launchGame();
      });
    }

    // View Leaderboard Button
    const viewLeaderboardBtn = document.getElementById('view-leaderboard-btn');
    if (viewLeaderboardBtn) {
      viewLeaderboardBtn.addEventListener('click', () => {
        this.openLeaderboard();
      });
    }

    // Close Leaderboard Button
    const closeLeaderboardBtn = document.getElementById('leaderboard-close-btn');
    if (closeLeaderboardBtn) {
      closeLeaderboardBtn.addEventListener('click', () => {
        this.closeLeaderboard();
      });
    }

    // Reset Leaderboard Button
    const resetLeaderboardBtn = document.getElementById('leaderboard-reset-btn');
    if (resetLeaderboardBtn) {
      resetLeaderboardBtn.addEventListener('click', () => {
        this.resetLeaderboard();
      });
    }

    // Click outside modal overlay to close
    const leaderboardModal = document.getElementById('leaderboard-modal');
    if (leaderboardModal) {
      leaderboardModal.addEventListener('click', (e) => {
        if (e.target === leaderboardModal) {
          this.closeLeaderboard();
        }
      });
    }
  },

  setupGameEventListeners() {
    // Back to Menu
    const backMenuBtn = document.getElementById('back-to-menu-btn');
    if (backMenuBtn) {
      backMenuBtn.addEventListener('click', () => {
        this.transitionToScreen('menu');
      });
    }

    // Mute button
    const muteBtn = document.getElementById('mute-btn');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        this.sounds.toggleMute();
      });
    }

    // Reset button
    const resetBtn = document.getElementById('reset-game-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.startNewGame();
      });
    }

    // Modal buttons
    const replayBtn = document.getElementById('modal-replay-btn');
    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        const modal = document.getElementById('game-over-modal');
        if (modal) modal.classList.remove('active');
        this.startNewGame();
      });
    }

    const menuBtn = document.getElementById('modal-menu-btn');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        const modal = document.getElementById('game-over-modal');
        if (modal) modal.classList.remove('active');
        this.transitionToScreen('menu');
      });
    }
  },

  transitionToScreen(screenName) {
    if (screenName === 'menu') {
      this.screens.game.classList.remove('active');
      setTimeout(() => {
        this.screens.game.style.display = 'none';
        this.screens.menu.style.display = 'flex';
        setTimeout(() => this.screens.menu.classList.add('active'), 20);
      }, 300);
    } else {
      this.screens.menu.classList.remove('active');
      setTimeout(() => {
        this.screens.menu.style.display = 'none';
        this.screens.game.style.display = 'flex';
        setTimeout(() => this.screens.game.classList.add('active'), 20);
      }, 300);
    }
  },

  launchGame() {
    // Update display names
    document.getElementById('p1-name-display').textContent = this.p1Name;
    document.getElementById('p2-name-display').textContent = this.p2Name;
    
    // Set avatars initials
    document.querySelector('.p1-avatar-initial').textContent = this.getInitials(this.p1Name);
    document.querySelector('.p2-avatar-initial').textContent = this.gameMode === 'ai' ? 'AI' : this.getInitials(this.p2Name);

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
        
        // Prevent move on already placed line
        const linePlaced = type === 'h' ? this.hLines[r][c] : this.vLines[r][c];
        if (!linePlaced) {
          hitbox.classList.remove('p1-hover', 'p2-hover');
          this.executeMove(type, r, c);
        }
      });

      svg.appendChild(visualLine);
      svg.appendChild(hitbox);
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
        circle.setAttribute('class', 'board-dot');
        circle.setAttribute('id', `dot-${r}-${c}`);
        svg.appendChild(circle);
      }
    }
  },

  executeMove(type, r, c) {
    // Record move
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
          textEl.textContent = this.currentPlayer === 0 ? this.getInitials(this.p1Name) : this.gameMode === 'ai' && this.currentPlayer === 1 ? 'AI' : this.getInitials(this.p2Name);
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

    if (this.currentPlayer === 0) {
      p1Card.classList.add('active');
      p2Card.classList.remove('active');
      
      document.getElementById('game-status-text').textContent = `${this.p1Name}'s turn!`;
    } else {
      p2Card.classList.add('active');
      p1Card.classList.remove('active');

      if (this.gameMode === 'ai') {
        document.getElementById('game-status-text').textContent = `AI is thinking...`;
      } else {
        document.getElementById('game-status-text').textContent = `${this.p2Name}'s turn!`;
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

    if (this.p1Score > this.p2Score) {
      title.textContent = `${this.p1Name} Wins!`;
      subtitle.textContent = "Outstanding strategy and grid dominance!";
      this.sounds.playWin();
    } else if (this.p2Score > this.p1Score) {
      title.textContent = `${this.p2Name} Wins!`;
      subtitle.textContent = this.gameMode === 'ai' ? "The AI outsmarted you. Try again!" : "Victory is sweet! Excellent game.";
      if (this.gameMode === 'ai') {
        this.sounds.playLoss();
      } else {
        this.sounds.playWin();
      }
    } else {
      title.textContent = "It's a Draw!";
      subtitle.textContent = "A perfectly symmetrical match of minds.";
      modal.querySelector('.modal-card').classList.add('tie');
      this.sounds.playTie();
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
};

// Initialize App on DOM Content Loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    Game.init();
  });
} else {
  Game.init();
}
