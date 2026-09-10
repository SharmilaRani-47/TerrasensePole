# TerraSense — hackathon booth app

Mobile-first single-page app for the booth QR code. Pure static HTML/CSS/JS — no build step, no backend, no accounts.

## What's here

- `index.html` — the whole app (pitch content + 3 interactive demos + deck viewer)
- `assets/style.css`, `assets/app.js` — styles and logic
- `assets/deck.pdf` — compressed conversion of the deck, used by the in-page viewer
- `assets/vendor/` — pdf.js, bundled locally (no CDN dependency, works on any network)
- `.nojekyll` — tells GitHub Pages to serve `assets/` as-is
- **Not included**: `assets/deck.pptx`. The original pitch deck is 42MB, over GitHub's 25MB web-upload cap, so it's hosted as a **GitHub Release asset** instead (tag `v1.0`) and the "Download PPTX" button links straight there.

## Deploy (GitHub Pages)

1. Upload everything in this folder to the **root** of the repo (`index.html` sits directly at the repo root, not inside a subfolder).
2. In the repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch**. Branch: `main` (or whichever has these files), folder: **/ (root)**. Save.
3. GitHub gives you the live URL — for this repo it will be:
   `https://sharmilarani-47.github.io/TerrasensePole/`
4. Open that URL on a phone before the booth goes live and check: page loads, all three demo tabs work, the deck preview renders, and both download buttons work.

## PPTX hosting (GitHub Release)

`deck.pptx` is too large for the repo itself, so it's attached to the **`v1.0` release** on this repo instead:
`https://github.com/SharmilaRani-47/TerrasensePole/releases/tag/v1.0`

The "Download PPTX" button in `index.html` points directly at the release asset:
`https://github.com/SharmilaRani-47/TerrasensePole/releases/download/v1.0/deck.pptx`

To update it: upload a new `deck.pptx` to that same release (or a new one) via **Releases → v1.0 → edit → attach file**, keeping the filename `deck.pptx` so the existing link keeps working. If you retag or rename the file, update the href in `index.html` to match.

## Updating the deck later

For the PDF preview: replace `assets/deck.pdf` and push — no code changes needed. For the PPTX: see "PPTX hosting" above. To regenerate the PDF from a new PPTX, convert it (PowerPoint's own "Export as PDF" works fine) and keep the filename `deck.pdf`.

## QR code

Point any QR generator at the live Pages URL above once it's confirmed working, or use the one already generated for this repo.
