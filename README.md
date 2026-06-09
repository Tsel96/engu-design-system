# Engu Design System

> A design system for **engu** — a playful, safe virtual world where children learn by playing. Built inside **Bohemia Interactive** (the largest Czech game studio).

This skill packages the visual + verbal foundation of the brand so an agent can generate well-branded engu artifacts: marketing pages, app screens, slides, posters, throwaway prototypes, and production code alike.

---

## Sources

The system was distilled from two Figma files mounted into this project as a virtual filesystem:

- **Brand Foundation.fig** — `/Logo`, `/Colors`, `/Typography`, `/Grids`, `/Spacings`. Contains the brand guidelines page, the Apparat / Inter Display lockups, the green/yellow/black/semantic color scales, the spacing token system, and the breakpoint set. (8 pages, 68 frames.)
- **Design System.fig** — Listed in the project brief with component pages for /Buttons, /Cards, /Inputs, /Navbar, /Footer, /Toast, /Tooltip, /Table, /Switch, /Stepper, /Avatar, /Chips, /Dropdown, /Checkbox, /Radio, etc. (27 pages, 81 frames.) **⚠ Not currently mounted in this workspace.** The components in `ui_kits/` are reconstructed from the Brand Foundation tokens + the screenshots of the Button / Color-Swatch components that did mount under `/external-shared/` and `/Logo/external/`. **Ask the user to re-attach Design System.fig** to get the rest of the components 1:1.

Fonts uploaded by the user:
- `Inter Display` — the full family of TTF weights (Thin → Black, plus matching italics). Bundled in `fonts/`.
- `Apparat` — loaded from Adobe Typekit (`https://use.typekit.net/chm5jtz.css`). User-supplied kit.
- `Piazzolla 24pt` — secondary italic accent. Loaded via Google Fonts in the artifacts that use it.
- `Wallop` — appears in the Figma file for two large headline styles but no font file was uploaded; falls back to Apparat in this system.

---

## What engu is

> "A unique platform where children learn by playing. In the largest Czech game studio, Bohemia Interactive, we've created a safe, richly interactive virtual world that nurtures curiosity and rewards exploration." — engu brand guidelines

Key product attributes pulled from the guidelines copy:
- **For kids.** Missions, puzzles, open-ended challenges.
- **Learning outcomes.** Creativity, logical thinking, digital skills, confidence, perseverance.
- **Adaptive.** Difficulty + age-appropriate content adapt per learner.
- **Collaborative.** Teamwork, communication, empathy.
- **Trustworthy for adults.** Parent + teacher dashboards, alignment to educational goals.
- **Bilingual.** Czech + English copy ships side-by-side throughout the guidelines.

Related sub-brand: **Edu centrum** — the educator/curriculum arm. Its logotype is part of the same brand kit (`assets/educentrum-wordmark.svg`).

---

## Naming

- The brand is **`engu`** — *one word, lowercase `e`*.
- Capitalize only at the start of a sentence: "Engu".
- It is the **brand name of the application**, not "engu app". Never "Engu App" or "ENGU".

---

## CONTENT FUNDAMENTALS

The engu voice is **warm, plainspoken, and parent-safe** — it's a brand that talks about children without talking down to them, and about technology without sounding cold. The brand guidelines themselves are written in this exact register: declarative, present tense, no exclamation points, no hype words.

### Voice attributes
- **Warm + assured.** "A unique platform where children learn by playing." Confident statements about what the product *is*, not what it *can* do.
- **Gentle imperative for guidance.** "Provide plenty of space around engu assets. Make them big or make them small, but give them room to breathe." — collegial, never bossy.
- **First-person plural for the company.** "we've created a safe, richly interactive virtual world…" — Bohemia speaks as a team.
- **Second-person for the reader.** "Get in touch if you have questions." Direct, never marketing-cliché.
- **No emoji.** Not used in any source copy. Don't add them in interface text, marketing, or slides.
- **No exclamation points** in body copy. Headlines can use them sparingly only if joyful, never urgent.

### Casing
- **Lowercase `engu`** in body copy and lockups. Brand wordmark is set in Apparat Heavy, all lowercase, with negative tracking.
- **Sentence case** for headlines and titles (the system favors big Apparat words in sentence case, not Title Case or ALL CAPS).
- **ALL CAPS + wide letter-spacing (16%) only for small labels** (10–12px). Used sparingly, e.g. category eyebrows like "HORIZONTAL", "VERTICAL", "TEXT PARAGRAPH". This is the *only* place where caps is appropriate.

### Length + rhythm
- Headlines run long and lyrical when they need to ("Resources for presenting the engu brand consistently and professionally.") — they're set in Apparat at 48–84px, and the tight tracking/leading lets them breathe across multiple lines.
- Body copy is dense but never wall-of-text: 14–18px Inter Display, 140% line-height.
- Lists use full sentences, not telegraphic fragments.

### Vocabulary
- **Use:** learn, play, explore, curiosity, creativity, missions, puzzles, adventure, community, parents, teachers, safe, virtual world.
- **Avoid:** *gamified, AI-powered, leverage, unlock, supercharge, revolutionary, magical*, and any other tech-marketing word.
- **Tone toward children:** describing them, not addressing them. The product talks to *adults* about kids; in-app copy aimed at kids would be its own register and is not represented in the source files.

### Bilingual handling
Czech and English appear in parallel in source files. When generating bilingual artifacts: render the English first, then the Czech below it in the same type style at a lighter weight or smaller size. Don't translate machine-style — keep both languages full-fidelity (the source uses idiomatic Czech, not a literal mirror of the English).

### Sample copy from the source (use as reference voice)
> "Engu is a single word, spelled with a low-case e. Capitalize it at the start of a sentence: 'Engu'. It is the brand name of our application (not 'engu app')."

> "Provide plenty of space around engu assets. Make them big or make them small, but give them room to breathe. They shouldn't feel cramped or cluttered."

> "Comfortable against light and dark backgrounds, engu's primary brand color is a medium, muted green with cool, slightly bluish undertones."

---

## VISUAL FOUNDATIONS

### The system in one sentence
**Big Apparat type, full-bleed greens, generous radii, a single golden-yellow accent, and breathing room.** No gradients. No drop-shadows on art. No textures. The brand earns its energy from contrast (ink green vs. yellow) and from confident type at scale.

### Color
- **One primary brand color: `#5AA57C`** (engu-green 500) — a medium, muted green with cool, slightly bluish undertones. Comfortable against both light and dark backgrounds.
- **Ink green `#122119`** is the canonical dark background. Use it full-bleed for hero sections, nav bars on dark themes, and full slide backgrounds.
- **Yellow `#FFD633`** is the *only* accent color. Used as a fill for Piazzolla 24pt italic accent words, as a button fill (`#FFEB99` soft yellow with `#332900` text), and as a callout.
- **Near-white `#FCFCFC` + cream `#EEF6F2`** are the two light surfaces. The cream (very pale green) softens long-form content; pure white is reserved for cards on cream.
- **Greyscale is true neutral** — no warm or cool tint. Used only for borders, captions, and disabled states.
- **Semantic colors** (info/success/warning/error) are saturated single hues, *not* pastel. Each pairs with a deep tinted-dark background tone for filled states.
- **Never use bluish-purple gradients, candy gradients, or rainbow accents.** The yellow accent does all the work the brand needs.

### Typography
Three families, three jobs:
1. **Apparat** (Heavy, 900) — every display moment, headline, hero, big number. Tight tracking (-3 to -4%), tight leading (0.82–1.0). Set in lowercase.
2. **Piazzolla 24pt** (Black Italic) — accent words *inline* with Apparat headlines, **always in the opposite color of the surrounding Apparat**: green + yellow, or white + yellow, never matched. Used sparingly — a single italicized word in a headline.
3. **Inter Display** (Regular 400 → Bold 700, occasional Medium 500) — body, UI labels, paragraphs. 140% line-height. -1% tracking.

**Wallop (Heavy)** appears in two places in the figma source as an alternate display weight — treat it as a fallback / second-tier display, not a primary choice.

### Backgrounds + surface treatment
- **Full-bleed solid color** is the dominant treatment — entire slide / hero / card painted ink green or muted green, with type laid directly on top.
- **No noise textures, no grain, no scanlines, no patterns.** Surfaces are flat.
- **No gradients**, period — neither linear, radial, nor mesh. The only exception is when an SVG illustration uses one internally.
- **Tinted cream (`#EEF6F2`)** is used as a soft full-bleed background when ink green would be too heavy.
- **Card on solid color**: a white or near-white card with 20px radius and soft drop shadow sitting on top of a colored surface is the canonical layout pattern.

### Imagery (when used)
The brand guidelines themselves don't ship photography — they're typographic. When imagery is required:
- **Warm, naturally-lit, no heavy filters or grading.** Outdoor / play / classroom scenes.
- **Real children playing, not stock smiles.** Mid-action shots > posed.
- **No black-and-white, no duotone, no grain.** Color-true.
- For product screenshots, frame them inside a card with 20px radius; no decorative gradient mat behind them.

### Animation
The source files don't ship motion specs. Defaults for engu artifacts:
- **Easing:** `cubic-bezier(0.22, 1, 0.36, 1)` (out-expo-like) for entrances; `cubic-bezier(0.34, 1.56, 0.64, 1)` (gentle spring) for playful button presses; `cubic-bezier(0.65, 0, 0.35, 1)` for re-positioning.
- **Durations:** 180ms for micro (hover, focus), 320ms for layout, 600–800ms for hero entrances.
- **Fade + small upward translate (8–12px)** is the canonical entrance.
- **No bounces, no parallax, no autoplay video**. Motion is calm.

### Hover, focus, press
- **Hover (light surfaces):** background darkens 4–6% (or moves one step in the scale). Text color stays.
- **Hover (filled buttons):** background lightens by ~6% (yellow button gets even softer), shadow lifts by 2px.
- **Focus:** 2px outer ring in `--engu-green` at 0.6 opacity, with 2px offset. Never the browser default.
- **Press:** background darkens 4–6% AND the element shrinks to `scale(0.98)` over 80ms. Shadow shortens.
- **Disabled:** 40% opacity, no pointer events. No greying out of the color.

### Borders + dividers
- **Cards:** no border on the cream surface; 1px `rgba(0,0,0,0.08)` border on white cards floating on cream.
- **Inputs:** 1px `rgba(0,0,0,0.12)` border at rest, 2px `--engu-green` border on focus.
- **Dividers:** 1px `rgba(0,0,0,0.08)`, never full black.

### Shadows
Two systems:
- **Button stack** (from figma source): a five-stop layered drop shadow that fades quickly, gives buttons a tactile press-down feel without smearing.
  ```
  0 0 1px rgba(0,0,0,0.15),
  0 1px 1px rgba(0,0,0,0.13),
  0 3px 2px rgba(0,0,0,0.08),
  0 5px 2px rgba(0,0,0,0.02),
  0 8px 2px rgba(0,0,0,0.00)
  ```
- **Card lift:** `0 1px 2px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.06)` for floating cards. A second, deeper `0 24px 48px rgba(18,33,25,0.12)` is reserved for modals and hover-lift states.
- No inner shadows on inputs. No glow effects.

### Corner radii
Generous, characterful. Cards are **20px**, big surfaces **24px**, swatches/tiles **16px**, small chips/inputs **12px**, micro **6px**. Buttons are **fully pill-rounded** (999px) at every size.

### Cards
- 20px radius
- Either flat-on-color (no shadow) when sitting on a contrasting surface, or floating (shadow-card) on cream/white.
- Padding scales with size: 24px for compact cards, 48px for hero cards.
- Internal type follows the standard scale; never reduce body text below 14px inside a card.

### Capsules + chips
- Pill-shaped (`border-radius: 999px`).
- 14×8 to 16×12 padding depending on size.
- Small chips use `t-label-md` (uppercase 12px) for category badges; medium chips use `t-body-sm` (sentence case) for filters.

### Transparency + blur
Used sparingly. The brand prefers solid surfaces. When blur is appropriate (mobile nav overlay, modal backdrop):
- Backdrop blur 16–24px with a 60% near-black overlay.
- Don't use blur as a decorative effect — only for hierarchy.

### Layout
- **8pt base grid**, with 2pt and 4pt micro steps for type-tight situations.
- **Container max-width 1440px** for desktop; comfortable left/right gutter at every breakpoint.
- **Breakpoints:** mobile 320–809, tablet 810–1199, desktop 1200+. (Pulled from `/Grids/Breakpoints`.)
- **Fixed elements** are uncommon — engu's interfaces favor scroll-based reveal over sticky chrome. The one fixed pattern is the top navbar on long marketing pages; collapses on scroll.

### Visual rhythm + variety
- **Alternate full-bleed ink green and cream sections** on long pages to give a sense of cadence.
- **Use the yellow accent at most once per screen** as either: an italicized accent word, a primary button, or a single shape callout. Never two of these at once.
- The brand's energy comes from *type at scale* + *one strong accent*, not from many decorations.

---

## ICONOGRAPHY

The brand ships a **distinctive custom logomark** (an 8-prong asterisk / compass-rosette) and otherwise relies on a **stroke-only line icon set** at 16px and 24px.

### What we have
- **Brand logomark**: `assets/engu-logomark.svg` — the iconic 8-prong shape (cardinal + diagonal arrows merging into a flat base). Drawn from the figma `EnguLogomarkGreen` path. Use it at 24px minimum.
- **Wordmark**: `assets/engu-wordmark.svg` — the lowercase "engu" set in Apparat Heavy, outlined as a vector. Use this *instead of* typing "engu" in Apparat when crisp logo rendering is needed.
- **Horizontal lockup**: `assets/engu-wordmark-h.svg` — logomark + wordmark side-by-side. The default header logo.
- **Vertical lockup**: `assets/engu-wordmark-v.svg` — logomark stacked above wordmark.
- **Sub-brand**: `assets/educentrum-wordmark.svg` — the Edu centrum sister logotype.

### General icons
The Design System figma file ships its own 16px icon family (referenced via the `SizeS16` symbol — `/external-shared/SizeS16/`). **Only the placeholder "Union" union-shape symbol made it into the mount; the full icon set is part of the Design System file that wasn't included.** Until that file is re-attached, this skill substitutes:

- **Lucide Icons** (CDN: `https://unpkg.com/lucide@latest`) — outline icons at 1.5–2px stroke. The visual weight matches the SizeS16 figma symbol closely.

When mocking up an engu screen and you need an icon:
- Use Lucide via `<i data-lucide="icon-name"></i>` + `lucide.createIcons()`.
- 16px in dense UI, 20–24px in default UI, 32px+ for marketing.
- Use `currentColor` so icons inherit text color. Default icon color: `--fg-2` (`rgba(0,0,0,0.7)`).
- For interactive icons (button glyph, nav item), stroke matches the button's text color.

### Emoji + unicode
- **No emoji.** Not in product, not in marketing, not in slide content. The brand voice doesn't use them.
- **Unicode glyphs as icons:** also avoid. Use a real SVG icon.

### Decorative shapes
The brand does *not* use abstract shape decoration (blobs, scribbles, doodles). The logomark itself supplies all the geometric character.

> **When in doubt, omit a decorative icon rather than draw one yourself.** The brand reads more confidently with type-only than with off-brand SVG marks.

---

## INDEX (manifest)

The Design System tab card groups follow a Wise.design-inspired IA, adapted for a learning platform:

- **Foundations** — Brand (logomarks, wordmarks, sub-brand), Color (brand core + 4 scales + semantics + supportive), Type (display / headline / title / body / label + Piazzolla italic accent + font stack), Spacing (scale, radii, shadows).
- **Components** — Actions (primary / secondary / on-ink buttons), Forms (inputs, toggle / check / radio), Containers (cards), Display (badges + chips, avatar, progress).
- **Patterns** — composed surfaces (marketing landing page).
- **Learning blocks** — engu-specific surfaces that a generic design system wouldn't have: Lesson cards, Quiz states, Achievement badges, Progress widgets (streak / XP / skill ring).

Root files:
- `README.md` — this file. Read first.
- `SKILL.md` — cross-compatible front-matter so this folder can be downloaded and used as a Claude Code skill.
- `colors_and_type.css` — drop-in token sheet. `@import` at the top of any HTML you generate.
- `fonts/` — bundled Inter Display TTFs (Light through Black, with matching italics).
- `assets/` — logos, wordmarks, lockups (SVG).
- `preview/` — the card files that populate the Design System tab.
- `ui_kits/` — interactive product surface kits.
  - `ui_kits/marketing/` — the engu.cz-style marketing site.
  - `ui_kits/app/` — the engu player/learner application surface.

How to use this skill:
1. **Read `README.md` start-to-finish.** Internalize the voice and the "no gradients, big type, one yellow accent" guardrail.
2. **Always `@import "./colors_and_type.css";`** in any HTML artifact you produce. Don't redefine tokens.
3. **Copy any assets you need** out of `assets/` and into your output folder — never link to this skill's path from a shipped file.
4. **Use the UI kits** (`ui_kits/*/index.html` + sibling `.jsx` files) as the canonical examples of header/footer/card/button composition.
