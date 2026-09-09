# Engu · Sync to GitHub

A Figma plugin for one-way sync from Engu's Figma library to `Tsel96/engu-design-system`.

## Install

1. Keep this folder together: `manifest.json`, `code.js`, and the built `ui.html` are the runtime files.
2. In Figma desktop, choose **Plugins → Development → Import plugin from manifest…**, then select this folder's `manifest.json`.
3. If Figma asks you to register an ID, use **Plugins → Development → New plugin**, name it **Engu · Sync to GitHub**, and use the Figma-assigned `id` in this manifest. IDs are assigned by Figma; none is fabricated here. A private organization publication can also assign the ID.
4. Open [Brand Foundation](https://www.figma.com/design/yFUGWRkPWpTU0rDJOqrIBe/Brand-Foundation), then run the plugin from **Plugins → Development**.

## Use

Enter a fine-grained GitHub token limited to **Tsel96/engu-design-system** with **Contents: read and write**, then choose **Sync tokens to GitHub**. The plugin updates the Figma snapshot and CSS together on `main`. It requires the original Brand Foundation file; copied files and other libraries are rejected.

To use **Refresh icons & Code Connect**, also grant the same token **Actions: read and write**. This button dispatches the GitHub workflow using its existing Figma secret. The plugin reports when the run has started; use **View sync runs** for its result.

The GitHub token is only held in the open UI. It is never written to Figma, plugin storage, files, or logs. The plugin only connects to `api.github.com`. It reads design variables and never changes the Figma design.

No Node.js or build step is needed to install the shipped folder. Developers changing the token renderer or UI template should run `npm run build:plugin` from the repository root.

Scope: foundation variables and the existing icon/Code Connect workflow. Full component implementation and every icon variant are outside this plugin's export scope.
