const Statistics = {
  init() {
    this.cacheDOM();
    this.bindEvents();
    this.render();
  },
  cacheDOM() {
    this.playedVal = document.getElementById('stats-games-played');
    this.winsVal = document.getElementById('stats-games-won');
    this.scoreVal = document.getElementById('stats-total-score');
    this.highestVal = document.getElementById('stats-highest-score');
    this.favVal = document.getElementById('stats-favorite-game');
    this.streakVal = document.getElementById('stats-winning-streak');
    this.chartContainer = document.getElementById('stats-game-chart');
  },

  bindEvents() {
    window.addEventListener('arcade_storage_update', () => {
      this.render();
    });
  },

  render() {
    const stats = Storage.getStats();
    if (this.playedVal) this.playedVal.textContent = stats.totalGamesPlayed;
    if (this.winsVal) this.winsVal.textContent = stats.totalWins;
    if (this.scoreVal) this.scoreVal.textContent = stats.totalScore;
    if (this.highestVal) this.highestVal.textContent = stats.highestScoreEver;
    if (this.favVal) this.favVal.textContent = stats.favoriteGame;
    if (this.streakVal) this.streakVal.textContent = stats.longestWinningStreak;
    if (this.chartContainer) {
      this.chartContainer.innerHTML = '';
      
      const games = [
        { key: 'snake', name: 'Snake', color: '#00f5ff' },
        { key: 'pong', name: 'Pong', color: '#ff00ff' },
        { key: 'tictactoe', name: 'TicTacToe', color: '#ffff00' },
        { key: 'memory', name: 'Memory', color: '#00ff88' },
        { key: 'rps', name: 'RPS', color: '#ff8800' }
      ];
      let maxPlays = 0;
      games.forEach(g => {
        const count = stats.games[g.key]?.played || 0;
        if (count > maxPlays) maxPlays = count;
      });

      games.forEach(g => {
        const count = stats.games[g.key]?.played || 0;
        const width = maxPlays > 0 ? (count / maxPlays) * 100 : 0;
        
        const row = document.createElement('div');
        row.style.marginBottom = '10px';
        row.innerHTML = `
          <div style="display:flex;justify-content:space-between;font-size:0.75rem;margin-bottom:2px;color:var(--text-secondary);">
            <span>${g.name}</span>
            <span>${count} play${count === 1 ? '' : 's'}</span>
          </div>
          <div style="width:100%;height:8px;background:rgba(255,255,255,0.03);border-radius:4px;overflow:hidden;border:1px solid rgba(255,255,255,0.05);">
            <div style="width:${width}%;height:100%;background:${g.color};border-radius:4px;box-shadow: 0 0 8px ${g.color};transition:width 0.8s ease-out;"></div>
          </div>
        `;
        this.chartContainer.appendChild(row);
      });
    }
    this.updateGameCardsOverlay(stats);
  },

  updateGameCardsOverlay(stats) {
    const snakeHigh = document.getElementById('card-stat-snake-high');
    if (snakeHigh) snakeHigh.textContent = stats.games.snake.highScore;
    const pongWins = document.getElementById('card-stat-pong-wins');
    if (pongWins) pongWins.textContent = stats.games.pong.won;
    const tttWins = document.getElementById('card-stat-ttt-wins');
    if (tttWins) tttWins.textContent = stats.games.tictactoe.wins;
    const memoryBest = document.getElementById('card-stat-memory-best');
    if (memoryBest) {
      const best = stats.games.memory.bestTime;
      memoryBest.textContent = best !== null ? `${best}s` : 'N/A';
    }

    const rpsStreak = document.getElementById('card-stat-rps-streak');
    if (rpsStreak) rpsStreak.textContent = stats.games.rps.longestStreak;
  }
};

window.Statistics = Statistics;
document.addEventListener('DOMContentLoaded', () => Statistics.init());