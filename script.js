// script.js
document.addEventListener('DOMContentLoaded', () => {
  // 1. Intro Screen & Initialization
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

  // Intro Tap Handler (Reveals page & Starts audio)
  if (introScreen) {
    introScreen.addEventListener('click', () => {
      introScreen.style.display = 'none';
      if (mainContent) {
        mainContent.classList.remove('hidden');
        mainContent.style.display = 'block';
      }
      
      // Canvas sizing sync fix
      setTimeout(() => {
        initScratchBoard();
      }, 100);

      // Play audio on first tap safely
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

  // 3. Scroll to show Mini Player
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
      container.className = 'scratch-card-container';
      
      const content = document.createElement('div');
      content.className = 'scratch-content';
      content.innerText = truth;
      
      const canvas = document.createElement('canvas');
      canvas.className = 'scratch-layer';
      
      container.appendChild(content);
      container.appendChild(canvas);
      scratchBoard.appendChild(container);

      initScratchCanvas(canvas, index);
    });
  }

  function initScratchCanvas(canvas, index) {
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions dynamically
    canvas.width = canvas.parentElement.offsetWidth || 150;
    canvas.height = canvas.parentElement.offsetHeight || 100;
    
    // Fill background
    ctx.fillStyle = '#5E9E90';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add dots styling
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

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('scratch me ✿', canvas.width / 2, canvas.height / 2);

    let isDrawing = false;
    let scratchedPixels = 0;
    const brushSize = 25;

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
      
      const pos = getMousePos(evt);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, brushSize, 0, Math.PI * 2);
      ctx.fill();
      
      checkScratched();
    }

    function checkScratched() {
      if (cardsScratched.has(index)) return;
      
      scratchedPixels++;
      if (scratchedPixels > 25) { 
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
    canvas.addEventListener('mouseleave', () => isDrawing = false);

    canvas.addEventListener('touchstart', (e) => { isDrawing = true; scratch(e); }, {passive: true});
    canvas.addEventListener('touchmove', scratch, {passive: true});
    canvas.addEventListener('touchend', () => isDrawing = false);
  }
});
