document.addEventListener('DOMContentLoaded', () => {
  const cells = document.querySelectorAll('.ttt-cell');
  const hudScoreWins = document.getElementById('hud-score-wins');
  const hudScoreDraws = document.getElementById('hud-score-draws');
  const hudScoreLosses = document.getElementById('hud-score-losses');
  
  const startOverlay = document.getElementById('start-overlay');
  const gameoverOverlay = document.getElementById('gameover-overlay');
  const gameoverTitle = document.getElementById('gameover-title');
  const gameoverDesc = document.getElementById('gameover-desc');
  
  const startBtn = document.getElementById('start-btn');
  const restartBtn = document.getElementById('restart-btn');
  const consoleResetBtn = document.getElementById('console-reset-btn');
  
  const modeSelect = document.getElementById('ttt-mode-select');
  const difficultySelect = document.getElementById('ttt-difficulty-select');
  const difficultyWrap = document.getElementById('ttt-difficulty-wrap');
  const turnIndicator = document.getElementById('turn-indicator');

  if (window.Settings) window.Settings.applyLoadedTheme();

  let board = ['', '', '', '', '', '', '', '', ''];
  let isPlaying = false;
  let isGameOver = false;
  let activeMode = 'pvc'; 
  let activeDifficulty = 'medium'; 
  let currentTurn = 'X';
  const stats = Storage.getStats().games.tictactoe;
  hudScoreWins.textContent = stats.wins;
  hudScoreLosses.textContent = stats.losses;
  hudScoreDraws.textContent = stats.draws;

  modeSelect.addEventListener('change', (e) => {
    activeMode = e.target.value;
    if (activeMode === 'pvp') {
      difficultyWrap.classList.add('hidden');
    } else {
      difficultyWrap.classList.remove('hidden');
    }
  });

  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', startGame);
  consoleResetBtn.addEventListener('click', startGame);

  cells.forEach(cell => {
    cell.addEventListener('click', (e) => {
      const idx = parseInt(e.target.dataset.index);
      handleCellClick(idx);
    });
  });

  function startGame() {
    board = ['', '', '', '', '', '', '', '', ''];
    isGameOver = false;
    isPlaying = true;
    currentTurn = 'X';
    activeMode = modeSelect.value;
    activeDifficulty = difficultySelect.value;

    cells.forEach(cell => {
      cell.textContent = '';
      cell.className = 'ttt-cell';
    });

    startOverlay.classList.add('hidden');
    gameoverOverlay.classList.add('hidden');

    turnIndicator.textContent = 'YOUR TURN (X)';
    
    if (window.App) window.App.playSound('start');
  }

  function handleCellClick(index) {
    if (!isPlaying || isGameOver || board[index] !== '') return;

    makeMove(index, currentTurn);

    if (checkWinner(currentTurn)) {
      endGame(currentTurn);
      return;
    }

    if (board.every(cell => cell !== '')) {
      endGame('draw');
      return;
    }

    currentTurn = currentTurn === 'X' ? 'O' : 'X';

    if (activeMode === 'pvc') {
      turnIndicator.textContent = 'COMPUTER THINKING...';
      setTimeout(makeComputerMove, 300);
    } else {
      turnIndicator.textContent = `PLAYER TURN (${currentTurn})`;
    }
  }

  function makeMove(index, player) {
    board[index] = player;
    
    const cell = cells[index];
    cell.textContent = player;
    cell.classList.add(player.toLowerCase());
    
    if (window.App) window.App.playSound('click');
  }

  function makeComputerMove() {
    if (!isPlaying || isGameOver) return;

    let targetIndex = -1;

    if (activeDifficulty === 'easy') {
      targetIndex = getEasyMove();
    } else if (activeDifficulty === 'medium') {
      targetIndex = getMediumMove();
    } else {
      targetIndex = getBestMove(); 
    }

    if (targetIndex !== -1) {
      makeMove(targetIndex, 'O');

      if (checkWinner('O')) {
        endGame('O');
        return;
      }

      if (board.every(cell => cell !== '')) {
        endGame('draw');
        return;
      }

      currentTurn = 'X';
      turnIndicator.textContent = 'YOUR TURN (X)';
    }
  }

  function getEasyMove() {
    const empties = board.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);
    if (empties.length === 0) return -1;
    return empties[Math.floor(Math.random() * empties.length)];
  }

  function getMediumMove() {
    for (let i = 0; i < board.length; i++) {
      if (board[i] === '') {
        board[i] = 'O';
        if (checkWinner('O')) {
          board[i] = '';
          return i;
        }
        board[i] = '';
      }
    }

    for (let i = 0; i < board.length; i++) {
      if (board[i] === '') {
        board[i] = 'X';
        if (checkWinner('X')) {
          board[i] = '';
          return i;
        }
        board[i] = '';
      }
    }

    return getEasyMove();
  }

  function getBestMove() {
    let bestVal = -Infinity;
    let bestMove = -1;

    for (let i = 0; i < board.length; i++) {
      if (board[i] === '') {
        board[i] = 'O';
        let moveVal = minimax(board, 0, false);
        board[i] = '';

        if (moveVal > bestVal) {
          bestVal = moveVal;
          bestMove = i;
        }
      }
    }
    return bestMove;
  }

  function minimax(tempBoard, depth, isMax) {
    const score = evaluateBoard(tempBoard);

    if (score === 10) return score - depth;
    if (score === -10) return score + depth;
    if (tempBoard.every(cell => cell !== '')) return 0;

    if (isMax) {
      let best = -Infinity;
      for (let i = 0; i < tempBoard.length; i++) {
        if (tempBoard[i] === '') {
          tempBoard[i] = 'O';
          best = Math.max(best, minimax(tempBoard, depth + 1, false));
          tempBoard[i] = '';
        }
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < tempBoard.length; i++) {
        if (tempBoard[i] === '') {
          tempBoard[i] = 'X';
          best = Math.min(best, minimax(tempBoard, depth + 1, true));
          tempBoard[i] = '';
        }
      }
      return best;
    }
  }

  function evaluateBoard(b) {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], 
      [0, 3, 6], [1, 4, 7], [2, 5, 8], 
      [0, 4, 8], [2, 4, 6]             
    ];

    for (let pattern of winPatterns) {
      if (b[pattern[0]] === b[pattern[1]] && b[pattern[1]] === b[pattern[2]]) {
        if (b[pattern[0]] === 'O') return 10;
        if (b[pattern[0]] === 'X') return -10;
      }
    }
    return 0;
  }

  function checkWinner(player) {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    return winPatterns.some(pattern => {
      return pattern.every(index => board[index] === player);
    });
  }

  function endGame(winner) {
    isGameOver = true;
    isPlaying = false;

    let isUserWin = null;

    if (winner === 'draw') {
      gameoverTitle.textContent = 'DRAW MATCH';
      gameoverTitle.style.color = 'var(--accent3)';
      gameoverTitle.style.textShadow = '0 0 10px var(--accent3)';
      gameoverDesc.textContent = 'Well played both!';
      if (window.App) window.App.playSound('click');
      isUserWin = null;
    } else if (winner === 'X') {
      gameoverTitle.textContent = 'VICTORY';
      gameoverTitle.style.color = 'var(--accent-green)';
      gameoverTitle.style.textShadow = 'var(--glow-green)';
      gameoverDesc.textContent = activeMode === 'pvc' ? 'You defeated the computer!' : 'Player X wins the match!';
      if (window.App) window.App.playSound('victory');
      isUserWin = true;

      if (activeMode === 'pvc' && activeDifficulty === 'hard') {
        Storage.unlockAchievement('ttt_expert');
      }
    } else {
      gameoverTitle.textContent = 'DEFEAT';
      gameoverTitle.style.color = 'var(--accent-red)';
      gameoverTitle.style.textShadow = '0 0 10px var(--accent-red)';
      gameoverDesc.textContent = activeMode === 'pvc' ? 'The computer outsmarted you.' : 'Player O wins the match!';
      if (window.App) window.App.playSound('defeat');
      isUserWin = false;
    }

    gameoverOverlay.classList.remove('hidden');

    Storage.recordGamePlayed('tictactoe', isUserWin, isUserWin ? 5 : 0);

    const newStats = Storage.getStats().games.tictactoe;
    hudScoreWins.textContent = newStats.wins;
    hudScoreLosses.textContent = newStats.losses;
    hudScoreDraws.textContent = newStats.draws;
  }
});

