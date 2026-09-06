import test from 'node:test';
import assert from 'node:assert/strict';
import { diffScope } from '../tools/scope-diff.mjs';

function c(overrides={}){
  return {
    contract:'glasscastles.scopesentinel.contract.v1',
    contract_digest_sha256:'a',program:'demo',
    scope:{allowed_hosts:['a.example.com'],structured_excluded_hosts:[],prose_forbidden_hosts:[]},
    actions:{automation:{state:'constrained'},social_engineering:{state:'forbidden'}},
    holds:[],rate_limits:[{limit:100,period:'minute',text:'100 requests per minute'}],
    ...overrides
  };
}

test('new allowed host expands authority evidence',()=>{
  const before=c(),after=c({contract_digest_sha256:'b',scope:{allowed_hosts:['a.example.com','b.example.com'],structured_excluded_hosts:[],prose_forbidden_hosts:[]}});
  const d=diffScope(before,after);assert.deepEqual(d.scope.added_hosts,['b.example.com']);assert.equal(d.summary.authority_expanded,true);assert.equal(d.summary.authority_reduced,false);
});

test('new exclusion reduces authority evidence',()=>{
  const before=c(),after=c({contract_digest_sha256:'b',scope:{allowed_hosts:['a.example.com'],structured_excluded_hosts:['admin.example.com'],prose_forbidden_hosts:[]}});
  const d=diffScope(before,after);assert.deepEqual(d.scope.added_exclusions,['admin.example.com']);assert.equal(d.summary.authority_reduced,true);
});

test('hold changes remain separate from authority change',()=>{
  const before=c(),after=c({contract_digest_sha256:'b',holds:[{hold_scope:'account',reason:'account_policy_conflict',summary:'Account language conflicts'}]});
  const d=diffScope(before,after);assert.equal(d.summary.ambiguity_changed,true);assert.equal(d.holds.added.length,1);assert.equal(d.summary.authority_expanded,false);assert.equal(d.summary.authority_reduced,false);
});

test('rate limit change is explicit drift',()=>{
  const before=c(),after=c({contract_digest_sha256:'b',rate_limits:[{limit:50,period:'minute',text:'50 requests per minute'}]});
  const d=diffScope(before,after);assert.equal(d.summary.rate_policy_changed,true);assert.equal(d.rate_limits.added[0].limit,50);assert.equal(d.rate_limits.removed[0].limit,100);
});
