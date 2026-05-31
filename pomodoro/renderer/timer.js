// Pomodoro Timer Logic
// ======================

const WORK_TIME = 25 * 60;
const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 15 * 60;
const POMODORO_CYCLE = 4;

// State
let workDuration = WORK_TIME;
let timeLeft = workDuration;
let totalTime = workDuration;
let isRunning = false;
let isPaused = false;
let isBreak = false;
let pomodoroCount = 0;      // 0-3, index within current cycle
let todayCompleted = parseInt(localStorage.getItem('pomodoro-today') || '0', 10);
let todayDate = localStorage.getItem('pomodoro-date') || '';
let timerInterval = null;
let alwaysOnTop = true;

// DOM refs
const timerText = document.getElementById('timer-text');
const modeBadge = document.getElementById('mode-badge');
const btnStart = document.getElementById('btn-start');
const btnReset = document.getElementById('btn-reset');
const btnPin = document.getElementById('btn-pin');
const btnMin = document.getElementById('btn-min');
const btnClose = document.getElementById('btn-close');
const progressCircle = document.getElementById('progress-circle');
const pomodoroDots = document.getElementById('pomodoro-dots');
const todayCountEl = document.getElementById('today-count');
const durationBtns = document.querySelectorAll('.duration-btn');

// SVG ring circumference
const RING_RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
progressCircle.style.strokeDasharray = `${CIRCUMFERENCE} ${CIRCUMFERENCE}`;
progressCircle.style.strokeDashoffset = '0';

// Reset daily count on new day
if (todayDate !== new Date().toDateString()) {
  todayCompleted = 0;
  todayDate = new Date().toDateString();
  localStorage.setItem('pomodoro-today', '0');
  localStorage.setItem('pomodoro-date', todayDate);
}
updateTodayCount();
updateDots();
btnPin.classList.toggle('active', alwaysOnTop);

// Audio context for beep
let audioCtx = null;
function playBeep() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 800;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (_) { /* ignore audio errors */ }
}

function notify(title, body) {
  if (window.pomodoroAPI) {
    window.pomodoroAPI.showNotification({ title, body }).catch(() => {});
  }
}

// Format seconds to MM:SS
function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateTimerDisplay() {
  timerText.textContent = formatTime(timeLeft);
  const offset = CIRCUMFERENCE * (1 - timeLeft / totalTime);
  progressCircle.style.strokeDashoffset = offset;
}

function updateDots() {
  const dots = pomodoroDots.querySelectorAll('.dot');
  dots.forEach((dot, i) => {
    dot.classList.toggle('filled', i < pomodoroCount);
  });
}

function updateTodayCount() {
  todayCountEl.textContent = todayCompleted;
}

function setModeBadge() {
  modeBadge.classList.remove('work', 'short-break', 'long-break');
  if (!isBreak) {
    modeBadge.textContent = '聚 焦';
    modeBadge.classList.add('work');
  } else if (pomodoroCount >= POMODORO_CYCLE) {
    modeBadge.textContent = '长休息';
    modeBadge.classList.add('long-break');
  } else {
    modeBadge.textContent = '短休息';
    modeBadge.classList.add('short-break');
  }
}

function startTimer() {
  if (isRunning && !isPaused) return;

  if (isPaused) {
    // Resume
    isPaused = false;
    btnStart.textContent = '暂停';
    btnStart.classList.remove('paused');
    runTimer();
    return;
  }

  // Fresh start
  isRunning = true;
  isPaused = false;
  btnStart.textContent = '暂停';
  btnStart.classList.remove('paused');
  runTimer();
}

function runTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      onTimerEnd();
      return;
    }
    timeLeft--;
    updateTimerDisplay();
  }, 1000);
}

function pauseTimer() {
  if (!isRunning || isPaused) return;
  isPaused = true;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  btnStart.textContent = '继续';
  btnStart.classList.add('paused');
}

function resetTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  isRunning = false;
  isPaused = false;
  timeLeft = workDuration;
  totalTime = workDuration;
  btnStart.textContent = '开始';
  btnStart.classList.remove('paused');
  updateTimerDisplay();
}

function onTimerEnd() {
  playBeep();
  isRunning = false;
  isPaused = false;

  if (!isBreak) {
    // Work session completed
    pomodoroCount++;
    updateDots();

    if (pomodoroCount >= POMODORO_CYCLE) {
      // Long break
      isBreak = true;
      timeLeft = LONG_BREAK;
      totalTime = LONG_BREAK;
      notify('番茄钟完成', '4个番茄钟完成！来段长休息吧~');
      pomodoroCount = 0;
      updateDots();
    } else {
      // Short break
      isBreak = true;
      timeLeft = SHORT_BREAK;
      totalTime = SHORT_BREAK;
      notify('番茄钟完成', '休息一下吧！');
    }

    todayCompleted++;
    localStorage.setItem('pomodoro-today', String(todayCompleted));
    updateTodayCount();
  } else {
    // Break completed, start next work session
    isBreak = false;
    timeLeft = workDuration;
    totalTime = workDuration;
    notify('休息结束', '准备开始下一个番茄钟！');
  }

  setModeBadge();
  progressCircle.classList.toggle('break', isBreak);
  btnStart.textContent = '开始';
  btnStart.classList.remove('paused');
  updateTimerDisplay();
}

// Duration selector
durationBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (isRunning) return; // Don't change during a session
    durationBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    workDuration = parseInt(btn.dataset.min, 10) * 60;
    timeLeft = workDuration;
    totalTime = workDuration;
    updateTimerDisplay();
  });
});

// Button events
btnStart.addEventListener('click', () => {
  if (isRunning && !isPaused) {
    pauseTimer();
  } else {
    startTimer();
  }
});

btnReset.addEventListener('click', resetTimer);

btnPin.addEventListener('click', () => {
  alwaysOnTop = !alwaysOnTop;
  btnPin.classList.toggle('active', alwaysOnTop);
  if (window.pomodoroAPI) {
    window.pomodoroAPI.setAlwaysOnTop(alwaysOnTop).catch(() => {});
  }
});

btnMin.addEventListener('click', () => {
  if (window.pomodoroAPI) window.pomodoroAPI.minimizeWindow().catch(() => {});
});

btnClose.addEventListener('click', () => {
  if (window.pomodoroAPI) window.pomodoroAPI.closeWindow().catch(() => {});
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (isRunning && !isPaused) pauseTimer();
    else startTimer();
  } else if (e.code === 'KeyR') {
    resetTimer();
  }
});

// Initialize
setModeBadge();
progressCircle.style.strokeDashoffset = '0';
updateTimerDisplay();
