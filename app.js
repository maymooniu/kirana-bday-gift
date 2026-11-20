/**
 * ============================================================================
 *  KIRANA'S BIRTHDAY WEBSITE: INTERACTIVE CONTROLLER
 * ============================================================================
 */

(function () {
  const C = window.SITE_CONTENT;
  if (!C) return;

  const $ = (id) => document.getElementById(id);

  // State trackers
  const flippedSwatches = new Set();
  const foundEggs = new Set();
  let confidantMaxed = false;
  let hermitRevealed = false;
  let cardStamped = false;
  let eggToastTimer = null;
  let rainInitialized = false;
  let activeLightboxPhoto = null;

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
    C.letter.paragraphs.forEach((pText) => {
      const p = document.createElement("p");
      p.textContent = pText;
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

    unwrapBtn.addEventListener("click", () => {
      unwrapBtn.disabled = true;
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
    };

    $("music-toggle-btn").addEventListener("click", () => {
      window.soundEngine.stopSongPreview(false);
      const nowPlaying = window.soundEngine.togglePlay();
      updateMusicHUD(nowPlaying);
    });

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

    C.scrapbook.photos.forEach((photo) => {
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
        openLightbox(photo);
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

    C.artGallery.pieces.forEach((art) => {
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
        openLightbox(art, true);
      });
      grid.appendChild(btn);
    });
  }

  function openLightbox(item, isArt = false) {
    const modal = $("photo-lightbox");
    const imgEl = $("lightbox-img");
    const songBar = $("lightbox-song-bar");

    imgEl.src = item.src;
    imgEl.alt = isArt ? item.title : item.caption;
    imgEl.classList.toggle("is-art-contain", isArt);

    $("lightbox-badge").textContent = item.badge;
    $("lightbox-caption").textContent = isArt ? item.title : item.caption;
    $("lightbox-note").textContent = item.note;
    modal.hidden = false;

    if (isArt) {
      activeLightboxPhoto = null;
      songBar.hidden = true;
    } else {
      activeLightboxPhoto = item;
      songBar.hidden = false;
      markCompletionTask("photos");
      startPhotoSongPreview(item);
    }
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
    $("lightbox-replay-song").addEventListener("click", () => {
      if (activeLightboxPhoto) {
        startPhotoSongPreview(activeLightboxPhoto);
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !$("photo-lightbox").hidden) {
        closeLightbox();
      }
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
  // 5C. INTERACTIVE MINI-JRPG ("CHRONICLES OF THE PURPLE CAFE")
  // ==========================================================================
  function initMiniRpg() {
    const R = C.rpg;
    $("rpg-player-name").textContent = R.player.name;
    $("rpg-player-avatar").src = R.player.portrait;
    $("rpg-all-out-img").src = R.player.portrait;
    $("rpg-victory-title").textContent = R.victoryLoot.title;
    $("loot-title").textContent = R.victoryLoot.rewardTitle;
    $("loot-desc").textContent = R.victoryLoot.rewardDesc;

    if (typeof window.initKiranaRpg === "function") {
      window.initKiranaRpg();
    }
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
      });

      grid.appendChild(card);
    });
  }

  // ==========================================================================
  // 7. CONFIDANT RANK UP MINI-INTERACTION
  // ==========================================================================
  function renderConfidantChoices() {
    const list = $("confidant-choices");
    const responseBox = $("confidant-response-box");
    const responseText = $("confidant-response-text");
    const rankBanner = $("rank-up-banner");
    const rankStars = $("rank-stars");
    const rankBadge = $("rank-badge");

    list.innerHTML = "";

    C.confidant.choices.forEach((choice, idx) => {
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

        if (!confidantMaxed) {
          confidantMaxed = true;
          window.soundEngine.playChimeSfx(true);
          rankStars.innerHTML = "<span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>";
          rankStars.classList.add("is-max");
          rankBadge.textContent = "RANK MAX";
          rankBadge.classList.add("is-max");
          rankBanner.hidden = false;
          markCompletionTask("confidant");
          launchBirthdayConfetti(60);
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
      }, 680);
    });
  }

  // ==========================================================================
  // 10. HIDDEN CLICKABLE EASTER EGGS (SOUL GEM CHARGE)
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

  function setupEasterEggs() {
    const eggButtons = document.querySelectorAll(".easter-egg");
    const total = C.easterEggs.length;
    const counterText = $("egg-counter-text");
    const soulGem = $("hud-soul-gem");

    $("egg-toast-close").addEventListener("click", () => {
      $("egg-toast").hidden = true;
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

        const count = foundEggs.size;
        counterText.textContent = `${count} / ${total} SOUL GEM`;
        soulGem.setAttribute("class", `soul-gem-svg level-${count}`);

        if (isFirstFind && count === total) {
          showEggToast(
            `SOUL GEM AT 100%! (${total}/${total}) ★`,
            `${data.message} Plus, you unlocked the Radiant Purple Soul Gem Trophy for finding every secret!`
          );
          setTimeout(() => window.soundEngine.playChimeSfx(true), 260);
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

  function markCompletionTask(taskKey) {
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
      launchBirthdayConfetti(140);
      setTimeout(() => window.soundEngine.playChimeSfx(true), 200);
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
  }

  // ==========================================================================
  // 13. INTERACTIVE BIRTHDAY CAKE CANDLES ("MAKE A WISH")
  // ==========================================================================
  function setupWishCandles() {
    const btn = $("blow-candles-btn");
    const visual = $("wish-cake-visual");
    const status = $("wish-status");
    if (!btn || !visual) return;

    let blown = false;
    btn.addEventListener("click", () => {
      blown = !blown;
      if (blown) {
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
    let mode = "draw"; // 'draw' | 'star' | 'paw'
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

    canvas.addEventListener("pointerdown", (e) => {
      const pos = getPos(e);
      if (mode === "star") {
        drawStar(pos.x, pos.y, activeColor);
        window.soundEngine.playEggSfx();
        return;
      }
      if (mode === "paw") {
        drawPaw(pos.x, pos.y, activeColor);
        window.soundEngine.playEggSfx();
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
      drawing = false;
    });

    document.querySelectorAll(".pen-swatch").forEach((sw) => {
      sw.addEventListener("click", () => {
        document.querySelectorAll(".pen-swatch").forEach((s) => s.classList.remove("is-active"));
        sw.classList.add("is-active");
        activeColor = sw.dataset.color || "#c77dff";
        mode = "draw";
        $("pen-mode-star").classList.remove("is-active");
        $("pen-mode-paw").classList.remove("is-active");
      });
    });

    $("pen-mode-star").addEventListener("click", () => {
      mode = mode === "star" ? "draw" : "star";
      $("pen-mode-star").classList.toggle("is-active", mode === "star");
      $("pen-mode-paw").classList.remove("is-active");
    });

    $("pen-mode-paw").addEventListener("click", () => {
      mode = mode === "paw" ? "draw" : "paw";
      $("pen-mode-paw").classList.toggle("is-active", mode === "paw");
      $("pen-mode-star").classList.remove("is-active");
    });

    $("coaster-clear-btn").addEventListener("click", () => {
      drawCoasterBase();
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
  });
})();
