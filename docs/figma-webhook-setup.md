# Optional Figma webhook

The working manual route is the Engu sync plugin; see [Figma sync](figma-sync.md). This optional proxy triggers the icon/Code Connect workflow when Figma sends `FILE_UPDATE` or `LIBRARY_PUBLISH`. Token exports use the native Plugin API separately.

Deploy `workers/figma-webhook-proxy/` to Cloudflare with `GITHUB_PAT` (fine-grained, this repository only, **Contents: read and write**, for `repository_dispatch`) and a distinct random `FIGMA_PASSCODE`. Register the deployed endpoint as a Figma webhook for the Design System file/team, with the same passcode. Never use a GitHub credential as the Figma passcode.

`PING` is acknowledged without dispatch. Actionable events create `repository_dispatch` in GitHub. `regenerate-code-connect.yml` exports assets, regenerates mappings and publishes Code Connect in the same run. A bot push does not trigger a second workflow; see [GitHub's trigger rules](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).

Keep the repository secret `FIGMA_ACCESS_TOKEN` valid for reads and Code Connect publishing. Verify the optional webhook by publishing a real Figma library update and checking the resulting Actions run. Merely deploying the Worker or seeing `PING` succeed does not prove end-to-end sync. The plugin's icon button and Monday schedule provide independent triggers.
