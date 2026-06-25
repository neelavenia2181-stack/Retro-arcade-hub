
document.addEventListener('DOMContentLoaded', () => {
  const hudWins = document.getElementById('hud-score-wins');
  const hudLosses = document.getElementById('hud-score-losses');
  const hudStreak = document.getElementById('hud-streak');
  const fighterPlayer = document.getElementById('fighter-player');
  const fighterCpu = document.getElementById('fighter-cpu');
  const fighterPlayerIcon = document.getElementById('fighter-player-icon');
  const fighterCpuIcon = document.getElementById('fighter-cpu-icon');
  const resultBanner = document.getElementById('result-banner');
  const optionBtns = document.querySelectorAll('.rps-btn');
  const consoleResetBtn = document.getElementById('console-reset-btn');

  if (window.Settings) window.Settings.applyLoadedTheme();

  const CHOICES = {
    rock: { emoji: '✊', beats: 'scissors' },
    paper: { emoji: '✋', beats: 'rock' },
    scissors: { emoji: '✌️', beats: 'paper' }
  };

  let wins = 0;
  let losses = 0;
  let currentStreak = 0;
  let lockChoice = false;
  const stats = Storage.getStats().games.rps;
  wins = stats.wins;
  losses = stats.losses;
  currentStreak = stats.currentStreak;

  hudWins.textContent = wins;
  hudLosses.textContent = losses;
  hudStreak.textContent = currentStreak;

  optionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const choice = btn.dataset.choice;
      playRound(choice);
    });
  });

  consoleResetBtn.addEventListener('click', () => {
    if (window.App) window.App.playSound('defeat');
    const check = confirm('Reset RPS session scores?');
    if (check) {
      wins = 0;
      losses = 0;
      currentStreak = 0;
      
      hudWins.textContent = wins;
      hudLosses.textContent = losses;
      hudStreak.textContent = currentStreak;
      
      fighterPlayerIcon.textContent = '✊';
      fighterCpuIcon.textContent = '✊';
      resultBanner.textContent = 'CHOOSE YOUR MOVE';
    }
  });

  function playRound(playerChoice) {
    if (lockChoice) return;
    lockChoice = true;

    fighterPlayerIcon.textContent = '✊';
    fighterCpuIcon.textContent = '✊';
    resultBanner.textContent = 'SHOOT!';
    resultBanner.style.color = 'var(--text-secondary)';

    fighterPlayer.classList.add('shake');
    fighterCpu.classList.add('shake');

    if (window.App) window.App.playSound('click');

    setTimeout(() => {
      fighterPlayer.classList.remove('shake');
      fighterCpu.classList.remove('shake');

      const choicesKeys = Object.keys(CHOICES);
      const cpuChoice = choicesKeys[Math.floor(Math.random() * choicesKeys.length)];

      fighterPlayerIcon.textContent = CHOICES[playerChoice].emoji;
      fighterCpuIcon.textContent = CHOICES[cpuChoice].emoji;

      resolveWinner(playerChoice, cpuChoice);
      
      lockChoice = false;
    }, 700);
  }

  function resolveWinner(player, cpu) {
    if (player === cpu) {
      resultBanner.textContent = 'DRAW MATCH!';
      resultBanner.style.color = 'var(--accent3)';
      if (window.App) window.App.playSound('click');
      
      Storage.recordGamePlayed('rps', null, 0);
    } else if (CHOICES[player].beats === cpu) {
      resultBanner.textContent = 'YOU WIN!';
      resultBanner.style.color = 'var(--accent-green)';
      if (window.App) window.App.playSound('victory');
      
      wins++;
      currentStreak++;
      hudWins.textContent = wins;
      hudStreak.textContent = currentStreak;

      Storage.recordGamePlayed('rps', true, 5);
    } else {
      resultBanner.textContent = 'YOU LOSE!';
      resultBanner.style.color = 'var(--accent-red)';
      if (window.App) window.App.playSound('defeat');
      
      losses++;
      currentStreak = 0;
      hudLosses.textContent = losses;
      hudStreak.textContent = currentStreak;

      Storage.recordGamePlayed('rps', false, 0);
    }
  }
});
