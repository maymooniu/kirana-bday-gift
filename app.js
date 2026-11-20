/**
 * ============================================================================
 *  KIRANA'S BIRTHDAY WEBSITE: INTERACTIVE CONTROLLER
 * ============================================================================
 */

(function () {
  const C = window.SITE_CONTENT;
  if (!C) return;

  const $ = (id) => document.getElementById(id);

  const SITE_PROGRESS_KEY = "kirana_site_progress_v1";
  const COASTER_ART_KEY = "kirana_coaster_art_v1";

  // State trackers
  const flippedSwatches = new Set();
  const foundEggs = new Set();
  let confidantStageIdx = 0;
  let confidantMaxed = false;
  let hermitRevealed = false;
  let cardStamped = false;
  let candlesBlown = false;
  let eggToastTimer = null;
  let rainInitialized = false;
  let activeLightboxPhoto = null;
  let activeLightboxList = [];
  let activeLightboxIndex = 0;
  let activeLightboxIsArt = false;

  function saveSiteProgress() {
    try {
      const payload = {
        eggs: [...foundEggs],
        swatches: [...flippedSwatches],
        tasks: [...completedTasks],
        confidantStageIdx,
        confidantMaxed,
        hermitRevealed,
        cardStamped,
        candlesBlown
      };
      localStorage.setItem(SITE_PROGRESS_KEY, JSON.stringify(payload));
    } catch (_) {}
  }

  function loadSiteProgress() {
    try {
      const raw = localStorage.getItem(SITE_PROGRESS_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  // ==========================================================================
  // 1. HYDRATE CONTENT FROM content.js
  // ==========================================================================
  function hydrateContent() {
    // Entry
    $("entry-eyebrow").textContent = C.entry.eyebrow;
    $("entry-quote").textContent = C.entry.quote;
    $("entry-subquote").textContent = C.entry.subquote;
    $("unwrap-label").textContent = C.entry.buttonLabel;
    $("entry-hint").textContent = C.entry.hint;

    // HUD
    $("music-track-name").textContent = C.audio.trackTitle;
    $("volume-slider").value = String(C.audio.volume ?? 0.45);
    $("cal-date").textContent = C.dateBadge.monthDay;
    $("cal-day").textContent = C.dateBadge.weekday;
    $("cal-weather").textContent = `☂ ${C.dateBadge.weatherLabel}`;

    // Hero
    $("hero-kicker").textContent = C.hero.kicker;
    $("hero-top").textContent = C.hero.headlineTop;
    $("hero-name").textContent = C.hero.headlineName;
    $("hero-subtitle").textContent = C.hero.subtitle;

    const tagsWrap = $("hero-tags");
    tagsWrap.innerHTML = "";
    C.hero.tags.forEach((tag) => {
      const span = document.createElement("span");
      span.className = "hero-tag-chip";
      span.textContent = tag;
      tagsWrap.appendChild(span);
    });

    // Sweet Fuel Station
    $("sweet-title").textContent = C.sweetStation.title;
    $("sweet-subtitle").textContent = C.sweetStation.subtitle;
    renderSweetStation();

    // Scrapbook & Goober Dossier
    $("scrapbook-eyebrow").textContent = C.scrapbook.eyebrow;
    $("scrapbook-title").textContent = C.scrapbook.title;
    $("scrapbook-subtitle").textContent = C.scrapbook.subtitle;
    renderPolaroidGrid();
    setupGooberDossier();

    // Kiraelin's Art Gallery
    $("art-eyebrow").textContent = C.artGallery.eyebrow;
    $("art-title").textContent = C.artGallery.title;
    $("art-subtitle").textContent = C.artGallery.subtitle;
    renderArtGallery();

    // Mini-RPG
    $("rpg-eyebrow").textContent = C.rpg.eyebrow;
    $("rpg-title").textContent = C.rpg.title;
    $("rpg-subtitle").textContent = C.rpg.subtitle;
    initMiniRpg();

    // Palette
    $("palette-eyebrow").textContent = C.paletteSection.eyebrow;
    $("palette-title").textContent = C.paletteSection.title;
    $("palette-subtitle").textContent = C.paletteSection.subtitle;
    renderPantoneGrid();

    // Confidant
    $("confidant-eyebrow").textContent = C.confidant.eyebrow;
    $("confidant-arcana").textContent = C.confidant.arcanaLabel;
    $("confidant-portrait").src = C.confidant.portraitSrc;
    $("confidant-portrait-caption").textContent = C.confidant.portraitCaption;
    $("confidant-speaker").textContent = C.confidant.promptSpeaker;
    $("confidant-prompt").textContent = C.confidant.promptLine;
    $("rank-up-title").textContent = C.confidant.rankUpTitle;
    $("rank-up-subtitle").textContent = C.confidant.rankUpSubtitle;
    $("perk-title").textContent = C.confidant.perkTitle;
    $("perk-desc").textContent = C.confidant.perkDesc;
    renderConfidantChoices();

    // Calling Card
    $("calling-eyebrow").textContent = C.callingCard.eyebrow;
    $("cc-to-line").textContent = C.callingCard.toLine;
    $("cc-body").textContent = C.callingCard.body;
    $("cc-signoff-name").textContent = C.callingCard.signOff;
    $("cc-design-spec").textContent = C.callingCard.designSpecNote;
    renderRansomHeadline(C.callingCard.headline);

    // Hermit
    $("hermit-eyebrow").textContent = C.hermit.eyebrow;
    $("hermit-title").textContent = C.hermit.title;
    $("hermit-instruction").textContent = C.hermit.instruction;
    $("hermit-lantern-quote").textContent = C.hermit.lanternQuote;
    $("hermit-personal-note").textContent = C.hermit.personalNote;

    // Letter
    $("letter-eyebrow").textContent = C.letter.eyebrow;
    $("letter-salutation").textContent = C.letter.salutation;
    $("letter-closing").textContent = C.letter.closing;
    $("letter-signature").textContent = C.letter.signature;

    const letterBody = $("letter-body");
    letterBody.innerHTML = "";
    C.letter.paragraphs.forEach((pText, idx) => {
      const p = document.createElement("p");
      p.textContent = pText;
      p.style.setProperty("--p-idx", String(idx));
      letterBody.appendChild(p);
    });
  }

  // ==========================================================================
  // 2. MONOCHROME MIST & COZY RAINY CAFE CANVASES
  // ==========================================================================
  function initMistCanvas() {
    const canvas = $("mist-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles = Array.from({ length: 44 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 2.6 + 0.8,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -Math.random() * 0.4 - 0.12,
      alpha: Math.random() * 0.45 + 0.15
    }));

    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    function tick() {
      ctx.clearRect(0, 0, width, height);
      const grad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.45,
        20,
        width * 0.5,
        height * 0.45,
        Math.max(width, height) * 0.55
      );
      grad.addColorStop(0, "rgba(255,255,255,0.06)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240, 240, 248, ${p.alpha})`;
        ctx.fill();
      }
      requestAnimationFrame(tick);
    }
    tick();
  }

  function initRainCanvas() {
    if (rainInitialized) return;
    rainInitialized = true;

    const canvas = $("rain-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const drops = Array.from({ length: 68 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      len: Math.random() * 18 + 10,
      speed: Math.random() * 2.4 + 2.2,
      alpha: Math.random() * 0.28 + 0.1
    }));

    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    function drawRain() {
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 1.2;
      ctx.lineCap = "round";

      for (const d of drops) {
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 2.5, d.y + d.len);
        ctx.strokeStyle = `rgba(199, 125, 255, ${d.alpha})`;
        ctx.stroke();

        d.y += d.speed;
        d.x -= 0.45;
        if (d.y > height + 20) {
          d.y = -20;
          d.x = Math.random() * (width + 40);
        }
      }
      requestAnimationFrame(drawRain);
    }
    drawRain();
  }

  // ==========================================================================
  // 3. PERSONA 5 GIFT UNWRAP TRANSITION
  // ==========================================================================
  function setupEntryUnwrap() {
    const unwrapBtn = $("unwrap-btn");
    const entryScreen = $("entry-screen");
    const slashOverlay = $("slash-transition");
    const mainExperience = $("main-experience");

    try {
      if (sessionStorage.getItem("kirana_unwrapped") === "1") {
        entryScreen.classList.add("is-hidden");
        mainExperience.hidden = false;
        document.body.classList.remove("state-locked");
        const resumed = window.soundEngine.resumePersistedBGM();
        updateMusicHUD(resumed);
        initRainCanvas();
        observeReveals();
      }
    } catch (_) {}

    unwrapBtn.addEventListener("click", () => {
      unwrapBtn.disabled = true;
      try {
        sessionStorage.setItem("kirana_unwrapped", "1");
      } catch (_) {}
      // Unlock audio synchronously inside click gesture for mobile Safari/Chrome
      if (typeof window.soundEngine.prepareBGMOnGesture === "function") {
        window.soundEngine.prepareBGMOnGesture();
      }
      window.soundEngine.playSlashSfx();

      slashOverlay.classList.remove("is-active");
      void slashOverlay.offsetWidth;
      slashOverlay.classList.add("is-active");

      setTimeout(() => {
        entryScreen.classList.add("is-hidden");
        mainExperience.hidden = false;
        document.body.classList.remove("state-locked");
        window.scrollTo({ top: 0, behavior: "instant" });

        if (typeof window.soundEngine.revealPreparedBGM === "function") {
          window.soundEngine.revealPreparedBGM();
        } else {
          window.soundEngine.startMellowBGM();
        }
        updateMusicHUD(true);
        initRainCanvas();
        observeReveals();
      }, 560);

      setTimeout(() => {
        slashOverlay.classList.remove("is-active");
        unwrapBtn.disabled = false;
      }, 1450);
    });

    $("rewrap-btn").addEventListener("click", () => {
      try {
        sessionStorage.removeItem("kirana_unwrapped");
      } catch (_) {}
      window.soundEngine.stopSongPreview(false);
      window.soundEngine.stopBattleMusic(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      entryScreen.classList.remove("is-hidden");
      document.body.classList.add("state-locked");
    });
  }

  // ==========================================================================
  // 4. MUSIC HUD CONTROLS
  // ==========================================================================
  function updateMusicHUD(playing) {
    const btn = $("music-toggle-btn");
    const badge = $("music-state-badge");
    if (playing) {
      btn.classList.remove("is-paused");
      badge.textContent = "PLAYING";
    } else {
      btn.classList.add("is-paused");
      badge.textContent = "PAUSED";
    }
  }

  function setupMusicHUD() {
    window.soundEngine.onTrackChange = (title) => {
      const el = $("music-track-name");
      if (el && title) el.textContent = title;
      updateMusicHUD(window.soundEngine.isPlaying || window.soundEngine.isBattlePlaying);
    };

    $("music-toggle-btn").addEventListener("click", () => {
      window.soundEngine.stopSongPreview(false);
      const nowPlaying = window.soundEngine.togglePlay();
      updateMusicHUD(nowPlaying);
    });

    const nextBtn = $("music-next-btn");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        window.soundEngine.stopSongPreview(false);
        window.soundEngine.nextWebsiteTrack();
        updateMusicHUD(true);
      });
    }

    const rainBtn = $("rain-ambience-btn");
    if (rainBtn) {
      rainBtn.addEventListener("click", () => {
        const active = window.soundEngine.toggleRainAmbience();
        rainBtn.classList.toggle("is-active", active);
        rainBtn.setAttribute("aria-pressed", String(active));
        rainBtn.textContent = active ? "☂ RAIN ON" : "☂ RAIN";
      });
    }

    $("volume-slider").addEventListener("input", (e) => {
      window.soundEngine.setVolume(e.target.value);
    });
  }

  // ==========================================================================
  // 5. SWEET FUEL STATION (CHOCO MILK & SWEETS)
  // ==========================================================================
  function getSweetSvg(type) {
    if (type === "milk") {
      return `
        <svg class="sweet-icon" viewBox="0 0 48 48" aria-hidden="true">
          <polygon points="14,12 24,4 34,12 34,42 14,42" fill="#F4EEFB" stroke="#0B0812" stroke-width="2.5"/>
          <polygon points="14,12 24,4 24,12" fill="#C77DFF" stroke="#0B0812" stroke-width="2"/>
          <rect x="14" y="21" width="20" height="14" fill="#6F4E37" stroke="#0B0812" stroke-width="2"/>
          <circle cx="24" cy="28" r="3.5" fill="#F4EEFB"/>
          <path d="M29 4 L34 0" stroke="#F4A261" stroke-width="3" stroke-linecap="round"/>
        </svg>
      `;
    }
    if (type === "chocolate") {
      return `
        <svg class="sweet-icon" viewBox="0 0 48 48" aria-hidden="true">
          <rect x="10" y="10" width="28" height="28" rx="6" fill="#5A331C" stroke="#0B0812" stroke-width="2.5"/>
          <path d="M12 18 Q24 25 36 17" fill="none" stroke="#E9C46A" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M14 27 Q24 33 34 25" fill="none" stroke="#C77DFF" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `;
    }
    return `
      <svg class="sweet-icon" viewBox="0 0 48 48" aria-hidden="true">
        <polygon points="8,36 40,36 40,22 10,16" fill="#F4EEFB" stroke="#0B0812" stroke-width="2.5"/>
        <polygon points="10,24 40,28 40,32 10,29" fill="#C77DFF"/>
        <path d="M10 16 Q25 14 40 22" fill="none" stroke="#9D4EDD" stroke-width="4" stroke-linecap="round"/>
        <circle cx="24" cy="13" r="5" fill="#E63946" stroke="#0B0812" stroke-width="2"/>
      </svg>
    `;
  }

  function renderSweetStation() {
    const container = $("sweet-items");
    const toast = $("sweet-toast");
    container.innerHTML = "";

    C.sweetStation.items.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sweet-item-btn";
      btn.innerHTML = `
        ${getSweetSvg(item.icon)}
        <span class="sweet-meta">
          <span class="sweet-name">${item.name}</span>
          <span class="sweet-stat">${item.stat}</span>
        </span>
      `;
      btn.addEventListener("click", () => {
        window.soundEngine.playPourSfx();
        btn.classList.remove("is-popped");
        void btn.offsetWidth;
        btn.classList.add("is-popped");
        toast.textContent = item.reaction;
      });
      container.appendChild(btn);
    });
  }

  // ==========================================================================
  // 5B. BLACC CAR SCRAPBOOK (6 POLAROIDS + BRIEF SONG PREVIEWS + DOSSIER)
  // ==========================================================================
  function renderPolaroidGrid() {
    const grid = $("polaroid-grid");
    grid.innerHTML = "";

    C.scrapbook.photos.forEach((photo, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "polaroid-card";
      btn.innerHTML = `
        <span class="polaroid-tape" aria-hidden="true"></span>
        <div class="polaroid-photo-wrap">
          <img src="${photo.src}" alt="${photo.caption}" loading="lazy" />
          <span class="polaroid-badge">${photo.badge}</span>
        </div>
        <p class="polaroid-caption">${photo.caption}</p>
        <span class="polaroid-tap-hint">♪ Tap for note &amp; chorus preview</span>
      `;

      btn.addEventListener("click", () => {
        openLightbox(C.scrapbook.photos, idx, false);
      });

      grid.appendChild(btn);
    });
  }

  function startPhotoSongPreview(photo) {
    const eq = $("lightbox-song-eq");
    const songTitle = $("lightbox-song-title");
    eq.classList.remove("is-stopped");
    songTitle.textContent = `♪ Chorus: ${photo.songTitle}`;

    window.soundEngine.playSongPreview(
      photo.songId,
      photo.previewUrl,
      () => {
        eq.classList.add("is-stopped");
        songTitle.textContent = `♪ ${photo.songTitle} (Preview ended)`;
        if (window.soundEngine.isPlaying) {
          updateMusicHUD(true);
        }
      },
      {
        chorusStart: photo.chorusStart,
        previewDurationSec: photo.previewDurationSec
      }
    );
  }

  function renderArtGallery() {
    const grid = $("art-gallery-grid");
    grid.innerHTML = "";

    C.artGallery.pieces.forEach((art, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "art-card";
      btn.innerHTML = `
        <div class="art-img-wrap">
          <img src="${art.src}" alt="${art.title}" loading="lazy" />
          <span class="art-badge">${art.badge}</span>
        </div>
        <h3 class="art-card-title">${art.title}</h3>
        <p class="art-card-note">${art.note}</p>
      `;
      btn.addEventListener("click", () => {
        window.soundEngine.playFlipSfx();
        openLightbox(C.artGallery.pieces, idx, true);
      });
      grid.appendChild(btn);
    });
  }

  function showLightboxCurrentItem() {
    const item = activeLightboxList[activeLightboxIndex];
    if (!item) return;

    const modal = $("photo-lightbox");
    const imgEl = $("lightbox-img");
    const songBar = $("lightbox-song-bar");
    const counterEl = $("lightbox-counter");

    imgEl.src = item.src;
    imgEl.alt = activeLightboxIsArt ? item.title : item.caption;
    imgEl.classList.toggle("is-art-contain", activeLightboxIsArt);

    $("lightbox-badge").textContent = item.badge;
    $("lightbox-caption").textContent = activeLightboxIsArt ? item.title : item.caption;
    $("lightbox-note").textContent = item.note;
    if (counterEl) {
      counterEl.textContent = `${activeLightboxIndex + 1} / ${activeLightboxList.length}`;
    }
    modal.hidden = false;

    if (activeLightboxIsArt) {
      activeLightboxPhoto = null;
      songBar.hidden = true;
      window.soundEngine.stopSongPreview(true);
    } else {
      activeLightboxPhoto = item;
      songBar.hidden = false;
      markCompletionTask("photos");
      startPhotoSongPreview(item);
    }
  }

  function openLightbox(listOrItem, index = 0, isArt = false) {
    if (Array.isArray(listOrItem)) {
      activeLightboxList = listOrItem;
      activeLightboxIndex = Math.max(0, Math.min(index, listOrItem.length - 1));
    } else {
      activeLightboxList = [listOrItem];
      activeLightboxIndex = 0;
    }
    activeLightboxIsArt = isArt;
    showLightboxCurrentItem();
  }

  function stepLightbox(delta) {
    if (!activeLightboxList.length) return;
    activeLightboxIndex = (activeLightboxIndex + delta + activeLightboxList.length) % activeLightboxList.length;
    window.soundEngine.playFlipSfx();
    showLightboxCurrentItem();
  }

  function closeLightbox() {
    $("photo-lightbox").hidden = true;
    activeLightboxPhoto = null;
    window.soundEngine.stopSongPreview(true);
    updateMusicHUD(window.soundEngine.isPlaying);
  }

  function setupLightbox() {
    $("lightbox-close").addEventListener("click", closeLightbox);
    $("lightbox-backdrop").addEventListener("click", closeLightbox);
    const prevBtn = $("lightbox-prev");
    const nextBtn = $("lightbox-next");
    if (prevBtn) prevBtn.addEventListener("click", () => stepLightbox(-1));
    if (nextBtn) nextBtn.addEventListener("click", () => stepLightbox(1));

    $("lightbox-replay-song").addEventListener("click", () => {
      if (activeLightboxPhoto) {
        startPhotoSongPreview(activeLightboxPhoto);
      }
    });
    document.addEventListener("keydown", (e) => {
      if ($("photo-lightbox").hidden) return;
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") stepLightbox(-1);
      else if (e.key === "ArrowRight") stepLightbox(1);
    });
  }

  function setupGooberDossier() {
    const d = C.scrapbook.dossier;
    $("dossier-badge").textContent = d.badge;
    $("dossier-title").textContent = d.title;
    $("dossier-intro").textContent = d.intro;
    if (d.artBadgeSrc) {
      $("dossier-art-img").src = d.artBadgeSrc;
    }

    // Tokyo Xanadu Soul Device Stats
    $("soul-device-name").textContent = d.soulDevice.name;
    const statsGrid = $("soul-device-stats");
    statsGrid.innerHTML = "";
    d.soulDevice.stats.forEach((st) => {
      const div = document.createElement("div");
      div.className = "sd-stat-chip";
      div.innerHTML = `
        <span class="sd-stat-label">${st.label}</span>
        <span class="sd-stat-value">${st.value}</span>
      `;
      statsGrid.appendChild(div);
    });

    const btn = $("reveal-title-btn");
    const box = $("sacred-title-box");
    btn.textContent = d.buttonLabel;
    $("sacred-title-text").textContent = `"${d.sacredTitle}"`;
    $("sacred-after-note").textContent = d.afterNote;

    btn.addEventListener("click", () => {
      const isHidden = box.hidden;
      box.hidden = !isHidden;
      if (isHidden) {
        window.soundEngine.playChimeSfx(true);
        btn.textContent = d.revealedLabel;
      } else {
        window.soundEngine.playFlipSfx();
        btn.textContent = d.buttonLabel;
      }
    });
  }

  // ==========================================================================
  // 5C. INTERACTIVE MINI-JRPG PORTAL STATUS
  // ==========================================================================
  function initMiniRpg() {
    try {
      if (localStorage.getItem("kirana_rpg_completed_v1") === "1") {
        markCompletionTask("rpg");
        const statusEl = $("rpg-launch-status");
        if (statusEl) {
          statusEl.textContent = "STATUS: PALACE CLEARED ★";
          statusEl.classList.add("is-cleared");
        }
      }
    } catch (_) {}
  }

  // ==========================================================================
  // 6. DKV PANTONE PALETTE
  // ==========================================================================
  function renderPantoneGrid() {
    const grid = $("pantone-grid");
    const counter = $("swatch-counter");
    const total = C.paletteSection.swatches.length;
    grid.innerHTML = "";
    counter.textContent = `0 / ${total} Swatches Flipped`;

    C.paletteSection.swatches.forEach((swatch) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "pantone-card";
      card.setAttribute("aria-pressed", "false");

      card.innerHTML = `
        <div class="pantone-inner">
          <div class="pantone-face pantone-front">
            <div class="pantone-color-block" style="background-color: ${swatch.hex};">
              <span class="pantone-hex-chip">${swatch.hex}</span>
              <span class="pantone-flip-cue">CLICK TO FLIP ↻</span>
            </div>
            <div class="pantone-label-area">
              <div class="pantone-code">${swatch.pantoneCode}</div>
              <h3 class="pantone-name">${swatch.name}</h3>
              <p class="pantone-role">${swatch.role}</p>
            </div>
          </div>

          <div class="pantone-face pantone-back">
            <div class="pantone-back-top">
              <strong>${swatch.name.toUpperCase()}</strong>
              <span class="pantone-dot" style="background-color: ${swatch.hex};"></span>
            </div>
            <p class="pantone-back-memory">${swatch.memory}</p>
            <div class="pantone-back-foot">${swatch.pantoneCode} // CLICK TO FLIP BACK</div>
          </div>
        </div>
      `;

      card.addEventListener("click", () => {
        const isFlipped = card.classList.toggle("is-flipped");
        card.setAttribute("aria-pressed", String(isFlipped));
        window.soundEngine.playFlipSfx();
        flippedSwatches.add(swatch.id);
        counter.textContent = `${flippedSwatches.size} / ${total} Swatches Flipped`;
        if (flippedSwatches.size === total) {
          markCompletionTask("palette");
        }
        saveSiteProgress();
      });

      grid.appendChild(card);
    });
  }

  // ==========================================================================
  // 7. CONFIDANT RANK UP MULTI-STAGE HANGOUT
  // ==========================================================================
  function updateConfidantVisuals() {
    const rankStars = $("rank-stars");
    const rankBadge = $("rank-badge");
    const rankBanner = $("rank-up-banner");
    if (!rankStars || !rankBadge) return;

    if (confidantMaxed) {
      rankStars.innerHTML = "<span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>";
      rankStars.classList.add("is-max");
      rankBadge.textContent = "RANK MAX";
      rankBadge.classList.add("is-max");
      if (rankBanner) rankBanner.hidden = false;
    } else if (confidantStageIdx === 0) {
      rankStars.innerHTML = "<span>★</span><span>☆</span><span>☆</span><span>☆</span><span>☆</span>";
      rankStars.classList.remove("is-max");
      rankBadge.textContent = "RANK 1";
      rankBadge.classList.remove("is-max");
      if (rankBanner) rankBanner.hidden = true;
    } else if (confidantStageIdx === 1) {
      rankStars.innerHTML = "<span>★</span><span>★</span><span>★</span><span>☆</span><span>☆</span>";
      rankStars.classList.remove("is-max");
      rankBadge.textContent = "RANK 3";
      rankBadge.classList.remove("is-max");
      if (rankBanner) rankBanner.hidden = true;
    } else {
      rankStars.innerHTML = "<span>★</span><span>★</span><span>★</span><span>★</span><span>☆</span>";
      rankStars.classList.remove("is-max");
      rankBadge.textContent = "RANK 4";
      rankBadge.classList.remove("is-max");
      if (rankBanner) rankBanner.hidden = true;
    }
  }

  function renderConfidantChoices() {
    const list = $("confidant-choices");
    const promptEl = $("confidant-prompt");
    const responseBox = $("confidant-response-box");
    const responseText = $("confidant-response-text");

    list.innerHTML = "";
    const stages = Array.isArray(C.confidant.stages) && C.confidant.stages.length > 0
      ? C.confidant.stages
      : [{ prompt: C.confidant.promptLine, choices: C.confidant.choices }];
    const activeIdx = Math.min(confidantStageIdx, stages.length - 1);
    const stageData = stages[activeIdx];

    if (promptEl && stageData.prompt) {
      promptEl.textContent = stageData.prompt;
    }
    updateConfidantVisuals();

    stageData.choices.forEach((choice, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.innerHTML = `
        <span class="choice-index">0${idx + 1}</span>
        <span>${choice.label}</span>
      `;

      btn.addEventListener("click", () => {
        list.querySelectorAll(".choice-btn").forEach((b) => b.classList.remove("is-selected"));
        btn.classList.add("is-selected");

        responseBox.hidden = false;
        responseText.textContent = choice.response;

        if (!confidantMaxed && activeIdx < stages.length - 1) {
          window.soundEngine.playChimeSfx(false);
          confidantStageIdx = activeIdx + 1;
          saveSiteProgress();
          const nextBtn = document.createElement("button");
          nextBtn.type = "button";
          nextBtn.className = "choice-btn choice-next-stage";
          nextBtn.innerHTML = `<span class="choice-index">▶</span><span>Continue Hangout (${confidantStageIdx + 1} / ${stages.length})</span>`;
          nextBtn.addEventListener("click", () => {
            window.soundEngine.playFlipSfx();
            renderConfidantChoices();
          });
          list.innerHTML = "";
          list.appendChild(btn);
          list.appendChild(nextBtn);
          updateConfidantVisuals();
          return;
        }

        if (!confidantMaxed) {
          confidantMaxed = true;
          window.soundEngine.playChimeSfx(true);
          updateConfidantVisuals();
          markCompletionTask("confidant");
          launchBirthdayConfetti(60);
          saveSiteProgress();
        } else {
          window.soundEngine.playChimeSfx(false);
        }
      });

      list.appendChild(btn);
    });
  }

  // ==========================================================================
  // 8. PHANTOM THIEF CALLING CARD
  // ==========================================================================
  function renderRansomHeadline(headlineStr) {
    const el = $("cc-headline");
    el.innerHTML = "";
    const styles = ["cutout-w", "cutout-b", "cutout-w", "cutout-r", "cutout-b"];
    headlineStr.split(/\s+/).forEach((word, i) => {
      const span = document.createElement("span");
      span.className = styles[i % styles.length];
      span.textContent = word;
      el.appendChild(span);
    });
  }

  function setupCallingCardStamp() {
    const btn = $("stamp-card-btn");
    const seal = $("cc-stamped-seal");
    btn.addEventListener("click", () => {
      window.soundEngine.playChimeSfx(false);
      seal.classList.remove("is-stamped");
      void seal.offsetWidth;
      seal.classList.add("is-stamped");
      if (!cardStamped) {
        cardStamped = true;
        btn.textContent = "Seal Stamped ★";
        saveSiteProgress();
      }
    });
  }

  // ==========================================================================
  // 9. THE HERMIT TAROT REVEAL (SPARKS + SOFT WHITE FLASH)
  // ==========================================================================
  function setupHermitReveal() {
    const sparksContainer = $("lantern-sparks");
    for (let i = 0; i < 16; i++) {
      const s = document.createElement("span");
      s.className = "lantern-spark";
      s.style.left = `${12 + Math.random() * 76}%`;
      s.style.bottom = `${8 + Math.random() * 45}%`;
      s.style.animationDelay = `${(Math.random() * 3.2).toFixed(2)}s`;
      s.style.animationDuration = `${(2.6 + Math.random() * 1.8).toFixed(2)}s`;
      sparksContainer.appendChild(s);
    }

    const cardBtn = $("hermit-card-btn");
    const flash = $("tarot-flash-overlay");
    const meaningCard = $("hermit-meaning-card");
    const instruction = $("hermit-instruction");

    // 3D Tilt Parallax on hover
    cardBtn.addEventListener("mousemove", (e) => {
      const rect = cardBtn.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      cardBtn.style.setProperty("--rx", `${(-ny * 14).toFixed(2)}deg`);
      cardBtn.style.setProperty("--ry", `${(nx * 14).toFixed(2)}deg`);
    });
    cardBtn.addEventListener("mouseleave", () => {
      cardBtn.style.setProperty("--rx", "0deg");
      cardBtn.style.setProperty("--ry", "0deg");
    });

    cardBtn.addEventListener("click", () => {
      if (hermitRevealed) {
        cardBtn.classList.toggle("is-revealed");
        window.soundEngine.playFlipSfx();
        return;
      }

      hermitRevealed = true;
      cardBtn.setAttribute("aria-expanded", "true");
      cardBtn.classList.add("is-charging");
      window.soundEngine.playTarotRevealSfx();

      setTimeout(() => {
        flash.classList.remove("is-flashing");
        void flash.offsetWidth;
        flash.classList.add("is-flashing");
      }, 280);

      setTimeout(() => {
        cardBtn.classList.remove("is-charging");
        cardBtn.classList.add("is-revealed");
        meaningCard.hidden = false;
        instruction.textContent = "Arcana IX revealed! Tap the card anytime to turn it over.";
        markCompletionTask("hermit");
        saveSiteProgress();
      }, 680);
    });
  }

  // ==========================================================================
  // 10. HIDDEN CLICKABLE EASTER EGGS (SOUL GEM CHARGE + SECRET MEMORY VAULT)
  // ==========================================================================
  function showEggToast(title, msg) {
    const toast = $("egg-toast");
    $("egg-toast-title").textContent = title;
    $("egg-toast-msg").textContent = msg;
    toast.hidden = false;

    clearTimeout(eggToastTimer);
    eggToastTimer = setTimeout(() => {
      toast.hidden = true;
    }, 6800);
  }

  function updateSoulGemCounterUI() {
    const total = C.easterEggs.length;
    const count = foundEggs.size;
    const counterText = $("egg-counter-text");
    const soulGem = $("hud-soul-gem");
    if (counterText) counterText.textContent = `${count} / ${total} SOUL GEM`;
    if (soulGem) soulGem.setAttribute("class", `soul-gem-svg level-${count}`);
  }

  function renderVaultModal() {
    const total = C.easterEggs.length;
    const count = foundEggs.size;
    const noteEl = $("vault-status-note");
    const grid = $("vault-eggs-grid");
    const memWrap = $("vault-memories-wrap");
    const memGrid = $("vault-memories-grid");
    if (!grid || !memWrap || !memGrid) return;

    if (noteEl) {
      noteEl.textContent =
        count === total
          ? "Soul Gem 100% purified! All 6 hidden secrets discovered and Memory Vault unlocked."
          : `Found ${count} of ${total} hidden secrets around the site! Find all ${total} to unlock the Bonus Inside-Jokes Vault.`;
    }

    grid.innerHTML = "";
    C.easterEggs.forEach((egg) => {
      const unlocked = foundEggs.has(egg.id);
      const card = document.createElement("div");
      card.className = `vault-egg-card ${unlocked ? "is-unlocked" : "is-locked"}`;
      card.innerHTML = unlocked
        ? `<strong>★ ${egg.label}</strong><small>${egg.title}</small><p>${egg.message}</p>`
        : `<strong>? Locked Secret (${egg.label})</strong><small>Hidden nearby in the website sections...</small>`;
      grid.appendChild(card);
    });

    if (count === total && Array.isArray(C.secretVault)) {
      memWrap.hidden = false;
      memGrid.innerHTML = "";
      C.secretVault.forEach((m) => {
        const div = document.createElement("div");
        div.className = "vault-memory-card";
        div.innerHTML = `<span>${m.tag}</span><h4>${m.title}</h4><p>${m.text}</p>`;
        memGrid.appendChild(div);
      });
    } else {
      memWrap.hidden = true;
    }
  }

  function openVaultModal() {
    const modal = $("vault-modal");
    if (!modal) return;
    renderVaultModal();
    modal.hidden = false;
    window.soundEngine.playScanSfx();
  }

  function closeVaultModal() {
    const modal = $("vault-modal");
    if (modal) modal.hidden = true;
  }

  function setupEasterEggs() {
    const eggButtons = document.querySelectorAll(".easter-egg");
    const total = C.easterEggs.length;

    $("egg-toast-close").addEventListener("click", () => {
      $("egg-toast").hidden = true;
    });

    const pillBtn = $("egg-counter-pill");
    if (pillBtn) pillBtn.addEventListener("click", openVaultModal);
    const vClose = $("vault-close");
    if (vClose) vClose.addEventListener("click", closeVaultModal);
    const vBackdrop = $("vault-backdrop");
    if (vBackdrop) vBackdrop.addEventListener("click", closeVaultModal);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && $("vault-modal") && !$("vault-modal").hidden) {
        closeVaultModal();
      }
    });

    eggButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const eggId = btn.dataset.eggId;
        const data = C.easterEggs.find((e) => e.id === eggId);
        if (!data) return;

        window.soundEngine.playEggSfx();
        const isFirstFind = !foundEggs.has(eggId);
        foundEggs.add(eggId);
        btn.classList.add("is-found");

        updateSoulGemCounterUI();
        saveSiteProgress();

        if (isFirstFind && foundEggs.size === total) {
          showEggToast(
            `SOUL GEM AT 100%! (${total}/${total}) ★`,
            `${data.message} Opening your Secret Memory Vault!`
          );
          launchBirthdayConfetti(110);
          setTimeout(() => {
            window.soundEngine.playChimeSfx(true);
            openVaultModal();
          }, 420);
        } else {
          showEggToast(data.title, data.message);
        }
      });
    });
  }

  // ==========================================================================
  // 11. CONFETTI BURST ENGINE
  // ==========================================================================
  function launchBirthdayConfetti(count = 85) {
    const canvas = $("confetti-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#c77dff", "#9d4edd", "#e9c46a", "#f4a261", "#e63946", "#70d6ff"];
    const pieces = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 140,
      w: Math.random() * 8 + 5,
      h: Math.random() * 6 + 4,
      vx: (Math.random() - 0.5) * 4.5,
      vy: Math.random() * 4.2 + 2.6,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.22,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));

    let frame = 0;
    function step() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = 0;
      for (const p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;
        p.rot += p.vrot;
        if (p.y < canvas.height + 30) alive++;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      frame++;
      if (alive > 0 && frame < 220) {
        requestAnimationFrame(step);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    requestAnimationFrame(step);
  }
  window.launchBirthdayConfetti = launchBirthdayConfetti;

  // ==========================================================================
  // 12. PALACE MAP & 100% COMPLETION TRACKER
  // ==========================================================================
  const completedTasks = new Set();
  const TOTAL_TASKS = 6;

  function markCompletionTask(taskKey, silent = false) {
    if (completedTasks.has(taskKey)) return;
    completedTasks.add(taskKey);

    const badge = $("map-progress-badge");
    if (badge) {
      badge.textContent = `${completedTasks.size} / ${TOTAL_TASKS}`;
    }

    const li = document.querySelector(`#completion-checklist li[data-task="${taskKey}"]`);
    if (li) {
      li.classList.add("is-done");
      const box = li.querySelector(".chk-box");
      if (box) box.textContent = "☑";
    }

    if (completedTasks.size === TOTAL_TASKS) {
      const banner = $("completion-100-banner");
      if (banner) banner.hidden = false;
      if (!silent) {
        launchBirthdayConfetti(140);
        setTimeout(() => window.soundEngine.playChimeSfx(true), 200);
      }
    }

    if (!silent) saveSiteProgress();
  }

  function resetWebsiteSecretsAndProgress() {
    window.soundEngine.playFlipSfx();
    foundEggs.clear();
    flippedSwatches.clear();
    completedTasks.clear();
    confidantStageIdx = 0;
    confidantMaxed = false;
    hermitRevealed = false;
    cardStamped = false;
    candlesBlown = false;

    try {
      localStorage.removeItem(SITE_PROGRESS_KEY);
    } catch (_) {}

    document.querySelectorAll(".easter-egg").forEach((b) => b.classList.remove("is-found"));
    updateSoulGemCounterUI();

    document.querySelectorAll(".pantone-card").forEach((c) => {
      c.classList.remove("is-flipped");
      c.setAttribute("aria-pressed", "false");
    });
    const swatchCounter = $("swatch-counter");
    if (swatchCounter) swatchCounter.textContent = `0 / ${C.paletteSection.swatches.length} Swatches Flipped`;

    document.querySelectorAll("#completion-checklist li").forEach((li) => {
      li.classList.remove("is-done");
      const box = li.querySelector(".chk-box");
      if (box) box.textContent = "☐";
    });
    const badge = $("map-progress-badge");
    if (badge) badge.textContent = `0 / ${TOTAL_TASKS}`;
    const banner = $("completion-100-banner");
    if (banner) banner.hidden = true;

    // Preserve RPG clear status if RPG was cleared in localStorage
    try {
      if (localStorage.getItem("kirana_rpg_completed_v1") === "1") {
        markCompletionTask("rpg", true);
      }
    } catch (_) {}

    renderConfidantChoices();
    const respBox = $("confidant-response-box");
    if (respBox) respBox.hidden = true;

    const cardBtn = $("hermit-card-btn");
    const meaningCard = $("hermit-meaning-card");
    const instruction = $("hermit-instruction");
    if (cardBtn) {
      cardBtn.classList.remove("is-revealed", "is-charging");
      cardBtn.setAttribute("aria-expanded", "false");
    }
    if (meaningCard) meaningCard.hidden = true;
    if (instruction) instruction.textContent = C.hermit.instruction;

    const seal = $("cc-stamped-seal");
    const stampBtn = $("stamp-card-btn");
    if (seal) seal.classList.remove("is-stamped");
    if (stampBtn) stampBtn.textContent = "Stamp Acceptance Seal";

    const wishVisual = $("wish-cake-visual");
    const blowBtn = $("blow-candles-btn");
    const wishStatus = $("wish-status");
    if (wishVisual) wishVisual.classList.remove("is-blown");
    if (blowBtn) blowBtn.textContent = "Make a Wish & Blow Out Candles";
    if (wishStatus) wishStatus.textContent = "3 glowing candles waiting!";

    renderVaultModal();
    closeVaultModal();
    showEggToast("Progress & Easter Eggs Reset!", "All 6 hidden secrets, Tarot, Confidant hangout, and swatches are fresh to discover again!");
  }

  function restoreSiteProgress() {
    const saved = loadSiteProgress();
    if (!saved) return;

    if (Array.isArray(saved.eggs)) {
      saved.eggs.forEach((id) => {
        foundEggs.add(id);
        const el = document.querySelector(`.easter-egg[data-egg-id="${id}"]`);
        if (el) el.classList.add("is-found");
      });
      updateSoulGemCounterUI();
    }

    if (Array.isArray(saved.swatches)) {
      const cards = document.querySelectorAll(".pantone-card");
      C.paletteSection.swatches.forEach((sw, i) => {
        if (saved.swatches.includes(sw.id)) {
          flippedSwatches.add(sw.id);
          if (cards[i]) {
            cards[i].classList.add("is-flipped");
            cards[i].setAttribute("aria-pressed", "true");
          }
        }
      });
      const counter = $("swatch-counter");
      if (counter) counter.textContent = `${flippedSwatches.size} / ${C.paletteSection.swatches.length} Swatches Flipped`;
    }

    if (typeof saved.confidantStageIdx === "number") confidantStageIdx = saved.confidantStageIdx;
    if (saved.confidantMaxed) confidantMaxed = true;
    renderConfidantChoices();

    if (saved.hermitRevealed) {
      hermitRevealed = true;
      const cardBtn = $("hermit-card-btn");
      const meaningCard = $("hermit-meaning-card");
      const instruction = $("hermit-instruction");
      if (cardBtn) {
        cardBtn.classList.add("is-revealed");
        cardBtn.setAttribute("aria-expanded", "true");
      }
      if (meaningCard) meaningCard.hidden = false;
      if (instruction) instruction.textContent = "Arcana IX revealed! Tap the card anytime to turn it over.";
    }

    if (saved.cardStamped) {
      cardStamped = true;
      const seal = $("cc-stamped-seal");
      const stampBtn = $("stamp-card-btn");
      if (seal) seal.classList.add("is-stamped");
      if (stampBtn) stampBtn.textContent = "Seal Stamped ★";
    }

    if (saved.candlesBlown) {
      candlesBlown = true;
      const visual = $("wish-cake-visual");
      const blowBtn = $("blow-candles-btn");
      const status = $("wish-status");
      if (visual) visual.classList.add("is-blown");
      if (blowBtn) blowBtn.textContent = "Relight Birthday Candles";
      if (status) status.textContent = "Wish made! Happy Birthday, Kirana!";
    }

    if (Array.isArray(saved.tasks)) {
      saved.tasks.forEach((t) => markCompletionTask(t, true));
    }
  }

  window.onRpgCompleted = function () {
    markCompletionTask("rpg");
  };

  function setupPalaceMap() {
    const toggleBtn = $("map-toggle-btn");
    const drawer = $("palace-map-drawer");
    if (!toggleBtn || !drawer) return;

    toggleBtn.addEventListener("click", () => {
      const opening = drawer.hidden;
      drawer.hidden = !opening;
      toggleBtn.setAttribute("aria-expanded", String(opening));
      window.soundEngine.playFlipSfx();
    });

    drawer.querySelectorAll(".map-jump-link").forEach((link) => {
      link.addEventListener("click", () => {
        drawer.hidden = true;
        toggleBtn.setAttribute("aria-expanded", "false");
      });
    });

    const resetBtn = $("reset-progress-btn");
    if (resetBtn) resetBtn.addEventListener("click", resetWebsiteSecretsAndProgress);
    const vResetBtn = $("vault-reset-btn");
    if (vResetBtn) vResetBtn.addEventListener("click", resetWebsiteSecretsAndProgress);
  }

  // ==========================================================================
  // 13. INTERACTIVE BIRTHDAY CAKE CANDLES ("MAKE A WISH")
  // ==========================================================================
  function setupWishCandles() {
    const btn = $("blow-candles-btn");
    const visual = $("wish-cake-visual");
    const status = $("wish-status");
    if (!btn || !visual) return;

    btn.addEventListener("click", () => {
      candlesBlown = !candlesBlown;
      if (candlesBlown) {
        visual.classList.add("is-blown");
        btn.textContent = "Relight Birthday Candles";
        status.textContent = "Wish made! Happy Birthday, Kirana!";
        window.soundEngine.playChimeSfx(true);
        launchBirthdayConfetti(90);
        markCompletionTask("cake");
      } else {
        visual.classList.remove("is-blown");
        btn.textContent = "Make a Wish & Blow Out Candles";
        status.textContent = "3 glowing candles waiting!";
        window.soundEngine.playFlipSfx();
      }
      saveSiteProgress();
    });
  }

  // ==========================================================================
  // 14. INTERACTIVE DKV "PURPLE CAFE COASTER" SKETCHPAD
  // ==========================================================================
  function setupCoasterSketchpad() {
    const canvas = $("coaster-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let activeColor = "#c77dff";
    let mode = "draw"; // 'draw' | 'star' | 'paw' | 'coffee'
    let drawing = false;

    function drawCoasterBase() {
      ctx.fillStyle = "#140f20";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle DKV coaster grid lines
      ctx.strokeStyle = "rgba(199, 125, 255, 0.08)";
      ctx.lineWidth = 1;
      for (let x = 24; x < canvas.width; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 24; y < canvas.height; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Watermark
      ctx.fillStyle = "rgba(233, 196, 106, 0.25)";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText("CAFE LEBLANC // KIRANA'S DOODLE COASTER", 16, 24);
    }

    drawCoasterBase();

    function saveCoasterArt() {
      try {
        localStorage.setItem(COASTER_ART_KEY, canvas.toDataURL("image/png"));
      } catch (_) {}
    }

    try {
      const savedArt = localStorage.getItem(COASTER_ART_KEY);
      if (savedArt && savedArt.startsWith("data:image/")) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = savedArt;
      }
    } catch (_) {}

    function getPos(evt) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (evt.clientX - rect.left) * scaleX,
        y: (evt.clientY - rect.top) * scaleY
      };
    }

    function drawStar(x, y, color) {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a1 = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const a2 = a1 + Math.PI / 5;
        ctx.lineTo(Math.cos(a1) * 14, Math.sin(a1) * 14);
        ctx.lineTo(Math.cos(a2) * 6, Math.sin(a2) * 6);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function drawPaw(x, y, color) {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(x, y + 4, 8, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();
      [
        [-9, -5],
        [-3, -9],
        [3, -9],
        [9, -5]
      ].forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, 3.2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    function drawCoffee(x, y, color) {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(-10, -4, 18, 13, 3);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(10, 2, 4.2, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      ctx.lineWidth = 1.8;
      [-4, 2].forEach((sx) => {
        ctx.beginPath();
        ctx.moveTo(sx, -8);
        ctx.quadraticCurveTo(sx + 2, -12, sx, -15);
        ctx.stroke();
      });
      ctx.restore();
    }

    canvas.addEventListener("pointerdown", (e) => {
      const pos = getPos(e);
      if (mode === "star") {
        drawStar(pos.x, pos.y, activeColor);
        window.soundEngine.playEggSfx();
        saveCoasterArt();
        return;
      }
      if (mode === "paw") {
        drawPaw(pos.x, pos.y, activeColor);
        window.soundEngine.playEggSfx();
        saveCoasterArt();
        return;
      }
      if (mode === "coffee") {
        drawCoffee(pos.x, pos.y, activeColor);
        window.soundEngine.playEggSfx();
        saveCoasterArt();
        return;
      }
      drawing = true;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    });

    canvas.addEventListener("pointermove", (e) => {
      if (!drawing || mode !== "draw") return;
      const pos = getPos(e);
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    });

    window.addEventListener("pointerup", () => {
      if (drawing) {
        drawing = false;
        saveCoasterArt();
      }
    });

    document.querySelectorAll(".pen-swatch").forEach((sw) => {
      sw.addEventListener("click", () => {
        document.querySelectorAll(".pen-swatch").forEach((s) => s.classList.remove("is-active"));
        sw.classList.add("is-active");
        activeColor = sw.dataset.color || "#c77dff";
        mode = "draw";
        $("pen-mode-star").classList.remove("is-active");
        $("pen-mode-paw").classList.remove("is-active");
        if ($("pen-mode-coffee")) $("pen-mode-coffee").classList.remove("is-active");
      });
    });

    $("pen-mode-star").addEventListener("click", () => {
      mode = mode === "star" ? "draw" : "star";
      $("pen-mode-star").classList.toggle("is-active", mode === "star");
      $("pen-mode-paw").classList.remove("is-active");
      if ($("pen-mode-coffee")) $("pen-mode-coffee").classList.remove("is-active");
    });

    $("pen-mode-paw").addEventListener("click", () => {
      mode = mode === "paw" ? "draw" : "paw";
      $("pen-mode-paw").classList.toggle("is-active", mode === "paw");
      $("pen-mode-star").classList.remove("is-active");
      if ($("pen-mode-coffee")) $("pen-mode-coffee").classList.remove("is-active");
    });

    if ($("pen-mode-coffee")) {
      $("pen-mode-coffee").addEventListener("click", () => {
        mode = mode === "coffee" ? "draw" : "coffee";
        $("pen-mode-coffee").classList.toggle("is-active", mode === "coffee");
        $("pen-mode-star").classList.remove("is-active");
        $("pen-mode-paw").classList.remove("is-active");
      });
    }

    $("coaster-clear-btn").addEventListener("click", () => {
      drawCoasterBase();
      try {
        localStorage.removeItem(COASTER_ART_KEY);
      } catch (_) {}
      window.soundEngine.playFlipSfx();
    });

    $("coaster-save-btn").addEventListener("click", () => {
      window.soundEngine.playChimeSfx(false);
      const link = document.createElement("a");
      link.download = "kirana-cafe-coaster.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  }

  // ==========================================================================
  // 15. SCROLL REVEAL OBSERVER
  // ==========================================================================
  function observeReveals() {
    const blocks = document.querySelectorAll(".reveal-block");
    if (!("IntersectionObserver" in window)) {
      blocks.forEach((b) => b.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    blocks.forEach((b) => io.observe(b));
  }

  // ==========================================================================
  // 16. FULLSCREEN RPG OVERLAY (KEEPS MAIN WEBSITE SONG PLAYING SEAMLESSLY)
  // ==========================================================================
  function setupRpgFrameOverlay() {
    const modal = $("rpg-frame-modal");
    const frame = $("rpg-frame");
    if (!modal || !frame) return;

    function pushBgmStateToFrame() {
      if (modal.hidden || !frame.contentWindow) return;
      try {
        frame.contentWindow.postMessage(
          {
            type: "kirana-bgm-state",
            isPlaying: window.soundEngine.isPlaying,
            userPaused: window.soundEngine.userPaused,
            trackTitle: window.soundEngine.currentTrackLabel,
            volume: window.soundEngine.volume
          },
          "*"
        );
      } catch (_) {}
    }

    window.soundEngine.onStateChange = () => pushBgmStateToFrame();

    function openRpgModal() {
      window.soundEngine.stopSongPreview(true);
      const currentAttr = frame.getAttribute("src");
      if (!currentAttr || currentAttr === "about:blank") {
        frame.src = "rpg.html";
      }
      modal.hidden = false;
      document.body.classList.add("state-locked");
      setTimeout(() => {
        pushBgmStateToFrame();
        try {
          frame.focus();
          if (frame.contentWindow) frame.contentWindow.focus();
        } catch (_) {}
      }, 80);
    }

    function closeRpgModal() {
      if (modal.hidden) return;
      try {
        if (frame.contentWindow) {
          frame.contentWindow.postMessage({ type: "kirana-rpg-hidden" }, "*");
        }
      } catch (_) {}
      modal.hidden = true;
      document.body.classList.remove("state-locked");
      window.soundEngine.resumeAfterBattleExternal();
      updateMusicHUD(window.soundEngine.isPlaying);
    }

    document.querySelectorAll('a[href="rpg.html"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        openRpgModal();
      });
    });

    window.addEventListener("message", (e) => {
      const data = e.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "kirana-close-rpg") {
        closeRpgModal();
      } else if (data.type === "kirana-rpg-completed") {
        markCompletionTask("rpg");
        const statusEl = $("rpg-launch-status");
        if (statusEl) {
          statusEl.textContent = "STATUS: PALACE CLEARED ★";
          statusEl.classList.add("is-cleared");
        }
      } else if (data.type === "kirana-bgm-control") {
        if (data.action === "pauseForBattle") {
          window.soundEngine.pauseForBattleExternal();
        } else if (data.action === "resumeAfterBattle") {
          window.soundEngine.resumeAfterBattleExternal();
        } else if (data.action === "clearBattleFlag") {
          window.soundEngine.clearBattleFlagExternal();
        } else if (data.action === "togglePlay") {
          const playing = window.soundEngine.togglePlay();
          updateMusicHUD(playing);
        } else if (data.action === "setVolume" && typeof data.volume !== "undefined") {
          window.soundEngine.setVolume(data.volume);
          const slider = $("volume-slider");
          if (slider) slider.value = String(window.soundEngine.volume);
        } else if (data.action === "requestState") {
          pushBgmStateToFrame();
        }
      }
    });
  }

  // ==========================================================================
  // 17. FINAL LETTER CELESTIAL ENVELOPE -> MAJESTIC SCROLL & GRAND FLASH
  // ==========================================================================
  function setupFinalLetter() {
    const closedStage = $("letter-closed-stage");
    const scrollStage = $("letter-scroll-stage");
    const openBtn = $("open-letter-btn");
    const foldBtn = $("fold-letter-btn");
    const flashEl = $("letter-grand-flash");
    if (!closedStage || !scrollStage || !openBtn) return;

    function triggerGrandWebsiteFlash() {
      document.body.classList.remove("is-letter-celebrating");
      void document.body.offsetWidth;
      document.body.classList.add("is-letter-celebrating");

      if (flashEl) {
        flashEl.classList.remove("is-active");
        void flashEl.offsetWidth;
        flashEl.classList.add("is-active");
        setTimeout(() => flashEl.classList.remove("is-active"), 1800);
      }
      setTimeout(() => document.body.classList.remove("is-letter-celebrating"), 2600);
    }

    openBtn.addEventListener("click", () => {
      openBtn.disabled = true;
      window.soundEngine.playLetterOpenSfx();
      triggerGrandWebsiteFlash();
      launchBirthdayConfetti(155);

      closedStage.classList.add("is-breaking");
      setTimeout(() => {
        closedStage.hidden = true;
        closedStage.classList.remove("is-breaking");
        scrollStage.hidden = false;
        scrollStage.classList.remove("is-unrolling");
        void scrollStage.offsetWidth;
        scrollStage.classList.add("is-unrolling");
        openBtn.setAttribute("aria-expanded", "true");
        openBtn.disabled = false;
        scrollStage.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 420);
    });

    if (foldBtn) {
      foldBtn.addEventListener("click", () => {
        window.soundEngine.playFlipSfx();
        scrollStage.classList.remove("is-unrolling");
        scrollStage.hidden = true;
        closedStage.hidden = false;
        openBtn.setAttribute("aria-expanded", "false");
        closedStage.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }

  // ==========================================================================
  // 18. 3D INTERACTIVE CARD TILT & SUBTLE DESKTOP SPARKLES
  // ==========================================================================
  function setupFancy3DTiltAndSparkles() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    document.querySelectorAll(".calling-card-poster, .sweet-station-card, .rpg-launch-card").forEach((el) => {
      el.classList.add("tilt-3d-surface");
      el.addEventListener("mousemove", (e) => {
        const rect = el.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.setProperty("--tx", `${(-ny * 7).toFixed(2)}deg`);
        el.style.setProperty("--ty", `${(nx * 7).toFixed(2)}deg`);
      });
      el.addEventListener("mouseleave", () => {
        el.style.setProperty("--tx", "0deg");
        el.style.setProperty("--ty", "0deg");
      });
    });

    if (window.matchMedia && window.matchMedia("(pointer: fine)").matches) {
      let lastSparkle = 0;
      window.addEventListener("mousemove", (e) => {
        const now = performance.now();
        if (now - lastSparkle < 95) return;
        if (document.body.classList.contains("state-locked")) return;
        lastSparkle = now;

        const sp = document.createElement("span");
        sp.className = "cursor-sparkle";
        sp.textContent = Math.random() < 0.5 ? "✦" : "✧";
        sp.style.left = `${e.clientX}px`;
        sp.style.top = `${e.clientY}px`;
        sp.style.color = Math.random() < 0.5 ? "#e9c46a" : "#c77dff";
        document.body.appendChild(sp);
        setTimeout(() => sp.remove(), 700);
      });
    }
  }

  // ==========================================================================
  // BOOTSTRAP
  // ==========================================================================
  document.addEventListener("DOMContentLoaded", () => {
    hydrateContent();
    initMistCanvas();
    setupEntryUnwrap();
    setupMusicHUD();
    setupPalaceMap();
    setupWishCandles();
    setupCoasterSketchpad();
    setupLightbox();
    setupCallingCardStamp();
    setupHermitReveal();
    setupEasterEggs();
    restoreSiteProgress();
    setupRpgFrameOverlay();
    setupFinalLetter();
    setupFancy3DTiltAndSparkles();
  });
})();
