# Screenshot Lab

A free, private screenshot styling tool by AI & Mac Lab. Images are processed locally in the browser with Canvas; there is no server upload, account, or watermark.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```bash
npm ci
npm run dev
```

Open the URL printed by Vite (normally `http://127.0.0.1:5173/`). For a production check:

```bash
npm run build
npm run preview
```

## Features

- Upload, drag and drop, or paste PNG, JPEG, and WebP images.
- Six backgrounds, three export ratios, image or browser frame, adjustable padding, corners, and shadow.
- Canvas-based PNG export at 1200×1600, 1200×1200, or 1600×900.
- English and Chinese interface. The bundled example image is original SVG artwork.

Files over 25 MB or images over 36 megapixels / 12,000 pixels per edge are rejected to limit browser memory use.

## GitHub Pages

Vite uses a relative asset base (`./`), so the built app works at a repository subpath such as `https://username.github.io/screenshot-lab/` as well as at a domain root. The workflow in `.github/workflows/pages.yml` is manual only. After creating a repository and reviewing the site, set **Settings → Pages → Build and deployment → GitHub Actions**, then run **Deploy to GitHub Pages** from the Actions tab. No deployment is triggered by this project on its own.
