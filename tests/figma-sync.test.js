const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { render, updateCss, resolve } = require('../scripts/export-figma-tokens');
const { currentIconSets } = require('../scripts/current-icon-sets');
const { syncTokensToGitHub, triggerIconSync } = require('../figma-plugin/github');
const snapshot = require('../tokens/figma-variables.json');
const clone = value => structuredClone(value);

test('all live source variables generate valid CSS and preserve non-token CSS', () => {
  const css = ':root { --font-body: Inter; --radius-lg: 20px; }\n@media (min-width: 800px) { .card { display: grid; } }\n';
  const next = updateCss(css, snapshot);
  assert.ok(next.startsWith(css.trimEnd()));
  assert.match(next, /--space-10: 124px;/);
  assert.match(next, /--color-bg-default: #[0-9A-F]{6};/);
  assert.match(next, /prefers-color-scheme: dark/);
  assert.doesNotMatch(next, /: null;|undefined|NaN/);
  assert.equal(updateCss(next, snapshot), next);
  assert.equal(Object.keys(snapshot.meta.variables).length, 121);
});

test('cross-collection aliases use matching mode names, not insertion order', () => {
  const meta = {
    variableCollections: { a: { modes: [{name:'Light',modeId:'a1'}, {name:'Dark',modeId:'a2'}] }, b: { modes: [{name:'Dark',modeId:'b2'}, {name:'Light',modeId:'b1'}] } },
    variables: { target: { id:'target', name:'target', variableCollectionId:'b', valuesByMode:{b2:8,b1:4} } },
  };
  const alias = { id:'alias', name:'alias', variableCollectionId:'a', valuesByMode:{a1:{type:'VARIABLE_ALIAS',id:'target'},a2:{type:'VARIABLE_ALIAS',id:'target'}} };
  assert.equal(resolve(alias, 'Light', meta), 4);
  assert.equal(resolve(alias, 'Dark', meta), 8);
});

test('partial exports, missing aliases, missing modes, invalid values and cycles fail closed', () => {
  const missing = clone(snapshot); delete missing.meta.variables['VariableID:18:149'];
  assert.throws(() => render(missing), /Missing variable/);
  const mode = clone(snapshot); mode.meta.variableCollections['VariableCollectionId:383:8261'].modes.pop();
  assert.throws(() => render(mode), /Light and Dark/);
  const bad = clone(snapshot); bad.meta.variables['VariableID:18:149'].valuesByMode['18:0'] = -2;
  assert.throws(() => render(bad), /Invalid spacing/);
  const cycle = clone(snapshot); cycle.meta.variables['VariableID:18:149'].valuesByMode['18:0'] = {type:'VARIABLE_ALIAS',id:'VariableID:18:149'};
  assert.throws(() => render(cycle), /Circular alias/);
  const wrong = clone(snapshot); wrong.source.fileKey='different';
  assert.throws(() => render(wrong), /configured Brand Foundation/);
});

test('malformed generated CSS is rejected before replacing content', () => {
  assert.throws(() => updateCss('/* figma:tokens:start */', snapshot), /Malformed/);
});

test('deleted, hidden and duplicate icon sets cannot produce stale Code Connect mappings', async () => {
  const sets = ['deleted','hidden','first','duplicate','renamed'].map(node_id => ({node_id,name:'Icons/Old/stale'}));
  const nodes = { deleted:null, hidden:{document:{type:'COMPONENT_SET',name:'Icons/A/hide',visible:false}}, first:{document:{type:'COMPONENT_SET',name:'Icons/A/live'}}, duplicate:{document:{type:'COMPONENT_SET',name:'Icons/A/live'}}, renamed:{document:{type:'COMPONENT_SET',name:'Icons/A/new'}} };
  const live = await currentIconSets(sets, 'file', async () => ({nodes}));
  assert.deepEqual(live.map(s=>s.node_id), ['first','renamed']);
  assert.equal(live[1].name,'Icons/A/new');
  await assert.rejects(currentIconSets([sets[0]], 'file', async()=>({nodes})), /No live/);
});

const encoded = s => ({encoding:'base64',content:Buffer.from(s).toString('base64')});
function fakeGitHub(css, prior, conflict=false) {
  const calls=[];
  const impl=async (url, options) => {
    const endpoint = url.replace('https://api.github.com/repos/Tsel96/engu-design-system','');
    const body = options.body && JSON.parse(options.body);
    calls.push({endpoint,method:options.method,body});
    let data;
    if (endpoint==='/git/ref/heads/main') data={object:{sha:'head'}};
    else if(endpoint==='/contents/colors_and_type.css?ref=head') data=encoded(css);
    else if(endpoint==='/contents/tokens/figma-variables.json?ref=head') data=encoded(JSON.stringify(prior));
    else if(endpoint==='/git/commits/head') data={tree:{sha:'base-tree'}};
    else if(endpoint==='/git/trees') data={sha:'new-tree'};
    else if(endpoint==='/git/commits') data={sha:'new-commit'};
    else if(endpoint==='/git/refs/heads/main') {
      if(conflict) return {ok:false,status:422};
      data={object:{sha:'new-commit'}};
    } else throw Error('Unexpected GitHub call: '+endpoint);
    return {ok:true,status:200,json:async()=>data};
  };
  return {calls,impl};
}

test('plugin commits snapshot and CSS atomically with a non-forced main update',async()=>{
  const mock=fakeGitHub(':root {}',snapshot);
  const result=await syncTokensToGitHub(snapshot,'test-token',updateCss,mock.impl);
  assert.equal(result.changed,true);
  const tree=mock.calls.find(c=>c.endpoint==='/git/trees').body;
  assert.deepEqual(tree.tree.map(x=>x.path),['colors_and_type.css','tokens/figma-variables.json']);
  assert.equal(tree.base_tree,'base-tree');
  assert.deepEqual(mock.calls.at(-1).body,{sha:'new-commit',force:false});
});

test('plugin creates no commit for unchanged data',async()=>{
  const mock=fakeGitHub(updateCss(':root {}',snapshot),snapshot);
  assert.deepEqual(await syncTokensToGitHub(snapshot,'test-token',updateCss,mock.impl),{changed:false});
  assert.ok(mock.calls.every(c=>c.method==='GET'));
});

test('plugin refuses a racing branch update and does not force or retry it',async()=>{
  const mock=fakeGitHub(':root {}',snapshot,true);
  await assert.rejects(syncTokensToGitHub(snapshot,'test-token',updateCss,mock.impl),/branch changed/);
  assert.equal(mock.calls.filter(c=>c.method==='PATCH').length,1);
});

test('icon button dispatches the existing main workflow',async()=>{
  let sent;
  await triggerIconSync('test-token',async(url,options)=>{sent={url,body:JSON.parse(options.body)};return {ok:true,status:204};});
  assert.ok(sent.url.endsWith('/actions/workflows/regenerate-code-connect.yml/dispatches'));
  assert.equal(sent.body.ref,'main');
});

test('plugin main rejects other Figma files without writing design data',async()=>{
  const messages=[];
  const figma={fileKey:'wrong-file',showUI(){},ui:{postMessage:m=>messages.push(m)},variables:{}};
  vm.runInNewContext(fs.readFileSync('figma-plugin/code.js','utf8'),{figma,__html__:'',Date});
  assert.equal(messages.length, 0, 'wait for the UI listener before sending source data');
  await figma.ui.onmessage({type:'ui-ready'});
  assert.equal(messages[0].type,'source-error');
});

test('plugin reads all source variables after the UI handshake and again on sync',async()=>{
  const messages=[];
  let reads=0;
  const figma={fileKey:snapshot.source.fileKey,showUI(){},ui:{postMessage:m=>messages.push(m)},variables:{
    getLocalVariableCollectionsAsync:async()=>Object.values(snapshot.meta.variableCollections),
    getLocalVariablesAsync:async()=>{reads++;return Object.values(snapshot.meta.variables);},
  }};
  vm.runInNewContext(fs.readFileSync('figma-plugin/code.js','utf8'),{figma,__html__:'',Date});
  assert.equal(reads,0);
  await figma.ui.onmessage({type:'ui-ready'});
  assert.equal(messages[0].type,'ready');
  assert.equal(Object.keys(messages[0].data.meta.variables).length,121);
  await figma.ui.onmessage({type:'export'});
  assert.equal(reads,2);
  assert.equal(messages[1].type,'snapshot');
});

test('shipped plugin UI contains valid JavaScript and no unbuilt placeholders',()=>{
  const html=fs.readFileSync('figma-plugin/ui.html','utf8');
  assert.doesNotMatch(html,/__TOKEN_RENDERER__|__GITHUB_CLIENT__/);
  new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
});

test('plugin UI handshakes and handles messages relayed by the Figma sandbox',async()=>{
  const elements=Object.fromEntries(['status','sync','icons','summary','token'].map(id=>[id,{dataset:{},value:''}]));
  const sent=[];
  const window={};
  const parent={postMessage:message=>sent.push(message)};
  const html=fs.readFileSync('figma-plugin/ui.html','utf8');
  vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],{window,parent,document:{getElementById:id=>elements[id]}});
  assert.equal(sent[0].pluginMessage.type,'ui-ready');
  await window.onmessage({source:null,data:{pluginMessage:{type:'ready',data:snapshot}}});
  assert.match(elements.summary.textContent,/121 variables/);
  assert.equal(elements.sync.disabled,false);
  await window.onmessage({source:null,data:{pluginMessage:{type:'source-error',message:'Wrong file'}}});
  assert.equal(elements.sync.disabled,true);
  assert.equal(elements.status.textContent,'Wrong file');
});

test('removed Figma tokens cannot reveal obsolete hand-coded fallback values',()=>{
  const old=':root { --space-10: #112233; --font-body: Inter; }';
  const first=updateCss(old,snapshot);
  assert.doesNotMatch(first,/#112233/);
  const fewer=clone(snapshot);
  const id=Object.keys(fewer.meta.variables).find(id=>fewer.meta.variables[id].name==='space/10');
  const c=fewer.meta.variableCollections[fewer.meta.variables[id].variableCollectionId];
  c.variableIds=c.variableIds.filter(x=>x!==id);delete fewer.meta.variables[id];
  const second=updateCss(first,fewer);
  assert.doesNotMatch(second,/--space-10:/);
  assert.match(second,/--font-body: Inter;/);
});
