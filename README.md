# The Glass Pantry — original design port

This Next.js 16 App Router / TypeScript application serves the original captured Wix documents, styles, runtime, fonts, and media. No replacement design is applied.

```bash
npm install
npm run dev
```

Open http://localhost:3000. The dependencies are already available in this workspace.

For production:

```bash
npm run build
npm start
```

`npm run build` prepares the original captures for deployment: binary assets go into `public/archive-assets/`, and compressed text goes into `data/runtime/`. Both directories are generated and ignored by Git. Keep them with the production application, along with `data/manifest.json` and `data/static-extensions.json`. No connection to the source crawl is required.

On Vercel, use `npm run build` as the Build Command so asset preparation runs. Binary assets are served as static CDN files; existing `/_archive/` URLs redirect to them. The function bundle excludes the original `data/objects/` archive and static binaries. The verified trace is approximately 393 MB, below the 5 GB limit; projects using the standard 250 MB limit still need Vercel Large Functions enabled.

The original desktop layout is preserved. Below 980 pixels, `public/responsive.css` and `public/responsive.js` reflow the existing Wix components into a readable column, preserve image proportions, and wrap the original navigation with accessible submenu controls. Original artwork, fonts, colors, and content remain in place.

The complete original route list is in `data/routes.json`. See `PORT_REPORT.md` for verification status and limitations.

## Verification

```bash
npm run build
node scripts/check-routes.cjs
node scripts/check-image-routing.cjs
node scripts/check-behavior.cjs
# With npm start running:
node scripts/check-static-delivery.cjs
# Chrome installed locally (or set CHROMIUM_PATH):
node scripts/check-responsive.mjs
# In a second terminal, with the website running:
npx playwright install chromium
npm run verify
```

The browser comparison reads reference responses directly from the original WARC files, not the port. Set `CRAWL_ROOT` if that collection has moved; set `PORT_ORIGIN` to test a different local port. `CHROMIUM_PATH` optionally selects an installed Chromium executable. Python Pillow is needed to produce difference images.

The comparison suite covers desktop 1440×1000, tablet 768×1024, and mobile 390×844. Browser verification could not run inside the current restricted environment; the scripts are supplied for execution where local servers and Chromium are permitted.

To repeat source extraction (source is always read-only):

```bash
python scripts/extract.py
```
