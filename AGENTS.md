# Engu design authority

Figma is the source of truth for design decisions. Sync direction is Figma → GitHub.

- Foundation variables: https://www.figma.com/design/yFUGWRkPWpTU0rDJOqrIBe/Brand-Foundation
- Components and icons: https://www.figma.com/design/92ZwLCANCyRKezlcuQLOBW/Design-System
- Read `docs/figma-sync.md` before changing the sync pipeline.
- Never run a code-to-Figma token import or overwrite Figma to match this repository.
- `tokens/figma-variables.json` is a Figma export, not an editable token authority. Refresh it from the original file using the plugin or Figma MCP. Include every collection and variable ID; do not guess missing data.
- Regenerate CSS with `npm run build:tokens`. Do not edit the generated `figma:tokens` block. After changing the renderer, run `npm run build:plugin` too.
- Run `npm test`, `npm run check:tokens`, and `npm run check:plugin` before shipping sync changes.
- Icons and Code Connect mappings are generated from live Figma nodes. Do not invent mappings for components without a matching implementation.
- Existing UI kits, motion defaults and unmapped CSS values are implementation examples. They are not a verified copy of every Figma component.
