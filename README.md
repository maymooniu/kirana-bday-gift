# Kirana's Birthday Website — Persona 5 × DKV Edition

An interactive birthday gift website built in a **Persona 5 × DKV (Visual Communication Design)** editorial aesthetic.

## What's Inside
1. **Monochrome-to-Color Gift Unwrap** — Starts in desaturated mist with a pulsing sealed envelope & glowing butterfly. Clicking **"Click Me"** triggers a dramatic Persona 5 Phantom Thief slash transition into vibrant color while mellow music fades in.
2. **Sweet Fuel Station** — Interactive **Choco Milk**, **Dark Truffle**, and **Strawberry Shortcake** treats with stat buffs & funny reactions.
3. **DKV Pantone Color Palette** — 6 clickable 3D Pantone swatches (*"Colors You Brought Into My World"*) that flip to reveal memories and traits.
4. **Confidant Rank Up** — Choose from 3 playful "goober" dialogue replies to level up your bond from `RANK 1` to `RANK MAX`.
5. **Phantom Thief Calling Card Poster** — Custom ransom-note-style Calling Card with an interactive **"Stamp Birthday Seal"** button.
6. **The Hermit Tarot Reveal** — Hovering golden lantern sparks + a soft, gentle white flash revealing a custom **IX — The Hermit** card paired with a meaningful note about her being a steady lantern in the dark.
7. **6 Hidden Clickable Easter Eggs** — Scattered doodles (Persona star, DKV pen, kitty paw, *Metaphor: ReFantazio* seeker wing, mini choco bar, and velvet butterfly) with secret notes and a completion surprise.
8. **Heartfelt Open Letter** — Signed `"from el goober, chris"`.

---

## How to Customize

Open **`content.js`** in any text editor:
- **Name & Date**: Update `recipientName`, `senderSignature`, and `dateBadge.monthDay` (currently `"11 / 20"`).
- **Memories & Dialogue**: Edit any swatch memory, Confidant choice/reply, Calling Card text, Easter egg message, or letter paragraphs.

### Adding Your Own Mellow Song (`.mp3`)
Right now, the site includes a built-in mellow lo-fi electric piano track (*"Beneath the Velvet Mist"*) so it works immediately with no extra files.
When you pick a specific song (like an instrumental *"Beneath the Mask"* or *"Sunset Bridge"*):
1. Create an `assets` folder here and place your audio file inside (e.g. `assets/song.mp3`).
2. In `content.js`, update `audio.customTrackUrl`:
   ```js
   audio: {
     customTrackUrl: "./assets/song.mp3",
     trackTitle: "Beneath the Mask (Instrumental)",
     volume: 0.45
   }
   ```

## How to Preview & Share
- **Preview locally**: Double-click `index.html` to open it directly in your browser.
- **Host online for free**: Drag and drop this entire folder into [Netlify Drop](https://app.netlify.com/drop) or push it to GitHub Pages to send her a live link!

