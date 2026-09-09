/* Shared by the plugin UI and mocked integration tests. No credential storage. */
const REPO_API = "https://api.github.com/repos/Tsel96/engu-design-system";
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])]));
  return value;
}
function githubClient(token, fetchImpl = fetch) {
  if (!token.trim()) throw new Error("Enter a GitHub token scoped to this repository.");
  return async function request(endpoint, method = "GET", body) {
    const res = await fetchImpl(REPO_API + endpoint, {
      method, headers: { Authorization: `Bearer ${token.trim()}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) throw new Error(`GitHub ${res.status}: check token expiry and repository permissions.`);
      if (res.status === 409 || res.status === 422) throw new Error("The branch changed or GitHub rejected the update. Refresh and retry; no force push was used.");
      throw new Error(`GitHub request failed (${res.status}). Check the repository and try again.`);
    }
    return res.status === 204 ? null : res.json();
  };
}
function decodeGithub(file) {
  if (file.encoding !== "base64" || !file.content) throw new Error("GitHub did not return readable file contents.");
  return new TextDecoder().decode(Uint8Array.from(atob(file.content.replace(/\s/g, "")), c => c.charCodeAt(0)));
}
async function syncTokensToGitHub(data, token, updateCss, fetchImpl = fetch) {
  const request = githubClient(token, fetchImpl);
  const ref = await request("/git/ref/heads/main");
  const sha = ref.object.sha;
  const [cssFile, snapshotFile, head] = await Promise.all([
    request(`/contents/colors_and_type.css?ref=${sha}`),
    request(`/contents/tokens/figma-variables.json?ref=${sha}`),
    request(`/git/commits/${sha}`),
  ]);
  const css = decodeGithub(cssFile);
  const prior = JSON.parse(decodeGithub(snapshotFile));
  const next = updateCss(css, data);
  if (next === css && JSON.stringify(stable(prior.meta)) === JSON.stringify(stable(data.meta))) return { changed: false };
  const tree = await request("/git/trees", "POST", {
    base_tree: head.tree.sha,
    tree: [
      { path: "colors_and_type.css", mode: "100644", type: "blob", content: next },
      { path: "tokens/figma-variables.json", mode: "100644", type: "blob", content: JSON.stringify(data, null, 2) + "\n" },
    ],
  });
  const commit = await request("/git/commits", "POST", { message: "chore: sync design tokens from Figma", tree: tree.sha, parents: [sha] });
  await request("/git/refs/heads/main", "PATCH", { sha: commit.sha, force: false });
  return { changed: true, url: `https://github.com/Tsel96/engu-design-system/commit/${commit.sha}` };
}
async function triggerIconSync(token, fetchImpl = fetch) {
  await githubClient(token, fetchImpl)("/actions/workflows/regenerate-code-connect.yml/dispatches", "POST", { ref: "main", inputs: { event_type: "figma-plugin" } });
}
if (typeof module !== "undefined") module.exports = { syncTokensToGitHub, triggerIconSync, stable };
