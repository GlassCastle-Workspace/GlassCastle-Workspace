#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ukc=require('../site/lib/ukc-model.js');

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
  if(reg?.suite?.name!=='ShatteredCastle(s)')fail(`suite mismatch: ${reg?.suite?.name||'missing'}`);
  if(reg?.suite?.attack_model?.contract!=='shatteredcastles.ukc.model.v1')fail('UKC attack-model contract missing from suite registry');
  if(reg?.suite?.attack_model?.endpoint!=='/api/v1/ukc')fail('UKC endpoint missing from suite registry');
  const want=EXPECTED.map(([stage])=>stage);
  if(JSON.stringify(workflow)!==JSON.stringify(want))fail(`workflow mismatch: ${JSON.stringify(workflow)} != ${JSON.stringify(want)}`);
  if(!Array.isArray(reg?.stages)||reg.stages.length!==EXPECTED.length)fail(`expected ${EXPECTED.length} stages, got ${reg?.stages?.length??'none'}`);
  for(const [stage] of EXPECTED){
    const hit=reg.stages.find(x=>x.stage===stage);if(!hit)fail(`missing stage ${stage}`);
    for(const key of ['base_url','capabilities','agent','openapi'])if(!hit[key])fail(`${stage} missing ${key}`);
  }
  return reg;
}
function checkSourceUkc(){const m=ukc.model();if(m.contract!=='shatteredcastles.ukc.model.v1')fail('source UKC contract mismatch');if(m.phases?.length!==18)fail(`source UKC phase count ${m.phases?.length}`);if(m.semantics?.strict_sequence_required!==false)fail('source UKC must not require strict sequence');return{contract:m.contract,version:m.version,phase_count:m.phases.length,digest:m.model_digest_sha256};}
async function checkPublicUkc(reg){const url=new URL(reg.suite.attack_model.endpoint,'https://glasscastles.vercel.app');const r=await fetch(url,{headers:{accept:'application/json'}});if(!r.ok)fail(`public UKC HTTP ${r.status}`);const m=await r.json();if(m.contract!=='shatteredcastles.ukc.model.v1'||m.phases?.length!==18)fail('public UKC model mismatch');if(m.semantics?.strict_sequence_required!==false)fail('public UKC incorrectly requires strict sequence');return{url:String(url),contract:m.contract,version:m.version,phase_count:m.phases.length,digest:m.model_digest_sha256};}

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
    if(body?.suite?.name!=='ShatteredCastle(s)')fail(`${stage} suite identity mismatch: ${body?.suite?.name||'missing'}`);
    if(body?.suite?.ukc?.contract!=='shatteredcastles.ukc.model.v1')fail(`${stage} UKC suite contract missing`);
    if(stage==='scope'&&body.network_requests!==false)fail('ScopeSentinel must remain zero-target-network');
    found[stage]={url:String(url),contract:actual,version:body.version||null};
  }
  return found;
}

const mode=process.argv[2]||'all';
const out={contract:'glasscastles.fabric.conformance.v1',checked_at:new Date().toISOString(),mode};
if(mode==='source'||mode==='all')out.source={workflow:(await loadSourceRegistry()).workflow,ukc:checkSourceUkc(),ok:true};
if(mode==='public'||mode==='all'){
  const reg=await loadPublicRegistry();out.public={workflow:reg.workflow,capabilities:await checkCapabilities(reg),ukc:await checkPublicUkc(reg),ok:true};
}
console.log(JSON.stringify(out,null,2));
