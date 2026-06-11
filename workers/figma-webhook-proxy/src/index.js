const GITHUB_DISPATCHES_URL =
  "https://api.github.com/repos/Tsel96/engu-design-system/dispatches";

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    // Verify Figma passcode if configured
    if (env.FIGMA_PASSCODE) {
      const passcode = request.headers.get("x-figma-passcode") ?? body.passcode;
      if (passcode !== env.FIGMA_PASSCODE) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    const eventType = body.event_type ?? "FIGMA_WEBHOOK";

    const githubRes = await fetch(GITHUB_DISPATCHES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GITHUB_PAT}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "figma-webhook-proxy",
      },
      body: JSON.stringify({
        event_type: eventType,
        client_payload: { figma_event: body },
      }),
    });

    // GitHub returns 204 No Content on success
    if (githubRes.status === 204) {
      return new Response("ok", { status: 200 });
    }

    const detail = await githubRes.text();
    console.error(`GitHub dispatches failed ${githubRes.status}: ${detail}`);
    return new Response(`GitHub error: ${githubRes.status}`, {
      status: 502,
    });
  },
};
