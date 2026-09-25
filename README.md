# Pathfinder Startups

Standalone HTML, CSS, and JavaScript reproduction of the HPE Startup Ecosystem design. No application framework, runtime dependency, or build step is required.

## Preview

Open [index.html](index.html) in a browser. Fonts and images are local, and the page works without a development server.

## Publishing

- Public prototype: https://luketa8.github.io/pathfinder-startups/
- Repository: https://github.com/luketa8/pathfinder-startups
- GitHub Pages serves the root of `main`; pushing to `main` triggers deployment.
- [.nojekyll](.nojekyll) disables Jekyll processing. No build step is required.
- Public sharing of the included prototype content, fonts, images, and video was approved by the project owner for this repository.

## Search and Sharing

The page includes a descriptive title, search description, index/follow directive, canonical URL, Open Graph and Twitter metadata, and WebPage JSON-LD. [sitemap.xml](sitemap.xml) lists the public page. The existing hero artwork is used as the social preview image.

All absolute metadata URLs target `https://luketa8.github.io/pathfinder-startups/`. Before moving to another domain or path, update the canonical, Open Graph URL/image, Twitter image, JSON-LD URL, sitemap, and corresponding launch test expectations together. Submit the sitemap in the verified site's search-console account after deployment; metadata alone does not guarantee indexing.

There is no project-level robots.txt: crawlers read it at the host root, not under `/pathfinder-startups/`. Any host-level crawl restrictions must be reviewed by the hosting owner.

## Source

- [Figma frame 158:1281](https://www.figma.com/design/WcZsgox6JORDtcACH59HVA/Pathfinder-Evolution-Startup-Ecosystem?node-id=158-1281)
- Desktop reference width: 1920 pixels. The approved company carousel and revised button sizing make the current page 9368 pixels tall.
- Mobile layout is an interpretation of the desktop frame; no mobile reference was supplied.
- HPE Graphik Light, Regular, Medium, and XXCondensed Light/Regular are copied from the local HPE web checkout. The design-system package's English font stylesheet identifies the same HPE-hosted font files.
- Button styling follows the HPE consumer stylesheet pattern, adapted to native HTML links and buttons.
- Figma image assets are stored locally. The logo's text fill is set to white to match the frame's dark theme; the export defaulted to black.
- The supplied arrow and chevron paths are embedded as separate CSS masks to avoid Chromium's `file:` SVG-mask CORS restriction and inherit each control's color.
- The added mobile menu/close icons are Lucide 0.468.0 assets; their license is included in [assets/LUCIDE-LICENSE](assets/LUCIDE-LICENSE).
- [assets/favicon.svg](assets/favicon.svg) is the exact SVG declared by hpe.com's homepage at `https://www.hpe.com/content/dam/hpe/favicons/favicon.svg`, retrieved on 2026-09-25. Its light/dark color-scheme behavior is preserved.

## Behavior

The page is public immediately, with no password gate or session-storage dependency. Content and in-page links remain available without JavaScript; the mobile menu, carousel buttons, and video playback require JavaScript.

Navigation, program comparison, and exploration CTAs link to the corresponding sections. The mobile menu supports Escape and closes when a destination is selected. The closing contact link opens HPE's general contact page; no form or backend submission is implemented.

Both background sections use the supplied [assets/hero-bg.mp4](assets/hero-bg.mp4), muted, looping, and inline. Playback starts when a section enters the viewport and pauses off-screen or when the tab is hidden. There are no native or custom play/pause controls, as requested. Reduced motion prevents initial video loading and displays the original still; loading failures and blocked autoplay also retain that fallback. The closing video preserves the designed 180-degree rotation.

The company carousel replaces the reference's placeholder grid with twelve supplied logos and acquisition details. Logos have individual optical sizing without modifying the source files. The list is keyboard-focusable; its controls retain focus at either boundary using guarded `aria-disabled` states, and reduced motion disables animated scrolling. The mobile header scrolls internally when the expanded menu is taller than the viewport.

## Pending Content

- Full-bio buttons are disabled prototype placeholders, as agreed. Supply the three destination URLs before enabling them.
- Confirm final program, contact, legal, and cookie-preference destinations before production use. General HPE links are provisional, and there is no consent-management integration.
- Company names, biographies, repeated journey-step copy, and repeated "Why HPE" descriptions are transcribed from Figma, not independently verified.
- Review WCAG 2.2.2 (Pause, Stop, Hide) before claiming accessibility conformance: looping motion runs longer than five seconds without a page-level pause mechanism. Operating-system reduced-motion support and passing automated axe checks do not establish conformance.
- Letter spacing is zero to follow the implementation constraints. Figma uses negative tracking on some text, so exact glyph positions and line wrapping can differ. Browser font rasterization also differs from Figma.
- Publication of this prototype does not grant third parties redistribution rights to HPE fonts, brand assets, or portrait photography.

## Validation

```sh
npm ci
npx playwright install chromium
npm test
```

To run the same checks against the deployed site:

```sh
SITE_URL=https://luketa8.github.io/pathfinder-startups/ npm test
```

The development-only suite checks Chromium at widths 1920, 1440, 768, 390, and 320: local font/image loading, console errors, horizontal overflow, text overflow, in-page targets, mobile navigation (including a 320 x 256 viewport), carousel keyboard/boundary behavior, and automated WCAG 2/2.1/2.2 A/AA rules supported by axe with the mobile menu closed and open. At 1920px, it also verifies the reference-derived section boundaries with the approved carousel/button adjustments, total page height, and portrait dimensions. These geometry checks are not a zero-difference pixel comparison.

Launch tests verify public access, section links across reloads, unavailable session storage, content without JavaScript, metadata consistency, and favicon/social-image decoding. Video tests additionally verify inline muted playback without controls, off-screen pausing, closing-section rotation, and reduced-motion preference changes at all five sizes.

Screenshots are generated in `qa/` and excluded from git. The Figma reference screenshot is a QA artifact, never rendered as page content. Automated accessibility checks do not replace assistive-technology testing. Safari/iOS and Firefox are not yet verified.

### Preflight Results (2026-09-25)

- All 50 Chromium checks passed over local HTTP across the five configured viewports, including automated axe checks.
- `npm audit` reported zero vulnerabilities; `node --check app.js` and `git diff --check` passed.
- Final copy, destinations, biography links, manual accessibility review, and cross-browser testing remain open as described above.
- This preflight did not commit, push, or deploy changes. Rerun the deployed-site checks after publication.

## Files

- [index.html](index.html): semantic content and destinations.
- [styles.css](styles.css): design values, local fonts, layout, and responsive rules.
- [app.js](app.js): mobile navigation and background-video playback.
- [tests/site.spec.js](tests/site.spec.js): repeatable browser checks.
- [tests/launch.spec.js](tests/launch.spec.js): public-access and metadata checks.
- [sitemap.xml](sitemap.xml): canonical public-page listing for search engines.

The directory name and package name are `pathfinder-startups`.