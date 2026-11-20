/**
 * ============================================================================
 *  KIRANA'S BIRTHDAY WEBSITE: EASY CUSTOMIZATION FILE
 *  Edit any text, memories, colors, photos, songs, or RPG data below!
 * ============================================================================
 */

window.SITE_CONTENT = {
  recipientName: "Kirana",
  senderSignature: "from el goober, chris",
  dateBadge: {
    monthDay: "11 / 20",
    weekday: "BIRTHDAY",
    weatherLabel: "Rainy Café Night"
  },

  // Audio Settings
  audio: {
    websitePlaylist: [
      {
        url: "./assets/website music/first song.mp3",
        title: "Velvet Rain Track 1"
      },
      {
        url: "./assets/website music/second song.mp3",
        title: "Velvet Rain Track 2"
      }
    ],
    generalBattleThemes: [
      {
        url: "./assets/general battle theme/Last Surprise.mp3",
        title: "Last Surprise (Persona 5)"
      },
      {
        url: "./assets/general battle theme/Take Over (Battle Theme) - Persona 5 Royal.mp3",
        title: "Take Over (Persona 5 Royal)"
      },
      {
        url: "./assets/general battle theme/Persona 3 Reload - Its Going Down Now (with Lyrics).mp3",
        title: "It's Going Down Now (P3R)"
      },
      {
        url: "./assets/general battle theme/Persona 4 Revival OST - Prime Time Golden Hour Show (Battle Theme).mp3",
        title: "Prime Time Golden Hour Show (P4)"
      },
      {
        url: "./assets/general battle theme/猛き者たちよ.mp3",
        title: "Warriors in Arms (Metaphor)"
      }
    ],
    bossBattleTheme: {
      url: "./assets/boss battle theme/Persona 4 Golden - Ill Face Myself ~ Alternate Battle Ver.mp3",
      title: "I'll Face Myself (Boss Battle)"
    },
    trackTitle: "Velvet Rain Track 1",
    volume: 0.45
  },

  // Act I: Monochrome Entry Screen (Before the Gift Unwraps)
  entry: {
    eyebrow: "MEMORY ARCHIVE // MONOCHROME",
    quote: "Recollection for le Gooberiorioriorioso",
    subquote: "you're still not spooky, but here you go",
    buttonLabel: "Click Me",
    hint: "Sound on recommended, tap to unwrap your gift"
  },

  // Act II: Hero & Sweet Fuel Station
  hero: {
    kicker: "RAINY CAFÉ EDITION // FOR THE BLACC CAR",
    headlineTop: "HAPPY BIRTHDAY,",
    headlineName: "KIRANA!",
    subtitle:
      "To my favorite DKV artist, JRPG adventurer, eepy eepy girl, and choco milk connoisseur. Thank you for showing up when I needed light the most, signed your local shiba.",
    tags: [
      "Purple Lover",
      "Persona 5 Royal & P2",
      "Metaphor: ReFantazio",
      "13 Sentinels",
      "Tokyo Xanadu",
      "Madoka Magica",
      "Yuri on Ice",
      "Psycho-Pass"
    ]
  },

  sweetStation: {
    title: "Leblanc Late Night Menu",
    subtitle: "Cozy rainy night treats. Tap to restore HP & SP!",
    items: [
      {
        id: "choco-milk",
        name: "Ice Cold Choco Milk",
        stat: "+999 COMFORT",
        icon: "milk",
        reaction: "SP fully restored! Honestly, choco milk fixes at least 80% of life's problems, especially on a rainy night."
      },
      {
        id: "truffle",
        name: "Velvet Dark Chocolate",
        stat: "+100 CHARM",
        icon: "chocolate",
        reaction: "Sweetness overload! Honestly, good chocolate and good company are undefeated."
      },
      {
        id: "shortcake",
        name: "Midnight Berry Cake",
        stat: "+MAX HAPPINESS",
        icon: "cake",
        reaction: "Make a wish, goober! May your naps be deep, your deadlines kind, and your snacks endless."
      }
    ]
  },

  // Act III: Blacc Car Scrapbook (6 Photos + Brief Chorus Previews on Click!)
  scrapbook: {
    eyebrow: "SECTION 01 // BLACC CAR ARCHIVES",
    title: "Certified Goober Sightings",
    subtitle:
      "Tap any polaroid to zoom in, read a note from your shiba, and hear the chorus from one of your favorite songs.",
    photos: [
      {
        id: "photo-1",
        src: "./assets/photos/kirana-1.jpg",
        badge: "EEPY MODE",
        caption: "The Eepy Eepy Girl in her natural habitat",
        note: "Morgana says you actually ARE allowed to go to sleep whenever you want today. Official shiba pardon granted.",
        songId: "watashi-wa-ame",
        songTitle: "Inabakumori: I'm the Rain (Watashi wa Ame)",
        previewUrl: "./assets/music for pictures/inabakumori - Im the Rain (Vo. Kaai Yuki) 稲葉曇『私は雨』Vo. 歌愛ユキ.mp3",
        chorusStart: 45,
        previewDurationSec: 15
      },
      {
        id: "photo-2",
        src: "./assets/photos/kirana-2.jpg",
        badge: "MAIN CHARACTER",
        caption: "Cardigan, tie, and maximum cool energy",
        note: "Honestly looks straight out of a Persona school arc. 10/10 protagonist aura right here.",
        songId: "heat-abnormal",
        songTitle: "Iyowa feat. Adachi Rei: Heat Abnormal",
        previewUrl: "./assets/music for pictures/熱異常 いよわ feat.足立レイ（Heat abnormal Iyowa feat.Adachi Rei）.mp3",
        chorusStart: 88,
        previewDurationSec: 15
      },
      {
        id: "photo-3",
        src: "./assets/photos/kirana-3.jpg",
        badge: "RAINY WINDOW",
        caption: "Flowers on a rainy day ride",
        note: "Raindrops on the glass and flowers in hand. Literally the exact cozy energy you brought into my whole year.",
        songId: "broken-heart-of-gold",
        songTitle: "ONE OK ROCK: Broken Heart of Gold",
        previewUrl: "./assets/music for pictures/ONE OK ROCK Broken Heart Of Gold (LYRIC VIDEO).mp3",
        chorusStart: 40,
        previewDurationSec: 18
      },
      {
        id: "photo-4",
        src: "./assets/photos/kirana-4.jpg",
        badge: "PHANTOM DRIP",
        caption: "Blacc Car looking super cool",
        note: "Red sweater, black mask, heart chain. Phantom Thief vibes on point, yet still the same goofy eepy girl underneath.",
        songId: "lost-again",
        songTitle: "Chase Atlantic: I Think I'm Lost Again",
        previewUrl: "./assets/music for pictures/Chase Atlantic - I THINK IM LOST AGAIN (Official Visualizer).mp3",
        chorusStart: 44,
        previewDurationSec: 15
      },
      {
        id: "photo-5",
        src: "./assets/photos/kirana-5.jpg",
        badge: "SIDE QUEST",
        caption: "Out exploring in style",
        note: "Spotted mid adventure. Probably searching for chocolate milk, sweets, or good vibes.",
        songId: "too-late",
        songTitle: "Chase Atlantic: Too Late",
        previewUrl: "./assets/music for pictures/Chase Atlantic - TOO LATE.mp3",
        chorusStart: 42,
        previewDurationSec: 15
      },
      {
        id: "photo-6",
        src: "./assets/photos/kirana-6.jpg",
        badge: "DKV MIRROR CHECK",
        caption: "Plaid jacket + the cutest phone charms",
        note: "Purple charm spotted, immaculate fit confirmed, and yes, the shiba officially approves.",
        songId: "velvet-birthday",
        songTitle: "Persona 5 Royal: I Believe",
        previewUrl: "./assets/music for pictures/I believe.mp3",
        chorusStart: 81,
        previewDurationSec: 16
      }
    ],
    dossier: {
      badge: "CLASSIFIED // BLACC CAR ID & SOUL DEVICE",
      title: "Gooberiorioriorioso: The Lord of Goobers",
      artBadgeSrc: "./assets/art/art-blacc-car-shiba.jpg",
      intro:
        "Known to the shiba as the Blacc Car and the Eepy Eepy Girl. Warning: extreme levels of sleepiness, cat appreciation, and chaotic goober energy.",
      soulDevice: {
        name: "Soul Device: Hermit's Lantern & DKV Stylus",
        stats: [
          { label: "Artistic Vision", value: "EX (MAX)" },
          { label: "Eepiness Level", value: "999 / 100" },
          { label: "Goober Energy", value: "INFINITE" },
          { label: "X-Drive Element", value: "Velvet Purple" }
        ]
      },
      buttonLabel: "Reveal Official Sacred Title",
      revealedLabel: "Sacred Title Unlocked!",
      sacredTitle:
        "so freaky gay kinky random schizo shorty violent sulky tsundere cute adorale stanky dirty minded pervert girlcracker girlkisser homosexual masochistic yandere gay kirana",
      afterNote: "And somehow still one of the chillest, funniest people I met all year. Never change, goober."
    }
  },

  // Kiraelin's Art Gallery (Her 5 Artworks!)
  artGallery: {
    eyebrow: "ART EXHIBITION // BY KIRAELIN",
    title: "The Blacc Car Sketchbook",
    subtitle:
      "You are honestly so talented. Here is a cozy dark gallery celebrating the art you made, tap any piece to inspect it up close.",
    pieces: [
      {
        id: "art-1",
        src: "./assets/art/art-blacc-car-shiba.jpg",
        badge: "BLACC CAR & SHIBA",
        title: "Sleepy Cuddle Doodle",
        note: "Still one of my favorite doodles ever. The black cat resting right on the sleepy shiba, drawn by you."
      },
      {
        id: "art-2",
        src: "./assets/art/art-kirana-self.jpg",
        badge: "SELF PORTRAIT // RPG AVATAR",
        title: "Purple Cat-Girl Kirana",
        note: "Round glasses, cat ears, tail, and the blep. Peak character design for the main hero of our RPG battle!"
      },
      {
        id: "art-3",
        src: "./assets/art/art-shiba-boy.jpg",
        badge: "SHIBA PORTRAIT",
        title: "Shiba Boy with Glasses",
        note: "Turtleneck, round glasses, and fluffy shiba ears. Official support character reporting for duty!"
      },
      {
        id: "art-4",
        src: "./assets/art/art-chibi.jpg",
        badge: "CHIBI STUDY",
        title: "Pocket Sized Goober",
        note: "So tiny and squishable. Looks like it belongs on an acrylic keychain or a café coaster."
      },
      {
        id: "art-5",
        src: "./assets/art/art-character-sheet.jpg",
        badge: "FULL CHARACTER SHEET",
        title: "Purple Aesthetic Illustration",
        note: "Look at the poses, expressions, dark coat, and purple palette here. Peak DKV artist energy!"
      }
    ]
  },

  // Act IV: Mini-RPG Game ("Palace of the Big Sad")
  rpg: {
    eyebrow: "SECTION 02 // INTERACTIVE MINI-RPG",
    title: "Battle: Palace of the Big Sad",
    subtitle:
      "Team up as Kirana (Blacc Car) & Shiba to shatter The Monochrome Gloom! Hit weaknesses for 1 MORE!, spread Persona 2 rumors, scan with Psycho-Pass Sibyl, and purify your Madoka Soul Gem.",
    player: {
      name: "Kirana (Blacc Car)",
      title: "Arcana IX: The Hermit",
      maxHp: 140,
      maxSp: 80,
      portrait: "./assets/art/art-kirana-self.jpg",
      supportPortrait: "./assets/art/art-shiba-boy.jpg"
    },
    boss: {
      name: "The Monochrome Gloom",
      subtitle: "Shadow of Grayscale & Evil Alarm Clocks",
      maxHp: 260,
      weaknesses: ["purple", "rumor"]
    },
    rumors: [
      {
        id: "rumor-goober",
        label: "Rumor: Kirana is Supreme Lord of Goobers",
        effectText: "Persona 2 Rumor becomes reality! Kirana's attacks hit way harder with Goober Power!",
        buffType: "atk"
      },
      {
        id: "rumor-yuri",
        label: "Rumor: Yuri on Ice Gold Medal Grace",
        effectText: "Born to Make History! Kirana glides cleanly across the battlefield, boosting Soul Gem & evasion!",
        buffType: "soul"
      },
      {
        id: "rumor-shiba",
        label: "Rumor: Shiba has Infinite Choco Milk",
        effectText: "Rumor confirmed true! Shiba brings an endless supply of comfort healing for the party!",
        buffType: "regen"
      }
    ],
    sibylScans: [
      {
        target: "boss",
        label: "Scan Boss: Monochrome Gloom",
        readout: "Sibyl Hue: Dull Static Gray. Weaknesses detected: Velvet Purple (Pantone Slash) and Persona 2 Rumors!"
      },
      {
        target: "kirana",
        label: "Scan Kirana (Blacc Car)",
        readout: "Sibyl Hue: Luminous Deep Violet. Goober Coefficient: 999 (Off the charts, peak eepy energy & artistic genius)."
      },
      {
        target: "shiba",
        label: "Scan Shiba (Chris)",
        readout: "Sibyl Hue: Clear & Warm Amber. Status: Stabilized after hanging out with the Blacc Car."
      },
      {
        target: "morgana",
        label: "Scan Morgana (The Cat)",
        readout: "Sibyl Hue: Sleepy Midnight Blue. Enforcement Action: Give the eepy eepy girl an immediate nap pass!"
      }
    ],
    thoughtCloud: [
      {
        id: "tc-rain",
        keyword: "Rainy Café Night",
        note: "13 Sentinels Fragment: Like sitting safely inside a warm café watching purple rain fall outside."
      },
      {
        id: "tc-rumor",
        keyword: "Innocent Rumor",
        note: "Persona 2 Fragment: Every silly joke between Blacc Car and Shiba turned into real comfort this year."
      },
      {
        id: "tc-soulgem",
        keyword: "Pure Soul Gem",
        note: "Madoka Fragment: Even when days get dark, you never lose your warmth and kindness."
      },
      {
        id: "tc-lantern",
        keyword: "Hermit's Lantern",
        note: "Persona & Metaphor Fragment: A steady light guiding someone safely home through the dark."
      }
    ],
    victoryLoot: {
      title: "ALL-OUT BIRTHDAY ATTACK! PALACE CLEARED!",
      rewardTitle: "KEY ITEM UNLOCKED: INFINITE CHOCO MILK & NAP PASS",
      rewardDesc:
        "Redeemable anytime with your shiba for cold chocolate milk, sweet treats, cat memes, and guilt free eepy naps."
    }
  },

  // Act V: DKV-Inspired Pantone Color Palette
  paletteSection: {
    eyebrow: "SECTION 03 // DKV COLOR STUDY",
    title: "Colors You Brought Into My World",
    subtitle:
      "Every DKV designer knows color changes everything. Click each Pantone swatch to flip it and see what you brought back into my life.",
    swatches: [
      {
        id: "purple",
        pantoneCode: "PANTONE 266 C",
        hex: "#9D4EDD",
        name: "Kirana Purple",
        role: "Your Signature Color",
        memory:
          "Your favorite color, and honestly it fits your whole vibe. Rich, creative, and cozy, just like the good energy you brought into this year."
      },
      {
        id: "amber",
        pantoneCode: "PANTONE 1495 C",
        hex: "#F4A261",
        name: "Café Amber",
        role: "For Warmth & Comfort",
        memory:
          "Hanging out with you feels like sitting inside a warm, quiet café while it rains outside. You made heavy days way easier to get through."
      },
      {
        id: "crimson",
        pantoneCode: "PANTONE 185 C",
        hex: "#E63946",
        name: "Phantom Crimson",
        role: "For Your Spark",
        memory:
          "Your passion for art, DKV projects, and Persona 5 has this bold, unmistakable fire. Watching you light up over the things you love is genuinely contagious."
      },
      {
        id: "cocoa",
        pantoneCode: "PANTONE 476 C",
        hex: "#6F4E37",
        name: "Choco Milk Brown",
        role: "For Sweet Joy",
        memory:
          "A dedicated swatch for your elite taste in chocolate, sweets, and especially choco milk. May your fridge never run empty of the good stuff."
      },
      {
        id: "cerulean",
        pantoneCode: "PANTONE 2925 C",
        hex: "#4EA8DE",
        name: "Velvet Sky",
        role: "For Lighter Days",
        memory:
          "When my head was noisy and dark, you somehow made things feel lighter without even trying. Suddenly the sky had color in it again."
      },
      {
        id: "gold",
        pantoneCode: "PANTONE 1235 C",
        hex: "#E9C46A",
        name: "Seeker's Gold",
        role: "For JRPG Wonder",
        memory:
          "From Persona to Metaphor: ReFantazio, 13 Sentinels, and Tokyo Xanadu, your imagination belongs in a grand story. Even our dumbest jokes feel like legendary quests."
      }
    ]
  },

  // Act VI: Confidant Rank Up Mini-Interaction
  confidant: {
    eyebrow: "SECTION 04 // CONFIDANT EVENT",
    arcanaLabel: "ARCANA III: THE EMPRESS",
    portraitSrc: "./assets/art/art-shiba-boy.jpg",
    portraitCaption: "CHRIS LE SHIBA",
    promptSpeaker: "Chris le Shiba",
    promptLine: "\"You're too goofy\"",
    choices: [
      {
        id: "choice-nuh-uh",
        label: "\"Nuh uh, you are\"",
        response:
          "Chris le Shiba grins: \"Okay fine, we are both goofy, and honestly that is why Blacc Car and Shiba get along so well.\""
      },
      {
        id: "choice-classes",
        label: "\"My classes are goofy\"",
        response:
          "Chris le Shiba laughs: \"Hey, surviving those goofy classes just makes you look even cooler, gooberiorioriorioso. You deserve a nap and choco milk!\""
      },
      {
        id: "choice-im-not",
        label: "\"I'm not tho\"",
        response:
          "Chris le Shiba smirks: \"Says the eepy eepy girl who literally drew us as a black cat and a shiba. Nice try, Blacc Car.\""
      }
    ],
    rankUpTitle: "CHRIS LE SHIBA: BOND AT MAX",
    rankUpSubtitle: "You reached MAX Rank with The Empress Confidant! Thanks for bringing good vibes and color back this year.",
    perkTitle: "CONFIDANT ABILITY UNLOCKED: INFINITE SHIBA SUPPORT",
    perkDesc: "Grants unlimited choco milk deliveries, endless eepy nap passes, and a loyal shiba cheering you on."
  },

  // Act VII: Phantom Thief Calling Card Poster
  callingCard: {
    eyebrow: "SECTION 05 // SPECIAL DELIVERY",
    toLine: "TO: KIRANA, THE LORD OF GOOBERS",
    headline: "YOU BROUGHT THE COLOR BACK",
    body:
      "At a time when things felt stuck in heavy static and grayscale, you showed up with quiet kindness, chaotic Blacc Car humor, and good energy. You helped clear away the gloom and painted the rain in purple and gold. As punishment for being such a great friend this year, you are hereby sentenced to a chill birthday filled with cats, sweets, choco milk, and long cozy naps.",
    signOff: "YOUR SHIBA, CHRIS",
    designSpecNote: "DKV Print Note: Set in Velvet Purple, Crimson & Midnight Café Ink. 100% genuine appreciation, zero counterfeit vibes."
  },

  // Act VIII: The Hermit Tarot Card Reveal
  hermit: {
    eyebrow: "SECTION 06 // ARCANA REVEAL",
    title: "The Hermit",
    instruction: "Click the face-down card to reveal your Arcana",
    cardNumber: "IX",
    cardTitle: "THE HERMIT",
    lanternQuote:
      "\"The Hermit carries a glowing lantern, not to hide from the world, but to light a steady path through the dark for anyone lost in it.\"",
    personalNote:
      "I know The Hermit is your favorite card, and honestly it fits you so well. When I was really depressed and mentally unstable, everything felt foggy and hard to navigate. You did not have to do anything loud or flashy. Just having you around felt like a quiet, steady lantern holding back the dark until I could find my footing again."
  },

  // Hidden Clickable Micro-Surprises (6 Scattered Easter Eggs -> Charges Soul Gem!)
  easterEggs: [
    {
      id: "egg-star",
      label: "Phantom Star",
      title: "Secret Note #1: Looking Cool!",
      message: "Morgana voice: \"Whoa! Looking cool, Blacc Car!\" And since Morgana is literally a cat, he is officially your biggest fan today."
    },
    {
      id: "egg-brush",
      label: "DKV Pen",
      title: "Secret Note #2: DKV Respect",
      message: "Reminder from your shiba: your eye for art and design is genuinely amazing. Never doubt how talented you are, even when deadlines get crazy."
    },
    {
      id: "egg-paw",
      label: "Kitty Paw",
      title: "Secret Note #3: Blacc Car Nap Pass",
      message: "Official cat council decree: the eepy eepy girl is encouraged to nap as long as she wants, dream sweet dreams, and wake up to chocolate."
    },
    {
      id: "egg-fairy",
      label: "Seeker Wing",
      title: "Secret Note #4: Metaphor & 13 Sentinels",
      message: "Gallica says: \"A royal birthday quest has been issued! Reward: endless sweets, cozy rainy nights, and a very happy year ahead.\""
    },
    {
      id: "egg-choco",
      label: "Mini Choco",
      title: "Secret Note #5: Emergency Stash",
      message: "You found the hidden chocolate stash! Officially certified 100% sweet, 0% stress, because birthday rules apply all day."
    },
    {
      id: "egg-butterfly",
      label: "Velvet Butterfly",
      title: "Secret Note #6: Madoka & Velvet Room",
      message: "\"The arcana is the means by which all is revealed...\" Your Soul Gem is shining bright purple, and meeting you this year was easily one of the best plot twists."
    }
  ],

  // Act IX: Final Heartfelt Letter
  letter: {
    eyebrow: "FINAL NOTE // OPEN LETTER",
    salutation: "Dear Kirana,",
    paragraphs: [
      "Happy Birthday, gooberiorioriorioso! I wanted to make something fun for you because you honestly deserve a solid celebration and some appreciation for everything this year.",
      "Meeting you this year truly felt like a blessed opportunity. There was a point not long ago where I was really depressed, overwhelmed, and mentally unstable, and having you around felt like catching a breather inside a quiet rainy café. You brought laughs, silly Blacc Car and Shiba chaos, and some much needed color back into days that used to feel completely grayscale.",
      "Whether you are grinding through DKV art projects, nerding out over Persona 5 Royal, Persona 2, Metaphor: ReFantazio, 13 Sentinels, or Tokyo Xanadu, rewatching Madoka Magica, Yuri on Ice, or Psycho-Pass, petting cats, taking another eepy eepy girl nap, or grabbing an ice cold choco milk and something sweet, I hope you know how much good energy you bring to the people around you.",
      "Thank you for being yourself, for sticking around, and for making this year genuinely way better to look back on. Wishing you a great birthday, zero stressful deadlines, and an awesome year ahead."
    ],
    closing: "Best wishes from your favorite shiba,",
    signature: "from el goober, chris"
  }
};
