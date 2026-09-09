// Published library metadata can include deleted or renamed component sets.
// Resolve current nodes before generating any mappings, and choose one visible
// set per name so a stale node cannot block the entire Code Connect publish.
async function currentIconSets(sets, fileKey, get) {
  const current = new Map();
  for (let i = 0; i < sets.length; i += 100) {
    const batch = sets.slice(i, i + 100);
    const data = await get(`https://api.figma.com/v1/files/${fileKey}/nodes?ids=${batch.map(s => s.node_id).join(",")}&depth=1`);
    for (const set of batch) {
      const node = data.nodes?.[set.node_id]?.document;
      if (!node || node.type !== "COMPONENT_SET" || node.visible === false || !/^Icons\/[^/]+\/.+/.test(node.name)) continue;
      const candidate = { ...set, name: node.name };
      if (!current.has(node.name)) current.set(node.name, candidate);
    }
  }
  if (!current.size) throw new Error("No live icon component sets resolved; existing mappings were left untouched.");
  return [...current.values()].sort((a, b) => a.name.localeCompare(b.name, "en"));
}
module.exports = { currentIconSets };
