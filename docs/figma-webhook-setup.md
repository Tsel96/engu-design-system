# Figma → GitHub webhook setup

When icons are updated or published in Figma, a webhook fires a `workflow_dispatch`
event on this repo. GitHub Actions then regenerates `code-connect/` and publishes
the result back to Figma automatically.

---

## 1. Create a GitHub fine-grained personal access token

1. Go to **github.com → Settings → Developer settings → Personal access tokens → Fine-grained tokens**.
2. Create a token scoped to **Tsel96/engu-design-system** with the permission
   **Actions → Read and write** (needed to trigger `workflow_dispatch`).
3. Copy the token value — you'll use it as the webhook secret below.

---

## 2. Register the webhook in Figma

Go to **figma.com/developers/webhooks** (or use the REST API below) and create a webhook with:

| Field | Value |
|---|---|
| **Team ID** | Your Figma team ID (visible in the URL when you open a team page) |
| **Event type** | `LIBRARY_PUBLISH` (fires when a library component is published) |
| **Endpoint URL** | `https://figma-webhook-proxy.<your-cf-subdomain>.workers.dev` |
| **Passcode** | Set to the same value you store as `FIGMA_PASSCODE` in the Worker (optional but recommended) |

### Via the Figma REST API

```bash
curl -X POST https://api.figma.com/v2/webhooks \
  -H "X-Figma-Token: <your-figma-personal-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "LIBRARY_PUBLISH",
    "team_id": "<your-team-id>",
    "endpoint": "https://figma-webhook-proxy.<your-cf-subdomain>.workers.dev",
    "passcode": "<any-string>"
  }'
```

To also catch component edits before a publish, add a second webhook with
`"event_type": "FILE_UPDATE"`. Be aware `FILE_UPDATE` fires frequently — consider
using `LIBRARY_PUBLISH` only to avoid unnecessary runs.

---

## 3. Configure the GitHub repository secret

The GitHub Actions dispatch endpoint requires a Bearer token in the
`Authorization` header. Figma webhooks don't natively send custom headers, so
you need a small proxy **or** use Figma's passcode field as a pre-shared key and
verify it in the workflow.

### Cloudflare Worker proxy (included in this repo)

The worker lives at `workers/figma-webhook-proxy/`. It receives the Figma
webhook POST, optionally verifies a passcode, and calls the GitHub dispatches
API with the correct `Authorization` header.

**Deploy:**

```bash
cd workers/figma-webhook-proxy
npm install
npm run secret:github-pat        # paste your GitHub fine-grained PAT
npm run secret:figma-passcode    # paste the passcode you set in Figma (optional)
npm run deploy
```

The deployed URL will be printed by wrangler:
`https://figma-webhook-proxy.<your-cf-subdomain>.workers.dev`

Use that URL as the Figma webhook endpoint.

### Alternative — trigger directly (requires GitHub App or OAuth token)

If you own a GitHub App or have an OAuth token, you can call the dispatches
endpoint directly from any HTTP client:

```bash
curl -X POST \
  -H "Authorization: Bearer <github-pat>" \
  -H "Accept: application/vnd.github+json" \
  -H "Content-Type: application/json" \
  https://api.github.com/repos/Tsel96/engu-design-system/dispatches \
  -d '{"event_type": "LIBRARY_PUBLISH"}'
```

---

## 4. Add `FIGMA_ACCESS_TOKEN` to GitHub repository secrets

1. Go to **github.com/Tsel96/engu-design-system → Settings → Secrets and variables → Actions**.
2. Click **New repository secret**.
3. Name: `FIGMA_ACCESS_TOKEN`
4. Value: your Figma personal access token.

This secret is used by both workflows:
- `publish-code-connect.yml` — passes it to `figma connect publish`
- `regenerate-code-connect.yml` — passes it to `scripts/generate-code-connect.js` as `FIGMA_TOKEN`

---

## End-to-end flow

```
Figma icon updated / library published
        │
        ▼
Figma webhook POST → proxy → GitHub dispatches API
        │
        ▼
regenerate-code-connect.yml runs
  └─ node scripts/generate-code-connect.js   (reads Figma API)
  └─ git commit + push code-connect/
        │
        ▼
publish-code-connect.yml runs  (triggered by the push above)
  └─ figma connect publish
        │
        ▼
Figma Dev Mode shows updated code snippets for all icons
```
