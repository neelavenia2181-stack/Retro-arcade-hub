
document.addEventListener('DOMContentLoaded', () => {
  const boardContainer = document.getElementById('memory-board');
  const hudTimer = document.getElementById('hud-timer');
  const hudMoves = document.getElementById('hud-moves');
  const hudBest = document.getElementById('hud-best');
  
  const startOverlay = document.getElementById('start-overlay');
  const gameoverOverlay = document.getElementById('gameover-overlay');
  const goTime = document.getElementById('go-time');
  const goMoves = document.getElementById('go-moves');
  
  const startBtn = document.getElementById('start-btn');
  const restartBtn = document.getElementById('restart-btn');
  const consoleRestartBtn = document.getElementById('console-restart-btn');
  const difficultySelect = document.getElementById('memory-difficulty-select');

  if (window.Settings) window.Settings.applyLoadedTheme();

  const EMOJI_POOL = [
    '👾', '🚀', '⭐', '🌈', '🍕', '🐱', '🧙', '🤖',
    '🦄', '💎', '🔑', '🔋', '🏆', '🛸', '🍉', '🍦',
    '🍩', '🍬'
  ];

  const GRID_CONFIG = {
    easy: { cols: 4, rows: 4, pairs: 8 },
    medium: { cols: 6, rows: 4, pairs: 12 },
    hard: { cols: 6, rows: 6, pairs: 18 }
  };

  let cards = [];
  let flippedCards = [];
  let matchedPairs = 0;
  let moveCount = 0;
  let timerInterval = null;
  let secondsElapsed = 0;
  let isPlaying = false;
  let isGameOver = false;
  let lockBoard = false;
  let activeDifficulty = 'medium';
  const bestTime = Storage.getStats().games.memory.bestTime;
  hudBest.textContent = bestTime !== null ? `${bestTime.toFixed(1)}s` : 'N/A';

  const defaultDiff = Storage.getSettings().difficulty;
  if (difficultySelect) {
    difficultySelect.value = defaultDiff;
  }
  activeDifficulty = defaultDiff;
  startBtn.addEventListener('click', startChallenge);
  restartBtn.addEventListener('click', startChallenge);
  consoleRestartBtn.addEventListener('click', startChallenge);
  
  difficultySelect.addEventListener('change', (e) => {
    activeDifficulty = e.target.value;
  });

  function startChallenge() {
    isPlaying = true;
    isGameOver = false;
    matchedPairs = 0;
    moveCount = 0;
    secondsElapsed = 0;
    flippedCards = [];
    lockBoard = false;
    
    hudMoves.textContent = 0;
    hudTimer.textContent = '0.0s';

    activeDifficulty = difficultySelect.value;
    boardContainer.className = `memory-board ${activeDifficulty}`;
    buildDeck();
    
    startOverlay.classList.add('hidden');
    gameoverOverlay.classList.add('hidden');

    if (window.App) window.App.playSound('start');
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      secondsElapsed += 0.1;
      hudTimer.textContent = `${secondsElapsed.toFixed(1)}s`;
    }, 100);
  }

  function buildDeck() {
    boardContainer.innerHTML = '';
    const config = GRID_CONFIG[activeDifficulty];
    const emojis = EMOJI_POOL.slice(0, config.pairs);
    let deck = [...emojis, ...emojis];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    deck.forEach((emoji, index) => {
      const card = document.createElement('div');
      card.className = 'card-3d';
      card.dataset.index = index;
      card.dataset.emoji = emoji;

      card.innerHTML = `
        <div class="card-back">❓</div>
        <div class="card-front">${emoji}</div>
      `;

      card.addEventListener('click', () => handleCardClick(card));
      boardContainer.appendChild(card);
    });
  }

  function handleCardClick(card) {
    if (!isPlaying || isGameOver || lockBoard) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

    
    card.classList.add('flipped');
    flippedCards.push(card);

    if (window.App) window.App.playSound('click');

    if (flippedCards.length === 2) {
      moveCount++;
      hudMoves.textContent = moveCount;
      checkMatch();
    }
  }

  function checkMatch() {
    lockBoard = true;
    const [card1, card2] = flippedCards;
    
    if (card1.dataset.emoji === card2.dataset.emoji) {
      setTimeout(() => {
        card1.classList.add('matched');
        card2.classList.add('matched');
        matchedPairs++;
        
        flippedCards = [];
        lockBoard = false;
        
        if (window.App) window.App.playSound('collect');

        const config = GRID_CONFIG[activeDifficulty];
        if (matchedPairs === config.pairs) {
          endGame();
        }
      }, 500);
    } else {
      setTimeout(() => {
        card1.classList.remove('flipped');
        card2.classList.remove('flipped');
        flippedCards = [];
        lockBoard = false;
      }, 1000);
    }
  }

  function endGame() {
    isGameOver = true;
    isPlaying = false;
    clearInterval(timerInterval);

    goTime.textContent = secondsElapsed.toFixed(1);
    goMoves.textContent = moveCount;
    gameoverOverlay.classList.remove('hidden');

    if (window.App) window.App.playSound('victory');
    Storage.recordGamePlayed('memory', true, 15, {
      timeElapsed: secondsElapsed
    });
    const newBest = Storage.getStats().games.memory.bestTime;
    hudBest.textContent = newBest !== null ? `${newBest.toFixed(1)}s` : 'N/A';
  }
});
