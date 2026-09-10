# TerraSense — hackathon booth app

Mobile-first single-page app for the booth QR code. Pure static HTML/CSS/JS — no build step, no backend, no accounts.

## What's here

- `index.html` — the whole app (pitch content + 3 interactive demos + deck viewer)
- `assets/style.css`, `assets/app.js` — styles and logic
- `assets/deck.pdf` — compressed conversion of the deck, used by the in-page viewer
- `assets/vendor/` — pdf.js, bundled locally (no CDN dependency, works on any network)
- `.nojekyll` — tells GitHub Pages to serve `assets/` as-is
- **Not included** (too large to hand over in chat) — see step 2 below: `assets/deck.pptx`, the original pitch deck.

## Deploy (GitHub Pages)

1. Upload everything in this folder to the **root** of the repo (`index.html` sits directly at the repo root, not inside a subfolder).
2. Add your original `.pptx` file too: rename it to exactly `deck.pptx` and put it in `assets/` alongside `deck.pdf`. The "Download PPTX" button on the page links to `assets/deck.pptx` — without this file, that one button 404s (everything else, including the deck preview, works without it).
3. In the repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch**. Branch: `main` (or whichever has these files), folder: **/ (root)**. Save.
4. GitHub gives you the live URL — for this repo it will be:
   `https://sharmilarani-47.github.io/TerrasensePole/`
5. Open that URL on a phone before the booth goes live and check: page loads, all three demo tabs work, the deck preview renders, and both download buttons work.

## Updating the deck later

Replace `assets/deck.pptx` and `assets/deck.pdf` and push — no code changes needed. To regenerate the PDF from a new PPTX, convert it (PowerPoint's own "Export as PDF" works fine) and keep the filename `deck.pdf`.

## QR code

Point any QR generator at the live Pages URL above once it's confirmed working, or use the one already generated for this repo.
