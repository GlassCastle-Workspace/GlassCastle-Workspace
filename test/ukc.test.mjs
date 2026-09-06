import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ukc=require('../site/lib/ukc-model.js');
const api=require('../site/api/v1/ukc.js');

const FINAL=['reconnaissance','weaponization','delivery','social_engineering','exploitation','persistence','defense_evasion','command_and_control','pivoting','discovery','privilege_escalation','execution','credential_access','lateral_movement','collection','exfiltration','target_manipulation','objectives'];

test('Pols 2017 final UKC preserves the 18 canonical phases',()=>{
  const model=ukc.model();
  assert.equal(model.contract,'shatteredcastles.ukc.model.v1');
  assert.deepEqual(model.phases.map(x=>x.id),FINAL);
  assert.ok(model.phases.every(x=>x.mandatory===false));
  assert.equal(model.semantics.strict_sequence_required,false);
  assert.equal(model.compatibility.mitre_attack_mapping.startsWith('not bundled'),true);
});

test('repeats and out-of-order transitions are reported but remain valid',()=>{
  const out=ukc.analyzePath({id:'looped',phases:['command and control','pivoting','discovery','credential access','lateral movement','pivoting','discovery','privilege escalation']});
  assert.equal(out.valid,true);
  assert.equal(out.repeats.find(x=>x.phase==='pivoting').count,2);
  assert.ok(out.noncanonical_transitions.length>=1);
  assert.equal(out.semantics.noncanonical_is_not_invalid,true);
});

test('pivoting is first-class choke-point evidence',()=>{
  const out=ukc.analyzePath({phases:['command_and_control',{phase:'pivoting',evidence_refs:['ev-1']},'discovery']});
  assert.equal(out.pivot_chokepoints.length,1);
  assert.deepEqual(out.pivot_chokepoints[0].evidence_refs,['ev-1']);
  assert.equal(out.pivot_chokepoints[0].before,'command_and_control');
  assert.equal(out.pivot_chokepoints[0].after,'discovery');
});


test('specific explicit UKC labels suppress only known generic overlaps',()=>{
  const r=ukc.explicitPhaseResolution(['exploitation','execution','privilege escalation']);
  assert.deepEqual(r.retained,['privilege_escalation']);
  assert.deepEqual(new Set(r.suppressed),new Set(['execution','exploitation']));
  assert.equal(r.resolved,'privilege_escalation');
});

test('coverage keeps unknown distinct from negative and highlights observed control gaps',()=>{
  const out=ukc.coverage({
    observations:[{phase:'pivoting',evidence_refs:['p1']},{phase:'discovery',evidence_refs:['d1']},{phase:'mystery'}],
    controls:[{id:'ctrl-pivot',phase:'pivoting',course:'detect'}]
  });
  assert.equal(out.pivot_chokepoint.observed,true);
  assert.equal(out.pivot_chokepoint.control_count,1);
  assert.ok(out.control_gaps_on_observed_phases.includes('discovery'));
  assert.equal(out.unresolved.length,1);
});

test('path comparison measures tactical convergence without actor attribution',()=>{
  const out=ukc.comparePaths({paths:[
    {id:'a',phases:['command_and_control','pivoting','discovery','privilege_escalation','execution','credential_access','lateral_movement']},
    {id:'b',phases:['command_and_control','pivoting','discovery','privilege_escalation','execution','credential_access','lateral_movement','collection']}
  ]});
  assert.equal(out.pairwise.length,1);
  assert.ok(out.pairwise[0].phase_set_jaccard>.8);
  assert.ok(out.common_phases.includes('pivoting'));
  assert.match(out.interpretation,/do not establish actor identity/i);
});

test('public UKC API exposes model and path analysis',async()=>{
  let body,status;
  const res={setHeader(){},status(s){status=s;return this},json(x){body=x;return x}};
  api({method:'GET'},res);
  assert.equal(status,200);assert.equal(body.phases.length,18);
  api({method:'POST',body:{action:'analyze_path',input:{phases:['pivoting','discovery','pivoting']}}},res);
  assert.equal(status,200);assert.equal(body.valid,true);assert.equal(body.pivot_chokepoints.length,2);
});
