document.addEventListener('DOMContentLoaded', () => {
  // Initialize Feather Icons
  if (typeof feather !== 'undefined') {
    feather.replace();
  }

  // --- 1. INTRO SCREEN TAP TO BEGIN ---
  const introScreen = document.getElementById('intro-screen');
  const bgAudio = document.getElementById('bg-audio');

  if (introScreen) {
    introScreen.addEventListener('click', () => {
      // Fade out and hide intro screen
      introScreen.classList.add('opacity-0', 'pointer-events-none');
      setTimeout(() => {
        introScreen.style.display = 'none';
      }, 500);

      // Play audio on tap
      if (bgAudio) {
        bgAudio.play().then(() => {
          updatePlayIcons(true);
        }).catch(err => console.log("Audio playback failed:", err));
      }
    });
  }

  // --- 2. AUDIO PLAYER CONTROLS ---
  const mainPlayBtn = document.getElementById('main-play-btn');
  const miniPlayBtn = document.getElementById('mini-play-btn');
  const progressBar = document.getElementById('progress-bar');
  const miniProgress = document.getElementById('mini-progress');
  const timeCurrent = document.getElementById('time-current');
  const timeTotal = document.getElementById('time-total');

  function togglePlay() {
    if (!bgAudio) return;
    if (bgAudio.paused) {
      bgAudio.play();
      updatePlayIcons(true);
    } else {
      bgAudio.pause();
      updatePlayIcons(false);
    }
  }

  function updatePlayIcons(isPlaying) {
    const iconName = isPlaying ? 'pause' : 'play';
    if (mainPlayBtn) {
      mainPlayBtn.innerHTML = `<i data-feather="${iconName}" class="${isPlaying ? '' : 'ml-1'} fill-current w-5 h-5"></i>`;
    }
    if (miniPlayBtn) {
      miniPlayBtn.innerHTML = `<i data-feather="${iconName}" class="w-4 h-4 fill-current"></i>`;
    }
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  }

  if (mainPlayBtn) mainPlayBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePlay(); });
  if (miniPlayBtn) miniPlayBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePlay(); });

  if (bgAudio) {
    // Format seconds to M:SS
    const formatTime = (secs) => {
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60);
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    bgAudio.addEventListener('loadedmetadata', () => {
      if (timeTotal) timeTotal.textContent = formatTime(bgAudio.duration);
    });

    bgAudio.addEventListener('timeupdate', () => {
      if (!bgAudio.duration) return;
      const pct = (bgAudio.currentTime / bgAudio.duration) * 100;
      
      if (progressBar) progressBar.value = pct;
      if (miniProgress) miniProgress.style.width = `${pct}%`;
      if (timeCurrent) timeCurrent.textContent = formatTime(bgAudio.currentTime);
      if (timeTotal && bgAudio.duration) timeTotal.textContent = formatTime(bgAudio.duration);
    });

    if (progressBar) {
      progressBar.addEventListener('input', () => {
        const seekTime = (progressBar.value / 100) * bgAudio.duration;
        bgAudio.currentTime = seekTime;
      });
    }
  }

  // --- 3. SCRATCH CARDS GENERATOR ---
  const scratchBoard = document.getElementById('scratch-board');
  const scratchCounter = document.getElementById('scratch-counter');

  const truths = [
    "You always know how to make me smile ✿",
    "Our late night talks are literally the best.",
    "Thank you for being so patient with me!",
    "You are genuinely one of a kind.",
    "I'm so lucky to have you in my life 💖",
    "Always here for you, no matter what!"
  ];

  let uncoveredCount = 0;

  if (scratchBoard) {
    truths.forEach((text, idx) => {
      const cardWrapper = document.createElement('div');
      cardWrapper.className = 'relative w-full h-28 rounded-xl overflow-hidden shadow-sm bg-white border border-mint/20 flex items-center justify-center p-3 text-center cursor-pointer select-none';

      // Revealed content underneath
      const content = document.createElement('p');
      content.className = 'font-handwriting text-lg text-dark font-medium leading-snug';
      content.innerText = text;
      cardWrapper.appendChild(content);

      // Canvas cover to scratch away
      const canvas = document.createElement('canvas');
      canvas.className = 'absolute inset-0 w-full h-full z-10 touch-none';
      cardWrapper.appendChild(canvas);

      scratchBoard.appendChild(cardWrapper);

      // Canvas setup
      const ctx = canvas.getContext('2d');
      let isScratching = false;
      let isUncovered = false;

      function resizeCanvas() {
        canvas.width = cardWrapper.offsetWidth;
        canvas.height = cardWrapper.offsetHeight;
        
        // Fill canvas layer
        ctx.fillStyle = '#379383';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Overlay text on scratch layer
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`TRUTH #${idx + 1} (Scratch me)`, canvas.width / 2, canvas.height / 2);
      }

      // Small delay to read container dimensions accurately
      setTimeout(resizeCanvas, 50);

      function scratch(x, y) {
        if (isUncovered) return;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2, false);
        ctx.fill();

        checkScratchProgress();
      }

      function checkScratchProgress() {
        if (isUncovered) return;
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let clearPixels = 0;
        for (let i = 3; i < imgData.data.length; i += 4) {
          if (imgData.data[i] === 0) clearPixels++;
        }
        
        // If 40% scratched off, remove cover completely
        if (clearPixels / (imgData.data.length / 4) > 0.4) {
          isUncovered = true;
          canvas.style.transition = 'opacity 0.4s ease';
          canvas.style.opacity = '0';
          setTimeout(() => canvas.remove(), 400);

          uncoveredCount++;
          if (scratchCounter) scratchCounter.textContent = uncoveredCount;
        }
      }

      // Mouse Events
      canvas.addEventListener('mousedown', (e) => { isScratching = true; scratch(e.offsetX, e.offsetY); });
      canvas.addEventListener('mousemove', (e) => { if (isScratching) scratch(e.offsetX, e.offsetY); });
      window.addEventListener('mouseup', () => { isScratching = false; });

      // Touch Events
      canvas.addEventListener('touchstart', (e) => {
        isScratching = true;
        const rect = canvas.getBoundingClientRect();
        scratch(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
      });
      canvas.addEventListener('touchmove', (e) => {
        if (!isScratching) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        scratch(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
      });
      canvas.addEventListener('touchend', () => { isScratching = false; });
    });
  }
});
