document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const hudScore = document.getElementById('hud-score');
  const hudHighScore = document.getElementById('hud-hiscore');
  const hudFood = document.getElementById('hud-food');
  const startOverlay = document.getElementById('start-overlay');
  const pauseOverlay = document.getElementById('pause-overlay');
  const gameoverOverlay = document.getElementById('gameover-overlay');
  const startBtn = document.getElementById('start-btn');
  const resumeBtn = document.getElementById('resume-btn');
  const restartBtn = document.getElementById('restart-btn');
  const consolePauseBtn = document.getElementById('console-pause-btn');
  const difficultySelect = document.getElementById('snake-difficulty-select');
  const goScore = document.getElementById('go-score');
  const GRID_SIZE = 20;
  const COLS = canvas.width / GRID_SIZE; // 24
  const ROWS = canvas.height / GRID_SIZE; // 20
  const SPEEDS = {
    easy: 120,
    medium: 80,
    hard: 50
  };
  let snake = [];
  let direction = 'right';
  let nextDirection = 'right';
  let food = { x: 0, y: 0 };
  let score = 0;
  let foodEatenSession = 0;
  let highScore = 0;
  let gameInterval = null;
  let isPaused = false;
  let isGameOver = false;
  let isPlaying = false;
  let activeDifficulty = 'medium';

  const defaultDiff = Storage.getSettings().difficulty;
  if (difficultySelect) {
    difficultySelect.value = defaultDiff;
  }
  activeDifficulty = defaultDiff;

  if (window.Settings) window.Settings.applyLoadedTheme();

  highScore = Storage.getStats().games.snake.highScore || 0;
  hudHighScore.textContent = highScore;

  // Bind Listeners
  startBtn.addEventListener('click', startGame);
  resumeBtn.addEventListener('click', resumeGame);
  restartBtn.addEventListener('click', startGame);
  consolePauseBtn.addEventListener('click', togglePause);
  
  difficultySelect.addEventListener('change', (e) => {
    activeDifficulty = e.target.value;
  });

  window.addEventListener('keydown', handleKeyInput);

  function handleKeyInput(e) {
    if (!isPlaying) {
      if (e.key === ' ' || e.key === 'Enter') {
        startGame();
      }
      return;
    }

    if (e.key === 'Escape') {
      togglePause();
      return;
    }

    if (isPaused) {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        resumeGame();
      }
      return;
    }

    const key = e.key.toLowerCase();
    
    if ((key === 'arrowup' || key === 'w') && direction !== 'down') {
      nextDirection = 'up';
    } else if ((key === 'arrowdown' || key === 's') && direction !== 'up') {
      nextDirection = 'down';
    } else if ((key === 'arrowleft' || key === 'a') && direction !== 'right') {
      nextDirection = 'left';
    } else if ((key === 'arrowright' || key === 'd') && direction !== 'left') {
      nextDirection = 'right';
    }
  }

  function startGame() {
    snake = [
      { x: 5, y: 10 },
      { x: 4, y: 10 },
      { x: 3, y: 10 }
    ];
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    foodEatenSession = 0;
    isPaused = false;
    isGameOver = false;
    isPlaying = true;
    
    hudScore.textContent = 0;
    hudFood.textContent = 0;

    spawnFood();

    if (window.App) window.App.playSound('start');

    // Hide modals
    startOverlay.classList.add('hidden');
    gameoverOverlay.classList.add('hidden');
    pauseOverlay.classList.add('hidden');

    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(tick, SPEEDS[activeDifficulty]);
  }

  function tick() {
    if (isPaused || isGameOver) return;

    direction = nextDirection;
    
    const head = { ...snake[0] };

    switch(direction) {
      case 'up':    head.y -= 1; break;
      case 'down':  head.y += 1; break;
      case 'left':  head.x -= 1; break;
      case 'right': head.x += 1; break;
    }

    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      gameOver();
      return;
    }

    for (let cell of snake) {
      if (head.x === cell.x && head.y === cell.y) {
        gameOver();
        return;
      }
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score += (activeDifficulty === 'easy' ? 1 : activeDifficulty === 'medium' ? 2 : 3);
      foodEatenSession++;
      
      hudScore.textContent = score;
      hudFood.textContent = foodEatenSession;
      
      if (score > highScore) {
        highScore = score;
        hudHighScore.textContent = highScore;
      }

      if (window.App) window.App.playSound('collect');
      spawnFood();
    } else {
      snake.pop();
    }

    draw();
  }

  function spawnFood() {
    let valid = false;
    while(!valid) {
      food.x = Math.floor(Math.random() * COLS);
      food.y = Math.floor(Math.random() * ROWS);
      
      valid = true;
      for (let cell of snake) {
        if (cell.x === food.x && cell.y === food.y) {
          valid = false;
          break;
        }
      }
    }
  }

  function draw() {
    ctx.fillStyle = '#05050a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * GRID_SIZE, 0);
      ctx.lineTo(c * GRID_SIZE, canvas.height);
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * GRID_SIZE);
      ctx.lineTo(canvas.width, r * GRID_SIZE);
      ctx.stroke();
    }

    const profile = Storage.getProfile();
    snake.forEach((cell, i) => {
      ctx.fillStyle = i === 0 ? '#ffffff' : profile.avatarColor;
      ctx.fillRect(cell.x * GRID_SIZE + 1, cell.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2);
      
      if (i === 0) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(cell.x * GRID_SIZE + 4, cell.y * GRID_SIZE + 4, 3, 3);
        ctx.fillRect(cell.x * GRID_SIZE + 12, cell.y * GRID_SIZE + 4, 3, 3);
      }
    });

    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.arc(food.x * GRID_SIZE + GRID_SIZE/2, food.y * GRID_SIZE + GRID_SIZE/2, GRID_SIZE/2 - 2, 0, Math.PI * 2);
    ctx.fill();
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

  function gameOver() {
    isGameOver = true;
    isPlaying = false;
    clearInterval(gameInterval);

    goScore.textContent = score;
    gameoverOverlay.classList.remove('hidden');

    if (window.App) window.App.playSound('defeat');

    Storage.recordGamePlayed('snake', score > 0, score, {
      foodEaten: foodEatenSession
    });
  }

  ctx.fillStyle = '#05050a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
});
