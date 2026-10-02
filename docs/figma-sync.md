# Figma → GitHub sync

Figma owns the design. This repository consumes it. Editing code never changes Figma.

## Source files

| Source | File | What it owns |
| --- | --- | --- |
| [Brand Foundation](https://www.figma.com/design/yFUGWRkPWpTU0rDJOqrIBe/Brand-Foundation) | `yFUGWRkPWpTU0rDJOqrIBe` | `engu-brand`, `engu-color-semantic` (Light/Dark), `engu-spacing` |
| [Design System](https://www.figma.com/design/92ZwLCANCyRKezlcuQLOBW/Design-System) | `92ZwLCANCyRKezlcuQLOBW` | Components and icon definitions |

The Design System file already subscribes to Brand Foundation. Its own `engu-tokens` collection is empty; it is not the token source.

## Sync now from Figma

Install the plugin in `figma-plugin/` (see its README). Open the original Brand Foundation file, run **Engu · Sync to GitHub**, enter a repository-scoped GitHub token, and click **Sync tokens to GitHub**.

The plugin reads the native Plugin API, resolves variables through the same renderer as the CLI, and commits both `tokens/figma-variables.json` and `colors_and_type.css` atomically to `main`. It makes no Figma design edits. It never stores the GitHub token. If the branch moves during the sync, it refuses the update and asks you to retry. If nothing changed, it makes no commit.

The snapshot stores Figma IDs, collection modes, aliases and source metadata. The generated CSS includes all 143 variables as of 2026-10-03: 75 brand colors, 57 semantic colors in Light/Dark, and 11 spacing values. Cross-collection aliases resolve by mode name. Four compatibility CSS names remain because consumers use them: `--color-bg-canvas`, `--color-bg-card`, `--color-bg-tinted` and `--color-intent-error`. Fonts, radii, shadows, motion, layout and unrepresented tokens remain implementation fallbacks pending an explicit Figma mapping.

**Refresh icons & Code Connect** starts the existing GitHub workflow. It reads the Design System file and selects one native 24px variant per named icon: Outlined first, single-style second, Solid third. Solid fallbacks record their size, style, and exact Figma node ID in the manifest. It filters deleted/hidden component nodes and sets without exported SVGs from Code Connect, commits the assets, and publishes Code Connect in the same job. It does not export every icon style or turn every Figma component into application code. Follow its status in GitHub Actions.

Each icon export also derives the small `assets/icons/index.json`, per-category JSONL catalogs, and standalone SVGs for agent lookup. These preserve the exported names, categories, aliases, symbol IDs, geometry, and optional variant metadata. `npm run build:icons` regenerates them offline from the recorded manifest and sprite; `npm run check:icons` verifies consistency without changing files. Start icon selection with [the lookup guide](../assets/icons/README.md) and a bounded search rather than reading the entire library into context. See the [2026-10-01 live verification](icon-sync-verification.md) for the source coverage and Solid additions.

## Access

For the plugin, create a fine-grained GitHub token limited to `Tsel96/engu-design-system` with **Contents: read and write**. Add **Actions: read and write** if using the icon button. Paste it only into the plugin's password field. It stays in memory for that window only.

GitHub Actions uses the existing `FIGMA_ACCESS_TOKEN` secret for icons and Code Connect. The token needs `file_content:read`, `library_assets:read` and `file_code_connect:write` and access to the Design System file. Regenerate it in Figma and replace the repository secret if it expires or loses access. No credentials belong in the repository.

Figma's Variables REST API requires a Full seat in an **Enterprise** organization and `file_variables:read`; the connected account is on the **Organization** plan. The old weekly REST token export failed with HTTP 403. The plugin/MCP route uses the supported native Plugin API and does not need an Enterprise upgrade. See [Figma Variables API access](https://developers.figma.com/docs/rest-api/variables/).

## Commands and verification

```sh
npm run build:tokens   # Generate CSS from the recorded Figma snapshot
npm run check:tokens   # Assert CSS equals that snapshot; not a live freshness check
npm run build:plugin   # Bundle the shared token renderer into the plugin UI
npm run check:plugin
npm run build:icons    # Derive agent assets from the recorded icon export
npm run check:icons    # Assert indexes and standalone SVGs match the export
npm test
```

`npm run sync-tokens` is an optional live REST export for an Enterprise account with `FIGMA_TOKEN`. It fails visibly on missing access; it never silently falls back to old data. `npm run push-tokens` is disabled because Figma owns tokens.

The token CI workflow validates committed snapshot/CSS consistency on pushes and PRs. It does not claim that a stored snapshot is live. The icon workflow supports manual requests, Figma webhook events, relevant code pushes, and a Monday 09:00 UTC fallback schedule. Scheduled token refresh through the Codex–Figma connection is managed separately in the Codex task.

## Scope and remaining coverage

The repository has icon Code Connect mappings. Full button/card/form component implementation parity is not established by a token or icon sync. Existing marketing kits remain examples; read the corresponding live Figma node before implementing or changing a component. Typography/effect styles and all icon variant sizes/styles are not yet generated into code.

The Cloudflare webhook proxy is optional. No webhook delivery was observed in the historical workflow runs; treat automatic Figma events as unverified until a real publish causes a successful GitHub run. The plugin and scheduled fallback do not depend on that proxy.

## AAA role variables (2026-10-01)

Brand Foundation gained eleven variables so product UIs can meet WCAG AAA (7:1 text) without inventing colours. All are aliases to the existing scales, in Light and Dark.

| Semantic variable | Alias | Contrast |
| --- | --- | --- |
| `color/fg/secondary-strong` | Grey 800 | 10.3:1 or more on white, greys and brand tints |
| `color/fg/tertiary-strong` | Grey 700 | 7.4:1 or more on white, `bg/subtle`, `bg/inset`, `bg/brand` |
| `color/fg/brand-strong` | Green 800 | 8.1:1 on white; 7.2:1 on `bg/inset` |
| `color/fg/inverse-muted` | Grey 200 | AAA on `bg/inverse` |
| `color/bg/brand-hover` | Green 50 | Hover/focus surface for menus and lists |
| `color/bg/brand-selected` | Green 100 | Pressed/selected surface; pair with `fg/primary` only |
| `color/bg/brand-strong` | Green 800 | Surface behind `fg/inverse` text (8.1:1) |
| `color/bg/brand-fill` | Green 500 | Checked/active control fill (non-text) |
| `color/intent/error/fg-strong` | Error 800 | Error text on `intent/error/bg-pressed` (13:1; `fg` is 6.8:1 there) |
| `color/border/hairline` | Black 5 / White 10 (Dark) | Faintest panel divider (new primitive `engu-overlay/Black 5`) |
| `color/intent/error/bg-pressed` | Error 100 | Pressed destructive surface |

`color/fg/tertiary` (Grey 600, 4.8:1) and `color/fg/brand` (Green 600, 4.4:1) remain for AA contexts; use the `-strong` variants when AAA is required. The hand-written `--color-fg-brand-strong` that claimed Green 700 at 7.1:1 was wrong (5.9:1) and has been replaced by the generated value.

## Entity-category tints and cleanup (2026-10-03)

Brand Foundation gained one pale tint per editor-entity category, for the Inspector header strip and tab. Each is a new primitive (one step, in its own hue group so the exporter names it uniquely) aliased by a semantic background. Hues avoid brand green, destructive red and the info/warning intents; text on every tint keeps `fg/primary` at 15:1+ and `fg/tertiary-strong` at 7:1+ (AAA). Dark mode aliases the same tints, like the rest of the current Dark mode.

| Semantic variable | Primitive | Value | Entities |
| --- | --- | --- | --- |
| `color/entity/character/bg` | `engu-blue/Blue 50` | #EAF1FB | Characters and creatures |
| `color/entity/prop/bg` | `engu-sand/Sand 50` | #F6EFE3 | Props and containers |
| `color/entity/logic/bg` | `engu-violet/Violet 50` | #F0EDFA | Trigger zones, group templates, spawners |
| `color/entity/light/bg` | `engu-amber/Amber 50` | #FBF5DD | Lights and effects |
| `color/entity/dialogue/bg` | `engu-teal/Teal 50` | #E6F4F3 | Dialogue and narrative |

Cleanup in the same pass:

- Every variable has explicit scopes instead of `ALL_SCOPES`: primitives `[]` (hidden from pickers, used through semantic aliases), backgrounds `FRAME_FILL, SHAPE_FILL`, text `TEXT_FILL, SHAPE_FILL, STROKE_COLOR`, borders `STROKE_COLOR`, icons `SHAPE_FILL, STROKE_COLOR`, spacing `GAP`.
- Every variable has WEB code syntax equal to its generated CSS name (for example `var(--color-entity-prop-bg)`, `var(--_sand-50)`, `var(--space-3)`).
- HTML entities (`&#39;`) in variable descriptions and the Colors specimen were decoded.
- The Colors page specimen now lists all 57 semantic variables (it was missing the 11 AAA role variables) plus an Entity · Category group.
- The unused `test` page was deleted from Brand Foundation.
- Five compatibility CSS aliases with no consumer were removed: `--color-bg-elevated`, `--color-fg-on-inverse`, `--color-intent-info`, `--color-intent-success`, `--color-intent-warning` (also from `_ds_manifest.json` and `_adherence.oxlintrc.json`).

Known open items (owner decision, not changed): the Dark mode mirrors Light for every surface and text token, so it is not yet a dark theme; several semantic roles share a value by design (`bg/brand`, `bg/brand-subtle`, `bg/brand-hover`, `intent/success/bg` are Green 50; `fg/secondary` and `fg/tertiary-strong` are Grey 700).
