
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const hudScorePlayer = document.getElementById('hud-score-player');
  const hudScoreAi = document.getElementById('hud-score-ai');
  const hudStreak = document.getElementById('hud-streak');
  const startOverlay = document.getElementById('start-overlay');
  const pauseOverlay = document.getElementById('pause-overlay');
  const gameoverOverlay = document.getElementById('gameover-overlay');
  const gameoverTitle = document.getElementById('gameover-title');
  const goScore = document.getElementById('go-score');
  
  const startBtn = document.getElementById('start-btn');
  const resumeBtn = document.getElementById('resume-btn');
  const restartBtn = document.getElementById('restart-btn');
  const consolePauseBtn = document.getElementById('console-pause-btn');
  const difficultySelect = document.getElementById('pong-difficulty-select');
  if (window.Settings) window.Settings.applyLoadedTheme();

  
  const PADDLE_WIDTH = 10;
  const PADDLE_HEIGHT = 70;
  const BALL_SIZE = 8;
  const WINNING_SCORE = 5;
  const AI_SPEEDS = {
    easy: 3,
    medium: 4.5,
    hard: 6.8
  };
  const BALL_SPEEDS = {
    easy: 5,
    medium: 7,
    hard: 9.5
  };
  let playerY = (canvas.height - PADDLE_HEIGHT) / 2;
  let aiY = (canvas.height - PADDLE_HEIGHT) / 2;
  let ball = { x: 0, y: 0, vx: 0, vy: 0 };
  
  let playerScore = 0;
  let aiScore = 0;
  let currentStreak = Storage.getStats().games.pong.currentStreak || 0;
  hudStreak.textContent = currentStreak;

  let isPlaying = false;
  let isPaused = false;
  let isGameOver = false;
  let activeDifficulty = 'medium';
  let keys = {};
  let gameLoopId = null;
  const defaultDiff = Storage.getSettings().difficulty;
  if (difficultySelect) {
    difficultySelect.value = defaultDiff;
  }
  activeDifficulty = defaultDiff;
  startBtn.addEventListener('click', startGame);
  resumeBtn.addEventListener('click', resumeGame);
  restartBtn.addEventListener('click', startGame);
  consolePauseBtn.addEventListener('click', togglePause);
  
  difficultySelect.addEventListener('change', (e) => {
    activeDifficulty = e.target.value;
  });

  window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    
    if (!isPlaying) {
      if (e.key === ' ' || e.key === 'Enter') {
        startGame();
      }
      return;
    }
    
    if (e.key === 'Escape') {
      togglePause();
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
  });

  function startGame() {
    playerScore = 0;
    aiScore = 0;
    playerY = (canvas.height - PADDLE_HEIGHT) / 2;
    aiY = (canvas.height - PADDLE_HEIGHT) / 2;
    
    isPaused = false;
    isGameOver = false;
    isPlaying = true;

    hudScorePlayer.textContent = '0';
    hudScoreAi.textContent = '0';
    
    startOverlay.classList.add('hidden');
    gameoverOverlay.classList.add('hidden');
    pauseOverlay.classList.add('hidden');

    resetBall(1);

    if (window.App) window.App.playSound('start');

    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    gameLoopId = requestAnimationFrame(update);
  }

  function resetBall(direction) {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    
    const speed = BALL_SPEEDS[activeDifficulty];
    const angle = (Math.random() * 40 - 20) * (Math.PI / 180);
    
    ball.vx = Math.cos(angle) * speed * direction;
    ball.vy = Math.sin(angle) * speed;
  }

  function update() {
    if (!isPlaying) return;

    if (!isPaused && !isGameOver) {
     
      const paddleSpeed = 6;
      if (keys['w'] || keys['arrowup']) {
        playerY = Math.max(0, playerY - paddleSpeed);
      }
      if (keys['s'] || keys['arrowdown']) {
        playerY = Math.min(canvas.height - PADDLE_HEIGHT, playerY + paddleSpeed);
      }


      const aiSpeed = AI_SPEEDS[activeDifficulty];
      const targetY = ball.y - PADDLE_HEIGHT / 2;
      const diffY = targetY - aiY;
      
      
      if (Math.abs(diffY) > 2) {
        aiY += Math.sign(diffY) * Math.min(aiSpeed, Math.abs(diffY));
      }
      aiY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, aiY));

      
      ball.x += ball.vx;
      ball.y += ball.vy;

      if (ball.y <= 0 || ball.y >= canvas.height - BALL_SIZE) {
        ball.vy = -ball.vy;
        playRetroTone(160, 0.05); // bounce sound
      }

      if (ball.vx < 0 && ball.x <= PADDLE_WIDTH + 10 && ball.x >= 10) {
        if (ball.y + BALL_SIZE >= playerY && ball.y <= playerY + PADDLE_HEIGHT) {
          // Calculate skew
          const hitPos = (ball.y + BALL_SIZE/2 - playerY) / PADDLE_HEIGHT; // 0 to 1
          const angle = (hitPos * 90 - 45) * (Math.PI / 180); // -45 to 45 deg
          const speed = BALL_SPEEDS[activeDifficulty] * 1.05; // speed up slightly

          ball.vx = Math.cos(angle) * speed;
          ball.vy = Math.sin(angle) * speed;
          ball.x = PADDLE_WIDTH + 11;
          playRetroTone(280, 0.08);
        }
      }

      if (ball.vx > 0 && ball.x >= canvas.width - PADDLE_WIDTH - 10 - BALL_SIZE && ball.x <= canvas.width - 10) {
        if (ball.y + BALL_SIZE >= aiY && ball.y <= aiY + PADDLE_HEIGHT) {
          const hitPos = (ball.y + BALL_SIZE/2 - aiY) / PADDLE_HEIGHT;
          const angle = (hitPos * 90 - 45) * (Math.PI / 180);
          const speed = BALL_SPEEDS[activeDifficulty] * 1.05;

          ball.vx = -Math.cos(angle) * speed;
          ball.vy = Math.sin(angle) * speed;
          ball.x = canvas.width - PADDLE_WIDTH - 11 - BALL_SIZE;
          playRetroTone(280, 0.08);
        }
      }

      if (ball.x < 0) {
        aiScore++;
        hudScoreAi.textContent = aiScore;
        playRetroTone(100, 0.3);
        if (aiScore >= WINNING_SCORE) {
          endGame(false);
        } else {
          resetBall(1);
        }
      } else if (ball.x > canvas.width) {
        playerScore++;
        hudScorePlayer.textContent = playerScore;
        playRetroTone(400, 0.15);
        if (playerScore >= WINNING_SCORE) {
          endGame(true);
        } else {
          resetBall(-1);
        }
      }
    }

    draw();
    gameLoopId = requestAnimationFrame(update);
  }

  function draw() {
    ctx.fillStyle = '#05050a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    const profile = Storage.getProfile();
    ctx.fillStyle = profile.avatarColor;
    ctx.fillRect(10, playerY, PADDLE_WIDTH, PADDLE_HEIGHT);

    ctx.fillStyle = 'var(--accent2)';
    ctx.fillRect(canvas.width - PADDLE_WIDTH - 10, aiY, PADDLE_WIDTH, PADDLE_HEIGHT);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ball.x, ball.y, BALL_SIZE, BALL_SIZE);
  }

  function togglePause() {
    if (!isPlaying || isGameOver) return;
    
    if (isPaused) {
      resumeGame();
    } else {
      isPaused = true;
      pauseOverlay.classList.remove('hidden');
      if (window.App) window.App.playSound('click');
    }
  }

  function resumeGame() {
    isPaused = false;
    pauseOverlay.classList.add('hidden');
    if (window.App) window.App.playSound('start');
  }

  function playRetroTone(freq, duration) {
    if (!window.App || !window.App.soundEnabled) return;
    try {
      const audioCtx = window.App.audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (!window.App.audioCtx) window.App.audioCtx = audioCtx;
      
      if (audioCtx.state === 'suspended') audioCtx.resume();
      
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.005, audioCtx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch(e) {}
  }

  function endGame(isPlayerWin) {
    isGameOver = true;
    isPlaying = false;
    if (gameLoopId) cancelAnimationFrame(gameLoopId);

    goScore.textContent = `${playerScore} - ${aiScore}`;
    
    if (isPlayerWin) {
      gameoverTitle.textContent = 'VICTORY';
      gameoverTitle.style.color = 'var(--accent-green)';
      gameoverTitle.style.textShadow = 'var(--glow-green)';
      if (window.App) window.App.playSound('victory');
    } else {
      gameoverTitle.textContent = 'DEFEAT';
      gameoverTitle.style.color = 'var(--accent-red)';
      gameoverTitle.style.textShadow = '0 0 10px var(--accent-red)';
      if (window.App) window.App.playSound('defeat');
    }

    gameoverOverlay.classList.remove('hidden');

    Storage.recordGamePlayed('pong', isPlayerWin, isPlayerWin ? 10 : 0);
    
    // Sync local streak widget
    currentStreak = Storage.getStats().games.pong.currentStreak;
    hudStreak.textContent = currentStreak;
  }

  ctx.fillStyle = '#05050a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
});




