#!/usr/bin/env node
import fs from 'node:fs/promises';

const SCOPE='https://scopesentinel-saas.vercel.app';
const SHATTER='https://glasscastle-launchguard.vercel.app';
function usage(){console.error('Usage: scoped-assess.mjs --program NAME --policy FILE --scope FILE --target URL --authorized yes [--max-requests N]');process.exit(2)}
function args(argv){const out={};for(let i=0;i<argv.length;i+=2){const k=argv[i],v=argv[i+1];if(!k?.startsWith('--')||v==null)usage();out[k.slice(2)]=v}return out}
async function post(base,path,body){const r=await fetch(new URL(path,base),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const text=await r.text();let data;try{data=JSON.parse(text)}catch{data={raw:text}}if(!r.ok)throw Object.assign(new Error(data.error||`HTTP ${r.status}`),{status:r.status,data});return data}
function unwrap(x){if(x?.result&&typeof x.result==='object')return x.result;if(x?.data&&typeof x.data==='object')return x.data;return x}
function contractObject(x){const y=unwrap(x);return y?.contract&&typeof y.contract==='object'?y.contract:y}

const a=args(process.argv.slice(2));
if(!a.policy||!a.scope||!a.target||a.authorized!=='yes')usage();
const target=new URL(a.target);if(!['http:','https:'].includes(target.protocol))throw new Error('target must be HTTP(S)');
const policy_text=await fs.readFile(a.policy,'utf8');const structured_scope=JSON.parse(await fs.readFile(a.scope,'utf8'));
const contract=contractObject(await post(SCOPE,'/api/v1/compile',{program:a.program||'',policy_text,structured_scope}));
if(!contract||typeof contract!=='object')throw new Error('ScopeSentinel compile did not return a contract object');
const query={host:target.hostname,action:'automation'};
const decision=unwrap(await post(SCOPE,'/api/v1/decide',{contract,query}));
if(decision?.decision!=='ALLOW')throw new Error(`ScopeSentinel refused execution: ${decision?.decision||'UNKNOWN'} ${(decision?.reasons||[]).join('; ')}`);
const ceiling=Math.max(1,Math.min(12,Number(a['max-requests']||4)));
const envelope=unwrap(await post(SCOPE,'/api/v1/envelope',{contract,query,max_requests:ceiling}));
if(envelope?.authorization_assertion_required!==true)throw new Error('ScopeSentinel envelope did not require explicit authorization assertion');
if(!envelope?.bounty||envelope.bounty.authorized!==false)throw new Error('ScopeSentinel envelope was not fail-closed');
if(envelope.bounty.scope_state!=='clear')throw new Error(`Scope envelope state is ${envelope.bounty.scope_state||'unknown'}`);
const bounty=structuredClone(envelope.bounty);bounty.authorized=true;bounty.max_requests=Math.min(ceiling,Number(bounty.max_requests||ceiling));
const result=await post(SHATTER,'/api/scan',{target:a.target,mode:'single',bounty});
console.log(JSON.stringify({
  contract:'glasscastles.scoped-assessment.v1',
  program:contract.program||a.program||'',
  target:a.target,
  policy_contract_digest_sha256:contract.contract_digest_sha256||null,
  preflight:{decision:decision.decision,reasons:decision.reasons||[],constraints:decision.constraints||[],authorization_explicit:true},
  execution:{request_budget:bounty.max_requests,scope_state:bounty.scope_state,allowed_hosts:bounty.allowed_hosts||[]},
  assessment:result
},null,2));
