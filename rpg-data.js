/**
 * ============================================================================
 *  CHRONICLES OF THE PURPLE CAFE: RPG DATA (ZONES, GEAR, SKILLS, MOBS, STORY)
 * ============================================================================
 */

window.RPG_DATA = {
  WEAPONS: {
    pencil: {
      id: "pencil",
      name: "Starter Sketch Pencil",
      atk: 6,
      mag: 4,
      crit: 0.05,
      price: 0,
      desc: "Reliable DKV graphite pencil. Balanced starter gear."
    },
    stylus: {
      id: "stylus",
      name: "Hermit's Purple Stylus",
      atk: 13,
      mag: 15,
      crit: 0.1,
      price: 55,
      desc: "+13 ATK, +15 MAG, +10% Crit. Boosts Purple & Magic skills."
    },
    heavyBrush: {
      id: "heavyBrush",
      name: "Crimson Palette Blade",
      atk: 24,
      mag: 8,
      crit: 0.14,
      price: 90,
      desc: "+24 ATK, +8 MAG, +14% Crit. Heavy physical artist weapon."
    },
    royalBrush: {
      id: "royalBrush",
      name: "Royal Velvet Brush",
      atk: 22,
      mag: 26,
      crit: 0.18,
      price: 140,
      desc: "+22 ATK, +26 MAG, +18% Crit. Ultimate DKV Phantom weapon."
    }
  },

  OUTFITS: {
    cardigan: {
      id: "cardigan",
      name: "Cozy Café Cardigan",
      hp: 15,
      def: 2,
      sp: 0,
      price: 0,
      desc: "+15 Max HP, +2 DEF. Warm and comfy."
    },
    thiefCoat: {
      id: "thiefCoat",
      name: "Phantom Purple Coat",
      hp: 35,
      def: 6,
      sp: 15,
      price: 75,
      desc: "+35 Max HP, +6 DEF, +15 Max SP. Stylish trench coat."
    },
    eepyHoodie: {
      id: "eepyHoodie",
      name: "Oversized Blacc Car Hoodie",
      hp: 70,
      def: 9,
      sp: 10,
      price: 115,
      desc: "+70 Max HP, +9 DEF, +10 Max SP. Peak cozy armor."
    }
  },

  ACCESSORIES: {
    glasses: {
      id: "glasses",
      name: "Comfy Round Glasses",
      hp: 10,
      atk: 2,
      mag: 4,
      crit: 0.04,
      price: 0,
      desc: "+10 HP, +2 ATK, +4 MAG. Classic Kirana look."
    },
    catEars: {
      id: "catEars",
      name: "Cat Ear Headphones",
      hp: 20,
      atk: 7,
      mag: 7,
      crit: 0.14,
      price: 65,
      desc: "+20 HP, +7 ATK/MAG, +14% Crit. Morgana approved."
    },
    soulCharm: {
      id: "soulCharm",
      name: "Purified Soul Charm",
      hp: 40,
      atk: 10,
      mag: 14,
      crit: 0.16,
      startXDrive: 35,
      price: 120,
      desc: "+40 HP, +10 ATK, +14 MAG, starts fights with 35% X-Drive."
    }
  },

  CONSUMABLES: {
    chocoMilk: {
      id: "chocoMilk",
      name: "Ice Cold Choco Milk",
      price: 20,
      desc: "Restores 75 HP and 25 SP.",
      effect: "heal_hpsp"
    },
    truffle: {
      id: "truffle",
      name: "Velvet Dark Truffle",
      price: 25,
      desc: "Restores 50 SP and cures all debuffs.",
      effect: "heal_sp_cleanse"
    },
    shortcake: {
      id: "shortcake",
      name: "Midnight Berry Cake",
      price: 40,
      desc: "Restores 135 HP and grants +35% X-Drive.",
      effect: "heal_hp_xd"
    },
    coffee: {
      id: "coffee",
      name: "Leblanc Special Coffee",
      price: 35,
      desc: "Boosts ATK & MAG by 35% for 3 turns.",
      effect: "buff_power"
    }
  },

  SKILLS: {
    pantoneSlash: {
      id: "pantoneSlash",
      name: "Pantone Slash",
      cost: 12,
      type: "purple",
      power: 1.5,
      desc: "Purple DKV brush slash. Hits Purple weakness for 1 MORE!"
    },
    soulPurify: {
      id: "soulPurify",
      name: "Soul Gem Purify",
      cost: 10,
      type: "support",
      desc: "Madoka cleanse: removes debuffs and grants a 2-turn Purple Shield."
    },
    miracleCatnap: {
      id: "miracleCatnap",
      name: "Morgana's Miracle Punch",
      cost: 15,
      type: "phys",
      power: 1.75,
      highCrit: true,
      desc: "Unlocked from Morgana! High crit strike + heals 25 HP."
    },
    rumorShift: {
      id: "rumorShift",
      name: "Persona 2: Spread Rumor",
      cost: 14,
      type: "rumor",
      power: 1.15,
      desc: "Unlocked in Alley! Rumors become battle reality and hit Rumor weakness."
    },
    royalSlash: {
      id: "royalSlash",
      name: "Metaphor: Royal Slash",
      cost: 22,
      type: "gold",
      power: 2.35,
      desc: "Unlocked in Labyrinth! Massive golden Seeker cleave."
    }
  },

  MOBS: {
    sleepyDrone: {
      id: "sleepyDrone",
      name: "Snooze Gremlin",
      spriteType: "gremlin",
      maxHp: 85,
      atk: 14,
      weaknesses: ["purple", "phys"],
      exp: 28,
      coins: 28,
      dropChance: 0.65,
      dropItem: "chocoMilk",
      scan: "Sibyl Hue: Grumpy Alarm Gray. Weak to Purple & Miracle Punch."
    },
    staticWisp: {
      id: "staticWisp",
      name: "Grayscale Static Wisp",
      spriteType: "wisp",
      maxHp: 110,
      atk: 18,
      weaknesses: ["purple", "rumor"],
      exp: 36,
      coins: 36,
      dropChance: 0.65,
      dropItem: "truffle",
      scan: "Sibyl Hue: Flickering Static. Weak to Purple & Persona 2 Rumors."
    },
    deadlineShadow: {
      id: "deadlineShadow",
      name: "2 AM Deadline Shade",
      spriteType: "shade",
      maxHp: 145,
      atk: 23,
      weaknesses: ["gold", "rumor"],
      exp: 48,
      coins: 48,
      dropChance: 0.75,
      dropItem: "coffee",
      scan: "Sibyl Hue: Caffeinated Panic. Weak to Royal Gold & Rumors!"
    }
  },

  BOSSES: {
    alarmBoss: {
      id: "alarmBoss",
      name: "6 AM Alarm Drone",
      subtitle: "Chapter 1 Guardian",
      spriteType: "alarmBoss",
      maxHp: 185,
      atk: 20,
      weaknesses: ["purple", "shiba"],
      exp: 70,
      coins: 80,
      dropItem: "shortcake",
      scan: "Sibyl Hue: Loud Morning Gray. Weak to Purple Art & Shiba Baton Pass!"
    },
    witchBoss: {
      id: "witchBoss",
      name: "Artblock Labyrinth Witch",
      subtitle: "Chapter 2 Guardian",
      spriteType: "witchBoss",
      maxHp: 270,
      atk: 26,
      weaknesses: ["purple", "rumor"],
      exp: 105,
      coins: 120,
      dropItem: "shortcake",
      scan: "Sibyl Hue: Muddy Eraser Dust. Weak to Purple & Persona 2 Rumors! Telegraphs big hits."
    },
    finalBoss: {
      id: "finalBoss",
      name: "The Monochrome Gloom",
      subtitle: "Ruler of the Grayscale Palace",
      spriteType: "finalBoss",
      maxHp: 390,
      atk: 31,
      weaknesses: ["purple", "rumor", "gold"],
      exp: 200,
      coins: 250,
      dropItem: "shortcake",
      scan: "Sibyl Hue: Pitch Static Void. Weak to Purple, Rumors & Metaphor Gold! Watch for Static Wipeout!"
    }
  },

  // 3 Explorable Zones (16x10 grid each)
  // # wall, . floor, T obstacle/counter, S save point, D next portal, B back portal
  ZONES: {
    cafe: {
      id: "cafe",
      name: "Zone 1: Café Leblanc Safe Room",
      hint: "Explore the café, talk to Chris le Shiba & Morgana, save at the crystal, then head right into the Alley!",
      map: [
        "################",
        "#..T....T.....S#",
        "#..............#",
        "#..T....T......#",
        "#..............D",
        "#..............D",
        "#..TTTT........#",
        "#..............#",
        "#.........C....#",
        "################"
      ],
      spawnFromRight: { x: 13, y: 4 },
      spawnDefault: { x: 3, y: 4 },
      portals: [
        { x: 15, y: 4, targetZone: "alley", targetX: 1, targetY: 4 },
        { x: 15, y: 5, targetZone: "alley", targetX: 1, targetY: 5 }
      ],
      chests: [
        { id: "chest-cafe-1", x: 10, y: 8, rewardType: "item", rewardId: "chocoMilk", qty: 2, label: "2x Ice Cold Choco Milk" }
      ],
      npcs: [
        {
          id: "npc-shiba",
          name: "Chris le Shiba",
          sprite: "shiba",
          x: 5,
          y: 2,
          type: "shop"
        },
        {
          id: "npc-morgana",
          name: "Morgana",
          sprite: "morgana",
          x: 2,
          y: 7,
          type: "morganaQuest"
        }
      ],
      mobs: []
    },

    alley: {
      id: "alley",
      name: "Zone 2: Rainy Sleepless Alley",
      hint: "Fight roaming mobs for Star Coins & XP, talk to the Rumor Girl, open chests, and defeat the 6 AM Alarm Drone!",
      map: [
        "################",
        "#..#......C....#",
        "#..#..####.....#",
        "#..............#",
        "B..............D",
        "B..............D",
        "#.....####.....#",
        "#..C...........#",
        "#.........#....#",
        "################"
      ],
      spawnFromLeft: { x: 1, y: 4 },
      spawnFromRight: { x: 13, y: 4 },
      portals: [
        { x: 0, y: 4, targetZone: "cafe", targetX: 14, targetY: 4 },
        { x: 0, y: 5, targetZone: "cafe", targetX: 14, targetY: 5 },
        { x: 15, y: 4, targetZone: "labyrinth", targetX: 1, targetY: 4, requiresBoss: "alarmBoss" },
        { x: 15, y: 5, targetZone: "labyrinth", targetX: 1, targetY: 5, requiresBoss: "alarmBoss" }
      ],
      chests: [
        { id: "chest-alley-1", x: 10, y: 1, rewardType: "weapon", rewardId: "stylus", label: "Hermit's Purple Stylus" },
        { id: "chest-alley-2", x: 3, y: 7, rewardType: "item", rewardId: "truffle", qty: 2, label: "2x Velvet Dark Truffle" }
      ],
      npcs: [
        {
          id: "npc-rumor",
          name: "Kuzunoha Rumor Girl",
          sprite: "npcViolet",
          x: 6,
          y: 1,
          type: "rumorUnlock"
        },
        {
          id: "npc-cat",
          name: "Alley Tuxedo Cat",
          sprite: "morgana",
          x: 12,
          y: 7,
          type: "healCat"
        }
      ],
      mobs: [
        { id: "mob-a1", mobId: "sleepyDrone", x: 5, y: 4 },
        { id: "mob-a2", mobId: "staticWisp", x: 9, y: 5 },
        { id: "boss-alley", bossId: "alarmBoss", x: 13, y: 4, isBoss: true }
      ]
    },

    labyrinth: {
      id: "labyrinth",
      name: "Zone 3: Velvet Labyrinth & Throne",
      hint: "Unlock Metaphor: Royal Slash from the Seeker Fairy, beat the Artblock Witch, then challenge The Monochrome Gloom!",
      map: [
        "################",
        "#C....#........#",
        "#..#..#..####..#",
        "#..#...........#",
        "B..............#",
        "B..............#",
        "#.....####.....#",
        "#........#....C#",
        "#..............#",
        "################"
      ],
      spawnFromLeft: { x: 1, y: 4 },
      portals: [
        { x: 0, y: 4, targetZone: "alley", targetX: 14, targetY: 4 },
        { x: 0, y: 5, targetZone: "alley", targetX: 14, targetY: 5 }
      ],
      chests: [
        { id: "chest-lab-1", x: 1, y: 1, rewardType: "outfit", rewardId: "thiefCoat", label: "Phantom Purple Coat" },
        { id: "chest-lab-2", x: 14, y: 7, rewardType: "accessory", rewardId: "soulCharm", label: "Purified Soul Charm" }
      ],
      npcs: [
        {
          id: "npc-gallica",
          name: "Seeker Fairy",
          sprite: "fairy",
          x: 3,
          y: 7,
          type: "royalUnlock"
        }
      ],
      mobs: [
        { id: "mob-l1", mobId: "deadlineShadow", x: 4, y: 4 },
        { id: "boss-witch", bossId: "witchBoss", x: 8, y: 4, isBoss: true },
        { id: "boss-final", bossId: "finalBoss", x: 13, y: 4, isBoss: true }
      ]
    }
  }
};

