# Engu icon lookup

Search first, retrieve one icon. Names, slugs, categories, and curated aliases keep their existing meanings and exact spelling, including uppercase letters and spaces.

## With a local checkout

Run from the repository root; the script also works by absolute path from another directory. Node.js is the only requirement; no install or Figma access is needed.

```sh
node scripts/icons.js search "settings"
node scripts/icons.js search "sparkle" --category "AI & Magic" --limit 5
node scripts/icons.js search --category "Code" --offset 10
node scripts/icons.js get "Folder-sparkle"
node scripts/icons.js svg "Folder-sparkle" --output folder-sparkle.svg
node scripts/icons.js categories
```

Search matches names and existing aliases, case-insensitively. Exact names rank first, then exact aliases. Multiple terms must all match. Default limit is 10; maximum is 50. Results include `total` and `nextOffset` for deliberate pagination. `get` requires an exact name or slug and returns metadata without geometry. `svg` prints only that icon or writes a new file; it refuses to overwrite an existing file.

## Without a shell

1. Read [`index.json`](index.json): category names, counts, and catalog paths only.
2. Read one `catalog/<category>.jsonl` listed there. Each line has one icon's original name, slug, aliases, and category; search that small catalog for the existing semantics.
3. Fetch `svg/<category>/<exact-slug>.svg`, using the catalog path's category key. URL-encode each path segment when accessing raw GitHub, especially names with spaces. Preserve case.

For example, the `AI & Magic` catalog is `catalog/ai-magic.jsonl`, and `Folder-sparkle` is `svg/ai-magic/Folder-sparkle.svg`. Stop after finding the needed icon; expand to another category only when necessary.

## Use and maintenance

Standalone SVGs preserve the original symbol ID, viewBox, fill/stroke values, geometry, and embedded definitions. Exported coverage is 24px outlined variants and 24px single-style marks; other variants require live Figma. Apply accessible labels in your UI. Repeated inline SVGs need unique internal IDs if their definitions would otherwise collide.

The original `engu-icons.json`, `engu-icons-sprite.svg`, and `engu-icons-browse.html` retain their existing runtime paths. Agents should avoid reading those entire files into context for selection. Browser previews can still use the browse HTML and sprite. Sprite IDs remain `engu-<exact-slug>`; URL-encode fragments containing spaces.

```sh
npm run build:icons   # Derive category catalogs and individual SVGs offline
npm run check:icons   # Check consistency without changing files
```

Figma sync regenerates these derived assets with every icon export. Do not hand-edit generated catalogs or SVGs. Preserve established aliases in the source manifest; no additional semantics are introduced by the lookup.
