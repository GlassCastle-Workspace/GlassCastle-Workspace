#!/usr/bin/env node
import fs from 'node:fs/promises';

function uniq(x){return [...new Set((x||[]).filter(Boolean))]}
function setDiff(a,b){const B=new Set(b||[]);return uniq(a).filter(x=>!B.has(x))}
function actionMap(c){return c?.actions||{}}
function holdKey(h){return JSON.stringify([h?.hold_scope||'',h?.reason||'',h?.asset||'',h?.summary||''])}
function rateKey(r){return JSON.stringify([r?.limit||null,r?.period||'',r?.text||''])}
function stableList(x,key=x=>JSON.stringify(x)){return [...(x||[])].sort((a,b)=>key(a).localeCompare(key(b)))}

export function diffScope(before={},after={}){
  const bScope=before.scope||{},aScope=after.scope||{};
  const bHosts=uniq(bScope.allowed_hosts),aHosts=uniq(aScope.allowed_hosts);
  const bExcluded=uniq([...(bScope.prose_forbidden_hosts||[]),...(bScope.structured_excluded_hosts||[])]);
  const aExcluded=uniq([...(aScope.prose_forbidden_hosts||[]),...(aScope.structured_excluded_hosts||[])]);
  const actionNames=uniq([...Object.keys(actionMap(before)),...Object.keys(actionMap(after))]);
  const action_changes=actionNames.map(name=>({name,before:actionMap(before)[name]?.state||'unknown',after:actionMap(after)[name]?.state||'unknown'})).filter(x=>x.before!==x.after);
  const bHolds=stableList(before.holds,holdKey),aHolds=stableList(after.holds,holdKey);
  const bRates=stableList(before.rate_limits,rateKey),aRates=stableList(after.rate_limits,rateKey);
  const added_hosts=setDiff(aHosts,bHosts),removed_hosts=setDiff(bHosts,aHosts);
  const added_exclusions=setDiff(aExcluded,bExcluded),removed_exclusions=setDiff(bExcluded,aExcluded);
  const added_holds=aHolds.filter(x=>!new Set(bHolds.map(holdKey)).has(holdKey(x)));
  const removed_holds=bHolds.filter(x=>!new Set(aHolds.map(holdKey)).has(holdKey(x)));
  const rate_added=aRates.filter(x=>!new Set(bRates.map(rateKey)).has(rateKey(x)));
  const rate_removed=bRates.filter(x=>!new Set(aRates.map(rateKey)).has(rateKey(x)));
  const authority_expanded=added_hosts.length>0||removed_exclusions.length>0||action_changes.some(x=>['allowed','constrained'].includes(x.after)&&!['allowed','constrained'].includes(x.before));
  const authority_reduced=removed_hosts.length>0||added_exclusions.length>0||action_changes.some(x=>x.after==='forbidden'&&x.before!=='forbidden');
  const ambiguity_changed=added_holds.length>0||removed_holds.length>0;
  return {
    contract:'glasscastles.scopesentinel.diff.v1',
    compared_at:new Date().toISOString(),
    program:after.program||before.program||'',
    before_digest:before.contract_digest_sha256||null,
    after_digest:after.contract_digest_sha256||null,
    changed:(before.contract_digest_sha256||null)!==(after.contract_digest_sha256||null),
    summary:{authority_expanded,authority_reduced,ambiguity_changed,rate_policy_changed:rate_added.length>0||rate_removed.length>0},
    scope:{added_hosts,removed_hosts,added_exclusions,removed_exclusions},
    actions:{changes:action_changes},
    holds:{added:added_holds,removed:removed_holds},
    rate_limits:{added:rate_added,removed:rate_removed},
    claim:'Scope drift describes authority evidence changes; it does not itself authorize execution.'
  };
}

async function main(){
  const [beforeFile,afterFile]=process.argv.slice(2);if(!beforeFile||!afterFile){console.error('Usage: scope-diff.mjs BEFORE.json AFTER.json');process.exit(2)}
  const before=JSON.parse(await fs.readFile(beforeFile,'utf8'));const after=JSON.parse(await fs.readFile(afterFile,'utf8'));
  console.log(JSON.stringify(diffScope(before,after),null,2));
}
if(import.meta.url===`file://${process.argv[1]}`)main().catch(e=>{console.error(e);process.exit(1)});
