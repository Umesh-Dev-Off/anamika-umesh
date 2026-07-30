// script.js

// 1. Intro Screen & Initialization
const introScreen = document.getElementById('intro-screen');
const audio = document.getElementById('bg-audio');

introScreen.addEventListener('click', () => {
  introScreen.classList.add('hidden');
  // Attempt to play audio on first interaction
  audio.play().then(() => {
    updatePlayState(true);
  }).catch(e => console.log('Audio autoplay prevented', e));
});

// 2. Audio Player Logic
const mainPlayBtn = document.getElementById('main-play-btn');
const miniPlayBtn = document.getElementById('mini-play-btn');
const progressBar = document.getElementById('progress-bar');
const miniProgress = document.getElementById('mini-progress');
const timeCurrent = document.getElementById('time-current');
const timeTotal = document.getElementById('time-total');
let isPlaying = false;

function updatePlayState(playing) {
  isPlaying = playing;
  const icon = isPlaying ? 'pause' : 'play';
  mainPlayBtn.innerHTML = `<i data-feather="${icon}" class="${isPlaying?'':'ml-1'} fill-current w-5 h-5"></i>`;
  miniPlayBtn.innerHTML = `<i data-feather="${icon}" class="${isPlaying?'':'ml-0.5'} fill-current w-4 h-4"></i>`;
  feather.replace();
}

function togglePlay() {
  if (isPlaying) {
    audio.pause();
    updatePlayState(false);
  } else {
    audio.play();
    updatePlayState(true);
  }
}

mainPlayBtn.addEventListener('click', togglePlay);
miniPlayBtn.addEventListener('click', togglePlay);

audio.addEventListener('loadedmetadata', () => {
  progressBar.max = audio.duration;
  timeTotal.textContent = formatTime(audio.duration);
});

audio.addEventListener('timeupdate', () => {
  progressBar.value = audio.currentTime;
  const percent = (audio.currentTime / audio.duration) * 100;
  miniProgress.style.width = `${percent}%`;
  timeCurrent.textContent = formatTime(audio.currentTime);
});

progressBar.addEventListener('input', () => {
  audio.currentTime = progressBar.value;
});

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// 3. Scroll to show Mini Player
const miniPlayer = document.getElementById('mini-player');
const audioWidget = document.querySelector('.audio-player-widget');

window.addEventListener('scroll', () => {
  if (!audioWidget) return;
  const rect = audioWidget.getBoundingClientRect();
  if (rect.bottom < 0) {
    miniPlayer.classList.add('visible');
  } else {
    miniPlayer.classList.remove('visible');
  }
});

// 4. Scratch Cards Logic
const scratchBoard = document.getElementById('scratch-board');
const scratchCounter = document.getElementById('scratch-counter');

const truths = [
  "You have the best laugh.",
  "I trust you with everything.",
  "You make bad days better.",
  "You're weird, I like it.",
  "I'm always proud of you.",
  "You're my favourite person."
];

let uncoveredCount = 0;
const cardsScratched = new Set();

truths.forEach((truth, index) => {
  // Container
  const container = document.createElement('div');
  container.className = 'scratch-card-container';
  
  // Hidden Content
  const content = document.createElement('div');
  content.className = 'scratch-content';
  content.innerText = truth;
  
  // Canvas Overlay
  const canvas = document.createElement('canvas');
  canvas.className = 'scratch-layer';
  
  container.appendChild(content);
  container.appendChild(canvas);
  scratchBoard.appendChild(container);

  initScratchCanvas(canvas, index);
});

function initScratchCanvas(canvas, index) {
  const ctx = canvas.getContext('2d');
  
  // Set actual canvas size based on CSS size
  // Delay slightly to let CSS render
  setTimeout(() => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Fill with mint green and dots
    ctx.fillStyle = '#5E9E90';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    for (let i = 0; i < 50; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * canvas.width, 
        Math.random() * canvas.height, 
        2 + Math.random() * 3, 
        0, Math.PI * 2
      );
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '14px "Plus Jakarta Sans"';
    ctx.textAlign = 'center';
    ctx.fillText('scratch me', canvas.width/2, canvas.height/2);
  }, 100);

  let isDrawing = false;
  let scratchedPixels = 0;
  const brushSize = 25; // Large brush for easier scratching

  function getMousePos(evt) {
    const rect = canvas.getBoundingClientRect();
    const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  function scratch(evt) {
    if (!isDrawing) return;
    evt.preventDefault();
    
    const pos = getMousePos(evt);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, brushSize, 0, Math.PI * 2);
    ctx.fill();
    
    checkScratched();
  }

  function checkScratched() {
    if (cardsScratched.has(index)) return;
    
    // Simple heuristic: if we scratched a bunch, reveal the rest
    scratchedPixels++;
    if (scratchedPixels > 40) { // arbitrary threshold of stroke events
      cardsScratched.add(index);
      canvas.style.transition = 'opacity 0.5s';
      canvas.style.opacity = '0';
      uncoveredCount++;
      scratchCounter.innerText = uncoveredCount;
      setTimeout(() => canvas.remove(), 500);
    }
  }

  canvas.addEventListener('mousedown', (e) => { isDrawing = true; scratch(e); });
  canvas.addEventListener('mousemove', scratch);
  canvas.addEventListener('mouseup', () => isDrawing = false);
  canvas.addEventListener('mouseleave', () => isDrawing = false);

  canvas.addEventListener('touchstart', (e) => { isDrawing = true; scratch(e); }, {passive: false});
  canvas.addEventListener('touchmove', scratch, {passive: false});
  canvas.addEventListener('touchend', () => isDrawing = false);
}
