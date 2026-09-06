#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import fs from 'node:fs/promises';

const EXPECTED = [
  ['scope','glasscastles.scopesentinel.agent-api.v1'],
  ['discover','glasscastles.kork.agent-api.v1'],
  ['assess','glasscastles.shatteredcastle.agent-api.v1'],
  ['validate','glasscastles.glasswitness.agent-api.v1'],
  ['impact','glasscastles.blastradial.agent-api.v1'],
  ['remediate','glasscastles.console.agent-api.v1'],
];
const REGISTRY_URL='https://glasscastles.vercel.app/api/v1/fabric';

function fail(msg){throw new Error(msg)}
function checkRegistry(reg){
  const workflow=reg?.workflow||[];
  const want=EXPECTED.map(([stage])=>stage);
  if(JSON.stringify(workflow)!==JSON.stringify(want))fail(`workflow mismatch: ${JSON.stringify(workflow)} != ${JSON.stringify(want)}`);
  if(!Array.isArray(reg?.stages)||reg.stages.length!==EXPECTED.length)fail(`expected ${EXPECTED.length} stages, got ${reg?.stages?.length??'none'}`);
  for(const [stage] of EXPECTED){
    const hit=reg.stages.find(x=>x.stage===stage);if(!hit)fail(`missing stage ${stage}`);
    for(const key of ['base_url','capabilities','agent','openapi'])if(!hit[key])fail(`${stage} missing ${key}`);
  }
  return reg;
}

async function loadSourceRegistry(){
  const mod=await import(pathToFileURL(new URL('../site/api/v1/fabric.js',import.meta.url).pathname));
  let body=null;
  const req={method:'GET'};
  const res={setHeader(){},status(){return this},json(x){body=x;return x}};
  mod.default(req,res);
  return checkRegistry(body);
}
async function loadPublicRegistry(){
  const r=await fetch(REGISTRY_URL,{headers:{accept:'application/json'}});
  if(!r.ok)fail(`public registry HTTP ${r.status}`);
  return checkRegistry(await r.json());
}
async function checkCapabilities(reg){
  const found={};
  for(const [stage,contract] of EXPECTED){
    const spec=reg.stages.find(x=>x.stage===stage);
    const url=new URL(spec.capabilities,spec.base_url);
    const r=await fetch(url,{headers:{accept:'application/json'}});
    if(!r.ok)fail(`${stage} capabilities HTTP ${r.status}`);
    const body=await r.json();
    const actual=body.api||body.contract;
    if(actual!==contract)fail(`${stage} contract mismatch: ${actual} != ${contract}`);
    if(stage==='scope'&&body.network_requests!==false)fail('ScopeSentinel must remain zero-target-network');
    found[stage]={url:String(url),contract:actual,version:body.version||null};
  }
  return found;
}

const mode=process.argv[2]||'all';
const out={contract:'glasscastles.fabric.conformance.v1',checked_at:new Date().toISOString(),mode};
if(mode==='source'||mode==='all')out.source={workflow:(await loadSourceRegistry()).workflow,ok:true};
if(mode==='public'||mode==='all'){
  const reg=await loadPublicRegistry();out.public={workflow:reg.workflow,capabilities:await checkCapabilities(reg),ok:true};
}
console.log(JSON.stringify(out,null,2));
