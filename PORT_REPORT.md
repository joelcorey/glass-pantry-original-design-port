# Glass Pantry preservation port

## Responsive preservation update (October 28, 2026)

A narrow-screen layout layer now reflows the original Wix mesh below 980 px. It retains original assets, typefaces, colors and content; desktop styling stays intact. The original navigation wraps into touch targets with working submenu controls. Media retain their original proportions, recipe collections stack, and desktop grid spacers no longer create mobile gaps. The About introduction precedes its contact form on narrow screens.

`node scripts/check-responsive.mjs` passes 56 checks across nine page types: home, featured recipes, About, categories, glass, adventures, mushroom recipes, sourdough starter, and a blog post. It checks widths 320, 390, 430, 768 and 979 px, navigation tap targets, image bounds, submenu toggling, and navigation, including iPhone 13 touch emulation. At 1440 px, screenshots with the new stylesheet enabled and disabled are pixel-identical; desktop element bounds and type sizes also restore after resizing. Screenshots and results are in `verification/responsive/` and `verification/responsive-results.json`. The route regression still passes all 1,412 captured HTML routes (1,408 documents and four redirects). Existing uncaptured iframe/service content is outside this responsive change; no claim is made that those original capture gaps are repaired. Live Vercel deployment remains unverified.


## Vercel packaging fix (October 28, 2026)

The complete archive exceeded Vercel's 5 GB function limit, leaving an earlier deployment live. Binary captures now build into static `public/archive-assets/` files, while rewritable text is stored compressed in `data/runtime/`. Original archive URLs redirect to static files. The traced function contains 392,652,855 bytes and no binary captures. Build, 219 homepage image routing checks, all-manifest output existence checks, and production HTTP checks for image/font bytes and video range requests pass locally. The updated deployment has not yet been verified on Vercel.


## Delivery and verification status

The Next.js App Router / TypeScript implementation and production build are available. All captured site documents and recoverable response assets are included locally. **This delivery has not met the requested visual and interactive definition of done:** this environment prevents local HTTP listeners and Chromium processes, and its computer-use browser is unavailable. No screenshot match or browser interaction success is claimed.

## Image loading correction

The initial implementation used `request.url`'s origin when rewriting assets. In the running Next.js dev server this was `http://0.0.0.0:3000`, even when the page was opened at `http://localhost:3000`. All image URLs therefore pointed at the server bind address. The direct-handler tests had supplied `localhost` as the request origin and missed this deployment behavior.

The handler now uses the browser-facing `Host` header, or `X-Forwarded-Host` / `X-Forwarded-Proto` for a preview proxy. Localized text responses use `Cache-Control: no-cache` so old host-specific markup is not retained as fresh content.

Verified against the running HTTP server: all **73 home-page image/srcset URLs** return HTTP 200, the expected image MIME types, and bytes identical to the original assets. A forwarded HTTPS preview-host HTTP request also generates the correct image origin. Evidence: `verification/image-http-results.json`. The production build passes. Regression tests exercise all 73 image URLs for localhost, a LAN hostname, and an HTTPS preview proxy (219 image checks): `node scripts/check-image-routing.cjs`, results in `verification/image-routing-results.json`.

This verifies image delivery over HTTP, not rendered browser screenshots. A hard reload may be needed to discard markup cached by the earlier version.

## Original source and structure

Source: `/home/derpina/crawls/collections/glass-pantry/`, accessed read-only. The separate `/home/derpina/dev/glass-pantry/` project was not modified or used as the implementation source.

The collection contains seven compressed WARC archives and corresponding CDX indexes, a WACZ bundle, seed/extra page JSONL files, crawl reports/logs, and crawler browser-profile data. The profile's protected directories could not be opened; they are not website source assets. The WARC responses and all seven indexes were inspected/extracted. The WACZ listing contains the same seven archives, indexes, page lists, logs/reports, and package metadata (15 entries); it contains no screenshots. It is an alternate packaged representation, rather than an independent frontend repository. `verification/source-inventory.json` records its inventory and metadata. The skipped-page report lists 12,612 out-of-scope URLs.

The original is a Wix Thunderbolt site with server-rendered HTML, inline component styles, captured CSS files, React 18 viewer scripts, Wix application modules, blog data, fonts, image transformations, and embedded third-party widgets. It is not a conventional source-code checkout.

Discovered site URLs: **1,412**. Original statuses: **1,393 successful pages, 4 redirects, 15 error pages**. The exact case-sensitive list is [data/routes.json](data/routes.json).

Important route families:

- `/`: home page.
- `/featured-recipes`, `/food`, `/recipes-1`, `/wild-mushrooms`, `/glass`, `/adventures`, `/about-me`: principal navigation destinations.
- Individual recipe and information pages, including `/make-your-own-sourdough-starter`, `/care-and-keeping-sourdough-starter`, and `/morel-morchella-info`.
- `/single-post/...`: 259 captured blog/post URLs, including dated and descriptive slug variants.
- `/home/...`: 921 captured blog pagination, category, tag, and hashtag paths.
- `/Recipes/...`: 56 captured paths, including original `catagory` spelling and capitalization variants.
- `/Adventures/...`: 8 captured category paths.
- `/bread-and-sourdough/...`: 29 captured paths; `/mushrooms1/...`: 12 captured paths.

## Implementation

Next.js 16.2.6, App Router, and TypeScript. `app/[[...path]]/route.ts` serves original complete HTML documents through a dynamic App Router handler. This intentionally retains the existing document rendering rather than translating thousands of Wix component styles into approximate React components. There is no new visual design, component library, CSS reset, image replacement, or typography substitution.

`lib/archive.ts` locates extracted original response bodies. Original inline markup/styles, CSS classes, text, font declarations, media variants, and scripts are retained. Captured absolute asset URLs are relocated to `/_archive/<original-host>/<original-path>`, retaining their query strings. Site links point to the local origin; external navigation anchors retain their original destinations. JSON-escaped URLs are handled as well. Binary files are served unchanged. Original redirects and 404 documents retain their status codes. Binary byte ranges support video playback/seeking.

A small document-level click hook routes cross-page internal links through full document loads, because Wix SPA navigation depends on its live service environment. This preserves captured destination pages but changes the navigation lifecycle from Wix client routing. Hash links, modifier clicks, and new-tab targets retain native behavior. This hook's browser behavior remains unverified.

The original Wix runtime is preserved, not replaced with invented menus/forms. Whether its hydration, mobile switching, consent UI, pagination widgets, hover behavior, and external embeds work completely after relocation still requires browser testing. This is an archived-document migration hosted by Next.js, not a conversion of Wix component internals into independently maintained React components.

## Reused assets

Extraction recovered **30,469 HTTP responses**, stored as **30,437 distinct payload objects**, approximately **8.04 GB / 7.49 GiB** of payload bytes. The response manifest is `data/manifest.json`; extraction errors: **zero** (`data/extraction-errors.json`). These payloads are copied into the destination, so serving the port does not read from or require the original crawl.

Included response types:

| Type | Count |
| --- | ---: |
| JPEG | 16,404 |
| AVIF | 6,689 |
| JSON | 4,968 |
| HTML, including embedded documents | 1,549 |
| CSS | 171 |
| WOFF2 fonts | 46 |
| JavaScript, all captured MIME variants | 557 |
| PNG / WebP / GIF / SVG / BMP | 75 |
| MP4 | 3 |

Fonts include original Anton, DIN Neuzeit Grotesk, Playfair Display, and other captured font resources. The original transformed Wix images and SVGs are reused directly. No assets were generated.

## Checks performed

- Production `npm run build`: passed, including TypeScript and App Router generation. See `verification/build.log`. Next emits tracing warnings because the data directory contains tens of thousands of original files; the normal local production build succeeds. Keep `data/` alongside the application at runtime.
- Direct execution of the **compiled production route handler** for all **1,412 captured site routes**, independent of an HTTP listener.
- Original HTML reference bodies read directly from the original WARC offsets, rather than from the port. Comparison reverses the deliberate URL relocation/navigation hook and normalizes HTTP/HTTPS URL schemes.
- All **1,408 non-redirect HTML documents** match the original after that normalization; all **4 redirects** preserve their destinations and status codes. All **15 original 404 pages** preserve their original status/content.
- **145 sampled extracted assets** compared byte-for-byte with original WARC bodies.
- Compiled-handler checks for serving original WOFF2, CSS, JavaScript, AVIF, JPEG, and MP4 responses, including MIME types and binary content.
- Video prefix and suffix byte ranges, invalid-range 416 response, query-string page access, and uncaptured-route 404 response checked.

Evidence: `verification/route-results.json`, `verification/route-check.log`, and `verification/behavior-results.json`. Tests are repeatable with `node scripts/check-routes.cjs` and `node scripts/check-behavior.cjs` after building.

These are content/response checks, **not visual or DOM interaction checks**.

## Visual comparison and browser restrictions

Planned comparison sizes:

| Viewport | Width × height | Actual screenshot comparison |
| --- | --- | --- |
| Desktop | 1440 × 1000 | Blocked; not tested |
| Tablet | 768 × 1024 | Blocked; not tested |
| Mobile | 390 × 844 | Blocked; not tested |

Attempts to start both Next.js and the independent original WARC reference server failed with `EPERM: operation not permitted` when opening sockets. Chromium failed at launch with `setsockopt: Operation not permitted` and `SIGTRAP`. The alternate computer-use tool failed with `CUA_REPL_ENABLED_SURFACES is required`.

`verification/browser-attempt.log` records the Chromium failure. No screenshot artifacts exist; creating substitute images would misrepresent verification. `scripts/verify.mjs` is a ready-to-run Playwright comparison runner that intercepts original-site requests and responds with unmodified bodies read directly from the **original WARC files**. It captures both versions, performs the same lazy-load scroll sequence, and runs `scripts/compare.py` to generate difference images and pixel statistics under `verification/`. It defaults to six representative pages at all three sizes. `VERIFY_ROUTES` can expand the page set.

## Missing source and unresolved behavior

- Fourteen linked internal URLs have no matching captured HTML response. The exact audit list is in `verification/route-results.json` (`missing_internal_links`), including the blog feed, several old `/blog/...` URLs, and some recipe destinations. Their original links remain intact; no replacement page content was invented.
- Original error responses are preserved rather than filled with fabricated content.
- Uncaptured runtime requests return 404. Runtime-generated service query strings, expiring Wix tokens, and dynamic data can differ from recorded requests.
- Newsletter submission, authentication, analytics/advertising, social widgets, and external video/service behavior are not guaranteed by archived GET responses. No replacement backend or fabricated success response was added.
- Some external widgets were already blocked in the original crawl (including YouTube embeds noted in the captured page text).
- Only captured layouts are available. Whether Wix's original scripts produce the correct mobile and tablet layouts after relocation remains unverified.
- Menus, consent controls, hover/transition states, form submission, navigation clicks, and responsive rendering still require the browser QA pass requested by the task.

## Running locally

```bash
cd /home/derpina/dev/glass-pantry-original-design-port
npm install
npm run dev
# http://localhost:3000
```

For production: `npm run build` followed by `npm start`. Dependencies are already available in this workspace; a fresh machine needs npm registry access. No remote assets are required for responses present in the local manifest.

For browser QA on a machine allowing local servers and browser launches: keep the port running, install Playwright Chromium (`npx playwright install chromium`), and run `npm run verify`. The original crawl must remain available for independent reference reads. Python Pillow is required for pixel comparisons.
