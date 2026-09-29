# Pathfinder Startups

Standalone HTML, CSS, and JavaScript reproduction of the HPE Startup Ecosystem design. No application framework, runtime dependency, or build step is required.

## Preview

Open [index.html](index.html) in a browser. Fonts and images are local, and the page works without a development server.

## Publishing

- Final public URL: https://pathfinder.hpe.com/ (not yet configured in the temporary upload).
- Repository: https://github.com/luketa8/pathfinder-startups
- Deploy `index.html`, `styles.css`, `app.js`, and their referenced `assets/` files to any static host. Keep the directory structure intact; use a directory URL ending in `/` or a direct `index.html` URL so relative paths resolve correctly.
- The sibling `../pathfinder-upload/` directory is the upload-only snapshot. It excludes source-control files, development dependencies, tests, QA screenshots, documentation, previous exports, and GitHub Pages configuration. The required Lucide asset license is retained.
- No application build, server-side runtime, or GitHub Pages hosting is required. Recreate the upload snapshot after editing the source.
- Public sharing of the included prototype content, fonts, images, and video was approved by the project owner for this repository.

## Search and Sharing

The temporary page includes a descriptive title, search description, active `noindex` directive, Open Graph and Twitter metadata, and WebPage JSON-LD. The original index/follow robots tag is preserved verbatim in an HTML comment. All site-owned resource references, including the social-preview image, are directory-relative. Genuine external HPE contact/legal links and the schema.org vocabulary remain absolute.

Canonical, Open Graph page URL, WebPage URL, and the sitemap are omitted until the permanent domain is deployed. Sitemaps require absolute URLs, and social crawlers may not accept relative preview-image URLs. At launch on `https://pathfinder.hpe.com/`, restore those metadata URLs and sitemap using the final domain and make social-image URLs absolute. Update the launch checks at the same time. Keep `noindex` until indexing is explicitly approved; it does not restrict public access.

There is no project-level robots.txt: crawlers read it at the host root, not inside a temporary subdirectory. Any host-level crawl restrictions must be reviewed by the hosting owner.

## Source

- [Figma frame 158:1281](https://www.figma.com/design/WcZsgox6JORDtcACH59HVA/Pathfinder-Evolution-Startup-Ecosystem?node-id=158-1281)
- Desktop reference width: 1920 pixels. The approved company carousel and revised button sizing make the current page 9366 pixels tall.
- Mobile layout is an interpretation of the desktop frame; no mobile reference was supplied.
- HPE Graphik Light, Regular, Medium, and XXCondensed Light/Regular are copied from the local HPE web checkout. The design-system package's English font stylesheet identifies the same HPE-hosted font files.
- Button styling follows the HPE consumer stylesheet pattern, adapted to native HTML links and buttons.
- Figma image assets are stored locally. The logo's text fill is set to white to match the frame's dark theme; the export defaulted to black.
- The supplied arrow and chevron paths are embedded as separate CSS masks to avoid Chromium's `file:` SVG-mask CORS restriction and inherit each control's color.
- The added mobile menu/close icons are Lucide 0.468.0 assets; their license is included in [assets/LUCIDE-LICENSE](assets/LUCIDE-LICENSE).
- [assets/favicon.svg](assets/favicon.svg) is the exact SVG declared by hpe.com's homepage at `https://www.hpe.com/content/dam/hpe/favicons/favicon.svg`, retrieved on 2026-09-25. Its light/dark color-scheme behavior is preserved.

## Behavior

The page is public immediately, with no password gate or session-storage dependency. Content and in-page links remain available without JavaScript; the mobile menu, biography modals, carousel buttons, and video playback require JavaScript.

Navigation, program comparison, and exploration CTAs link to the corresponding sections. The header's Connect with HPE link opens `mailto:pathfinder@hpe.com`. The mobile menu supports Escape and closes when a destination is selected. The closing contact link opens HPE's general contact page; no form or backend submission is implemented.

Both background sections use the supplied [assets/hero-bg.mp4](assets/hero-bg.mp4), muted, looping, and inline. Playback starts when a section enters the viewport and pauses off-screen or when the tab is hidden. There are no native or custom play/pause controls, as requested. Reduced motion prevents initial video loading and displays the original still; loading failures and blocked autoplay also retain that fallback. The closing video preserves the designed 180-degree rotation.

The company carousel replaces the reference's placeholder grid with twelve supplied logos and acquisition details. Logos have individual optical sizing without modifying the source files. The list is keyboard-focusable; its controls retain focus at either boundary using guarded `aria-disabled` states, and reduced motion disables animated scrolling. The mobile header scrolls internally when the expanded menu is taller than the viewport.

All three Read Full Bio buttons open a native modal styled from [Figma frame 295:2396](https://www.figma.com/design/WcZsgox6JORDtcACH59HVA/Pathfinder-Evolution-Startup-Ecosystem?node-id=295-2396), with Escape, close-button, and outside-click dismissal, keyboard focus containment and restoration, background scroll lock, and scrollable content. Opening and closing use 140ms eased fade/scale transitions, disabled for reduced motion. Clicking content or dragging from inside to outside does not dismiss the modal. Full biographies and modal eyebrows are supplied by the user and stored in each card's `.team-bio` template in `index.html`; the short card summaries remain unchanged. Elena's supplied modal eyebrow is "Pathfinder Partner" while her biography describes her as an Analyst; both are preserved as supplied.

## Pending Content

- Confirm final program, contact, legal, and cookie-preference destinations before production use. General HPE links are provisional, and there is no consent-management integration.
- Company names, short team summaries, repeated journey-step copy, and repeated "Why HPE" descriptions are transcribed from Figma, not independently verified.
- Review WCAG 2.2.2 (Pause, Stop, Hide) before claiming accessibility conformance: looping motion runs longer than five seconds without a page-level pause mechanism. Operating-system reduced-motion support and passing automated axe checks do not establish conformance.
- Letter spacing is zero outside the biography modals, which use the supplied Figma tracking. Exact glyph positions and line wrapping can differ; browser font rasterization also differs from Figma.
- Publication of this prototype does not grant third parties redistribution rights to HPE fonts, brand assets, or portrait photography.

## Validation

```sh
npm ci
npx playwright install chromium
npm test
```

To run the same checks against the deployed site:

```sh
SITE_URL=https://pathfinder.hpe.com/ npm test
```

The development-only suite checks Chromium at widths 1920, 1440, 768, 390, and 320: local font/image loading, console errors, horizontal overflow, text overflow, in-page targets, mobile navigation (including a 320 x 256 viewport), carousel keyboard/boundary behavior, and automated WCAG 2/2.1/2.2 A/AA rules supported by axe with the mobile menu closed and open. At 1920px, it also verifies the reference-derived section boundaries with the approved carousel/button adjustments, total page height, and portrait dimensions. These geometry checks are not a zero-difference pixel comparison.

Launch tests verify public access, directory-relative resources, external HPE destinations, section links across reloads, unavailable session storage, content without JavaScript, metadata consistency, and favicon/social-image decoding. Biography tests cover all supplied paragraphs, focus, dismissal, short animations, reduced motion, and long-content scrolling. Video tests additionally verify inline muted playback without controls, off-screen pausing, closing-section rotation, and reduced-motion preference changes at all five sizes.

Screenshots are generated in `qa/` and excluded from git. The Figma reference screenshot is a QA artifact, never rendered as page content. Automated accessibility checks do not replace assistive-technology testing. Safari/iOS and Firefox are not yet verified.

### Preflight Results (2026-09-29)

- All 75 Chromium checks passed against the upload-only copy served over local HTTP at `/preview/nested/`, across all five configured viewports, including automated axe checks, biographies, video playback, and directory-relative resource loading.
- The package contains 35 files (6,320,240 bytes), with copied-file hashes verified against the source. Unused artwork, developer files, previous exports, and GitHub Pages configuration are excluded.
- `node --check app.js` and `git diff --check` passed. Stale desktop geometry expectations were corrected to match the unchanged committed layout (9366px page height and 416px hero content); no page layout was changed for this adjustment.
- Final-domain search/social metadata, manual accessibility review, and Safari/iOS/Firefox testing remain open as described above. No live temporary-host URL was supplied; rerun the checks against that host after uploading.
- This preflight did not commit, push, or deploy changes.

## Files

- [index.html](index.html): semantic content and destinations.
- [styles.css](styles.css): design values, local fonts, layout, and responsive rules.
- [app.js](app.js): mobile navigation, biography modals, carousel controls, and background-video playback.
- [tests/site.spec.js](tests/site.spec.js): repeatable browser checks.
- [tests/launch.spec.js](tests/launch.spec.js): public-access and metadata checks.

The directory name and package name are `pathfinder-startups`.