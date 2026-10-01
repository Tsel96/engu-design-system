# Icon selection

- Read `README.md` here first. Keep this entry point small.
- Search with `node scripts/icons.js search "query"`; default 10 results, maximum 50. Use `--category`, then `--offset` if necessary.
- Get metadata with `get "exact-name"`; read only its standalone SVG or use `svg "exact-name" --output FILE`.
- Without a shell: read `index.json`, one referenced category catalog, then one SVG under `svg/`.
- Preserve exact names, slugs, category names, aliases, and `engu-` symbol IDs, including case and spaces. Existing aliases supply semantics; do not invent replacements.
- The full manifest, sprite, browse HTML, and Code Connect catalogs are runtime/maintenance inputs. Avoid loading them into context for selection.
- `index.json`, `catalog/`, and `svg/` are generated. Refresh offline with `npm run build:icons`; check with `npm run check:icons`. Figma remains the source of truth.
