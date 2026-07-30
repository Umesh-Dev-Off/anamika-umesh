document.addEventListener('DOMContentLoaded', () => {
  // 1. Elements Initialization
  const introScreen = document.getElementById('intro-screen');
  const mainContent = document.getElementById('main-content');
  const audio = document.getElementById('bg-audio');
  
  const mainPlayBtn = document.getElementById('main-play-btn');
  const miniPlayBtn = document.getElementById('mini-play-btn');
  const progressBar = document.getElementById('progress-bar');
  const miniProgress = document.getElementById('mini-progress');
  const timeCurrent = document.getElementById('time-current');
  const timeTotal = document.getElementById('time-total');
  
  let isPlaying = false;

  // Render Scratch Cards right away
  initScratchBoard();

  // Intro Tap Handler
  if (introScreen) {
    introScreen.addEventListener('click', () => {
      introScreen.style.display = 'none';
      if (mainContent) {
        mainContent.classList.remove('hidden');
        mainContent.style.display = 'block';
      }
      
      // Delay to ensure CSS sizing is loaded before canvas redraw
      setTimeout(() => {
        setupCanvases();
      }, 150);

      if (audio) {
        audio.play().then(() => {
          updatePlayState(true);
        }).catch(e => console.log('Audio autoplay prevented', e));
      }
    });
  }

  // 2. Audio Player Logic
  function updatePlayState(playing) {
    isPlaying = playing;
    const icon = isPlaying ? 'pause' : 'play';
    if (mainPlayBtn) {
      mainPlayBtn.innerHTML = `<i data-feather="${icon}" class="${isPlaying ? '' : 'ml-1'} fill-current w-5 h-5"></i>`;
    }
    if (miniPlayBtn) {
      miniPlayBtn.innerHTML = `<i data-feather="${icon}" class="${isPlaying ? '' : 'ml-0.5'} fill-current w-4 h-4"></i>`;
    }
    if (window.feather) {
      feather.replace();
    }
  }

  function togglePlay() {
    if (!audio) return;
    if (audio.paused) {
      audio.play().then(() => {
        updatePlayState(true);
      }).catch(e => console.log('Playback error', e));
    } else {
      audio.pause();
      updatePlayState(false);
    }
  }

  if (mainPlayBtn) mainPlayBtn.addEventListener('click', togglePlay);
  if (miniPlayBtn) miniPlayBtn.addEventListener('click', togglePlay);

  if (audio) {
    audio.addEventListener('loadedmetadata', () => {
      if (progressBar) progressBar.max = audio.duration;
      if (timeTotal) timeTotal.textContent = formatTime(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      if (!audio.duration) return;
      if (progressBar) progressBar.value = audio.currentTime;
      const percent = (audio.currentTime / audio.duration) * 100;
      if (miniProgress) miniProgress.style.width = `${percent}%`;
      if (timeCurrent) timeCurrent.textContent = formatTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      updatePlayState(false);
    });
  }

  if (progressBar && audio) {
    progressBar.addEventListener('input', () => {
      audio.currentTime = progressBar.value;
    });
  }

  function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // 3. Mini Player Visibility
  const miniPlayer = document.getElementById('mini-player');
  const audioWidget = document.querySelector('.audio-player-widget');
  
  window.addEventListener('scroll', () => {
    if (!audioWidget || !miniPlayer) return;
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

  function initScratchBoard() {
    if (!scratchBoard || scratchBoard.children.length > 0) return;

    truths.forEach((truth, index) => {
      const container = document.createElement('div');
      container.className = 'scratch-card-container relative overflow-hidden rounded-xl bg-white shadow-md border-2 border-mint/20 h-28 flex items-center justify-center p-4 text-center cursor-pointer select-none';
      
      const content = document.createElement('div');
      content.className = 'scratch-content font-handwriting text-xl text-dark font-bold';
      content.innerText = truth;
      
      const canvas = document.createElement('canvas');
      canvas.className = 'scratch-layer absolute inset-0 w-full h-full z-10 touch-none';
      
      container.appendChild(content);
      container.appendChild(canvas);
      scratchBoard.appendChild(container);

      attachScratchEvents(canvas, index);
    });
  }

  function setupCanvases() {
    const canvases = document.querySelectorAll('.scratch-layer');
    canvases.forEach(canvas => {
      canvas.width = canvas.parentElement.offsetWidth || 150;
      canvas.height = canvas.parentElement.offsetHeight || 100;
      drawCanvasOverlay(canvas);
    });
  }

  function drawCanvasOverlay(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#5E9E90';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Pattern dots
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * canvas.width, 
        Math.random() * canvas.height, 
        2 + Math.random() * 3, 
        0, Math.PI * 2
      );
      ctx.fill();
    }

    // Scratch text overlay
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('scratch me ✿', canvas.width / 2, canvas.height / 2);
  }

  function attachScratchEvents(canvas, index) {
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let scratchedPixels = 0;

    function getPos(evt) {
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
      if (evt.type === 'touchmove') evt.preventDefault();
      
      const pos = getPos(evt);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
      ctx.fill();
      
      scratchedPixels++;
      if (scratchedPixels > 20 && !cardsScratched.has(index)) {
        cardsScratched.add(index);
        canvas.style.transition = 'opacity 0.4s ease';
        canvas.style.opacity = '0';
        uncoveredCount++;
        if (scratchCounter) scratchCounter.innerText = uncoveredCount;
        setTimeout(() => canvas.remove(), 400);
      }
    }

    canvas.addEventListener('mousedown', (e) => { isDrawing = true; scratch(e); });
    canvas.addEventListener('mousemove', scratch);
    canvas.addEventListener('mouseup', () => isDrawing = false);

    canvas.addEventListener('touchstart', (e) => { isDrawing = true; scratch(e); });
    canvas.addEventListener('touchmove', scratch);
    canvas.addEventListener('touchend', () => isDrawing = false);
  }
});
