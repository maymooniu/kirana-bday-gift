/**
 * ============================================================================
 *  CHRONICLES OF THE PURPLE CAFE: REFINED 2D JRPG ENGINE
 *  - Smooth 2D exploration, floating [E] prompts, live quest tracker
 *  - Custom SVG/Canvas portraits (Shiba only appears when Chris speaks!)
 *  - General battle theme shuffle-bag + Boss battle theme + full SFX suite
 *  - Animated 60fps battle canvas with slash arcs, particles & floating numbers
 * ============================================================================
 */

(function () {
  const $ = (id) => document.getElementById(id);
  const SAVE_KEY = "kirana_purple_cafe_rpg_v1";
  const TILE_SIZE = 40;
  const MAP_COLS = 16;
  const MAP_ROWS = 10;

  window.initKiranaRpg = function () {
    const D = window.RPG_DATA;
    const C = window.SITE_CONTENT;
    if (!D || !C) return;

    // ========================================================================
    // STATE MANAGEMENT
    // ========================================================================
    function createFreshState() {
      return {
        zoneId: "cafe",
        px: 3,
        py: 4,
        facing: "right",
        trail: [
          { x: 2, y: 4 },
          { x: 2, y: 4 }
        ],

        level: 1,
        exp: 0,
        nextExp: 55,
        coins: 35,
        bonusAtk: 0,
        bonusMag: 0,
        bonusHp: 0,
        bonusSp: 0,
        bonusDef: 0,
        bonusCrit: 0,
        pendingLevelUps: 0,

        weaponId: "pencil",
        outfitId: "cardigan",
        accessoryId: "glasses",
        ownedWeapons: ["pencil"],
        ownedOutfits: ["cardigan"],
        ownedAccessories: ["glasses"],

        unlockedSkills: ["pantoneSlash", "soulPurify"],
        inventory: {
          chocoMilk: 2,
          truffle: 1,
          shortcake: 0,
          coffee: 1
        },

        openedChests: [],
        defeatedBosses: [],
        clearedMobsInVisit: [],
        mobsDefeatedTotal: 0,
        morganaQuestDone: false,
        rumorQuestDone: false,
        royalQuestDone: false,
        turnsTotal: 0,

        hp: 145,
        sp: 65,
        xDrive: 25
      };
    }

    let state = createFreshState();
    let activeMobs = [];
    let mobMoveTimer = 0;
    let animFrameId = null;

    // Smooth visual interpolation coordinates on 2D map
    let visualX = state.px;
    let visualY = state.py;
    let followVisualX = state.px - 1;
    let followVisualY = state.py;

    // Mode: 'explore' | 'battle' | 'goodEnding' | 'badEnding'
    let gameMode = "explore";
    let isDialogueOpen = false;
    let isMenuOpen = false;
    let isLevelUpOpen = false;

    function getMaxHp() {
      return (
        120 +
        (state.level - 1) * 24 +
        state.bonusHp +
        (D.OUTFITS[state.outfitId]?.hp || 0) +
        (D.ACCESSORIES[state.accessoryId]?.hp || 0)
      );
    }
    function getMaxSp() {
      return 65 + (state.level - 1) * 12 + state.bonusSp + (D.OUTFITS[state.outfitId]?.sp || 0);
    }
    function getAtk() {
      return (
        18 +
        (state.level - 1) * 5 +
        state.bonusAtk +
        (D.WEAPONS[state.weaponId]?.atk || 0) +
        (D.ACCESSORIES[state.accessoryId]?.atk || 0)
      );
    }
    function getMag() {
      return (
        18 +
        (state.level - 1) * 5 +
        state.bonusMag +
        (D.WEAPONS[state.weaponId]?.mag || 0) +
        (D.ACCESSORIES[state.accessoryId]?.mag || 0)
      );
    }
    function getDef() {
      return 3 + (state.level - 1) * 2 + state.bonusDef + (D.OUTFITS[state.outfitId]?.def || 0);
    }
    function getCrit() {
      return (
        0.06 +
        state.bonusCrit +
        (D.WEAPONS[state.weaponId]?.crit || 0) +
        (D.ACCESSORIES[state.accessoryId]?.crit || 0)
      );
    }

    function clampStats() {
      state.hp = Math.min(state.hp, getMaxHp());
      state.sp = Math.min(state.sp, getMaxSp());
    }

    // ========================================================================
    // SAVE & LOAD SYSTEM (localStorage)
    // ========================================================================
    function saveGame(silent = false) {
      try {
        const payload = {
          savedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          state
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
        if (!silent) {
          window.soundEngine.playChimeSfx(false);
          setExploreNotice("Progress saved to the Velvet Save Crystal!");
        }
        return true;
      } catch (_) {
        return false;
      }
    }

    function loadGame() {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.state) return false;
        state = Object.assign(createFreshState(), parsed.state);
        window.soundEngine.stopBattleMusic(true);
        enterZone(state.zoneId, state.px, state.py, true);
        gameMode = "explore";
        isMenuOpen = false;
        $("rpg-menu-overlay").hidden = true;
        renderHudAndViews();
        setExploreNotice(`Loaded saved game from ${parsed.savedAt || "earlier"}!`);
        return true;
      } catch (_) {
        return false;
      }
    }

    function hasSavedGame() {
      try {
        return Boolean(localStorage.getItem(SAVE_KEY));
      } catch (_) {
        return false;
      }
    }

    // ========================================================================
    // THOUGHT CLOUD (13 SENTINELS)
    // ========================================================================
    const tcChips = $("thought-cloud-chips");
    const tcOut = $("thought-cloud-output");
    if (tcChips && tcOut) {
      tcChips.innerHTML = "";
      C.rpg.thoughtCloud.forEach((item) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "tc-chip";
        btn.textContent = item.keyword;
        btn.addEventListener("click", () => {
          tcChips.querySelectorAll(".tc-chip").forEach((c) => c.classList.remove("is-active"));
          btn.classList.add("is-active");
          window.soundEngine.playScanSfx();
          tcOut.textContent = item.note;
        });
        tcChips.appendChild(btn);
      });
    }

    // ========================================================================
    // CUSTOM SPRITE DIALOGUE PORTRAITS + TYPEWRITER SYSTEM
    // ========================================================================
    function drawDialogueSpritePortrait(kind) {
      const canvas = $("rpg-dlg-sprite-portrait");
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Soft dark purple portrait backdrop
      const grad = ctx.createLinearGradient(0, 0, 0, 118);
      grad.addColorStop(0, "#24183b");
      grad.addColorStop(1, "#120c1d");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 108, 118);

      ctx.save();
      ctx.translate(54, 62);

      if (kind === "morgana") {
        // Morgana portrait
        ctx.fillStyle = "#111018";
        ctx.beginPath();
        ctx.moveTo(-28, -14);
        ctx.lineTo(-32, -44);
        ctx.lineTo(-8, -26);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(28, -14);
        ctx.lineTo(32, -44);
        ctx.lineTo(8, -26);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.fill();
        // Blue eyes + yellow scarf
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.ellipse(-12, -2, 8, 9, 0, 0, Math.PI * 2);
        ctx.ellipse(12, -2, 8, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#4ea8de";
        ctx.beginPath();
        ctx.arc(-11, -2, 5, 0, Math.PI * 2);
        ctx.arc(11, -2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#e9c46a";
        ctx.fillRect(-24, 24, 48, 14);
      } else if (kind === "fairy") {
        // Seeker Fairy (Gallica-inspired)
        ctx.fillStyle = "rgba(112, 214, 255, 0.72)";
        ctx.beginPath();
        ctx.ellipse(-26, -6, 20, 10, -0.45, 0, Math.PI * 2);
        ctx.ellipse(26, -6, 20, 10, 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f4a261";
        ctx.beginPath();
        ctx.arc(0, -10, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fde4cf";
        ctx.beginPath();
        ctx.arc(0, -6, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#4ea8de";
        ctx.fillRect(-6, -8, 4, 4);
        ctx.fillRect(2, -8, 4, 4);
      } else if (kind === "npcViolet") {
        // Kuzunoha Rumor Girl
        ctx.fillStyle = "#9d4edd";
        ctx.beginPath();
        ctx.arc(0, -8, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fde4cf";
        ctx.beginPath();
        ctx.arc(0, -4, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2b1c40";
        ctx.fillRect(-7, -6, 4, 4);
        ctx.fillRect(3, -6, 4, 4);
        ctx.fillStyle = "#e9c46a";
        ctx.fillRect(-16, 18, 32, 16);
      } else if (kind === "crystal") {
        // Velvet Save Crystal
        ctx.fillStyle = "#70d6ff";
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -36);
        ctx.lineTo(26, 0);
        ctx.lineTo(0, 36);
        ctx.lineTo(-26, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (kind === "chest") {
        // Treasure Chest
        ctx.fillStyle = "#e9c46a";
        ctx.strokeStyle = "#0b0812";
        ctx.lineWidth = 3;
        ctx.fillRect(-28, -20, 56, 40);
        ctx.strokeRect(-28, -20, 56, 40);
        ctx.fillStyle = "#e63946";
        ctx.fillRect(-6, -4, 12, 12);
      } else {
        // Starburst Trophy
        ctx.fillStyle = "#e9c46a";
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a1 = (i * 2 * Math.PI) / 5 - Math.PI / 2;
          const a2 = a1 + Math.PI / 5;
          ctx.lineTo(Math.cos(a1) * 32, Math.sin(a1) * 32);
          ctx.lineTo(Math.cos(a2) * 14, Math.sin(a2) * 14);
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    let dialogueQueue = [];
    let dialogueCallback = null;
    let typeTimer = null;
    let isTyping = false;
    let currentFullText = "";
    let currentHasChoices = false;

    function openDialogue(lines, onFinish) {
      dialogueQueue = [...lines];
      dialogueCallback = onFinish || null;
      isDialogueOpen = true;
      $("rpg-dialogue-overlay").hidden = false;
      showNextDialogueLine();
    }

    function showNextDialogueLine() {
      clearInterval(typeTimer);
      const choicesEl = $("rpg-dlg-choices");
      choicesEl.innerHTML = "";
      choicesEl.hidden = true;

      if (dialogueQueue.length === 0) {
        isDialogueOpen = false;
        $("rpg-dialogue-overlay").hidden = true;
        const cb = dialogueCallback;
        dialogueCallback = null;
        if (cb) cb();
        return;
      }

      const item = dialogueQueue.shift();
      $("rpg-dlg-speaker").textContent = item.speaker || "Narration";

      const wrapEl = $("rpg-dlg-portrait-wrap");
      const avatarEl = $("rpg-dlg-avatar");
      const spriteEl = $("rpg-dlg-sprite-portrait");

      if (item.avatar) {
        wrapEl.hidden = false;
        avatarEl.src = item.avatar;
        avatarEl.hidden = false;
        spriteEl.hidden = true;
      } else if (item.spritePortrait) {
        wrapEl.hidden = false;
        avatarEl.hidden = true;
        spriteEl.hidden = false;
        drawDialogueSpritePortrait(item.spritePortrait);
      } else {
        wrapEl.hidden = true;
        avatarEl.hidden = true;
        spriteEl.hidden = true;
      }

      currentFullText = item.text || "";
      currentHasChoices = Boolean(item.choices && item.choices.length > 0);
      const textEl = $("rpg-dlg-text");
      textEl.textContent = "";
      isTyping = true;
      let idx = 0;
      let blipTick = 0;

      const finishTyping = () => {
        clearInterval(typeTimer);
        isTyping = false;
        textEl.textContent = currentFullText;
        if (currentHasChoices) {
          choicesEl.hidden = false;
          item.choices.forEach((ch) => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "dlg-choice-btn";
            b.textContent = ch.label;
            b.addEventListener("click", (e) => {
              e.stopPropagation();
              window.soundEngine.playFlipSfx();
              if (ch.action) ch.action();
              if (ch.nextLines) {
                dialogueQueue = [...ch.nextLines, ...dialogueQueue];
              }
              showNextDialogueLine();
            });
            choicesEl.appendChild(b);
          });
        }
      };

      typeTimer = setInterval(() => {
        idx += 2;
        blipTick++;
        if (blipTick % 3 === 0) {
          window.soundEngine.playTypeBlipSfx();
        }
        if (idx >= currentFullText.length) {
          finishTyping();
        } else {
          textEl.textContent = currentFullText.slice(0, idx);
        }
      }, 22);

      const advance = (e) => {
        if (e) e.stopPropagation();
        if (isTyping) {
          finishTyping();
        } else if (!currentHasChoices) {
          window.soundEngine.playFlipSfx();
          showNextDialogueLine();
        }
      };

      $("rpg-dlg-next-btn").onclick = advance;
      $("rpg-dlg-box").onclick = advance;
    }

    // ========================================================================
    // ZONE LOADING & 2D EXPLORATION ENGINE
    // ========================================================================
    function setExploreNotice(msg) {
      const el = $("explore-notice-bar");
      if (el) el.textContent = msg;
    }

    function updateQuestBanner() {
      const el = $("explore-quest-pill");
      if (!el) return;
      if (!state.morganaQuestDone) {
        el.textContent = `Quest: Defeat 2 Alley Mobs for Morgana (${Math.min(2, state.mobsDefeatedTotal)}/2) & beat 6 AM Alarm Drone`;
      } else if (!state.defeatedBosses.includes("alarmBoss")) {
        el.textContent = "Quest: Defeat the 6 AM Alarm Drone in the Rainy Alley (Right)!";
      } else if (!state.defeatedBosses.includes("witchBoss")) {
        el.textContent = "Quest: Enter the Velvet Labyrinth & defeat the Artblock Witch!";
      } else if (!state.defeatedBosses.includes("finalBoss")) {
        el.textContent = "Final Quest: Challenge The Monochrome Gloom on the far right!";
      } else {
        el.textContent = "All Palace Bosses Cleared!";
      }
    }

    function enterZone(zoneId, spawnX, spawnY, keepClearedMobs = false) {
      state.zoneId = zoneId;
      state.px = spawnX;
      state.py = spawnY;
      visualX = spawnX;
      visualY = spawnY;
      followVisualX = spawnX;
      followVisualY = spawnY;
      state.trail = [
        { x: spawnX, y: spawnY },
        { x: spawnX, y: spawnY }
      ];
      if (!keepClearedMobs) {
        state.clearedMobsInVisit = [];
      }

      const z = D.ZONES[zoneId];
      activeMobs = z.mobs
        .filter((m) => {
          if (m.isBoss && state.defeatedBosses.includes(m.bossId)) return false;
          if (!m.isBoss && state.clearedMobsInVisit.includes(m.id)) return false;
          return true;
        })
        .map((m) => ({
          ...m,
          homeX: m.x,
          homeY: m.y,
          dir: 1
        }));

      $("rpg-zone-name").textContent = z.name;
      setExploreNotice(z.hint);
      renderHudAndViews();
    }

    function isTileWalkable(x, y) {
      if (x < 0 || x >= MAP_COLS || y < 0 || y >= MAP_ROWS) return false;
      const z = D.ZONES[state.zoneId];
      const ch = z.map[y][x];
      if (ch === "#" || ch === "T") return false;
      if (ch === "C" && !state.openedChests.includes(findChestAt(x, y)?.id)) return false;
      if (ch === "S") return false;
      if (z.npcs.some((n) => n.x === x && n.y === y)) return false;
      return true;
    }

    function findChestAt(x, y) {
      return D.ZONES[state.zoneId].chests.find((c) => c.x === x && c.y === y);
    }

    function tryMove(dx, dy) {
      if (gameMode !== "explore" || isDialogueOpen || isMenuOpen || isLevelUpOpen) return;

      if (dx > 0) state.facing = "right";
      if (dx < 0) state.facing = "left";
      if (dy > 0) state.facing = "down";
      if (dy < 0) state.facing = "up";

      const nx = state.px + dx;
      const ny = state.py + dy;

      const z = D.ZONES[state.zoneId];
      const portal = z.portals.find((p) => p.x === nx && p.y === ny);
      if (portal) {
        if (portal.requiresBoss && !state.defeatedBosses.includes(portal.requiresBoss)) {
          window.soundEngine.playScanSfx();
          openDialogue([
            {
              speaker: "Chris le Shiba",
              avatar: "./assets/art/art-shiba-boy.jpg",
              text: "The shadow barrier ahead is locked! We have to defeat the 6 AM Alarm Drone guarding the alley first."
            }
          ]);
          return;
        }
        window.soundEngine.playFlipSfx();
        enterZone(portal.targetZone, portal.targetX, portal.targetY, false);
        return;
      }

      const mobHit = activeMobs.find((m) => m.x === nx && m.y === ny);
      if (mobHit) {
        triggerEncounter(mobHit);
        return;
      }

      if (!isTileWalkable(nx, ny)) return;

      state.trail.unshift({ x: state.px, y: state.py });
      if (state.trail.length > 3) state.trail.pop();
      state.px = nx;
      state.py = ny;
      window.soundEngine.playStepSfx();

      const steppedMob = activeMobs.find((m) => m.x === state.px && m.y === state.py);
      if (steppedMob) {
        triggerEncounter(steppedMob);
      }
    }

    function getAdjacentInteractable() {
      const z = D.ZONES[state.zoneId];
      const offsets = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
      const [fx, fy] = offsets[state.facing] || [0, 1];
      const candidates = [
        { x: state.px + fx, y: state.py + fy },
        { x: state.px + 1, y: state.py },
        { x: state.px - 1, y: state.py },
        { x: state.px, y: state.py + 1 },
        { x: state.px, y: state.py - 1 }
      ];

      for (const pos of candidates) {
        if (pos.x < 0 || pos.x >= MAP_COLS || pos.y < 0 || pos.y >= MAP_ROWS) continue;
        if (z.map[pos.y][pos.x] === "S") return { kind: "save", x: pos.x, y: pos.y, label: "Save [E]" };
        const chest = findChestAt(pos.x, pos.y);
        if (chest && !state.openedChests.includes(chest.id)) {
          return { kind: "chest", x: pos.x, y: pos.y, chest, label: "Open [E]" };
        }
        const npc = z.npcs.find((n) => n.x === pos.x && n.y === pos.y);
        if (npc) return { kind: "npc", x: pos.x, y: pos.y, npc, label: "Talk [E]" };
        const mob = activeMobs.find((m) => m.x === pos.x && m.y === pos.y);
        if (mob) return { kind: "mob", x: pos.x, y: pos.y, mob, label: mob.isBoss ? "Boss [E]" : "Fight [E]" };
      }
      return null;
    }

    function interactFacingOrAdjacent() {
      if (gameMode !== "explore" || isDialogueOpen || isMenuOpen || isLevelUpOpen) return;
      const target = getAdjacentInteractable();
      if (!target) return;

      if (target.kind === "save") handleSaveCrystal();
      else if (target.kind === "chest") handleOpenChest(target.chest);
      else if (target.kind === "npc") handleNpcInteract(target.npc);
      else if (target.kind === "mob") triggerEncounter(target.mob);
    }

    function handleSaveCrystal() {
      state.hp = getMaxHp();
      state.sp = getMaxSp();
      saveGame(true);
      window.soundEngine.playTarotRevealSfx();
      openDialogue([
        {
          speaker: "Velvet Save Crystal",
          spritePortrait: "crystal",
          text: "Your HP and SP are fully restored, and your journey has been saved to the Velvet Crystal!"
        }
      ]);
      renderHudAndViews();
    }

    function handleOpenChest(chest) {
      state.openedChests.push(chest.id);
      if (chest.rewardType === "item") {
        state.inventory[chest.rewardId] = (state.inventory[chest.rewardId] || 0) + (chest.qty || 1);
      } else if (chest.rewardType === "weapon" && !state.ownedWeapons.includes(chest.rewardId)) {
        state.ownedWeapons.push(chest.rewardId);
      } else if (chest.rewardType === "outfit" && !state.ownedOutfits.includes(chest.rewardId)) {
        state.ownedOutfits.push(chest.rewardId);
      } else if (chest.rewardType === "accessory" && !state.ownedAccessories.includes(chest.rewardId)) {
        state.ownedAccessories.push(chest.rewardId);
      }
      window.soundEngine.playChestSfx();
      openDialogue([
        {
          speaker: "Treasure Chest",
          spritePortrait: "chest",
          text: `Opened the chest! Obtained: ${chest.label}! Open MENU (M) to equip or use it.`
        }
      ]);
      renderHudAndViews();
    }

    function handleNpcInteract(npc) {
      window.soundEngine.playFlipSfx();

      if (npc.type === "shop") {
        openShibaShopDialogue();
        return;
      }

      if (npc.type === "morganaQuest") {
        if (state.morganaQuestDone) {
          state.hp = getMaxHp();
          state.sp = getMaxSp();
          openDialogue([
            {
              speaker: "Morgana",
              spritePortrait: "morgana",
              text: "Looking cool, Blacc Car! I patched up your HP & SP. Remember to use Miracle Punch on tough shadows!"
            }
          ]);
          renderHudAndViews();
          return;
        }
        if (state.mobsDefeatedTotal >= 2) {
          state.morganaQuestDone = true;
          if (!state.unlockedSkills.includes("miracleCatnap")) {
            state.unlockedSkills.push("miracleCatnap");
          }
          state.hp = getMaxHp();
          state.sp = getMaxSp();
          window.soundEngine.playChimeSfx(true);
          openDialogue([
            {
              speaker: "Morgana",
              spritePortrait: "morgana",
              text: "Whoa, you cleared 2 shadow mobs in the Alley! Nice work, Blacc Car!"
            },
            {
              speaker: "Morgana",
              spritePortrait: "morgana",
              text: "As promised, I am teaching you Morgana's Miracle Punch! High crit rate + restores 25 HP on hit!"
            }
          ]);
          renderHudAndViews();
        } else {
          openDialogue([
            {
              speaker: "Morgana",
              spritePortrait: "morgana",
              text: `Meow! Head right into the Rainy Alley and defeat 2 roaming shadow mobs (${state.mobsDefeatedTotal}/2 done). Come back and I will teach you Miracle Punch!`
            }
          ]);
        }
        return;
      }

      if (npc.type === "rumorUnlock") {
        if (state.rumorQuestDone) {
          openDialogue([
            {
              speaker: "Kuzunoha Rumor Girl",
              spritePortrait: "npcViolet",
              text: "Remember: in Persona 2, rumors hold real power. Use Spread Rumor against static wisps and bosses!"
            }
          ]);
          return;
        }
        openDialogue([
          {
            speaker: "Kuzunoha Rumor Girl",
            spritePortrait: "npcViolet",
            text: "Psst... want to learn how to bend reality with Persona 2 Rumors? Unlock it for 25 Star Coins or answer a quick question!",
            choices: [
              {
                label: "Pay 25 Star Coins (Instant Unlock)",
                action: () => {
                  if (state.coins >= 25) {
                    state.coins -= 25;
                    state.rumorQuestDone = true;
                    if (!state.unlockedSkills.includes("rumorShift")) {
                      state.unlockedSkills.push("rumorShift");
                    }
                    window.soundEngine.playChimeSfx(true);
                  }
                },
                nextLines: [
                  state.coins >= 25
                    ? {
                        speaker: "Kuzunoha Rumor Girl",
                        spritePortrait: "npcViolet",
                        text: "Deal! Unlocked Persona 2: Spread Rumor! Now rumors become battle reality!"
                      }
                    : {
                        speaker: "Kuzunoha Rumor Girl",
                        spritePortrait: "npcViolet",
                        text: "Oops, looks like you need 25 Star Coins first! Defeat a mob nearby or try the trivia!"
                      }
                ]
              },
              {
                label: "Free Trivia: Which Arcana carries the lantern?",
                nextLines: [
                  {
                    speaker: "Kuzunoha Rumor Girl",
                    spritePortrait: "npcViolet",
                    text: "Which Arcana carries the glowing lantern through the dark?",
                    choices: [
                      {
                        label: "IX: The Hermit",
                        action: () => {
                          state.rumorQuestDone = true;
                          if (!state.unlockedSkills.includes("rumorShift")) {
                            state.unlockedSkills.push("rumorShift");
                          }
                          window.soundEngine.playChimeSfx(true);
                        },
                        nextLines: [
                          {
                            speaker: "Kuzunoha Rumor Girl",
                            spritePortrait: "npcViolet",
                            text: "Correct! You unlocked Persona 2: Spread Rumor for free!"
                          }
                        ]
                      },
                      {
                        label: "0: The Fool",
                        nextLines: [
                          {
                            speaker: "Kuzunoha Rumor Girl",
                            spritePortrait: "npcViolet",
                            text: "Close, that is Joker's! Talk to me again whenever you are ready."
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              { label: "Maybe later", nextLines: [] }
            ]
          }
        ]);
        return;
      }

      if (npc.type === "healCat") {
        state.hp = getMaxHp();
        state.sp = getMaxSp();
        window.soundEngine.playPourSfx();
        openDialogue([
          {
            speaker: "Alley Tuxedo Cat",
            spritePortrait: "morgana",
            text: "Purr... *headbutts Kirana's ankle*. Fully restored your HP & SP for the alley battle!"
          }
        ]);
        renderHudAndViews();
        return;
      }

      if (npc.type === "royalUnlock") {
        if (state.royalQuestDone) {
          openDialogue([
            {
              speaker: "Seeker Fairy",
              spritePortrait: "fairy",
              text: "Metaphor: Royal Slash shines brightest against The Monochrome Gloom. Give it everything!"
            }
          ]);
          return;
        }
        state.royalQuestDone = true;
        if (!state.unlockedSkills.includes("royalSlash")) {
          state.unlockedSkills.push("royalSlash");
        }
        window.soundEngine.playChimeSfx(true);
        openDialogue([
          {
            speaker: "Seeker Fairy",
            spritePortrait: "fairy",
            text: "You made it into the Velvet Labyrinth! Take this Seeker Archetype blessing: unlocked Metaphor: Royal Slash!"
          }
        ]);
        renderHudAndViews();
      }
    }

    function openShibaShopDialogue() {
      const shopChoices = [
        { label: "Buy Ice Cold Choco Milk (20 Coins)", action: () => buyItem("chocoMilk", 20) },
        { label: "Buy Velvet Dark Truffle (25 Coins)", action: () => buyItem("truffle", 25) },
        { label: "Buy Midnight Berry Cake (40 Coins)", action: () => buyItem("shortcake", 40) },
        { label: "Buy Crimson Palette Blade (+24 ATK, 90 Coins)", action: () => buyGear("weapon", "heavyBrush", 90) },
        { label: "Buy Cat Ear Headphones (65 Coins)", action: () => buyGear("accessory", "catEars", 65) },
        { label: "Buy Oversized Blacc Car Hoodie (+70 HP, 115 Coins)", action: () => buyGear("outfit", "eepyHoodie", 115) },
        {
          label: "Rest at Counter (Free Full Heal!)",
          action: () => {
            state.hp = getMaxHp();
            state.sp = getMaxSp();
            window.soundEngine.playPourSfx();
            setExploreNotice("Chris le Shiba poured warm choco milk! Full HP & SP restored!");
            renderHudAndViews();
          }
        },
        { label: "Leave Counter" }
      ];

      openDialogue([
        {
          speaker: "Chris le Shiba",
          avatar: "./assets/art/art-shiba-boy.jpg",
          text: `Welcome to Leblanc! You have ${state.coins} Star Coins. Want snacks, gear upgrades, or a free rest?`,
          choices: shopChoices
        }
      ]);
    }

    function buyItem(itemId, price) {
      if (state.coins < price) {
        setExploreNotice(`Not enough Star Coins (need ${price})! Defeat roaming mobs for coins.`);
        return;
      }
      state.coins -= price;
      state.inventory[itemId] = (state.inventory[itemId] || 0) + 1;
      window.soundEngine.playChimeSfx(false);
      setExploreNotice(`Bought 1x ${D.CONSUMABLES[itemId].name}!`);
      renderHudAndViews();
    }

    function buyGear(slot, gearId, price) {
      const ownedArr =
        slot === "weapon"
          ? state.ownedWeapons
          : slot === "outfit"
          ? state.ownedOutfits
          : state.ownedAccessories;
      if (ownedArr.includes(gearId)) {
        setExploreNotice("You already own this gear! Equip it in the Menu.");
        return;
      }
      if (state.coins < price) {
        setExploreNotice(`Need ${price} Star Coins for this gear!`);
        return;
      }
      state.coins -= price;
      ownedArr.push(gearId);
      if (slot === "weapon") state.weaponId = gearId;
      if (slot === "outfit") state.outfitId = gearId;
      if (slot === "accessory") state.accessoryId = gearId;
      window.soundEngine.playChimeSfx(true);
      setExploreNotice("Purchased and equipped new gear!");
      renderHudAndViews();
    }

    // ========================================================================
    // 2D EXPLORATION CANVAS RENDERER
    // ========================================================================
    function drawExploreCanvas(ts) {
      const canvas = $("rpg-explore-canvas");
      if (!canvas || gameMode !== "explore") return;
      const ctx = canvas.getContext("2d");
      const z = D.ZONES[state.zoneId];

      // Smoothly interpolate character positions
      visualX += (state.px - visualX) * 0.32;
      visualY += (state.py - visualY) * 0.32;
      const trailTarget = state.trail[1] || { x: state.px, y: state.py };
      followVisualX += (trailTarget.x - followVisualX) * 0.25;
      followVisualY += (trailTarget.y - followVisualY) * 0.25;

      const themes = {
        cafe: { floorA: "#241935", floorB: "#201630", wall: "#110b1c", wallTop: "#5a189a" },
        alley: { floorA: "#161426", floorB: "#1a172c", wall: "#0b0914", wallTop: "#7b2cbf" },
        labyrinth: { floorA: "#1d1030", floorB: "#25143d", wall: "#0d0617", wallTop: "#c77dff" }
      };
      const th = themes[state.zoneId] || themes.cafe;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let y = 0; y < MAP_ROWS; y++) {
        for (let x = 0; x < MAP_COLS; x++) {
          const ch = z.map[y][x];
          const px = x * TILE_SIZE;
          const py = y * TILE_SIZE;

          ctx.fillStyle = (x + y) % 2 === 0 ? th.floorA : th.floorB;
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

          if (ch === "#") {
            ctx.fillStyle = th.wall;
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = th.wallTop;
            ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, 7);
          } else if (ch === "T") {
            ctx.fillStyle = "#5c3a21";
            ctx.fillRect(px + 4, py + 6, TILE_SIZE - 8, TILE_SIZE - 12);
            ctx.strokeStyle = "#e9c46a";
            ctx.lineWidth = 1.5;
            ctx.strokeRect(px + 4, py + 6, TILE_SIZE - 8, TILE_SIZE - 12);
            ctx.fillStyle = "#f4eefb";
            ctx.fillRect(px + 15, py + 14, 8, 8);
          } else if (ch === "S") {
            const pulse = Math.sin(ts * 0.005) * 3;
            ctx.save();
            ctx.translate(px + 20, py + 20 + pulse * 0.5);
            ctx.fillStyle = "#70d6ff";
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -13);
            ctx.lineTo(10, 0);
            ctx.lineTo(0, 13);
            ctx.lineTo(-10, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          } else if (ch === "D" || ch === "B") {
            const glow = 0.45 + 0.35 * Math.sin(ts * 0.006);
            ctx.fillStyle = `rgba(199, 125, 255, ${glow})`;
            ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            ctx.fillStyle = "#fff";
            ctx.font = "bold 14px sans-serif";
            ctx.fillText(ch === "D" ? "→" : "←", px + 13, py + 25);
          }
        }
      }

      // Draw Chests
      z.chests.forEach((c) => {
        const opened = state.openedChests.includes(c.id);
        const cx = c.x * TILE_SIZE;
        const cy = c.y * TILE_SIZE;
        ctx.fillStyle = opened ? "#4a405c" : "#e9c46a";
        ctx.fillRect(cx + 7, cy + 10, 26, 20);
        ctx.strokeStyle = "#0b0812";
        ctx.lineWidth = 2;
        ctx.strokeRect(cx + 7, cy + 10, 26, 20);
        if (!opened) {
          ctx.fillStyle = "#e63946";
          ctx.fillRect(cx + 17, cy + 17, 6, 6);
        }
      });

      // Draw NPCs
      z.npcs.forEach((n) => {
        const nx = n.x * TILE_SIZE + 20;
        const ny = n.y * TILE_SIZE + 20 + Math.sin(ts * 0.004 + n.x) * 1.5;
        drawMapCharacter(ctx, n.sprite, nx, ny);
        ctx.fillStyle = "#e9c46a";
        ctx.font = "bold 9px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(n.name.split(" ")[0], nx, n.y * TILE_SIZE + 6);
        ctx.textAlign = "left";
      });

      // Draw Mobs & Bosses
      activeMobs.forEach((m) => {
        const mx = m.x * TILE_SIZE + 20;
        const my = m.y * TILE_SIZE + 20 + Math.sin(ts * 0.006 + m.x) * 2.5;
        drawMapEnemy(ctx, m, mx, my);
      });

      // Draw Chris le Shiba Follower in Alley & Labyrinth
      if (state.zoneId !== "cafe") {
        const sx = followVisualX * TILE_SIZE + 20;
        const sy = followVisualY * TILE_SIZE + 20 + Math.sin(ts * 0.008) * 1.5;
        drawMapCharacter(ctx, "shiba", sx, sy);
      }

      // Draw Kirana (Blacc Car) Hero Sprite
      const bob = Math.sin(ts * 0.01) * 1.6;
      drawMapCharacter(ctx, "kirana", visualX * TILE_SIZE + 20, visualY * TILE_SIZE + 20 + bob);

      // Draw Floating [E] Interaction Prompt Bubble above adjacent interactable
      const adj = getAdjacentInteractable();
      if (adj && !isDialogueOpen && !isMenuOpen) {
        const bx = adj.x * TILE_SIZE + 20;
        const by = adj.y * TILE_SIZE - 8 + Math.sin(ts * 0.008) * 2;
        ctx.fillStyle = "#0b0812";
        ctx.strokeStyle = "#e9c46a";
        ctx.lineWidth = 1.5;
        ctx.fillRect(bx - 24, by - 12, 48, 17);
        ctx.strokeRect(bx - 24, by - 12, 48, 17);
        ctx.fillStyle = "#e9c46a";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(adj.label, bx, by);
        ctx.textAlign = "left";
      }

      if (state.zoneId === "alley") {
        ctx.strokeStyle = "rgba(199, 125, 255, 0.22)";
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 18; i++) {
          const rx = (i * 47 + ts * 0.12) % canvas.width;
          const ry = (i * 71 + ts * 0.35) % canvas.height;
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 4, ry + 12);
          ctx.stroke();
        }
      }
    }

    function drawMapCharacter(ctx, kind, cx, cy) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.beginPath();
      ctx.ellipse(0, 14, 11, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      if (kind === "kirana") {
        ctx.fillStyle = "#7b2cbf";
        ctx.beginPath();
        ctx.roundRect(-9, 0, 18, 13, 4);
        ctx.fill();
        ctx.fillStyle = "#181422";
        ctx.beginPath();
        ctx.arc(0, -5, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-9, -8);
        ctx.lineTo(-10, -17);
        ctx.lineTo(-2, -13);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(9, -8);
        ctx.lineTo(10, -17);
        ctx.lineTo(2, -13);
        ctx.fill();
        ctx.fillStyle = "#fde4cf";
        ctx.beginPath();
        ctx.arc(0, -3, 7, 0, Math.PI);
        ctx.fill();
        ctx.strokeStyle = "#4a2511";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-6, -6, 5, 4);
        ctx.strokeRect(1, -6, 5, 4);
      } else if (kind === "shiba") {
        ctx.fillStyle = "#6c757d";
        ctx.beginPath();
        ctx.roundRect(-8, 1, 16, 12, 4);
        ctx.fill();
        ctx.fillStyle = "#2b2533";
        ctx.beginPath();
        ctx.arc(0, -5, 9.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f4a261";
        ctx.beginPath();
        ctx.moveTo(-9, -7);
        ctx.lineTo(-11, -16);
        ctx.lineTo(-2, -12);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(9, -7);
        ctx.lineTo(11, -16);
        ctx.lineTo(2, -12);
        ctx.fill();
        ctx.fillStyle = "#fde4cf";
        ctx.beginPath();
        ctx.arc(0, -3, 6.5, 0, Math.PI);
        ctx.fill();
        ctx.strokeStyle = "#111";
        ctx.lineWidth = 1.4;
        ctx.strokeRect(-5.5, -5.5, 4.5, 3.5);
        ctx.strokeRect(1, -5.5, 4.5, 3.5);
      } else if (kind === "morgana") {
        ctx.fillStyle = "#111018";
        ctx.beginPath();
        ctx.arc(0, 1, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-9, -4);
        ctx.lineTo(-10, -14);
        ctx.lineTo(-2, -8);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(9, -4);
        ctx.lineTo(10, -14);
        ctx.lineTo(2, -8);
        ctx.fill();
        ctx.fillStyle = "#e9c46a";
        ctx.fillRect(-7, 6, 14, 4);
        ctx.fillStyle = "#70d6ff";
        ctx.fillRect(-5, -1, 3, 3);
        ctx.fillRect(2, -1, 3, 3);
      } else if (kind === "fairy") {
        ctx.fillStyle = "rgba(112, 214, 255, 0.7)";
        ctx.beginPath();
        ctx.ellipse(-9, -2, 7, 4, -0.4, 0, Math.PI * 2);
        ctx.ellipse(9, -2, 7, 4, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#e9c46a";
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = "#9d4edd";
        ctx.beginPath();
        ctx.roundRect(-8, 0, 16, 12, 4);
        ctx.fill();
        ctx.fillStyle = "#f4eefb";
        ctx.beginPath();
        ctx.arc(0, -6, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    function drawMapEnemy(ctx, mob, mx, my) {
      ctx.save();
      ctx.translate(mx, my);
      const r = mob.isBoss ? 15 : 11;
      ctx.fillStyle = mob.isBoss ? "#e63946" : "#3a324d";
      ctx.strokeStyle = mob.isBoss ? "#e9c46a" : "#c77dff";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = mob.isBoss ? "#fff" : "#ff4d6d";
      ctx.fillRect(-5, -3, 3, 4);
      ctx.fillRect(2, -3, 3, 4);

      if (mob.isBoss) {
        ctx.fillStyle = "#e9c46a";
        ctx.font = "bold 9px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("BOSS", 0, -18);
      }
      ctx.restore();
    }

    // ========================================================================
    // ANIMATED 60FPS BATTLE ENGINE & VFX
    // ========================================================================
    let battle = null;

    function triggerEncounter(mobEntry) {
      const isBoss = Boolean(mobEntry.isBoss);
      const template = isBoss ? D.BOSSES[mobEntry.bossId] : D.MOBS[mobEntry.mobId];

      gameMode = "battle";
      state.xDrive = Math.max(state.xDrive, D.ACCESSORIES[state.accessoryId]?.startXDrive || 0);

      battle = {
        mobEntry,
        isBoss,
        enemy: template,
        enemyHp: template.maxHp,
        weaknessKnown: false,
        telegraphing: false,
        defDownTurns: 0,
        rumorActive: null,
        debuff: null,
        shieldTurns: 0,
        powerBuffTurns: 0,
        guarding: false,
        shibaCooldown: 0,
        busy: false,
        log: `${template.name} attacked! Use Skills, Shiba Baton Pass, or Sibyl Scan!`,
        heroOffsetX: 0,
        heroFlash: 0,
        enemyOffsetX: 0,
        enemyFlash: 0,
        shakeFrames: 0,
        vfx: [],
        slashArcs: [],
        floatNums: []
      };

      $("rpg-subdrawer").hidden = true;
      window.soundEngine.playEncounterSfx();
      window.soundEngine.startBattleMusic(isBoss);
      renderHudAndViews();
    }

    function spawnBattleVfx(kind, targetSide, textVal, color) {
      if (!battle) return;
      const x = targetSide === "enemy" ? 175 : 465;
      const y = 145;

      if (textVal) {
        battle.floatNums.push({ x, y: y - 35, text: textVal, color: color || "#e9c46a", life: 48 });
      }

      if (kind === "slash") {
        battle.slashArcs.push({
          x,
          y,
          angle: -0.6 + Math.random() * 1.2,
          color: color || "#c77dff",
          life: 16
        });
      }

      const pCount = kind === "slash" ? 18 : 22;
      for (let i = 0; i < pCount; i++) {
        const ang = (Math.PI * 2 * i) / pCount + Math.random() * 0.4;
        const spd = 2 + Math.random() * 4;
        battle.vfx.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          size: Math.random() * 5 + 3,
          color: color || "#c77dff",
          life: 28 + Math.random() * 14
        });
      }
    }

    function drawBattleCanvas(ts) {
      const canvas = $("rpg-battle-canvas");
      if (!canvas || gameMode !== "battle" || !battle) return;
      const ctx = canvas.getContext("2d");

      ctx.save();
      if (battle.shakeFrames > 0) {
        battle.shakeFrames--;
        ctx.translate((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9);
      }

      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, "#120a21");
      grad.addColorStop(1, "#24133d");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "rgba(199, 125, 255, 0.16)";
      ctx.lineWidth = 1.5;
      for (let i = 0; i <= 10; i++) {
        const x = i * 64;
        ctx.beginPath();
        ctx.moveTo(x, 190);
        ctx.lineTo(320 + (x - 320) * 1.7, 300);
        ctx.stroke();
      }
      for (let y = 200; y <= 290; y += 26) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      battle.heroOffsetX *= 0.82;
      battle.enemyOffsetX *= 0.82;
      if (battle.heroFlash > 0) battle.heroFlash--;
      if (battle.enemyFlash > 0) battle.enemyFlash--;

      const ex = 175 + battle.enemyOffsetX + (battle.telegraphing ? Math.sin(ts * 0.04) * 4 : 0);
      const ey = 135 + Math.sin(ts * 0.005) * 6;
      drawBattleEnemy(ctx, battle.enemy.spriteType, ex, ey, battle.enemyFlash > 0, battle.telegraphing, ts);

      const sx = 525;
      const sy = 152 + Math.sin(ts * 0.006 + 1) * 4;
      drawBattleCharacter(ctx, "shiba", sx, sy, false, false);

      const hx = 455 + battle.heroOffsetX;
      const hy = 158 + Math.sin(ts * 0.006) * 4;
      drawBattleCharacter(ctx, "kirana", hx, hy, battle.heroFlash > 0, battle.shieldTurns > 0 || battle.guarding);

      // Slash Arcs
      for (let i = battle.slashArcs.length - 1; i >= 0; i--) {
        const s = battle.slashArcs[i];
        s.life--;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.angle);
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 5 * (s.life / 16);
        ctx.beginPath();
        ctx.arc(0, 0, 52, -0.9, 0.9);
        ctx.stroke();
        ctx.restore();
        if (s.life <= 0) battle.slashArcs.splice(i, 1);
      }

      // Particles
      for (let i = battle.vfx.length - 1; i >= 0; i--) {
        const p = battle.vfx[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        ctx.globalAlpha = Math.max(0, p.life / 40);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        if (p.life <= 0) battle.vfx.splice(i, 1);
      }
      ctx.globalAlpha = 1;

      for (let i = battle.floatNums.length - 1; i >= 0; i--) {
        const fn = battle.floatNums[i];
        fn.y -= 0.9;
        fn.life--;
        ctx.font = "bold 26px Anton, Impact, sans-serif";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#0b0812";
        ctx.lineWidth = 5;
        ctx.strokeText(fn.text, fn.x, fn.y);
        ctx.fillStyle = fn.color;
        ctx.fillText(fn.text, fn.x, fn.y);
        if (fn.life <= 0) battle.floatNums.splice(i, 1);
      }
      ctx.textAlign = "left";
      ctx.restore();
    }

    function drawBattleEnemy(ctx, type, x, y, flash, telegraph, ts) {
      ctx.save();
      ctx.translate(x, y);

      if (telegraph) {
        ctx.strokeStyle = "rgba(230, 57, 70, 0.8)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 62 + Math.sin(ts * 0.02) * 5, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (flash) ctx.filter = "brightness(2.8)";

      if (type === "alarmBoss" || type === "gremlin") {
        const r = type === "alarmBoss" ? 44 : 32;
        ctx.fillStyle = "#1d1a26";
        ctx.strokeStyle = "#a098ad";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#3c354c";
        ctx.beginPath();
        ctx.arc(-r * 0.7, -r * 0.72, r * 0.32, 0, Math.PI * 2);
        ctx.arc(r * 0.7, -r * 0.72, r * 0.32, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#e63946";
        ctx.fillRect(-16, -8, 10, 8);
        ctx.fillRect(6, -8, 10, 8);
        ctx.strokeStyle = "#e9c46a";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -r * 0.6);
        ctx.moveTo(0, 0);
        ctx.lineTo(r * 0.45, r * 0.25);
        ctx.stroke();
      } else if (type === "witchBoss" || type === "wisp") {
        ctx.fillStyle = "#221436";
        ctx.strokeStyle = "#c77dff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -54);
        ctx.lineTo(42, 46);
        ctx.lineTo(-42, 46);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = "#e9c46a";
        ctx.beginPath();
        ctx.arc(-44, 0, 11, 0, Math.PI * 2);
        ctx.arc(44, 0, 11, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#ff70a6";
        ctx.beginPath();
        ctx.arc(0, -10, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#120e1a";
        ctx.fillRect(-6, -13, 4, 6);
        ctx.fillRect(2, -13, 4, 6);
      } else {
        ctx.save();
        ctx.rotate(ts * 0.0015);
        ctx.strokeStyle = "#e63946";
        ctx.lineWidth = 4;
        ctx.setLineDash([12, 7]);
        ctx.beginPath();
        ctx.arc(0, 0, 56, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = "#0e0a15";
        ctx.strokeStyle = "#c77dff";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 42, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ff2a38";
        ctx.beginPath();
        ctx.moveTo(-22, -8);
        ctx.lineTo(-6, -2);
        ctx.lineTo(-18, 6);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(22, -8);
        ctx.lineTo(6, -2);
        ctx.lineTo(18, 6);
        ctx.fill();
      }
      ctx.restore();
    }

    function drawBattleCharacter(ctx, who, x, y, flash, shielded) {
      ctx.save();
      ctx.translate(x, y);
      if (flash) ctx.filter = "brightness(2.5)";

      if (shielded) {
        ctx.strokeStyle = "rgba(199, 125, 255, 0.85)";
        ctx.fillStyle = "rgba(157, 78, 221, 0.2)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, -6, 38, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      if (who === "kirana") {
        ctx.fillStyle = "#7b2cbf";
        ctx.beginPath();
        ctx.roundRect(-16, -2, 32, 32, 8);
        ctx.fill();
        ctx.fillStyle = "#e9c46a";
        ctx.fillRect(-12, -2, 24, 6);
        ctx.strokeStyle = "#c77dff";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(-16, 10);
        ctx.lineTo(-34, -14);
        ctx.stroke();
        ctx.fillStyle = "#181422";
        ctx.beginPath();
        ctx.arc(0, -18, 17, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-14, -26);
        ctx.lineTo(-18, -42);
        ctx.lineTo(-4, -33);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(14, -26);
        ctx.lineTo(18, -42);
        ctx.lineTo(4, -33);
        ctx.fill();
        ctx.fillStyle = "#fde4cf";
        ctx.beginPath();
        ctx.arc(-2, -16, 12, 0, Math.PI);
        ctx.fill();
        ctx.strokeStyle = "#5c2a12";
        ctx.lineWidth = 2;
        ctx.strokeRect(-12, -22, 9, 7);
        ctx.strokeRect(-1, -22, 9, 7);
      } else {
        ctx.fillStyle = "#495057";
        ctx.beginPath();
        ctx.roundRect(-13, 0, 26, 26, 6);
        ctx.fill();
        ctx.fillStyle = "#2b2533";
        ctx.beginPath();
        ctx.arc(0, -14, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f4a261";
        ctx.beginPath();
        ctx.moveTo(-12, -20);
        ctx.lineTo(-16, -34);
        ctx.lineTo(-3, -27);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(12, -20);
        ctx.lineTo(16, -34);
        ctx.lineTo(3, -27);
        ctx.fill();
        ctx.fillStyle = "#fde4cf";
        ctx.beginPath();
        ctx.arc(-1, -12, 10, 0, Math.PI);
        ctx.fill();
      }
      ctx.restore();
    }

    // ========================================================================
    // BATTLE TURN ACTIONS & LEVEL-UP BUILD PICKER
    // ========================================================================
    function showOneMoreBanner(text) {
      const b = $("rpg-one-more");
      b.textContent = text;
      b.hidden = false;
      window.soundEngine.playOneMoreSfx();
      setTimeout(() => {
        b.hidden = true;
      }, 1050);
    }

    function damageEnemy(rawDmg, element, weakTrigger) {
      let dmg = rawDmg;
      if (battle.defDownTurns > 0) dmg = Math.round(dmg * 1.25);
      const isCrit = Math.random() < getCrit();
      if (isCrit) dmg = Math.round(dmg * 1.45);

      battle.enemyHp = Math.max(0, battle.enemyHp - dmg);
      battle.heroOffsetX = -55;
      battle.enemyOffsetX = -18;
      battle.enemyFlash = 10;
      battle.shakeFrames = isCrit || weakTrigger ? 10 : 5;
      spawnBattleVfx("slash", "enemy", `-${dmg}${isCrit ? "!" : ""}`, weakTrigger ? "#e9c46a" : "#c77dff");

      if (battle.enemyHp <= 0) {
        handleBattleVictory();
        return "won";
      }

      if (weakTrigger || isCrit) {
        showOneMoreBanner(weakTrigger ? "WEAK! 1 MORE!" : "CRIT! 1 MORE!");
        return "1more";
      }
      return "normal";
    }

    function handleBattleVictory() {
      const en = battle.enemy;
      state.exp += en.exp;
      state.coins += en.coins;
      if (!battle.isBoss) {
        state.mobsDefeatedTotal++;
        state.clearedMobsInVisit.push(battle.mobEntry.id);
      } else if (!state.defeatedBosses.includes(en.id)) {
        state.defeatedBosses.push(en.id);
      }

      let dropNote = "";
      if (en.dropItem && (battle.isBoss || Math.random() < (en.dropChance || 0.5))) {
        state.inventory[en.dropItem] = (state.inventory[en.dropItem] || 0) + 1;
        dropNote = ` Dropped 1x ${D.CONSUMABLES[en.dropItem].name}!`;
      }

      while (state.exp >= state.nextExp) {
        state.exp -= state.nextExp;
        state.level++;
        state.nextExp = Math.round(state.nextExp * 1.45);
        state.pendingLevelUps++;
      }

      window.soundEngine.stopBattleMusic(true);
      window.soundEngine.playVictoryFanfareSfx();

      if (battle.isBoss && en.id === "finalBoss") {
        triggerGoodEnding();
        return;
      }

      activeMobs = activeMobs.filter((m) => m.id !== battle.mobEntry.id);
      gameMode = "explore";
      battle = null;
      renderHudAndViews();

      openDialogue(
        [
          {
            speaker: "Battle Victory!",
            spritePortrait: "trophy",
            text: `Defeated ${en.name}! Gained +${en.exp} EXP and +${en.coins} Star Coins!${dropNote}`
          }
        ],
        () => {
          if (state.pendingLevelUps > 0) {
            openLevelUpModal();
          }
        }
      );
    }

    function openLevelUpModal() {
      if (state.pendingLevelUps <= 0) return;
      isLevelUpOpen = true;
      $("rpg-levelup-sub").textContent = `Kirana reached Lv. ${state.level}! Choose your growth path:`;
      $("rpg-levelup-modal").hidden = false;
    }

    function applyLevelChoice(choice) {
      if (choice === "atk") {
        state.bonusAtk += 6;
        state.bonusCrit += 0.05;
      } else if (choice === "mag") {
        state.bonusMag += 8;
        state.bonusSp += 15;
      } else if (choice === "tank") {
        state.bonusHp += 35;
        state.bonusDef += 3;
      }
      state.hp = getMaxHp();
      state.sp = getMaxSp();
      state.pendingLevelUps--;
      window.soundEngine.playChimeSfx(true);
      if (state.pendingLevelUps > 0) {
        openLevelUpModal();
      } else {
        isLevelUpOpen = false;
        $("rpg-levelup-modal").hidden = true;
        renderHudAndViews();
      }
    }

    function enemyTurn() {
      if (!battle || battle.enemyHp <= 0 || gameMode !== "battle") return;
      battle.busy = true;
      renderHudAndViews();

      setTimeout(() => {
        if (!battle || battle.enemyHp <= 0 || gameMode !== "battle") return;
        const en = battle.enemy;
        let extra = "";

        if (battle.rumorActive === "regen") {
          state.hp = Math.min(getMaxHp(), state.hp + 16);
          state.sp = Math.min(getMaxSp(), state.sp + 8);
          extra += " (Shiba Choco Milk healed +16 HP/+8 SP!)";
        }

        let rawDmg = en.atk + Math.floor(Math.random() * 8) - Math.floor(getDef() * 0.4);
        rawDmg = Math.max(6, rawDmg);

        if (battle.telegraphing) {
          rawDmg = Math.round(rawDmg * 2.15);
          battle.telegraphing = false;
          extra = " UNLEASHED STATIC WIPEOUT!" + extra;
        } else if (battle.isBoss && Math.random() < 0.34) {
          battle.telegraphing = true;
          battle.guarding = false;
          if (battle.shieldTurns > 0) battle.shieldTurns--;
          if (battle.powerBuffTurns > 0) battle.powerBuffTurns--;
          if (battle.defDownTurns > 0) battle.defDownTurns--;
          if (battle.shibaCooldown > 0) battle.shibaCooldown--;
          state.turnsTotal++;
          window.soundEngine.playScanSfx();
          battle.log = `WARNING: ${en.name} is charging a massive attack! Guard or raise a Shield!${extra}`;
          battle.busy = false;
          renderHudAndViews();
          return;
        }

        if (battle.guarding) {
          rawDmg = Math.max(2, Math.round(rawDmg * 0.28));
        } else if (battle.shieldTurns > 0) {
          rawDmg = Math.max(3, Math.round(rawDmg * 0.45));
        }

        state.hp = Math.max(0, state.hp - rawDmg);
        battle.enemyOffsetX = 48;
        battle.heroFlash = 10;
        battle.shakeFrames = 7;
        window.soundEngine.playEnemyHitSfx();
        spawnBattleVfx("hit", "hero", `-${rawDmg}`, "#ff4d6d");

        if (state.hp <= 0) {
          triggerBadEnding();
          return;
        }

        if (!battle.guarding && !battle.debuff && Math.random() < 0.28) {
          battle.debuff = Math.random() < 0.5 ? "Eepy" : "Artblock";
          extra += ` Inflicted "${battle.debuff}"!`;
        }

        battle.guarding = false;
        if (battle.shieldTurns > 0) battle.shieldTurns--;
        if (battle.powerBuffTurns > 0) battle.powerBuffTurns--;
        if (battle.defDownTurns > 0) battle.defDownTurns--;
        if (battle.shibaCooldown > 0) battle.shibaCooldown--;
        state.turnsTotal++;

        battle.log = `${en.name} hit Kirana for ${rawDmg} dmg!${extra}`;
        battle.busy = false;
        renderHudAndViews();
      }, 650);
    }

    // ========================================================================
    // GOOD ENDING & BAD ENDING
    // ========================================================================
    function triggerBadEnding() {
      window.soundEngine.stopBattleMusic(true);
      window.soundEngine.playBadEndSfx();
      gameMode = "badEnding";
      battle = null;
      renderHudAndViews();
    }

    function triggerGoodEnding() {
      window.soundEngine.stopBattleMusic(true);
      gameMode = "goodEnding";
      battle = null;
      if (typeof window.launchBirthdayConfetti === "function") {
        window.launchBirthdayConfetti(120);
      }
      if (typeof window.onRpgCompleted === "function") {
        window.onRpgCompleted();
      }
      renderHudAndViews();
    }

    // ========================================================================
    // RENDERING ALL UI OVERLAYS & MENUS
    // ========================================================================
    function renderHudAndViews() {
      const maxHp = getMaxHp();
      const maxSp = getMaxSp();

      $("rpg-explore-view").hidden = gameMode !== "explore";
      $("rpg-battle-view").hidden = gameMode !== "battle";
      $("rpg-good-ending-view").hidden = gameMode !== "goodEnding";
      $("rpg-bad-ending-view").hidden = gameMode !== "badEnding";

      $("rpg-level-pill").textContent = `LV. ${state.level} | ${state.coins} COINS`;
      $("rpg-top-hp").textContent = `HP ${state.hp}/${maxHp} | SP ${state.sp}/${maxSp}`;
      updateQuestBanner();

      if (gameMode === "battle" && battle) {
        $("rpg-telegraph-alert").hidden = !battle.telegraphing;
        $("rpg-boss-name").textContent = battle.enemy.name;
        $("rpg-boss-sub").textContent = battle.enemy.subtitle || "Roaming Shadow";
        $("boss-hp-text").textContent = `${battle.enemyHp} / ${battle.enemy.maxHp}`;
        $("boss-hp-fill").style.width = `${Math.max(0, (battle.enemyHp / battle.enemy.maxHp) * 100)}%`;
        $("rpg-boss-weakness").textContent = battle.weaknessKnown
          ? `WEAK: ${battle.enemy.weaknesses.join(", ").toUpperCase()}`
          : "WEAK: ??? (Scan!)";

        $("player-hp-text").textContent = `${state.hp} / ${maxHp}`;
        $("player-hp-fill").style.width = `${Math.max(0, (state.hp / maxHp) * 100)}%`;
        $("player-sp-text").textContent = `${state.sp} / ${maxSp}`;
        $("player-sp-fill").style.width = `${Math.max(0, (state.sp / maxSp) * 100)}%`;
        $("xdrive-text").textContent = `${state.xDrive}%`;
        $("xdrive-fill").style.width = `${state.xDrive}%`;

        $("rpg-log").textContent = battle.log;

        const pills = $("rpg-status-pills");
        pills.innerHTML = "";
        const addChip = (t, c) => {
          const s = document.createElement("span");
          s.className = `status-chip ${c || ""}`;
          s.textContent = t;
          pills.appendChild(s);
        };
        addChip(D.WEAPONS[state.weaponId].name);
        if (battle.rumorActive) addChip(`Rumor: ${battle.rumorActive.toUpperCase()}`, "is-buff");
        if (battle.powerBuffTurns > 0) addChip(`Coffee Buff (${battle.powerBuffTurns}t)`, "is-buff");
        if (battle.shieldTurns > 0) addChip(`Shield (${battle.shieldTurns}t)`, "is-buff");
        if (battle.debuff) addChip(`Debuff: ${battle.debuff}`, "is-debuff");

        ["act-strike", "act-skills", "act-guard", "act-scan", "act-items"].forEach((id) => {
          $(id).disabled = battle.busy;
        });
        $("act-shiba").disabled = battle.busy || battle.shibaCooldown > 0;
        $("act-shiba").querySelector("span").textContent =
          battle.shibaCooldown > 0 ? `Cooldown: ${battle.shibaCooldown}t` : "Baton Pass + DEF Down";
        $("act-xdrive").disabled = battle.busy || state.xDrive < 100;
        $("act-xdrive").querySelector("span").textContent =
          state.xDrive >= 100 ? "READY! Eclipse Finisher" : `Needs 100% (${state.xDrive}%)`;
        $("act-flee").disabled = battle.busy || battle.isBoss;
        $("act-flee").querySelector("span").textContent = battle.isBoss ? "Boss Battle!" : "Run from normal mob";
      }

      if (gameMode === "goodEnding") {
        $("end-stat-level").textContent = `Lv. ${state.level} (Rank S)`;
        $("end-stat-turns").textContent = `${state.turnsTotal} Turns`;
        $("end-stat-gear").textContent = `${D.WEAPONS[state.weaponId].name} & ${D.OUTFITS[state.outfitId].name}`;
      }
    }

    function openPauseMenu(tabName = "status") {
      isMenuOpen = true;
      $("rpg-menu-overlay").hidden = false;
      renderPauseMenu(tabName);
    }

    function renderPauseMenu(tabName) {
      document.querySelectorAll(".menu-tab-btn").forEach((b) => {
        b.classList.toggle("is-active", b.dataset.tab === tabName);
      });

      const body = $("rpg-menu-body");
      body.innerHTML = "";

      if (tabName === "status") {
        body.innerHTML = `
          <div class="menu-status-grid">
            <div class="menu-stat-card"><strong>Level</strong><span>Lv. ${state.level} (${state.exp}/${state.nextExp} EXP)</span></div>
            <div class="menu-stat-card"><strong>HP / SP</strong><span>${state.hp}/${getMaxHp()} HP | ${state.sp}/${getMaxSp()} SP</span></div>
            <div class="menu-stat-card"><strong>ATK / MAG</strong><span>${getAtk()} ATK / ${getMag()} MAG</span></div>
            <div class="menu-stat-card"><strong>DEF / CRIT</strong><span>${getDef()} DEF / ${Math.round(getCrit() * 100)}% Crit</span></div>
            <div class="menu-stat-card"><strong>Star Coins</strong><span>${state.coins} Coins</span></div>
            <div class="menu-stat-card"><strong>Unlocked Skills</strong><span>${state.unlockedSkills.map((id) => D.SKILLS[id].name).join(", ")}</span></div>
          </div>
        `;
      } else if (tabName === "equip") {
        const makeGroup = (title, ownedIds, dict, currentId, onPick) => {
          const h = document.createElement("h4");
          h.className = "menu-subhead";
          h.textContent = title;
          body.appendChild(h);
          const list = document.createElement("div");
          list.className = "gear-list";
          ownedIds.forEach((id) => {
            const g = dict[id];
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = `gear-btn ${currentId === id ? "is-equipped" : ""}`;
            btn.innerHTML = `<strong>${g.name} ${currentId === id ? "(Equipped)" : ""}</strong><span>${g.desc}</span>`;
            btn.addEventListener("click", () => {
              onPick(id);
              clampStats();
              window.soundEngine.playFlipSfx();
              renderHudAndViews();
              renderPauseMenu("equip");
            });
            list.appendChild(btn);
          });
          body.appendChild(list);
        };
        makeGroup("Weapons", state.ownedWeapons, D.WEAPONS, state.weaponId, (id) => (state.weaponId = id));
        makeGroup("Outfits", state.ownedOutfits, D.OUTFITS, state.outfitId, (id) => (state.outfitId = id));
        makeGroup("Accessories", state.ownedAccessories, D.ACCESSORIES, state.accessoryId, (id) => (state.accessoryId = id));
      } else if (tabName === "bag") {
        const list = document.createElement("div");
        list.className = "gear-list";
        Object.keys(D.CONSUMABLES).forEach((k) => {
          const item = D.CONSUMABLES[k];
          const qty = state.inventory[k] || 0;
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "gear-btn";
          btn.disabled = qty <= 0;
          btn.innerHTML = `<strong>${item.name} (x${qty})</strong><span>${item.desc}</span>`;
          btn.addEventListener("click", () => {
            if (qty <= 0) return;
            state.inventory[k]--;
            applyConsumableOutOfBattle(item);
            window.soundEngine.playPourSfx();
            renderHudAndViews();
            renderPauseMenu("bag");
          });
          list.appendChild(btn);
        });
        body.appendChild(list);
      } else if (tabName === "save") {
        const canLoad = hasSavedGame();
        body.innerHTML = `
          <div class="save-panel">
            <p>Save your progress anytime to browser storage, or load your last checkpoint.</p>
            <div class="save-btn-row">
              <button id="menu-save-btn" class="rpg-btn rpg-btn-purple" type="button"><strong>Save Current Progress</strong><span>Stores gear, level &amp; zone</span></button>
              <button id="menu-load-btn" class="rpg-btn rpg-btn-sky" type="button" ${canLoad ? "" : "disabled"}><strong>Load Saved Game</strong><span>${canLoad ? "Restore saved slot" : "No save found yet"}</span></button>
              <button id="menu-reset-btn" class="rpg-btn rpg-btn-crimson" type="button"><strong>Restart Campaign</strong><span>Start fresh from Lv. 1</span></button>
            </div>
          </div>
        `;
        $("menu-save-btn").addEventListener("click", () => {
          saveGame(false);
          renderPauseMenu("save");
        });
        $("menu-load-btn").addEventListener("click", () => {
          loadGame();
        });
        $("menu-reset-btn").addEventListener("click", () => {
          window.soundEngine.stopBattleMusic(true);
          state = createFreshState();
          isMenuOpen = false;
          $("rpg-menu-overlay").hidden = true;
          enterZone("cafe", 3, 4, false);
        });
      }
    }

    function applyConsumableEffect(item, inBattle) {
      const maxHp = getMaxHp();
      const maxSp = getMaxSp();
      if (item.effect === "heal_hpsp") {
        state.hp = Math.min(maxHp, state.hp + 75);
        state.sp = Math.min(maxSp, state.sp + 25);
        if (inBattle) spawnBattleVfx("heal", "hero", "+75 HP", "#80ed99");
        return `Used ${item.name}! Restored +75 HP and +25 SP!`;
      }
      if (item.effect === "heal_sp_cleanse") {
        state.sp = Math.min(maxSp, state.sp + 50);
        if (inBattle && battle) {
          battle.debuff = null;
          spawnBattleVfx("heal", "hero", "+50 SP", "#c77dff");
        }
        return `Used ${item.name}! Restored +50 SP and cleared debuffs!`;
      }
      if (item.effect === "heal_hp_xd") {
        state.hp = Math.min(maxHp, state.hp + 135);
        state.xDrive = Math.min(100, state.xDrive + 35);
        if (inBattle) spawnBattleVfx("heal", "hero", "+135 HP", "#80ed99");
        return `Used ${item.name}! Restored +135 HP and +35% X-Drive!`;
      }
      if (item.effect === "buff_power") {
        if (inBattle && battle) {
          battle.powerBuffTurns = 3;
          spawnBattleVfx("heal", "hero", "ATK/MAG UP!", "#e9c46a");
          return `Drank ${item.name}! ATK & MAG boosted for 3 turns!`;
        }
        state.sp = Math.min(maxSp, state.sp + 20);
        return `Sipped ${item.name}! Restored +20 SP!`;
      }
      return `Used ${item.name}!`;
    }

    function applyConsumableOutOfBattle(item) {
      const msg = applyConsumableEffect(item, false);
      setExploreNotice(msg);
    }

    // ========================================================================
    // BIND CONTROLS
    // ========================================================================
    const exploreCanvas = $("rpg-explore-canvas");
    exploreCanvas.addEventListener("click", (e) => {
      exploreCanvas.focus();
      if (gameMode !== "explore" || isDialogueOpen || isMenuOpen) return;
      const rect = exploreCanvas.getBoundingClientRect();
      const tx = Math.floor(((e.clientX - rect.left) / rect.width) * MAP_COLS);
      const ty = Math.floor(((e.clientY - rect.top) / rect.height) * MAP_ROWS);

      const dx = tx - state.px;
      const dy = ty - state.py;
      if (Math.abs(dx) + Math.abs(dy) === 1) {
        state.facing = dx === 1 ? "right" : dx === -1 ? "left" : dy === 1 ? "down" : "up";
        const z = D.ZONES[state.zoneId];
        const hasInteractable =
          z.map[ty][tx] === "S" ||
          Boolean(findChestAt(tx, ty)) ||
          z.npcs.some((n) => n.x === tx && n.y === ty);
        if (hasInteractable) {
          interactFacingOrAdjacent();
        } else {
          tryMove(dx, dy);
        }
      } else if (dx !== 0 || dy !== 0) {
        if (Math.abs(dx) >= Math.abs(dy)) {
          tryMove(dx > 0 ? 1 : -1, 0);
        } else {
          tryMove(0, dy > 0 ? 1 : -1);
        }
      } else {
        interactFacingOrAdjacent();
      }
    });

    const rpgArena = $("rpg-arena-box");
    rpgArena.addEventListener("keydown", (e) => {
      if (gameMode !== "explore") return;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") tryMove(0, -1);
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") tryMove(0, 1);
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") tryMove(-1, 0);
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") tryMove(1, 0);
      if (e.key === "Enter" || e.key === " " || e.key === "e" || e.key === "E") {
        if (isDialogueOpen) {
          $("rpg-dlg-next-btn").click();
        } else {
          interactFacingOrAdjacent();
        }
      }
      if (e.key === "m" || e.key === "M") {
        isMenuOpen ? (($("rpg-menu-overlay").hidden = true), (isMenuOpen = false)) : openPauseMenu("status");
      }
    });

    $("dpad-up").addEventListener("click", () => tryMove(0, -1));
    $("dpad-down").addEventListener("click", () => tryMove(0, 1));
    $("dpad-left").addEventListener("click", () => tryMove(-1, 0));
    $("dpad-right").addEventListener("click", () => tryMove(1, 0));
    $("dpad-act").addEventListener("click", interactFacingOrAdjacent);

    $("rpg-menu-btn").addEventListener("click", () => openPauseMenu("status"));
    $("rpg-menu-close").addEventListener("click", () => {
      isMenuOpen = false;
      $("rpg-menu-overlay").hidden = true;
    });
    document.querySelectorAll(".menu-tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => renderPauseMenu(btn.dataset.tab));
    });

    $("lvl-pick-atk").addEventListener("click", () => applyLevelChoice("atk"));
    $("lvl-pick-mag").addEventListener("click", () => applyLevelChoice("mag"));
    $("lvl-pick-tank").addEventListener("click", () => applyLevelChoice("tank"));

    function openSubdrawer(title, options) {
      const drawer = $("rpg-subdrawer");
      const list = $("subdrawer-options");
      $("subdrawer-title").textContent = title;
      list.innerHTML = "";
      options.forEach((opt) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "subdrawer-opt-btn";
        b.disabled = Boolean(opt.disabled);
        b.innerHTML = `<strong>${opt.label}</strong><small>${opt.sub || ""}</small>`;
        b.addEventListener("click", opt.onClick);
        list.appendChild(b);
      });
      drawer.hidden = false;
    }

    $("subdrawer-close").addEventListener("click", () => {
      $("rpg-subdrawer").hidden = true;
    });

    $("act-strike").addEventListener("click", () => {
      if (!battle || battle.busy) return;
      $("rpg-subdrawer").hidden = true;
      const mult = battle.powerBuffTurns > 0 ? 1.35 : 1;
      const dmg = Math.round(getAtk() * mult) + Math.floor(Math.random() * 6);
      state.xDrive = Math.min(100, state.xDrive + 18);
      window.soundEngine.playFlipSfx();
      const weak = battle.enemy.weaknesses.includes("phys");
      const res = damageEnemy(dmg, "phys", weak);
      if (res === "won") return;
      if (res === "1more") {
        battle.log = `Stylus Strike hit for ${dmg} dmg! 1 MORE!`;
        renderHudAndViews();
      } else {
        battle.log = `Kirana struck with Stylus Strike for ${dmg} dmg (+18% X-Drive).`;
        enemyTurn();
      }
    });

    $("act-skills").addEventListener("click", () => {
      if (!battle || battle.busy) return;
      const opts = state.unlockedSkills.map((skId) => {
        const sk = D.SKILLS[skId];
        return {
          label: `${sk.name} (${sk.cost} SP)`,
          sub: sk.desc,
          disabled: state.sp < sk.cost,
          onClick: () => {
            $("rpg-subdrawer").hidden = true;
            state.sp -= sk.cost;

            if (sk.id === "soulPurify") {
              const cleared = battle.debuff;
              battle.debuff = null;
              battle.shieldTurns = 2;
              state.xDrive = Math.min(100, state.xDrive + 18);
              window.soundEngine.playTarotRevealSfx();
              spawnBattleVfx("heal", "hero", "SHIELD UP!", "#c77dff");
              battle.log = cleared
                ? `Soul Gem Purify cleared "${cleared}" and raised a 2-turn shield!`
                : "Soul Gem Purify raised a 2-turn radiant shield!";
              enemyTurn();
              return;
            }

            if (sk.id === "rumorShift") {
              openSubdrawer("Persona 2: Choose Rumor to Make Real", [
                {
                  label: "Rumor: Supreme Lord of Goobers",
                  sub: "Party Power +30% + Reality Shock dmg!",
                  onClick: () => executeRumor("atk", "Goober Power boosted party ATK!")
                },
                {
                  label: "Rumor: Yuri on Ice Gold Medal Grace",
                  sub: "+X-Drive gain + Reality Shock dmg!",
                  onClick: () => executeRumor("yuri", "Born to Make History! Grace & X-Drive boosted!")
                },
                {
                  label: "Rumor: Shiba Infinite Choco Milk",
                  sub: "+16 HP / +8 SP Regen every turn!",
                  onClick: () => executeRumor("regen", "Shiba brought infinite choco milk regen!")
                }
              ]);
              return;
            }

            const magMult = battle.powerBuffTurns > 0 ? 1.35 : 1;
            const rumorMult = battle.rumorActive === "atk" ? 1.3 : 1;
            const statBase = sk.type === "phys" ? getAtk() : getMag();
            const dmg = Math.round(statBase * sk.power * magMult * rumorMult) + Math.floor(Math.random() * 8);
            const xdAdd = battle.rumorActive === "yuri" ? 32 : 22;
            state.xDrive = Math.min(100, state.xDrive + xdAdd);
            window.soundEngine.playSlashSfx();

            if (sk.id === "miracleCatnap") {
              state.hp = Math.min(getMaxHp(), state.hp + 25);
              spawnBattleVfx("heal", "hero", "+25 HP", "#80ed99");
            }

            const hitsWeak = battle.enemy.weaknesses.includes(sk.type);
            const res = damageEnemy(dmg, sk.type, hitsWeak);
            if (res === "won") return;
            if (res === "1more") {
              battle.log = `WEAKNESS HIT! ${sk.name} dealt ${dmg} dmg! 1 MORE!`;
              renderHudAndViews();
            } else {
              battle.log = `${sk.name} dealt ${dmg} dmg!`;
              enemyTurn();
            }
          }
        };
      });
      openSubdrawer("Kirana's Skills", opts);
    });

    function executeRumor(rumorId, msg) {
      $("rpg-subdrawer").hidden = true;
      battle.rumorActive = rumorId;
      state.xDrive = Math.min(100, state.xDrive + 25);
      window.soundEngine.playChimeSfx(false);
      const dmg = Math.round(getMag() * 1.15);
      const hitsWeak = battle.enemy.weaknesses.includes("rumor");
      const res = damageEnemy(dmg, "rumor", hitsWeak);
      if (res === "won") return;
      if (res === "1more") {
        battle.log = `${msg} (${dmg} Reality Shock! 1 MORE!)`;
        renderHudAndViews();
      } else {
        battle.log = `${msg} (${dmg} Reality Shock!)`;
        enemyTurn();
      }
    }

    $("act-guard").addEventListener("click", () => {
      if (!battle || battle.busy) return;
      $("rpg-subdrawer").hidden = true;
      battle.guarding = true;
      state.sp = Math.min(getMaxSp(), state.sp + 15);
      state.xDrive = Math.min(100, state.xDrive + 15);
      window.soundEngine.playGuardSfx();
      spawnBattleVfx("heal", "hero", "GUARD +15 SP", "#70d6ff");
      battle.log = "Kirana guarded! Incoming dmg cut by 72%, +15 SP & +15% X-Drive!";
      enemyTurn();
    });

    $("act-shiba").addEventListener("click", () => {
      if (!battle || battle.busy || battle.shibaCooldown > 0) return;
      $("rpg-subdrawer").hidden = true;
      battle.shibaCooldown = 2;
      battle.defDownTurns = 3;
      const dmg = Math.round(getAtk() * 1.15);
      state.hp = Math.min(getMaxHp(), state.hp + 25);
      state.xDrive = Math.min(100, state.xDrive + 20);
      window.soundEngine.playOneMoreSfx();
      const hitsWeak = battle.enemy.weaknesses.includes("shiba");
      const res = damageEnemy(dmg, "shiba", hitsWeak);
      if (res === "won") return;
      battle.log = `Baton Pass to Chris le Shiba! Dealt ${dmg} dmg, lowered Enemy DEF, & healed +25 HP!`;
      if (res === "1more") {
        renderHudAndViews();
      } else {
        enemyTurn();
      }
    });

    $("act-scan").addEventListener("click", () => {
      if (!battle || battle.busy) return;
      openSubdrawer("Psycho-Pass Sibyl Scanner (Free Action)", [
        {
          label: `Scan ${battle.enemy.name}`,
          sub: "Reveals enemy weaknesses",
          onClick: () => {
            $("rpg-subdrawer").hidden = true;
            battle.weaknessKnown = true;
            window.soundEngine.playScanSfx();
            battle.log = battle.enemy.scan;
            renderHudAndViews();
          }
        },
        ...C.rpg.sibylScans
          .filter((s) => s.target !== "boss")
          .map((s) => ({
            label: s.label,
            sub: "Sibyl Hue Check",
            onClick: () => {
              $("rpg-subdrawer").hidden = true;
              window.soundEngine.playScanSfx();
              battle.log = s.readout;
              renderHudAndViews();
            }
          }))
      ]);
    });

    $("act-items").addEventListener("click", () => {
      if (!battle || battle.busy) return;
      const opts = Object.keys(D.CONSUMABLES).map((k) => {
        const item = D.CONSUMABLES[k];
        const qty = state.inventory[k] || 0;
        return {
          label: `${item.name} (x${qty})`,
          sub: item.desc,
          disabled: qty <= 0,
          onClick: () => {
            $("rpg-subdrawer").hidden = true;
            state.inventory[k]--;
            window.soundEngine.playPourSfx();
            battle.log = applyConsumableEffect(item, true);
            enemyTurn();
          }
        };
      });
      openSubdrawer("Bag: Sweets & Supplies", opts);
    });

    $("act-xdrive").addEventListener("click", () => {
      if (!battle || battle.busy || state.xDrive < 100) return;
      $("rpg-subdrawer").hidden = true;
      state.xDrive = 0;
      const dmg = Math.round((getAtk() + getMag()) * 1.85) + 40;
      window.soundEngine.playSlashSfx();
      const res = damageEnemy(dmg, "purple", false);
      if (res === "won") return;
      battle.log = `TOKYO XANADU X-DRIVE! Kirana & Shiba unleashed ${dmg} dmg!`;
      enemyTurn();
    });

    $("act-flee").addEventListener("click", () => {
      if (!battle || battle.busy || battle.isBoss) return;
      $("rpg-subdrawer").hidden = true;
      if (Math.random() < 0.85) {
        window.soundEngine.playFlipSfx();
        window.soundEngine.stopBattleMusic(true);
        gameMode = "explore";
        battle = null;
        // Step back one tile safely
        const prev = state.trail[1];
        if (prev && isTileWalkable(prev.x, prev.y)) {
          state.px = prev.x;
          state.py = prev.y;
        }
        renderHudAndViews();
        setExploreNotice("Escaped safely back to the path!");
      } else {
        battle.log = "Could not escape this turn!";
        enemyTurn();
      }
    });

    // Ending & Bad Ending Retry Buttons
    $("rpg-newgame-btn").addEventListener("click", () => {
      window.soundEngine.playChimeSfx(false);
      state = createFreshState();
      gameMode = "explore";
      enterZone("cafe", 3, 4, false);
    });

    $("bad-load-btn").addEventListener("click", () => {
      if (!loadGame()) {
        state.hp = getMaxHp();
        state.sp = getMaxSp();
        gameMode = "explore";
        enterZone("cafe", 3, 4, false);
      }
    });

    $("bad-retry-cafe-btn").addEventListener("click", () => {
      state.hp = getMaxHp();
      state.sp = getMaxSp();
      gameMode = "explore";
      enterZone("cafe", 3, 4, false);
      setExploreNotice("Woke up back at Café Leblanc with all your gear and levels intact!");
    });

    const dlBtn = $("download-pass-btn");
    if (dlBtn) {
      dlBtn.addEventListener("click", () => {
        window.soundEngine.playChimeSfx(true);
        downloadOfficialPassPng(state);
      });
    }

    function loop(ts) {
      if (gameMode === "explore") {
        if (!isDialogueOpen && !isMenuOpen && !isLevelUpOpen && ts - mobMoveTimer > 950) {
          mobMoveTimer = ts;
          activeMobs.forEach((m) => {
            if (m.isBoss) return;
            const ny = m.y + m.dir;
            if (Math.abs(ny - m.homeY) <= 1 && isTileWalkable(m.x, ny) && !(m.x === state.px && ny === state.py)) {
              m.y = ny;
            } else {
              m.dir *= -1;
            }
          });
        }
        drawExploreCanvas(ts);
      } else if (gameMode === "battle") {
        drawBattleCanvas(ts);
      }
      animFrameId = requestAnimationFrame(loop);
    }

    enterZone("cafe", 3, 4, false);
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(loop);
  };

  function downloadOfficialPassPng(state) {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 440;
    const ctx = canvas.getContext("2d");

    const grad = ctx.createLinearGradient(0, 0, 800, 440);
    grad.addColorStop(0, "#150e24");
    grad.addColorStop(0.55, "#2b1647");
    grad.addColorStop(1, "#190f2b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 440);

    ctx.fillStyle = "rgba(199, 125, 255, 0.09)";
    for (let x = 20; x < 800; x += 22) {
      for (let y = 20; y < 440; y += 22) {
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.strokeStyle = "#c77dff";
    ctx.lineWidth = 6;
    ctx.strokeRect(18, 18, 764, 404);
    ctx.strokeStyle = "#e9c46a";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(30, 30, 740, 380);
    ctx.setLineDash([]);

    ctx.fillStyle = "#9d4edd";
    ctx.fillRect(54, 54, 330, 34);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("OFFICIAL BLACC CAR VIP VOUCHER", 72, 77);

    ctx.fillStyle = "#f4eefb";
    ctx.font = "bold 40px Impact, sans-serif";
    ctx.fillText("INFINITE CHOCO MILK & NAP PASS", 54, 140);

    ctx.fillStyle = "#e9c46a";
    ctx.fillRect(54, 160, 480, 4);

    ctx.fillStyle = "#d9ccf0";
    ctx.font = "20px sans-serif";
    ctx.fillText("Issued to: Kirana (The Lord of Goobers)", 54, 206);
    ctx.fillText(`Cleared Rank: Lv. ${state.level} Phantom Artist (Rank S)`, 54, 240);
    ctx.fillText("Redeemable for: Cold Choco Milk, Sweets & Guilt-Free Naps", 54, 274);

    ctx.fillStyle = "#0e0a16";
    ctx.fillRect(54, 314, 440, 68);
    ctx.strokeStyle = "#e9c46a";
    ctx.lineWidth = 2;
    ctx.strokeRect(54, 314, 440, 68);
    ctx.fillStyle = "#f4a261";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("APPROVED BY: CHRIS LE SHIBA", 74, 342);
    ctx.fillStyle = "#c77dff";
    ctx.font = "italic 22px Georgia, serif";
    ctx.fillText("from el goober, chris", 74, 369);

    ctx.beginPath();
    ctx.arc(655, 220, 88, 0, Math.PI * 2);
    ctx.fillStyle = "#120c1d";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#e9c46a";
    ctx.stroke();

    ctx.fillStyle = "#2b2538";
    ctx.strokeStyle = "#c77dff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(615, 200);
    ctx.lineTo(622, 162);
    ctx.lineTo(646, 188);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(695, 200);
    ctx.lineTo(688, 162);
    ctx.lineTo(664, 188);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(655, 224, 46, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#e9c46a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(638, 220, 7, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(672, 220, 7, Math.PI, 0);
    ctx.stroke();

    ctx.fillStyle = "#e9c46a";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("STAMPED ★", 614, 290);

    const link = document.createElement("a");
    link.download = "kirana-choco-milk-nap-pass.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }
})();
