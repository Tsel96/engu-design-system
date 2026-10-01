# Live Figma icon verification — 2026-10-01

Source: [Engu Design System, Icons — Components](https://www.figma.com/design/92ZwLCANCyRKezlcuQLOBW/Engu-Design-System?node-id=1200-3055). Figma owns names and vector geometry; synchronization is Figma → GitHub.

## Coverage

- Inspected all 38 category frames supplied in this request, plus the Weather frame from the source file: 39 category frames. Canonical component names include 40 categories, including nested Custom and Health & Medical sets.
- Live Figma has 2,008 visible icon component sets, resolving to 1,992 distinct category/name pairs after duplicate sets are accounted for.
- The existing GitHub export at commit `1bf0ad35fdd99f9899b51bb0b9c6e14adf05e678` contains 1,978 named icons. Every exported name/category pair matches live Figma, with no removed or renamed entries.
- Exported all 1,978 selected Figma variants through the native SVG exporter and compared normalized inner SVG markup with the recorded GitHub assets. Two independent 32-bit string digests matched for every icon, including path data, colors, and definitions. Normalization removes only the outer SVG wrapper and line-ending differences. This is a drift check, not a cryptographic proof.
- Added the remaining 14 names using their actual native 24px Solid variants from Figma. All prior 1,978 manifest records, curated aliases, and standalone SVG contents remain identical. No Central Icons replacements were needed.
- Result: **1,992 native 24px icons, 40 categories**, with manifest, sprite, browse page, category catalogs, and standalone SVGs aligned. Existing 1,992 Code Connect mappings now all resolve to exported sprite symbols.

## Solid additions

The default export chooses native 24px Outlined first, single-style second, Solid third. It never scales another size. These 14 sets have no native 24px Outlined variant; their exact Solid source node is recorded as `variant: { size: 24, style: "Solid", nodeId }` in the manifest and lookup results.

| Exact name | Category | Figma 24px Solid node |
| --- | --- | --- |
| reframe | Augmented Reality | [1871:19294](https://www.figma.com/design/92ZwLCANCyRKezlcuQLOBW/Engu-Design-System?node-id=1871-19294) |
| key-3 | Security | [1709:10966](https://www.figma.com/design/92ZwLCANCyRKezlcuQLOBW/Engu-Design-System?node-id=1709-10966) |
| keyhole-2 | Security | [1709:10992](https://www.figma.com/design/92ZwLCANCyRKezlcuQLOBW/Engu-Design-System?node-id=1709-10992) |
| lock-2 | Security | [1709:11031](https://www.figma.com/design/92ZwLCANCyRKezlcuQLOBW/Engu-Design-System?node-id=1709-11031) |
| unlocked-2 | Security | [1709:20409](https://www.figma.com/design/92ZwLCANCyRKezlcuQLOBW/Engu-Design-System?node-id=1709-20409) |
| pointer | Hands | [1200:33898](https://www.figma.com/design/92ZwLCANCyRKezlcuQLOBW/Engu-Design-System?node-id=1200-33898) |
| raising-hand-4-finger | Hands | [1200:33911](https://www.figma.com/design/92ZwLCANCyRKezlcuQLOBW/Engu-Design-System?node-id=1200-33911) |
| raising-hand-5-finger | Hands | [1200:33924](https://www.figma.com/design/92ZwLCANCyRKezlcuQLOBW/Engu-Design-System?node-id=1200-33924) |
| shaka-1 | Hands | [1200:33937](https://www.figma.com/design/92ZwLCANCyRKezlcuQLOBW/Engu-Design-System?node-id=1200-33937) |
| shaka-2 | Hands | [1200:33950](https://www.figma.com/design/92ZwLCANCyRKezlcuQLOBW/Engu-Design-System?node-id=1200-33950) |
| thumb-down-curved | Hands | [1200:33964](https://www.figma.com/design/92ZwLCANCyRKezlcuQLOBW/Engu-Design-System?node-id=1200-33964) |
| thumb-up-curved | Hands | [1200:34006](https://www.figma.com/design/92ZwLCANCyRKezlcuQLOBW/Engu-Design-System?node-id=1200-34006) |
| thumbs-down | Hands | [1200:33979](https://www.figma.com/design/92ZwLCANCyRKezlcuQLOBW/Engu-Design-System?node-id=1200-33979) |
| thumbs-up | Hands | [1200:33992](https://www.figma.com/design/92ZwLCANCyRKezlcuQLOBW/Engu-Design-System?node-id=1200-33992) |

## Rechecking

Offline checks: `npm test`, `npm run check:icons`, `npm run check:tokens`, and `npm run check:plugin`. Offline checks verify the recorded export and generated files; a new live Figma verification requires Figma access. Run the existing icon/Code Connect workflow to export later source changes.

For selection, start with the [developer lookup guide](../assets/icons/README.md): search up to 10 results, then fetch one exact icon. The full manifest and sprite remain available for runtime integration.
