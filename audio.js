/**
 * ============================================================================
 *  AUDIO ENGINE: 2-Track Website Playlist + Battle Theme Shuffle Bag + SFX
 * ============================================================================
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.bgmGain = null;
    this.previewGain = null;
    this.sfxGain = null;

    this.isPlaying = false;
    this.userPaused = false;
    this.bgmPausedForPreview = false;
    this.bgmPausedForBattle = false;
    this.volume = window.SITE_CONTENT?.audio?.volume ?? 0.45;

    // Website 2-song playlist state
    this.websitePlaylistIdx = 0;
    this.customAudioEl = null;
    this.pendingResumeEl = null;
    this.loopTimer = null;
    this.stepIndex = 0;
    this.noiseNode = null;
    this._lastSaveMs = 0;
    this.isEmbeddedChild = (() => {
      try {
        return Boolean(window.parent && window.parent !== window);
      } catch (_) {
        return false;
      }
    })();

    // RPG Battle music state (Shuffle-Bag without back-to-back repeats)
    this.battleAudioEl = null;
    this.isBattlePlaying = false;
    this.battleQueue = [];
    this.lastGeneralBattleUrl = null;
    this.currentTrackLabel = window.SITE_CONTENT?.audio?.trackTitle || "Velvet Rain Track 1";
    this.onTrackChange = null;
    this.onStateChange = null;

    if (!this.isEmbeddedChild) {
      window.addEventListener("pagehide", () => this.saveBgmState(true));
      window.addEventListener("beforeunload", () => this.saveBgmState(true));
    }

    // Brief Photo Song Preview state
    this.previewAudioEl = null;
    this.previewTimers = [];
    this.previewSessionId = 0;
    this.isPreviewPlaying = false;
    this.onPreviewEndCallback = null;
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1;
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0.001;
      this.bgmGain.connect(this.masterGain);

      this.previewGain = this.ctx.createGain();
      this.previewGain.gain.value = 0.55;
      this.previewGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.36;
      this.sfxGain.connect(this.masterGain);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  notifyTrack(title) {
    this.currentTrackLabel = title;
    if (typeof this.onTrackChange === "function") {
      this.onTrackChange(title);
    }
    this.emitStateChange();
  }

  emitStateChange() {
    if (typeof this.onStateChange === "function") {
      this.onStateChange({
        isPlaying: this.isPlaying || this.isBattlePlaying,
        userPaused: this.userPaused,
        trackTitle: this.currentTrackLabel,
        volume: this.volume,
        isBattlePlaying: this.isBattlePlaying
      });
    }
  }

  saveBgmState(force = false) {
    if (this.isEmbeddedChild) return;
    const now = Date.now();
    if (!force && now - this._lastSaveMs < 750) return;
    this._lastSaveMs = now;
    const payload = {
      isPlaying: Boolean(this.isPlaying || this.bgmPausedForBattle || this.bgmPausedForPreview),
      userPaused: Boolean(this.userPaused),
      trackIdx: this.websitePlaylistIdx,
      currentTime: this.customAudioEl ? Number(this.customAudioEl.currentTime) || 0 : 0,
      volume: this.volume,
      updatedAt: now
    };
    const raw = JSON.stringify(payload);
    try {
      sessionStorage.setItem("kirana_bgm_state_v1", raw);
    } catch (_) {}
    try {
      localStorage.setItem("kirana_bgm_state_v1", raw);
    } catch (_) {}
  }

  loadBgmState() {
    let raw = null;
    try {
      raw = sessionStorage.getItem("kirana_bgm_state_v1");
    } catch (_) {}
    if (!raw) {
      try {
        raw = localStorage.getItem("kirana_bgm_state_v1");
      } catch (_) {}
    }
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.updatedAt === "number" && Date.now() - parsed.updatedAt > 6 * 3600 * 1000) {
        return null;
      }
      return parsed;
    } catch (_) {
      return null;
    }
  }

  resumePersistedBGM() {
    if (this.isEmbeddedChild || this.isBattlePlaying || this.isPlaying) return false;
    const saved = this.loadBgmState();
    if (!saved) return false;
    if (typeof saved.volume === "number" && !Number.isNaN(saved.volume)) {
      this.volume = Math.max(0, Math.min(1, saved.volume));
    }
    this.userPaused = Boolean(saved.userPaused);
    if (this.userPaused || !saved.isPlaying) return false;

    const list = this.getWebsitePlaylist();
    if (list.length === 0) return false;

    this.websitePlaylistIdx = (Number(saved.trackIdx) || 0) % list.length;
    const track = list[this.websitePlaylistIdx];
    const startSec = Math.max(0, Number(saved.currentTime) || 0);
    this.loadWebsiteTrackElement(track, 0, true, startSec);
    return true;
  }

  attachUnlockResume(el, track) {
    if (this.pendingResumeEl === el) return;
    this.pendingResumeEl = el;
    const unlock = () => {
      if (this.pendingResumeEl !== el || this.userPaused || this.isBattlePlaying) return;
      el.play()
        .then(() => {
          this.pendingResumeEl = null;
          this.isPlaying = true;
          this.notifyTrack(track.title);
          this.fadeCustomVolume(el, this.volume, 600);
          this.saveBgmState(true);
        })
        .catch(() => {});
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
  }

  getWebsitePlaylist() {
    const audioCfg = window.SITE_CONTENT?.audio;
    if (Array.isArray(audioCfg?.websitePlaylist) && audioCfg.websitePlaylist.length > 0) {
      return audioCfg.websitePlaylist;
    }
    if (audioCfg?.customTrackUrl?.trim()) {
      return [{ url: audioCfg.customTrackUrl.trim(), title: audioCfg.trackTitle || "Background Music" }];
    }
    return [];
  }

  // ==================== WEBSITE 2-SONG PLAYLIST ====================

  prepareBGMOnGesture() {
    this.initContext();
    this.userPaused = false;
    const list = this.getWebsitePlaylist();
    if (list.length === 0) return;

    const track = list[this.websitePlaylistIdx % list.length];
    this.loadWebsiteTrackElement(track, 0, true);
  }

  revealPreparedBGM() {
    if (this.customAudioEl && this.isPlaying) {
      this.fadeCustomVolume(this.customAudioEl, this.volume, 1500);
      return;
    }
    this.startMellowBGM();
  }

  loadWebsiteTrackElement(track, initialVol = 0, playNow = true, startTime = 0) {
    if (this.customAudioEl) {
      if (this.customAudioEl._fadeTimer) clearInterval(this.customAudioEl._fadeTimer);
      try {
        this.customAudioEl.pause();
      } catch (_) {}
    }

    const el = new Audio(encodeURI(track.url));
    el.preload = "auto";
    el.loop = false;
    el.volume = initialVol;
    this.customAudioEl = el;

    const applyStartTime = () => {
      if (startTime > 0 && (!el.duration || startTime < el.duration - 0.5)) {
        try {
          el.currentTime = startTime;
        } catch (_) {}
      }
    };
    if (startTime > 0) {
      if (el.readyState >= 1) applyStartTime();
      else el.addEventListener("loadedmetadata", applyStartTime, { once: true });
    }

    el.addEventListener("timeupdate", () => this.saveBgmState(false));

    el.addEventListener("error", () => {
      if (this.customAudioEl !== el) return;
      this.customAudioEl = null;
      this.startBuiltInFallback();
    });

    el.addEventListener("ended", () => {
      const list = this.getWebsitePlaylist();
      if (list.length === 0) return;
      this.websitePlaylistIdx = (this.websitePlaylistIdx + 1) % list.length;
      const nextTrack = list[this.websitePlaylistIdx];
      this.loadWebsiteTrackElement(nextTrack, 0, true, 0);
    });

    if (playNow) {
      el.play()
        .then(() => {
          this.pendingResumeEl = null;
          this.isPlaying = true;
          this.notifyTrack(track.title);
          if (initialVol === 0) {
            this.fadeCustomVolume(el, this.volume, 850);
          }
          this.saveBgmState(true);
        })
        .catch((err) => {
          if (err && err.name === "NotAllowedError") {
            this.isPlaying = false;
            this.notifyTrack(track.title);
            this.attachUnlockResume(el, track);
          } else {
            this.customAudioEl = null;
            this.startBuiltInFallback();
          }
        });
    }
  }

  startMellowBGM() {
    this.initContext();
    if (this.isBattlePlaying) return;

    const list = this.getWebsitePlaylist();
    if (list.length > 0) {
      if (this.customAudioEl) {
        this.customAudioEl.volume = 0;
        this.customAudioEl
          .play()
          .then(() => {
            this.isPlaying = true;
            const cur = list[this.websitePlaylistIdx % list.length];
            this.notifyTrack(cur.title);
            this.fadeCustomVolume(this.customAudioEl, this.volume, 1100);
          })
          .catch(() => {
            this.customAudioEl = null;
            this.startBuiltInFallback();
          });
      } else {
        const track = list[this.websitePlaylistIdx % list.length];
        this.loadWebsiteTrackElement(track, 0, true);
      }
      return;
    }

    this.startBuiltInFallback();
  }

  startBuiltInFallback() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    const now = this.ctx.currentTime;
    this.bgmGain.gain.setValueAtTime(0.001, now);
    this.bgmGain.gain.exponentialRampToValueAtTime(Math.max(0.05, this.volume * 0.65), now + 2.0);
    this.startVinylCrackle();
    this.scheduleLoop();
  }

  fadeCustomVolume(el, target, durationMs) {
    if (!el) return;
    if (el._fadeTimer) {
      clearInterval(el._fadeTimer);
      el._fadeTimer = null;
    }
    const steps = 20;
    const stepTime = Math.max(15, durationMs / steps);
    const startVol = el.volume;
    const delta = (target - startVol) / steps;
    let count = 0;
    const iv = setInterval(() => {
      count++;
      if (!el) {
        clearInterval(iv);
        return;
      }
      el.volume = Math.max(0, Math.min(1, startVol + delta * count));
      if (count >= steps) {
        clearInterval(iv);
        el._fadeTimer = null;
      }
    }, stepTime);
    el._fadeTimer = iv;
  }

  togglePlay() {
    this.initContext();

    if (this.isBattlePlaying && this.battleAudioEl) {
      if (!this.battleAudioEl.paused) {
        this.battleAudioEl.pause();
        this.userPaused = true;
        return false;
      } else {
        this.battleAudioEl.play();
        this.userPaused = false;
        return true;
      }
    }

    if (this.customAudioEl) {
      if (this.isPlaying) {
        this.customAudioEl.pause();
        this.isPlaying = false;
        this.userPaused = true;
      } else {
        this.customAudioEl.play();
        this.isPlaying = true;
        this.userPaused = false;
      }
      this.saveBgmState(true);
      this.emitStateChange();
      return this.isPlaying;
    }

    if (this.isPlaying) {
      this.pauseBuiltInBGM();
      this.userPaused = true;
    } else {
      this.userPaused = false;
      this.startMellowBGM();
    }
    this.saveBgmState(true);
    this.emitStateChange();
    return this.isPlaying;
  }

  pauseForBattleExternal() {
    if (this.isPlaying) {
      this.bgmPausedForBattle = true;
      this.pauseWebsiteBGM();
      this.emitStateChange();
    }
  }

  resumeAfterBattleExternal() {
    if (this.bgmPausedForBattle && !this.userPaused) {
      this.bgmPausedForBattle = false;
      this.startMellowBGM();
    }
  }

  clearBattleFlagExternal() {
    this.bgmPausedForBattle = false;
  }

  pauseWebsiteBGM() {
    if (this.customAudioEl) {
      if (this.customAudioEl._fadeTimer) clearInterval(this.customAudioEl._fadeTimer);
      this.customAudioEl.pause();
      this.isPlaying = false;
    } else {
      this.pauseBuiltInBGM();
    }
  }

  pauseBuiltInBGM() {
    this.isPlaying = false;
    clearTimeout(this.loopTimer);
    if (this.noiseNode) {
      try {
        this.noiseNode.stop();
      } catch (_) {}
      this.noiseNode = null;
    }
    if (this.ctx && this.bgmGain) {
      this.bgmGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.12);
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, parseFloat(val)));
    if (this.customAudioEl && this.isPlaying) {
      this.customAudioEl.volume = this.volume;
    }
    if (this.battleAudioEl && this.isBattlePlaying) {
      this.battleAudioEl.volume = this.volume;
    }
    if (this.previewAudioEl && this.isPreviewPlaying) {
      this.previewAudioEl.volume = Math.min(1, Math.max(0.08, this.volume));
    }
    if (this.ctx && this.bgmGain && this.isPlaying) {
      this.bgmGain.gain.setTargetAtTime(Math.max(0.001, this.volume * 0.65), this.ctx.currentTime, 0.08);
    }
    if (this.ctx && this.previewGain) {
      this.previewGain.gain.setTargetAtTime(Math.max(0.1, this.volume * 0.9), this.ctx.currentTime, 0.08);
    }
    this.saveBgmState(true);
    this.emitStateChange();
  }

  // ==================== RPG BATTLE MUSIC (SHUFFLE BAG + BOSS) ====================

  pickNextGeneralBattleTrack() {
    const pool = window.SITE_CONTENT?.audio?.generalBattleThemes || [];
    if (pool.length === 0) return null;

    if (this.battleQueue.length === 0) {
      const shuffled = [...pool];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      // Guarantee first track of new cycle != last played track
      if (shuffled.length > 1 && shuffled[0].url === this.lastGeneralBattleUrl) {
        const swapIdx = 1 + Math.floor(Math.random() * (shuffled.length - 1));
        [shuffled[0], shuffled[swapIdx]] = [shuffled[swapIdx], shuffled[0]];
      }
      this.battleQueue = shuffled;
    }

    const next = this.battleQueue.shift();
    this.lastGeneralBattleUrl = next.url;
    return next;
  }

  startBattleMusic(isBoss = false) {
    this.initContext();
    this.stopBattleMusic(false);

    if (this.isEmbeddedChild) {
      try {
        window.parent.postMessage({ type: "kirana-bgm-control", action: "pauseForBattle", isBoss }, "*");
      } catch (_) {}
    } else if (this.isPlaying) {
      this.bgmPausedForBattle = true;
      this.pauseWebsiteBGM();
      this.saveBgmState(true);
    }

    if (this.userPaused) return;

    const track = isBoss
      ? window.SITE_CONTENT?.audio?.bossBattleTheme
      : this.pickNextGeneralBattleTrack();
    if (!track || !track.url) return;

    const audio = new Audio(encodeURI(track.url));
    audio.preload = "metadata";
    audio.loop = true;
    audio.volume = 0;
    this.battleAudioEl = audio;
    this.isBattlePlaying = true;

    audio
      .play()
      .then(() => {
        if (this.battleAudioEl !== audio) return;
        this.notifyTrack(`⚔ ${track.title}`);
        this.fadeCustomVolume(audio, this.volume, 600);
      })
      .catch(() => {
        this.isBattlePlaying = false;
        this.battleAudioEl = null;
      });
  }

  stopBattleMusic(resumeWebsite = true) {
    if (this.battleAudioEl) {
      if (this.battleAudioEl._fadeTimer) clearInterval(this.battleAudioEl._fadeTimer);
      try {
        this.battleAudioEl.pause();
        this.battleAudioEl.currentTime = 0;
      } catch (_) {}
      this.battleAudioEl = null;
    }
    this.isBattlePlaying = false;

    if (this.isEmbeddedChild) {
      try {
        window.parent.postMessage(
          { type: "kirana-bgm-control", action: resumeWebsite ? "resumeAfterBattle" : "clearBattleFlag" },
          "*"
        );
      } catch (_) {}
      return;
    }

    if (resumeWebsite && this.bgmPausedForBattle && !this.userPaused) {
      this.bgmPausedForBattle = false;
      this.startMellowBGM();
    }
  }

  // ==================== PHOTO BRIEF SONG PREVIEW ENGINE ====================

  playSongPreview(songId, previewUrl, onDone, options = {}) {
    this.initContext();
    this.stopSongPreview(false);

    const sessionId = ++this.previewSessionId;
    const chorusStart = Number(options.chorusStart) || 0;
    const durationMs = Math.max(5000, (Number(options.previewDurationSec) || 15) * 1000);

    this.onPreviewEndCallback = onDone || null;
    this.isPreviewPlaying = true;

    if (this.isPlaying) {
      this.bgmPausedForPreview = true;
      this.pauseWebsiteBGM();
    }

    if (previewUrl && previewUrl.trim()) {
      const audio = new Audio(encodeURI(previewUrl.trim()));
      audio.preload = "metadata";
      audio.volume = 0;
      this.previewAudioEl = audio;

      let started = false;
      const beginFromChorus = () => {
        if (started || sessionId !== this.previewSessionId) return;
        started = true;

        if (chorusStart > 0 && (!audio.duration || chorusStart < audio.duration - 2)) {
          try {
            audio.currentTime = chorusStart;
          } catch (_) {}
        }

        audio
          .play()
          .then(() => {
            if (sessionId !== this.previewSessionId) {
              audio.pause();
              return;
            }
            const targetVol = Math.min(1, Math.max(0.15, this.volume));
            this.fadeCustomVolume(audio, targetVol, 550);

            const fadeOutAt = Math.max(1200, durationMs - 950);
            const tFadeOut = setTimeout(() => {
              if (sessionId === this.previewSessionId && this.previewAudioEl === audio) {
                this.fadeCustomVolume(audio, 0, 900);
              }
            }, fadeOutAt);

            const tStop = setTimeout(() => {
              if (sessionId === this.previewSessionId) {
                this.stopSongPreview(true);
              }
            }, durationMs);

            this.previewTimers.push(tFadeOut, tStop);
          })
          .catch(() => {
            if (sessionId !== this.previewSessionId) return;
            this.previewAudioEl = null;
          });
      };

      audio.addEventListener("error", () => {
        if (sessionId !== this.previewSessionId) return;
        this.previewAudioEl = null;
      });

      if (audio.readyState >= 1) {
        beginFromChorus();
      } else {
        audio.addEventListener("loadedmetadata", beginFromChorus, { once: true });
      }
      return;
    }
  }

  stopSongPreview(resumeBgm = true) {
    this.previewSessionId++;
    this.previewTimers.forEach((t) => clearTimeout(t));
    this.previewTimers = [];

    if (this.previewAudioEl) {
      if (this.previewAudioEl._fadeTimer) {
        clearInterval(this.previewAudioEl._fadeTimer);
        this.previewAudioEl._fadeTimer = null;
      }
      try {
        this.previewAudioEl.pause();
        this.previewAudioEl.currentTime = 0;
      } catch (_) {}
      this.previewAudioEl = null;
    }

    const wasPreviewing = this.isPreviewPlaying;
    this.isPreviewPlaying = false;

    if (wasPreviewing && this.onPreviewEndCallback) {
      const cb = this.onPreviewEndCallback;
      this.onPreviewEndCallback = null;
      cb();
    }

    if (resumeBgm && this.bgmPausedForPreview && !this.userPaused) {
      this.bgmPausedForPreview = false;
      this.startMellowBGM();
    }
  }

  // ==================== FALLBACK SYNTH BGM ====================

  startVinylCrackle() {
    if (!this.ctx || this.noiseNode) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (Math.random() > 0.992 ? 0.18 : 0.018);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1400;
    filter.Q.value = 0.7;

    const crackleGain = this.ctx.createGain();
    crackleGain.gain.value = 0.16;

    noise.connect(filter);
    filter.connect(crackleGain);
    crackleGain.connect(this.bgmGain);
    noise.start();
    this.noiseNode = noise;
  }

  scheduleLoop() {
    if (!this.isPlaying || !this.ctx) return;

    const progression = [
      { bass: 174.61, chord: [261.63, 329.63, 392.0, 440.0], melody: [523.25, 659.25] },
      { bass: 164.81, chord: [246.94, 293.66, 392.0, 493.88], melody: [587.33, 493.88] },
      { bass: 146.83, chord: [261.63, 329.63, 349.23, 440.0], melody: [523.25, 440.0] },
      { bass: 130.81, chord: [246.94, 293.66, 329.63, 392.0], melody: [493.88, 392.0] }
    ];

    const bar = Math.floor(this.stepIndex / 4) % progression.length;
    const beat = this.stepIndex % 4;
    const chordData = progression[bar];
    const now = this.ctx.currentTime;

    if (beat === 0) {
      this.playRhodesChord(chordData.chord, now, 2.9);
      this.playSoftBass(chordData.bass / 2, now, 2.7);
    }
    if (beat === 1 || beat === 3) {
      this.playBrushTick(now, beat === 3 ? 0.045 : 0.03);
    }
    if (beat === 1) {
      this.playBellNote(chordData.melody[0], now + 0.05, 1.3, 0.055);
    } else if (beat === 2 && bar % 2 === 1) {
      this.playBellNote(chordData.melody[1], now + 0.12, 1.5, 0.048);
    }

    this.stepIndex++;
    this.loopTimer = setTimeout(() => this.scheduleLoop(), 760);
  }

  playRhodesChord(freqs, startTime, duration) {
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const oscHarm = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      osc.type = "sine";
      osc.frequency.value = freq;
      oscHarm.type = "triangle";
      oscHarm.frequency.value = freq * 2;
      filter.type = "lowpass";
      filter.frequency.value = 1100;
      const t = startTime + idx * 0.035;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.068, t + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0008, t + duration);
      const harmGain = this.ctx.createGain();
      harmGain.gain.value = 0.12;
      osc.connect(filter);
      oscHarm.connect(harmGain);
      harmGain.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGain);
      osc.start(t);
      oscHarm.start(t);
      osc.stop(t + duration + 0.05);
      oscHarm.stop(t + duration + 0.05);
    });
  }

  playSoftBass(freq, startTime, duration) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(0.14, startTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  playBellNote(freq, startTime, duration, peak) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(peak, startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration);
    osc.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  playBrushTick(startTime, level) {
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.06);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 2600;
    const gain = this.ctx.createGain();
    gain.gain.value = level;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);
    src.start(startTime);
  }

  // ==================== UI & FULL RPG SOUND EFFECTS ====================

  playSlashSfx() {
    this.initContext();
    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.3);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(420, now);
    filter.frequency.exponentialRampToValueAtTime(3400, now + 0.14);
    filter.frequency.exponentialRampToValueAtTime(600, now + 0.3);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.45, now);
    g.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    noise.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);
    noise.start(now);

    [523.25, 659.25, 783.99, 987.77].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const og = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      og.gain.setValueAtTime(0.001, now + 0.05 + i * 0.03);
      og.gain.linearRampToValueAtTime(0.11, now + 0.08 + i * 0.03);
      og.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(og);
      og.connect(this.sfxGain);
      osc.start(now + 0.05 + i * 0.03);
      osc.stop(now + 0.65);
    });
  }

  playStepSfx() {
    this.initContext();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.045);
    g.gain.setValueAtTime(0.06, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  playTypeBlipSfx() {
    this.initContext();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = 540 + Math.random() * 140;
    g.gain.setValueAtTime(0.035, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  playEncounterSfx() {
    this.initContext();
    const now = this.ctx.currentTime;
    [329.63, 440, 659.25, 880].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(f, now + i * 0.045);
      osc.frequency.exponentialRampToValueAtTime(f * 1.15, now + i * 0.045 + 0.16);
      const filt = this.ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.value = 1800;
      g.gain.setValueAtTime(0.11, now + i * 0.045);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.045 + 0.25);
      osc.connect(filt);
      filt.connect(g);
      g.connect(this.sfxGain);
      osc.start(now + i * 0.045);
      osc.stop(now + i * 0.045 + 0.28);
    });
  }

  playEnemyHitSfx() {
    this.initContext();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(165, now);
    osc.frequency.exponentialRampToValueAtTime(52, now + 0.18);
    g.gain.setValueAtTime(0.16, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  playGuardSfx() {
    this.initContext();
    const now = this.ctx.currentTime;
    [440, 660].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.12, now + i * 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now + i * 0.04);
      osc.stop(now + 0.26);
    });
  }

  playChestSfx() {
    this.initContext();
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = f;
      const t = now + i * 0.07;
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.38);
    });
  }

  playVictoryFanfareSfx() {
    this.initContext();
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 987.77, 1046.5];
    notes.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = f;
      const t = now + i * 0.1;
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.48);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  }

  playBadEndSfx() {
    this.initContext();
    const now = this.ctx.currentTime;
    [392.0, 349.23, 311.13, 261.63].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      const t = now + i * 0.18;
      g.gain.setValueAtTime(0.16, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  }

  playFlipSfx() {
    this.initContext();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.08);
    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  playChimeSfx(isRankUp = false) {
    this.initContext();
    const now = this.ctx.currentTime;
    const notes = isRankUp ? [523.25, 659.25, 783.99, 1046.5, 1318.51] : [587.33, 783.99, 987.77];
    notes.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      const t = now + idx * 0.085;
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.16, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + (isRankUp ? 0.85 : 0.45));
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.9);
    });
  }

  playPourSfx() {
    this.initContext();
    const now = this.ctx.currentTime;
    [440, 554.37, 659.25, 880].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f * 0.92, now + i * 0.055);
      osc.frequency.exponentialRampToValueAtTime(f, now + i * 0.055 + 0.08);
      g.gain.setValueAtTime(0.12, now + i * 0.055);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.25);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now + i * 0.055);
      osc.stop(now + i * 0.055 + 0.28);
    });
  }

  playTarotRevealSfx() {
    this.initContext();
    const now = this.ctx.currentTime;
    const freqs = [293.66, 440.0, 554.37, 659.25, 880.0, 1108.73];
    freqs.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = i % 2 === 0 ? "sine" : "triangle";
      osc.frequency.value = f;
      const t = now + i * 0.09;
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.11, t + 0.18);
      g.gain.exponentialRampToValueAtTime(0.0008, t + 2.1);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 2.2);
    });
  }

  playEggSfx() {
    this.initContext();
    const now = this.ctx.currentTime;
    [783.99, 1046.5].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = f;
      const t = now + i * 0.07;
      g.gain.setValueAtTime(0.14, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  playOneMoreSfx() {
    this.initContext();
    const now = this.ctx.currentTime;
    [659.25, 880, 1174.66].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = f;
      const t = now + i * 0.055;
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  playScanSfx() {
    this.initContext();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1480, now + 0.14);
    g.gain.setValueAtTime(0.14, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  playLetterOpenSfx() {
    this.initContext();
    const now = this.ctx.currentTime;

    // Warm, sentimental music-box & velvet harp bloom (Fmaj9 -> Cmaj9 feel)
    const padFreqs = [174.61, 261.63, 329.63, 392.0];
    padFreqs.forEach((f) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.065, now + 0.35);
      g.gain.exponentialRampToValueAtTime(0.0008, now + 3.2);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 3.3);
    });

    const musicBoxNotes = [523.25, 659.25, 783.99, 987.77, 1174.66, 1318.51, 1567.98];
    musicBoxNotes.forEach((f, idx) => {
      const t = now + 0.08 + idx * 0.13;
      const osc = this.ctx.createOscillator();
      const harmonic = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      harmonic.type = "triangle";
      harmonic.frequency.value = f * 2;
      const hg = this.ctx.createGain();
      hg.gain.value = 0.22;

      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.14, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0008, t + 1.65);

      osc.connect(g);
      harmonic.connect(hg);
      hg.connect(g);
      g.connect(this.sfxGain);

      osc.start(t);
      harmonic.start(t);
      osc.stop(t + 1.75);
      harmonic.stop(t + 1.75);
    });
  }
}

window.soundEngine = new SoundEngine();
