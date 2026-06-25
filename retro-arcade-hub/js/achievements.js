

const Achievements = {
  icons: {
    'first_game': '🎮',
    'snake_beginner': '🐍',
    'snake_master': '👑',
    'pong_champion': '🏓',
    'ttt_expert': '❌',
    'memory_genius': '🧠',
    'rps_winner': '✂️',
    'half_century': '💯',
    'century_points': '⭐'
  },

  init() {
    this.cacheDOM();
    this.bindEvents();
    this.render();
  },

  cacheDOM() {
    this.achievementsList = document.getElementById('achievements-list');
    this.progressFill = document.getElementById('achievements-progress-fill');
    this.progressText = document.getElementById('achievements-progress-text');
  },

  bindEvents() {
    window.addEventListener('arcade_storage_update', () => {
      this.render();
    });

    window.addEventListener('arcade_achievement_unlocked', (e) => {
      const ach = e.detail;
      if (window.App) {
        window.App.playSound('victory');
        window.App.showToast(`Achievement Unlocked!`, `${ach.name} — ${ach.desc}`, 'achievement');
      }
      this.render();
    });
  },

  render() {
    const list = Storage.getAchievements();
    let unlockedCount = 0;
    const totalCount = Object.keys(list).length;
    
    if (this.achievementsList) {
      this.achievementsList.innerHTML = '';
    }

    for (const [id, ach] of Object.entries(list)) {
      if (ach.unlocked) unlockedCount++;

      if (this.achievementsList) {
        const item = document.createElement('div');
        item.className = `achievement-item ${ach.unlocked ? 'unlocked' : 'locked'}`;
        
        const emoji = this.icons[id] || '🏆';
        const formattedDate = ach.date ? new Date(ach.date).toLocaleDateString() : '';

        item.innerHTML = `
          <div class="achievement-icon">${emoji}</div>
          <div class="achievement-info">
            <div class="achievement-name">${ach.name}</div>
            <div class="achievement-desc">${ach.desc}</div>
          </div>
          <div class="achievement-status">
            ${ach.unlocked ? `<span>UNLOCKED<br><small style="font-size:0.6rem;color:var(--text-muted);">${formattedDate}</small></span>` : 'LOCKED'}
          </div>
        `;

        this.achievementsList.appendChild(item);
      }
    }

    const percent = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;
    if (this.progressFill) {
      this.progressFill.style.width = `${percent}%`;
    }
    if (this.progressText) {
      this.progressText.textContent = `${unlockedCount}/${totalCount} Unlocked (${Math.round(percent)}%)`;
    }
  }
};

window.Achievements = Achievements;
document.addEventListener('DOMContentLoaded', () => Achievements.init());
