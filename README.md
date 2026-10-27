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

Keep `data/` with the application. It contains approximately 7.6 GB of original response bodies; it is required at runtime. No connection to the source crawl is required to run the port.

The complete original route list is in `data/routes.json`. See `PORT_REPORT.md` for verification status and limitations.

## Verification

```bash
npm run build
node scripts/check-routes.cjs
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
