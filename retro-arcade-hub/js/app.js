const App = {
  soundEnabled: true,
  audioCtx: null,

  init() {
    this.cacheDOM();
    this.bindEvents();
    this.initBackgroundParticles();
    this.loadSoundSetting();
    this.hideLoadingScreen();
  },

  cacheDOM() {
    this.navLinks = document.querySelectorAll('.nav-links a, .nav-btn-route');
    this.sections = document.querySelectorAll('.page-section');
    this.toastContainer = document.getElementById('toast-container');
    this.starsCanvas = document.getElementById('stars-canvas');
  },

  bindEvents() {
    this.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('href') || link.dataset.target;
        if (target && target.startsWith('#')) {
          this.switchTab(target);
          this.playSound('click');
        }
      });
    });

    window.addEventListener('hashchange', () => {
      const hash = window.location.hash;
      if (hash) {
        this.switchTab(hash);
      }
    });

    const initHash = window.location.hash;
    if (initHash) {
      this.switchTab(initHash);
    } else {
      this.switchTab('#games-grid-section');
    }
  },

  switchTab(targetId) {
    if (!targetId || targetId === '#' || !targetId.startsWith('#')) return;

    this.sections.forEach(sec => sec.classList.remove('active'));
    
    let targetSec = null;
    try {
      targetSec = document.querySelector(targetId);
    } catch(e) {
      console.warn("Invalid selector hash:", targetId);
    }
    
    if (targetSec) {
      targetSec.classList.add('active');
    }

    this.navLinks.forEach(link => {
      const href = link.getAttribute('href') || link.dataset.target;
      if (href === targetId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  loadSoundSetting() {
    const settings = Storage.getSettings();
    this.soundEnabled = settings.soundEnabled;
  },

  playSound(type) {
    if (!this.soundEnabled) return;
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      switch(type) {
        case 'click': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);
          
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.1);
          break;
        }
        case 'collect': { 
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, now); // C5
          osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
          
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.2);
          break;
        }
        case 'victory': { 
          const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
          notes.forEach((freq, index) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, now + index * 0.1);
            
            gain.gain.setValueAtTime(0.1, now + index * 0.1);
            gain.gain.linearRampToValueAtTime(0.01, now + index * 0.1 + 0.2);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + index * 0.1);
            osc.stop(now + index * 0.1 + 0.2);
          });
          break;
        }
        case 'defeat': { 
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.exponentialRampToValueAtTime(80, now + 0.4);
          
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.4);
          break;
        }
        case 'start': { 
          const osc = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'square';
          osc.frequency.setValueAtTime(987.77, now); // B5
          osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
          
          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(493.88, now);
          osc2.frequency.setValueAtTime(659.25, now + 0.08);
          
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
          
          osc.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(now);
          osc2.start(now);
          osc.stop(now + 0.35);
          osc2.stop(now + 0.35);
          break;
        }
      }
    } catch(e) {
      console.warn('AudioContext failed to initiate:', e);
    }
  },

  showToast(title, message, type = 'success') {
    if (!this.toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let emoji = '🔔';
    if (type === 'success') emoji = '✅';
    if (type === 'error') emoji = '❌';
    if (type === 'achievement') emoji = '🏆';

    toast.innerHTML = `
      <div class="toast-icon">${emoji}</div>
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        <div class="toast-msg">${message}</div>
      </div>
    `;

    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastFade 0.4s forwards';
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  },

  initBackgroundParticles() {
    if (!this.starsCanvas) return;
    
    const canvas = this.starsCanvas;
    const ctx = canvas.getContext('2d');
    
    let stars = [];
    const count = 75;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        speed: 0.1 + Math.random() * 0.4,
        alpha: Math.random()
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const theme = Storage.getSettings().theme;
      
      let starColor = '255, 255, 255';
      if (theme === 'neon') starColor = '57, 255, 20';
      if (theme === 'matrix') starColor = '0, 255, 65';
      if (theme === 'retro') starColor = '255, 0, 170';

      stars.forEach(s => {
        s.y += s.speed;
        if (s.y > canvas.height) {
          s.y = 0;
          s.x = Math.random() * canvas.width;
        }

        ctx.fillStyle = `rgba(${starColor}, ${s.alpha})`;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      });

      requestAnimationFrame(draw);
    };

    draw();
  },

  hideLoadingScreen() {
    const loader = document.getElementById('loading-screen');
    if (loader) {
      setTimeout(() => {
        loader.classList.add('hide');
        setTimeout(() => loader.remove(), 500);
      }, 800);
    }
  }
};

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());

