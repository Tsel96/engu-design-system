const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const exporter = fs.readFileSync(path.join(__dirname, "export-figma-tokens.js"), "utf8");
const core = exporter.slice(exporter.indexOf('const FILE_KEY ='), exporter.indexOf('async function main('));
if (!core.includes("function updateCss")) throw new Error("Token renderer could not be bundled");
const plugin = path.join(root, "figma-plugin");
const html = fs.readFileSync(path.join(plugin, "ui.template.html"), "utf8")
  .replace("__TOKEN_RENDERER__", () => core)
  .replace("__GITHUB_CLIENT__", () => fs.readFileSync(path.join(plugin, "github.js"), "utf8"));
const destination = path.join(plugin, "ui.html");
if (process.argv.includes("--check")) {
  if (!fs.existsSync(destination) || fs.readFileSync(destination, "utf8") !== html) throw new Error("Plugin bundle is stale. Run npm run build:plugin.");
} else fs.writeFileSync(destination, html);
