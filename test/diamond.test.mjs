import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const d=require('../site/lib/diamond-model.js');

test('Diamond model preserves four core vertices and five paper-defined edges',()=>{
  const m=d.model();
  assert.deepEqual(m.core_features,['adversary','infrastructure','capability','victim']);
  assert.equal(m.core_edges.length,5);
  assert.equal(m.semantics.unknown_features_are_knowledge_gaps,true);
  assert.equal(m.semantics.automatic_attribution,false);
});

test('event keeps unknowns visible and preserves supplied confidence',()=>{
  const e=d.normalizeEvent({event_id:'e1',infrastructure:{value:'c2.example',confidence:'high'},victim:{value:'controlled-victim',confidence:{source:'direct',score:.9}}});
  assert.equal(e.core.adversary.known,false);
  assert.ok(e.knowledge_gaps.includes('adversary'));
  assert.equal(e.core.infrastructure.confidence,'high');
  assert.deepEqual(e.core.victim.confidence,{source:'direct',score:.9});
  assert.match(e.event_digest_sha256,/^[a-f0-9]{64}$/);
});

test('UKC phase binding is explicit and Diamond remains phase-model pluggable',()=>{
  const explicit=d.normalizeEvent({phase:{value:'Pivoting',framework:'ukc',confidence:'medium'}});
  assert.deepEqual(explicit.meta.phase.ukc_phase_refs,['pivoting']);
  const custom=d.normalizeEvent({phase:{value:'Custom Phase',framework:'local'}});
  assert.deepEqual(custom.meta.phase.ukc_phase_refs,[]);
  assert.equal(custom.meta.phase.value,'Custom Phase');
});

test('pivoting returns opportunities rather than claims',()=>{
  const e=d.normalizeEvent({infrastructure:'c2.example',capability:'tool'});
  const p=d.pivot({event:e,center:'infrastructure'});
  assert.equal(p.semantics.possible_not_certain,true);
  assert.equal(p.semantics.no_network_action,true);
  assert.ok(p.knowledge_gap_targets.includes('adversary'));
  assert.ok(p.opportunities.some(x=>x.target==='technology'));
});

test('activity thread preserves supplied causal arc semantics',()=>{
  const t=d.activityThread({thread_id:'t1',events:[{event_id:'e1',adversary:'A',victim:'V',phase:{value:'Reconnaissance',framework:'ukc'}},{event_id:'e2',adversary:'A',victim:'V',phase:{value:'Delivery',framework:'ukc'}}],arcs:[{from:'e1',to:'e2',confidence:'high',and_or:'and',actuality:'actual',provides:['targeting data']}]});
  assert.equal(t.arcs[0].confidence,'high');
  assert.equal(t.arcs[0].and_or,'and');
  assert.equal(t.arcs[0].actuality,'actual');
  assert.deepEqual(t.arcs[0].provides,['targeting data']);
  assert.equal(t.adversary_victim_pair.consistent,true);
  assert.equal(t.ukc_path_analysis.events.length,2);
});

test('activity group similarity does not auto-attribute or auto-cluster',()=>{
  const a=d.normalizeEvent({event_id:'a',infrastructure:{value:'shared.example',confidence:'medium'},capability:'tool-a'});
  const b=d.normalizeEvent({event_id:'b',infrastructure:{value:'shared.example',confidence:'low'},capability:'tool-b'});
  const g=d.activityGroup({group_id:'g1',analytic_problem:'Compare infrastructure reuse',feature_vector:[{path:'core.infrastructure.value',weight:1}],items:[a,b]});
  assert.equal(g.membership_basis,'caller-supplied');
  assert.equal(g.pairwise_similarity[0].score,1);
  assert.match(g.claim_policy,/does not auto-attrib/i);
});

test('activity-attack overlay keeps possible graph separate from actual event bindings',()=>{
  const t=d.activityThread({thread_id:'t1',events:[{event_id:'e1',phase:{value:'Reconnaissance',framework:'ukc'}}]});
  const o=d.activityAttackOverlay({threads:[t],attack_graph:{nodes:[{id:'n1'},{id:'n2'}],edges:[{from:'n1',to:'n2'}]},bindings:[{event_id:'e1',node_id:'n1',confidence:'high'}]});
  assert.equal(o.actual_path_bindings.length,1);
  assert.equal(o.attack_graph.nodes.length,2);
  assert.equal(o.semantics.bindings_explicit_only,true);
});

test('contextual indicators preserve Diamond role rather than flattening context',()=>{
  const c=d.contextualIndicators({event:{event_id:'e1',infrastructure:'1.2.3.4',methodology:['port scan']}});
  assert.ok(c.indicators.some(x=>x.role==='infrastructure'));
  assert.ok(c.indicators.some(x=>x.role==='methodology'));
  assert.equal(c.contract,'shatteredcastles.diamond.contextual-indicator.v1');
});

test('public Diamond API exposes model and event normalization',async()=>{
  const handler=require('../site/api/v1/diamond.js');
  const invoke=req=>new Promise(resolve=>{const res={setHeader(){},status(c){this.code=c;return this},json(x){resolve({code:this.code||200,body:x})}};handler(req,res)});
  const m=await invoke({method:'GET'});assert.equal(m.code,200);assert.equal(m.body.core_features.length,4);
  const e=await invoke({method:'POST',body:{action:'normalize_event',event:{event_id:'api-e1',infrastructure:'infra.example'}}});
  assert.equal(e.code,200);assert.equal(e.body.contract,'shatteredcastles.diamond.event.v1');assert.ok(e.body.knowledge_gaps.includes('adversary'));
});
