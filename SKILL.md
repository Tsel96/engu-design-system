---
name: engu-design
description: Use this skill to generate well-branded interfaces and assets for engu — a children's educational gaming platform from Bohemia Interactive — either for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc.), copy assets out of `assets/` into the output and create static HTML files for the user to view. Always `@import "./colors_and_type.css";` (or copy it) so tokens, fonts, and the type scale are available.

If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask 6–10 clarifying questions (audience, surface, copy tone, etc.), and act as an expert designer who outputs HTML artifacts _or_ production code depending on the need.

## Quick reference

- **Brand:** engu (lowercase, one word). Bohemia Interactive product.
- **Primary color:** `#5AA57C` engu green
- **Ink background:** `#122119`
- **Accent:** `#FFD633` golden yellow (used sparingly, once per screen)
- **Display type:** Apparat Heavy 900 (from Adobe Typekit, already imported)
- **Accent type:** Piazzolla Black Italic 900 (from Google Fonts)
- **Body type:** Inter Display (bundled in `fonts/`)
- **Card radius:** 20px · button radius: pill (999px)
- **No gradients. No emoji. No textures.**

## File map

```
.
├── README.md                  ← read this first
├── SKILL.md                   ← this file
├── colors_and_type.css        ← drop-in token sheet
├── fonts/                     ← Inter Display TTFs
├── assets/                    ← logos + wordmarks (SVG, currentColor + baked variants)
├── preview/                   ← design-system card files (Type / Colors / Spacing / Components / Brand)
└── ui_kits/
    └── marketing/             ← engu.cz-style landing page kit
```
