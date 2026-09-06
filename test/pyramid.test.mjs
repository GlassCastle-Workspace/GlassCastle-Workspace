import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const p=require('../site/lib/pyramid-model.js');

test('Pyramid model preserves seven categories across six ordinal pain tiers',()=>{
  const m=p.model();
  assert.equal(m.categories.length,7);
  assert.equal(m.pain_tiers,6);
  assert.equal(m.categories.find(x=>x.id==='network_artifact').pain_tier,4);
  assert.equal(m.categories.find(x=>x.id==='host_artifact').pain_tier,4);
  assert.equal(m.semantics.quantitative_cost_score,false);
  assert.equal(m.semantics.automatic_value_classification,false);
});

test('indicator type must be explicit and value alone is never auto-classified',()=>{
  assert.throws(()=>p.normalizeIndicator({value:'203.0.113.10'}),/indicator_type must be explicit/i);
  const i=p.normalizeIndicator({indicator_id:'i1',indicator_type:'ip',value:'203.0.113.10',status:'detected'});
  assert.equal(i.indicator_type,'ip_address');
  assert.equal(i.pain_tier,2);
  assert.equal(i.pain_rank_semantics,'ordinal-only');
});

test('UKC binding remains explicit and can retain multiple explicit phases',()=>{
  const i=p.normalizeIndicator({indicator_type:'ttp',ukc_phase_refs:['Reconnaissance','Delivery'],status:'gap'});
  assert.deepEqual(i.ukc_phase_refs,['reconnaissance','delivery']);
  const j=p.normalizeIndicator({indicator_type:'tool',notes:'used during recon',status:'unknown'});
  assert.deepEqual(j.ukc_phase_refs,[]);
});

test('portfolio reports supplied coverage without inventing a weighted score',()=>{
  const x=p.portfolio({threat_domain:'controlled-fixture',indicators:[
    {id:'h',indicator_type:'hash',status:'detected'},
    {id:'n',indicator_type:'network_artifact',status:'detectable'},
    {id:'t',indicator_type:'ttp',status:'gap'}
  ]});
  assert.equal(x.highest_supplied_pain_tier,6);
  assert.equal(x.by_tier.find(r=>r.pain_tier===4).detectable,1);
  assert.equal(x.semantics.no_weighted_score,true);
});

test('UKC-Pyramid plan turns explicit phase bindings into detection posture',()=>{
  const plan=p.ukcPlan({threat_domain:'controlled-fixture',indicators:[
    {id:'a',indicator_type:'domain',status:'detected',ukc_phase_refs:['Command & Control']},
    {id:'b',indicator_type:'ttp',status:'gap',ukc_phase_refs:['Command & Control']},
    {id:'c',indicator_type:'tool',status:'detectable',ukc_phase_refs:['Pivoting']},
    {id:'d',indicator_type:'hash',status:'unknown'}
  ]});
  const c2=plan.phase_plan.find(x=>x.phase==='command_and_control');
  assert.equal(c2.detected,1);assert.equal(c2.gap,1);assert.equal(c2.highest_supplied_pain_tier,6);
  assert.ok(plan.short_term_candidates.some(x=>x.phase==='pivoting'&&x.indicator_id==='c'));
  assert.ok(plan.unbound_indicator_refs.includes('d'));
  assert.equal(plan.semantics.phase_binding_explicit_only,true);
});

test('Pyramid-Diamond overlay requires explicit known IDs and does not infer Diamond roles',()=>{
  const o=p.diamondOverlay({
    indicators:[{id:'i1',indicator_type:'network_artifact',status:'detected'}],
    events:[{event_id:'e1',infrastructure:'controlled.example'}],
    bindings:[{indicator_id:'i1',event_id:'e1',diamond_feature:'infrastructure',confidence:'high'}]
  });
  assert.equal(o.bindings.length,1);
  assert.equal(o.semantics.bindings_explicit_only,true);
  assert.equal(o.semantics.diamond_role_not_inferred_from_indicator_type,true);
  assert.throws(()=>p.diamondOverlay({indicators:[{id:'i1',indicator_type:'domain'}],events:[{event_id:'e1'}],bindings:[{indicator_id:'missing',event_id:'e1'}]}),/unknown indicator/i);
});

test('public Pyramid API exposes model and deterministic pure actions',async()=>{
  const handler=require('../site/api/v1/pyramid.js');
  const invoke=req=>new Promise(resolve=>{const res={setHeader(){},status(c){this.code=c;return this},json(x){resolve({code:this.code||200,body:x})}};handler(req,res)});
  const m=await invoke({method:'GET'});assert.equal(m.code,200);assert.equal(m.body.categories.length,7);
  const i=await invoke({method:'POST',body:{action:'normalize_indicator',indicator:{id:'api-i1',indicator_type:'tool',status:'detectable'}}});
  assert.equal(i.code,200);assert.equal(i.body.contract,'shatteredcastles.pyramid.indicator.v1');assert.equal(i.body.pain_tier,5);
});
