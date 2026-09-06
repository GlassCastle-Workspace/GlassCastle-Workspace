#!/usr/bin/env node
import fs from 'node:fs/promises';

const BASE='https://scopesentinel-saas.vercel.app';
function usage(){console.error('Usage: scope-preflight.mjs --program NAME --policy FILE --scope FILE [--observed FILE] [--host HOST|--url URL] [--action ACTION] [--account-mode MODE]');process.exit(2)}
function argMap(argv){const out={};for(let i=0;i<argv.length;i+=2){const k=argv[i],v=argv[i+1];if(!k?.startsWith('--')||v==null)usage();out[k.slice(2)]=v}return out}
async function jsonFile(path){return JSON.parse(await fs.readFile(path,'utf8'))}
async function post(path,body){const r=await fetch(new URL(path,BASE),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const text=await r.text();let data;try{data=JSON.parse(text)}catch{data={raw:text}}if(!r.ok)throw new Error(data.error||`HTTP ${r.status}`);return data}
function unwrapObject(x){if(x?.result&&typeof x.result==='object')return x.result;if(x?.data&&typeof x.data==='object')return x.data;return x}

const args=argMap(process.argv.slice(2));
if(!args.policy||!args.scope)usage();
const policy_text=await fs.readFile(args.policy,'utf8');
const structured_scope=await jsonFile(args.scope);
const observed_assets=args.observed?await jsonFile(args.observed):[];
const compiledResponse=await post('/api/v1/compile',{program:args.program||'',policy_text,structured_scope,observed_assets});
const compiled=unwrapObject(compiledResponse);
const contract=(compiled?.contract&&typeof compiled.contract==='object')?compiled.contract:compiled;
if(!contract||typeof contract!=='object')throw new Error('ScopeSentinel compile response did not contain a contract object');
const query={};
if(args.host)query.host=args.host;if(args.url)query.url=args.url;if(args.action)query.action=args.action;if(args['account-mode'])query.account_mode=args['account-mode'];
const decidedResponse=Object.keys(query).length?await post('/api/v1/decide',{contract,query}):null;
const decision=decidedResponse?unwrapObject(decidedResponse):null;
const out={
  contract:'glasscastles.scopesentinel.preflight.v1',
  program:contract.program||args.program||'',
  contract_digest_sha256:contract.contract_digest_sha256||null,
  source:{policy_sha256:contract.sources?.policy_sha256||null,structured_scope_sha256:contract.sources?.structured_scope_sha256||null},
  scope:{structured_assets:contract.sources?.structured_assets??contract.scope?.structured_assets?.length??null,allowed_hosts:contract.scope?.allowed_hosts||[],holds:contract.holds||[]},
  query:Object.keys(query).length?query:null,
  decision,
  claim:'Preflight interprets supplied policy evidence; it does not assert researcher authorization.'
};
console.log(JSON.stringify(out,null,2));
