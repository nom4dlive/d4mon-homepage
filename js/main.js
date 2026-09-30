// D4MON Dark Psy — Master Client Controller

// Cookie helpers
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

function setCookie(name, val, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(val)};expires=${expires};path=/;SameSite=Lax`;
}

// Current Language State (Default: pt)
let currentLang = getCookie('d4mon_lang') || localStorage.getItem('d4mon_lang') || 'pt';
if (currentLang !== 'pt' && currentLang !== 'en') currentLang = 'pt';

function applyLanguage(lang) {
  currentLang = lang;
  setCookie('d4mon_lang', lang);
  localStorage.setItem('d4mon_lang', lang);

  const t = translations[lang] || translations.pt;

  // Update HTML Lang and Meta
  document.documentElement.lang = t.meta.lang;
  if (t.meta.title) document.title = t.meta.title;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', t.meta.description);
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', t.meta.title);
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', t.meta.description);

  // Update Text Nodes with data-i18n
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const keyPath = el.getAttribute('data-i18n').split('.');
    let val = t;
    for (const key of keyPath) {
      if (val && val[key] !== undefined) {
        val = val[key];
      } else {
        val = null;
        break;
      }
    }
    if (val !== null) {
      el.textContent = val;
    }
  });

  // Update Placeholders with data-i18n-ph
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
    const keyPath = el.getAttribute('data-i18n-ph').split('.');
    let val = t;
    for (const key of keyPath) {
      if (val && val[key] !== undefined) {
        val = val[key];
      } else {
        val = null;
        break;
      }
    }
    if (val !== null) {
      el.setAttribute('placeholder', val);
    }
  });

  // Update Language Switcher UI buttons
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    const targetLang = btn.getAttribute('data-lang');
    if (targetLang === lang) {
      btn.classList.add('btn-ember');
      btn.classList.remove('btn-ghost');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.classList.add('btn-ghost');
      btn.classList.remove('btn-ember');
      btn.setAttribute('aria-pressed', 'false');
    }
  });

  // Re-render gallery if on gallery page
  if (typeof renderGallery === 'function') {
    renderGallery();
  }

  // Update Marquee items
  const marqueeContainer = document.querySelector('.marquee-content');
  if (marqueeContainer && t.marquee) {
    const itemsHtml = t.marquee.map(item => `<span class="display flex items-center gap-8 pr-8 text-2xl md:text-3xl">${item} <span class="text-sulfur">✕</span></span>`).join('');
    marqueeContainer.innerHTML = itemsHtml + itemsHtml;
  }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  applyLanguage(currentLang);

  // Bind Language Switcher Buttons
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const selected = btn.getAttribute('data-lang');
      applyLanguage(selected);
    });
  });

  // Mobile Menu Toggle
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', () => {
      const expanded = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', !expanded);
      mobileNav.classList.toggle('hidden');
    });
  }

  // Audio Transmitter Controller
  initAudioPlayer();

  // Booking Form Form-Kind Controller
  initBookingForm();

  // Lightbox Modal
  initLightbox();
});

// Audio Transmitter Functionality
function initAudioPlayer() {
  const audio = document.getElementById('d4mon-audio');
  const toggleBtn = document.getElementById('player-toggle-btn');
  const heroPlayBtn = document.getElementById('hero-play-cut');
  const progressBar = document.getElementById('player-progress');
  const canvas = document.getElementById('player-canvas');

  if (!audio) return;

  function togglePlay() {
    if (audio.paused) {
      audio.play().then(() => {
        updatePlayerUi(true);
      }).catch(console.error);
    } else {
      audio.pause();
      updatePlayerUi(false);
    }
  }

  function updatePlayerUi(isPlaying) {
    const playIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play ml-0.5"><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/></svg>`;
    const pauseIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pause"><rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/></svg>`;
    
    if (toggleBtn) {
      toggleBtn.innerHTML = isPlaying ? pauseIcon : playIcon;
      toggleBtn.setAttribute('aria-label', isPlaying ? 'Pausar faixa' : 'Reproduzir faixa');
    }
    if (heroPlayBtn) {
      const t = translations[currentLang] || translations.pt;
      heroPlayBtn.innerHTML = `${isPlaying ? pauseIcon : playIcon} ${t.hero.playCut}`;
    }
  }

  if (toggleBtn) toggleBtn.addEventListener('click', togglePlay);
  if (heroPlayBtn) heroPlayBtn.addEventListener('click', togglePlay);

  audio.addEventListener('timeupdate', () => {
    if (audio.duration && progressBar) {
      const pct = (audio.currentTime / audio.duration) * 100;
      progressBar.style.width = `${pct}%`;
    }
  });

  audio.addEventListener('ended', () => {
    updatePlayerUi(false);
    if (progressBar) progressBar.style.width = '0%';
  });

  // Animated visualizer bars
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const bars = 18;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isPlaying = !audio.paused;
      for (let i = 0; i < bars; i++) {
        const height = isPlaying 
          ? Math.random() * (canvas.height - 4) + 4
          : (Math.sin(Date.now() / 400 + i) * 3 + 4);
        ctx.fillStyle = isPlaying ? '#ff3b14' : '#695f5c';
        ctx.fillRect(i * 4, canvas.height - height, 2.5, height);
      }
      requestAnimationFrame(draw);
    }
    draw();
  }
}

// Booking Form Preset Selector (Ensuring Netlify payload stability)
function initBookingForm() {
  const form = document.querySelector('form[name="booking"]');
  if (!form) return;

  const kindHidden = document.getElementById('form-kind');
  const kindButtons = document.querySelectorAll('.kind-select-btn');

  kindButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      kindButtons.forEach(b => {
        b.classList.remove('btn-ember');
        b.classList.add('btn-ghost');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('btn-ember');
      btn.classList.remove('btn-ghost');
      btn.setAttribute('aria-pressed', 'true');
      
      // Keep stable English value for Netlify Forms backend
      const rawKind = btn.getAttribute('data-kind-value');
      if (kindHidden) kindHidden.value = rawKind;
    });
  });
}

// Lightbox Modal Implementation (Fixing Alt vs Caption separation)
let currentLightboxIndex = 0;
let filteredGallery = [];

function initLightbox() {
  const modal = document.getElementById('lightbox-modal');
  if (!modal) return;

  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');
  const modalImg = document.getElementById('lightbox-img');
  const modalCaption = document.getElementById('lightbox-caption');
  const modalCounter = document.getElementById('lightbox-counter');

  function openLightbox(index) {
    currentLightboxIndex = index;
    const item = filteredGallery[index] || galleryItems[index];
    if (!item) return;

    modalImg.src = `img/${item.img}`;
    modalImg.alt = item.alt[currentLang] || item.alt.pt; // Pure accessibility description
    modalCaption.textContent = item.caption[currentLang] || item.caption.pt; // Editorial metadata
    modalCounter.textContent = `${item.id} / ${galleryItems.length}`;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
  }

  function nextImage() {
    currentLightboxIndex = (currentLightboxIndex + 1) % filteredGallery.length;
    openLightbox(currentLightboxIndex);
  }

  function prevImage() {
    currentLightboxIndex = (currentLightboxIndex - 1 + filteredGallery.length) % filteredGallery.length;
    openLightbox(currentLightboxIndex);
  }

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (nextBtn) nextBtn.addEventListener('click', nextImage);
  if (prevBtn) prevBtn.addEventListener('click', prevImage);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (modal.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
  });

  window.openLightboxAtIndex = openLightbox;
}
