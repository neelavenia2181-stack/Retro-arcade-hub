
const STORAGE_KEY = 'retro_arcade_hub_data';

const DEFAULT_DATA = {
  profile: {
    name: 'Player One',
    avatarColor: '#00f5ff',
    avatarEmoji: '👾'
  },
  settings: {
    soundEnabled: true,
    theme: 'dark',
    difficulty: 'medium' 
  },
  stats: {
    totalGamesPlayed: 0,
    totalWins: 0,
    totalLosses: 0,
    totalScore: 0,
    highestScoreEver: 0,
    favoriteGame: 'None',
    longestWinningStreak: 0,
    games: {
      snake: { played: 0, highScore: 0, totalFood: 0 },
      pong: { played: 0, won: 0, currentStreak: 0, highestStreak: 0 },
      tictactoe: { played: 0, wins: 0, losses: 0, draws: 0 },
      memory: { played: 0, completed: 0, bestTime: null }, // bestTime in seconds
      rps: { played: 0, wins: 0, losses: 0, draws: 0, currentStreak: 0, longestStreak: 0 }
    }
  },
  achievements: {
    'first_game': { id: 'first_game', name: 'First Game Played', desc: 'Play any game in the arcade.', unlocked: false, date: null },
    'snake_beginner': { id: 'snake_beginner', name: 'Snake Beginner', desc: 'Reach 10 points in Snake.', unlocked: false, date: null },
    'snake_master': { id: 'snake_master', name: 'Snake Master', desc: 'Reach 50 points in Snake.', unlocked: false, date: null },
    'pong_champion': { id: 'pong_champion', name: 'Pong Champion', desc: 'Defeat the AI in Pong.', unlocked: false, date: null },
    'ttt_expert': { id: 'ttt_expert', name: 'Tic Tac Toe Expert', desc: 'Beat the computer on hard difficulty.', unlocked: false, date: null },
    'memory_genius': { id: 'memory_genius', name: 'Memory Genius', desc: 'Complete Memory Match under 35 seconds.', unlocked: false, date: null },
    'rps_winner': { id: 'rps_winner', name: 'RPS Winner', desc: 'Win a Rock Paper Scissors match.', unlocked: false, date: null },
    'half_century': { id: 'half_century', name: 'Play 50 Games', desc: 'Play 50 total matches across all games.', unlocked: false, date: null },
    'century_points': { id: 'century_points', name: 'Earn 100 Points', desc: 'Reach 100 total score across all matches.', unlocked: false, date: null }
  }
};

const Storage = {
  data: null,

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.data = JSON.parse(raw);
        this.data = this.deepMerge(JSON.parse(JSON.stringify(DEFAULT_DATA)), this.data);
      } else {
        this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
        this.save();
      }
    } catch (e) {
      console.error('Error loading data from localStorage, resetting:', e);
      this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
    return this.data;
  },

  save() {
    if (!this.data) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      window.dispatchEvent(new CustomEvent('arcade_storage_update', { detail: this.data }));
    } catch (e) {
      console.error('Error saving data to localStorage:', e);
    }
  },

  getProfile() {
    return this.data.profile;
  },

  setProfile(profile) {
    this.data.profile = { ...this.data.profile, ...profile };
    this.save();
  },

  getSettings() {
    return this.data.settings;
  },

  setSetting(key, val) {
    this.data.settings[key] = val;
    this.save();
  },

  getStats() {
    return this.data.stats;
  },

  recordGamePlayed(gameId, isWin, scoreChange = 0, extraStats = {}) {
    const stats = this.data.stats;
    stats.totalGamesPlayed += 1;
    if (isWin === true) stats.totalWins += 1;
    else if (isWin === false) stats.totalLosses += 1;

    stats.totalScore += scoreChange;

    if (scoreChange > stats.highestScoreEver) {
      stats.highestScoreEver = scoreChange;
    }

    const game = stats.games[gameId];
    if (game) {
      game.played += 1;
      if (gameId === 'snake') {
        if (scoreChange > game.highScore) {
          game.highScore = scoreChange;
        }
        if (extraStats.foodEaten) {
          game.totalFood += extraStats.foodEaten;
        }
      } else if (gameId === 'pong') {
        if (isWin) {
          game.won += 1;
          game.currentStreak += 1;
          if (game.currentStreak > game.highestStreak) {
            game.highestStreak = game.currentStreak;
          }
        } else {
          game.currentStreak = 0;
        }
      } else if (gameId === 'tictactoe') {
        if (isWin === true) game.wins += 1;
        else if (isWin === false) game.losses += 1;
        else game.draws += 1;
      } else if (gameId === 'memory') {
        if (isWin) {
          game.completed += 1;
          if (extraStats.timeElapsed) {
            if (game.bestTime === null || extraStats.timeElapsed < game.bestTime) {
              game.bestTime = extraStats.timeElapsed;
            }
          }
        }
      } else if (gameId === 'rps') {
        if (isWin === true) {
          game.wins += 1;
          game.currentStreak += 1;
          if (game.currentStreak > game.longestStreak) {
            game.longestStreak = game.currentStreak;
          }
        } else if (isWin === false) {
          game.losses += 1;
          game.currentStreak = 0;
        } else {
          game.draws += 1;
        }
      }
    }

    stats.favoriteGame = this.calculateFavoriteGame();

    let overallStreak = 0;
    if (stats.games.pong.highestStreak > overallStreak) overallStreak = stats.games.pong.highestStreak;
    if (stats.games.rps.longestStreak > overallStreak) overallStreak = stats.games.rps.longestStreak;
    stats.longestWinningStreak = overallStreak;

    this.save();
    
    this.checkAchievements();
  },

  calculateFavoriteGame() {
    const games = this.data.stats.games;
    let fav = 'None';
    let max = 0;
    for (const [key, val] of Object.entries(games)) {
      if (val.played > max) {
        max = val.played;
        fav = key.charAt(0).toUpperCase() + key.slice(1);
      }
    }
    return fav;
  },

  getAchievements() {
    return this.data.achievements;
  },

  unlockAchievement(id) {
    if (this.data.achievements[id] && !this.data.achievements[id].unlocked) {
      this.data.achievements[id].unlocked = true;
      this.data.achievements[id].date = new Date().toISOString();
      this.save();
      window.dispatchEvent(new CustomEvent('arcade_achievement_unlocked', { detail: this.data.achievements[id] }));
    }
  },

  checkAchievements() {
    const stats = this.data.stats;

    if (stats.totalGamesPlayed >= 1) {
      this.unlockAchievement('first_game');
    }

    if (stats.games.snake.highScore >= 10) {
      this.unlockAchievement('snake_beginner');
    }

    if (stats.games.snake.highScore >= 50) {
      this.unlockAchievement('snake_master');
    }

    if (stats.games.pong.won >= 1) {
      this.unlockAchievement('pong_champion');
    }

    
    if (stats.games.memory.bestTime !== null && stats.games.memory.bestTime <= 35) {
      this.unlockAchievement('memory_genius');
    }

    if (stats.games.rps.wins >= 1) {
      this.unlockAchievement('rps_winner');
    }

    if (stats.totalGamesPlayed >= 50) {
      this.unlockAchievement('half_century');
    }

    if (stats.totalScore >= 100) {
      this.unlockAchievement('century_points');
    }
  },

  resetAllData() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    this.save();
  },

  deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      if (source[key] instanceof Object && target[key] instanceof Object) {
        Object.assign(source[key], this.deepMerge(target[key], source[key]));
      }
    }
    Object.assign(target || {}, source);
    return target;
  }
};

Storage.load();
window.Storage = Storage;
