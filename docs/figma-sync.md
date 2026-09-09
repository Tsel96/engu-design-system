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

The snapshot stores Figma IDs, collection modes, aliases and source metadata. The generated CSS includes all 121 variables as of 2026-09-09: 69 brand colors, 41 semantic colors in Light/Dark, and 11 spacing values. Cross-collection aliases resolve by mode name. Existing CSS names such as `--color-bg-canvas` are compatibility aliases to Figma names. Fonts, radii, shadows, motion, layout and unrepresented tokens remain implementation fallbacks pending an explicit Figma mapping.

**Refresh icons & Code Connect** starts the existing GitHub workflow. It reads the Design System file, exports the supported 24px outlined/single-style SVG variants, filters deleted/hidden component nodes from Code Connect, commits the assets, and publishes Code Connect in the same job. It does not export every icon style or turn every Figma component into application code. Follow its status in GitHub Actions.

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
npm test
```

`npm run sync-tokens` is an optional live REST export for an Enterprise account with `FIGMA_TOKEN`. It fails visibly on missing access; it never silently falls back to old data. `npm run push-tokens` is disabled because Figma owns tokens.

The token CI workflow validates committed snapshot/CSS consistency on pushes and PRs. It does not claim that a stored snapshot is live. The icon workflow supports manual requests, Figma webhook events, relevant code pushes, and a Monday 09:00 UTC fallback schedule. Scheduled token refresh through the Codex–Figma connection is managed separately in the Codex task.

## Scope and remaining coverage

The repository has icon Code Connect mappings. Full button/card/form component implementation parity is not established by a token or icon sync. Existing marketing kits remain examples; read the corresponding live Figma node before implementing or changing a component. Typography/effect styles and all icon variant sizes/styles are not yet generated into code.

The Cloudflare webhook proxy is optional. No webhook delivery was observed in the historical workflow runs; treat automatic Figma events as unverified until a real publish causes a successful GitHub run. The plugin and scheduled fallback do not depend on that proxy.
