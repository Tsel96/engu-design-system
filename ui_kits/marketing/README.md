# engu — Marketing UI Kit

Recreation of the engu.cz-style marketing surface, built from the brand foundation: big Apparat type at scale, full-bleed greens, golden-yellow accent, and an editorial card rhythm.

## Files
- `index.html` — composed landing page demo (hero → features → ages → testimonial → CTA → footer).
- `Navbar.jsx` — sticky top nav with logo lockup, links, and primary CTA.
- `Hero.jsx` — display-type hero with Piazzolla italic accent and a yellow button.
- `FeatureRow.jsx` — alternating image/text editorial rows.
- `AgeTiles.jsx` — a 3-up of age-tier cards (light + brand + ink).
- `Testimonial.jsx` — parent quote on the cream surface.
- `CtaBlock.jsx` — ink-green full-bleed CTA with the logomark.
- `Footer.jsx` — multi-column footer on ink green.

All components import tokens from `../../colors_and_type.css`. No external CSS frameworks. Lucide icons via CDN.

## What's faithful
- Color usage (#5AA57C primary, #122119 ink, #FFD633 accent).
- Apparat heavy at hero scale (84–96px).
- The pill button with the layered drop shadow.
- 20px card radius.
- Bilingual EN / CZ headline pattern.

## What's a placeholder
- Photography slots use `<image-slot>` so the user can drop in real engu screenshots / classroom shots.
- The 8-prong logomark in `assets/` doubles as a decorative shape — that matches the brand's preference for typography + a single mark over invented illustrations.
