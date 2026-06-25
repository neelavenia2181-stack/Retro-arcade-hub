
const Profile = {
  selectedColor: '#00f5ff',
  selectedEmoji: '👾',
  
  init() {
    this.cacheDOM();
    this.bindEvents();
    this.render();
  },

  cacheDOM() {
    this.avatarDisplay = document.getElementById('profile-avatar-display');
    this.nameDisplay = document.getElementById('profile-name-display');
    this.rankDisplay = document.getElementById('profile-rank-display');
    
    this.editModal = document.getElementById('profile-edit-modal');
    this.closeModalBtn = document.getElementById('profile-close-modal');
    this.profileForm = document.getElementById('profile-edit-form');
    this.usernameInput = document.getElementById('profile-username-input');
    this.emojiSelect = document.getElementById('profile-emoji-select');
    this.colorContainer = document.getElementById('profile-color-picker');
  },

  bindEvents() {
    if (this.avatarDisplay) this.avatarDisplay.addEventListener('click', () => this.openModal());
    if (this.nameDisplay) this.nameDisplay.addEventListener('click', () => this.openModal());
    
    if (this.closeModalBtn) this.closeModalBtn.addEventListener('click', () => this.closeModal());
    
    if (this.profileForm) {
      this.profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveProfile();
      });
    }

    if (this.colorContainer) {
      this.colorContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('avatar-color-btn')) {
          this.selectColor(e.target);
        }
      });
    }

    window.addEventListener('click', (e) => {
      if (e.target === this.editModal) {
        this.closeModal();
      }
    });

    window.addEventListener('arcade_storage_update', () => {
      this.render();
    });
  },

  render() {
    const profile = Storage.getProfile();
    
    if (this.avatarDisplay) {
      this.avatarDisplay.textContent = profile.avatarEmoji;
      this.avatarDisplay.style.borderColor = profile.avatarColor;
      this.avatarDisplay.style.boxShadow = `0 0 20px ${profile.avatarColor}`;
    }
    
    if (this.nameDisplay) {
      this.nameDisplay.textContent = profile.name;
    }

    if (this.rankDisplay) {
      const stats = Storage.getStats();
      let rank = 'ROOKIE';
      if (stats.totalGamesPlayed >= 30) rank = 'LEGEND';
      else if (stats.totalGamesPlayed >= 15) rank = 'PRO';
      else if (stats.totalGamesPlayed >= 5) rank = 'ARCADE ENTHUSIAST';
      this.rankDisplay.textContent = rank;
    }
  },

  openModal() {
    if (!this.editModal) return;
    const profile = Storage.getProfile();
    
    this.usernameInput.value = profile.name;
    this.emojiSelect.value = profile.avatarEmoji;
    this.selectedColor = profile.avatarColor;
    this.selectedEmoji = profile.avatarEmoji;

    const colors = [
      '#00f5ff', 
      '#ff00ff', 
      '#ffff00', 
      '#00ff88', 
      '#ff4444', 
      '#ff8800', 
      '#8a2be2', 
      '#ffffff'  
    ];

    if (this.colorContainer) {
      this.colorContainer.innerHTML = '';
      colors.forEach(col => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'avatar-color-btn';
        btn.style.backgroundColor = col;
        btn.style.color = col;
        btn.dataset.color = col;
        if (col === this.selectedColor) {
          btn.classList.add('active');
        }
        this.colorContainer.appendChild(btn);
      });
    }

    this.editModal.classList.add('show');
    if (window.App) window.App.playSound('click');
  },

  closeModal() {
    if (this.editModal) {
      this.editModal.classList.remove('show');
    }
  },

  selectColor(btnElement) {
    const active = this.colorContainer.querySelector('.active');
    if (active) active.classList.remove('active');
    
    btnElement.classList.add('active');
    this.selectedColor = btnElement.dataset.color;
    if (window.App) window.App.playSound('click');
  },

  saveProfile() {
    const newName = this.usernameInput.value.trim() || 'Player One';
    const newEmoji = this.emojiSelect.value;
    
    Storage.setProfile({
      name: newName,
      avatarColor: this.selectedColor,
      avatarEmoji: newEmoji
    });

    this.closeModal();
    if (window.App) {
      window.App.playSound('victory');
      window.App.showToast('Profile Updated!', 'Your arcade identity is updated.', 'success');
    }
  }
};

window.Profile = Profile;
document.addEventListener('DOMContentLoaded', () => Profile.init());

