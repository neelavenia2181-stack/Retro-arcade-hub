
const Settings = {
  init() {
    this.cacheDOM();
    this.bindEvents();
    this.applyLoadedTheme();
    this.render();
  },

  cacheDOM() {
    this.soundToggle = document.getElementById('settings-sound-toggle');
    this.difficultySelect = document.getElementById('settings-difficulty');
    this.resetBtn = document.getElementById('settings-reset-btn');
    this.themeOptions = document.querySelectorAll('.theme-option');
  },

  bindEvents() {
    if (this.soundToggle) {
      this.soundToggle.addEventListener('change', (e) => {
        Storage.setSetting('soundEnabled', e.target.checked);
        if (window.App) {
          window.App.soundEnabled = e.target.checked;
          window.App.playSound('click');
        }
      });
    }
    if (this.difficultySelect) {
      this.difficultySelect.addEventListener('change', (e) => {
        Storage.setSetting('difficulty', e.target.value);
        if (window.App) window.App.playSound('click');
      });
    }
    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => {
        this.confirmReset();
      });
    }
    this.themeOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        const theme = opt.dataset.theme;
        this.setTheme(theme);
      });
    });
    window.addEventListener('arcade_storage_update', () => {
      this.render();
      this.applyLoadedTheme();
    });
  },

  render() {
    const settings = Storage.getSettings();
    
    if (this.soundToggle) {
      this.soundToggle.checked = settings.soundEnabled;
    }
    
    if (this.difficultySelect) {
      this.difficultySelect.value = settings.difficulty;
    }
    this.themeOptions.forEach(opt => {
      if (opt.dataset.theme === settings.theme) {
        opt.classList.add('active');
      } else {
        opt.classList.remove('active');
      }
    });
  },

  applyLoadedTheme() {
    const theme = Storage.getSettings().theme;
    
    document.body.className = document.body.className.replace(/\btheme-\S+/g, '');
    
    if (theme !== 'dark') {
      document.body.classList.add(`theme-${theme}`);
    }
  },

  setTheme(themeName) {
    Storage.setSetting('theme', themeName);
    this.applyLoadedTheme();
    this.render();
    if (window.App) {
      window.App.playSound('victory');
      window.App.showToast('Theme Changed', `Applied theme: ${themeName.toUpperCase()}`, 'success');
    }
  },

  confirmReset() {
    if (window.App) window.App.playSound('defeat');
    const firstCheck = confirm('⚠️ WARNING: This will delete ALL scores, statistics, and unlocked achievements. Are you sure you want to reset?');
    if (firstCheck) {
      const secondCheck = confirm('🔥 LAST WARNING: This cannot be undone. Wipe all progress data?');
      if (secondCheck) {
        Storage.resetAllData();
        if (window.App) {
          window.App.showToast('Data Reset', 'All records cleared!', 'error');
        }
      }
    }
  }
};

window.Settings = Settings;
document.addEventListener('DOMContentLoaded', () => Settings.init());


