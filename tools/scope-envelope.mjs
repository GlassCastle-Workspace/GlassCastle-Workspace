#!/usr/bin/env node
import fs from 'node:fs/promises';

const BASE='https://scopesentinel-saas.vercel.app';
function usage(){console.error('Usage: scope-envelope.mjs --program NAME --policy FILE --scope FILE --host HOST [--action ACTION] [--max-requests N]');process.exit(2)}
function args(argv){const out={};for(let i=0;i<argv.length;i+=2){const k=argv[i],v=argv[i+1];if(!k?.startsWith('--')||v==null)usage();out[k.slice(2)]=v}return out}
async function post(path,body){const r=await fetch(new URL(path,BASE),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const text=await r.text();let data;try{data=JSON.parse(text)}catch{data={raw:text}}if(!r.ok)throw new Error(data.error||`HTTP ${r.status}`);return data}
function unwrap(x){if(x?.result&&typeof x.result==='object')return x.result;if(x?.data&&typeof x.data==='object')return x.data;return x}
const a=args(process.argv.slice(2));if(!a.policy||!a.scope||!a.host)usage();
const policy_text=await fs.readFile(a.policy,'utf8');const structured_scope=JSON.parse(await fs.readFile(a.scope,'utf8'));
const compiled=unwrap(await post('/api/v1/compile',{program:a.program||'',policy_text,structured_scope}));
const contract=(compiled?.contract&&typeof compiled.contract==='object')?compiled.contract:compiled;
if(!contract||typeof contract!=='object')throw new Error('compile response did not contain contract object');
const query={host:a.host};if(a.action)query.action=a.action;
const max_requests=Math.max(1,Math.min(12,Number(a['max-requests']||6)));
const envelope=unwrap(await post('/api/v1/envelope',{contract,query,max_requests}));
console.log(JSON.stringify({contract:'glasscastles.scopesentinel.envelope-check.v1',query,contract_digest_sha256:contract.contract_digest_sha256||null,envelope},null,2));
