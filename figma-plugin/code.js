// This plugin only reads Figma. It never imports repository values into Figma.
const SOURCE_KEY = "yFUGWRkPWpTU0rDJOqrIBe";
const EXPECTED = {
  "engu-spacing": "VariableCollectionId:18:148",
  "engu-color-semantic": "VariableCollectionId:383:8261",
  "engu-brand": "VariableCollectionId:436:2",
};
figma.showUI(__html__, { width: 420, height: 560, themeColors: true });

async function snapshot() {
  if (figma.fileKey && figma.fileKey !== SOURCE_KEY) throw new Error("Open the Engu Brand Foundation file to sync tokens.");
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  for (const [name, id] of Object.entries(EXPECTED)) {
    if (!collections.some(c => c.name === name && c.id === id)) {
      throw new Error("Open the original Engu Brand Foundation file; this file does not contain its source collections.");
    }
  }
  const variables = await figma.variables.getLocalVariablesAsync();
  return {
    source: { fileKey: SOURCE_KEY, fileUrl: `https://www.figma.com/design/${SOURCE_KEY}/Brand-Foundation`, exportedAt: new Date().toISOString(), method: "Engu Figma sync plugin" },
    meta: {
      variableCollections: Object.fromEntries(collections.map(c => [c.id, {
        id: c.id, name: c.name, defaultModeId: c.defaultModeId, modes: c.modes, variableIds: c.variableIds,
      }])),
      variables: Object.fromEntries(variables.map(v => [v.id, {
        id: v.id, name: v.name, variableCollectionId: v.variableCollectionId, resolvedType: v.resolvedType, valuesByMode: v.valuesByMode,
      }])),
    },
  };
}
async function sendSnapshot(type) {
  try { figma.ui.postMessage({ type, data: await snapshot() }); }
  catch (error) { figma.ui.postMessage({ type: "source-error", message: error.message }); }
}
figma.ui.onmessage = async message => {
  if (message.type === "export") await sendSnapshot("snapshot");
  if (message.type === "close") figma.closePlugin();
};
void sendSnapshot("ready");
