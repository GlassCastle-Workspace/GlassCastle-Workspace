const crypto=require('node:crypto');
const ukc=require('./ukc-model');

const MODEL_CONTRACT='shatteredcastles.diamond.model.v1';
const EVENT_CONTRACT='shatteredcastles.diamond.event.v1';
const THREAD_CONTRACT='shatteredcastles.diamond.thread.v1';
const GROUP_CONTRACT='shatteredcastles.diamond.group.v1';
const PIVOT_CONTRACT='shatteredcastles.diamond.pivot.v1';

const CORE=['adversary','infrastructure','capability','victim'];
const META=['timestamp','phase','result','direction','methodology','resources'];
const EDGES=[
  ['adversary','capability'],['adversary','infrastructure'],
  ['infrastructure','capability'],['infrastructure','victim'],
  ['capability','victim']
];
function stable(value){
  if(Array.isArray(value))return value.map(stable);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));
  return value;
}
function sha256(value){return crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex')}
function clean(value){
  if(value==null||value==='')return null;
  if(typeof value==='string'||typeof value==='number'||typeof value==='boolean')return value;
  if(Array.isArray(value))return value.map(clean).filter(v=>v!=null);
  if(typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,clean(v)]).filter(([,v])=>v!=null));
  return String(value);
}
function confidence(raw){
  if(raw==null||raw==='')return null;
  return clean(raw);
}
const FAMILY_CONTRACT='shatteredcastles.diamond.group-family.v1';
const CONTEXT_CONTRACT='shatteredcastles.diamond.contextual-indicator.v1';
const OVERLAY_CONTRACT='shatteredcastles.diamond.activity-attack.v1';
const DIRECTION_VALUES=['victim-to-infrastructure','infrastructure-to-victim','infrastructure-to-infrastructure','adversary-to-infrastructure','infrastructure-to-adversary','bidirectional','unknown'];
const CENTERED={
  victim:{direct:['infrastructure','capability'],context:['social_political'],hypothesis:['adversary']},
  capability:{direct:['adversary','infrastructure','victim'],context:['technology'],hypothesis:[]},
  infrastructure:{direct:['adversary','capability','victim'],context:['technology'],hypothesis:[]},
  adversary:{direct:['capability','infrastructure'],context:['social_political'],hypothesis:['victim']},
  social_political:{direct:[],context:['adversary','victim'],hypothesis:['adversary','victim']},
  technology:{direct:[],context:['capability','infrastructure'],hypothesis:['capability','infrastructure']}
};
function feature(raw){
  if(raw==null||raw==='')return {value:null,confidence:null,known:false};
  if(raw&&typeof raw==='object'&&!Array.isArray(raw)&&('value' in raw||'confidence' in raw)){
    const value=clean(raw.value);return {value,confidence:confidence(raw.confidence),known:value!=null};
  }
  const value=clean(raw);return {value,confidence:null,known:value!=null};
}
function unique(xs){return [...new Set((xs||[]).filter(x=>x!=null&&x!==''))]}
function normalizePhase(raw){
  const f=feature(raw);if(!f.known)return {...f,framework:null,ukc_phase_refs:[],ukc_resolution:null};
  const obj=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  const refs=obj.ukc_phase_refs||obj.ukc_refs||obj.phases||((String(obj.framework||'').toLowerCase()==='ukc'&&obj.value!=null)?[obj.value]:[]);
  const resolution=ukc.explicitPhaseResolution(refs);
  return {...f,framework:obj.framework||null,ukc_phase_refs:unique(resolution.resolved?[resolution.resolved]:resolution.retained),ukc_resolution:resolution};
}
function normalizeMeta(raw={}){
  const direction=feature(raw.direction);if(direction.known){const d=String(direction.value).toLowerCase();direction.value=DIRECTION_VALUES.includes(d)?d:String(direction.value)}
  return {
    timestamp:feature(raw.timestamp||{value:{start:raw.timestamp_start||null,end:raw.timestamp_end||null},confidence:raw.timestamp_confidence}),
    phase:normalizePhase(raw.phase||{value:raw.phase_value||null,confidence:raw.phase_confidence,ukc_phase_refs:raw.ukc_phase_refs||[]}),
    result:feature(raw.result),direction,methodology:feature(raw.methodology),resources:feature(raw.resources),
    social_political:feature(raw.social_political),technology:feature(raw.technology)
  };
}
function model(){
  const body={contract:MODEL_CONTRACT,name:'Diamond Model of Intrusion Analysis',version:'Caltagirone-Pendergast-Betz-2013',suite:'ShatteredCastle(s)',core_features:CORE,meta_features:META,extended_features:['social_political','technology'],core_edges:EDGES,extended_axes:[{between:['adversary','victim'],feature:'social_political'},{between:['capability','infrastructure'],feature:'technology'}],direction_values:DIRECTION_VALUES,centered_approaches:CENTERED,semantics:{unknown_features_are_knowledge_gaps:true,confidence_scheme_implementation_defined:true,phase_model_pluggable:true,automatic_attribution:false,pivot_success_guaranteed:false,grouping_problem_specific:true}};
  return {...body,model_digest_sha256:sha256(body)};
}
function normalizeTimestamp(raw={}){
  if(raw.timestamp!=null&&raw.timestamp!=='')return feature(raw.timestamp);
  const start=clean(raw.timestamp_start),end=clean(raw.timestamp_end);
  if(start==null&&end==null)return {value:null,confidence:confidence(raw.timestamp_confidence),known:false};
  return {value:{start,end},confidence:confidence(raw.timestamp_confidence),known:true};
}
function normalizeEvent(input={}){
  const core=Object.fromEntries(CORE.map(k=>[k,feature(input[k])]));
  const meta=normalizeMeta(input.meta||input);
  meta.timestamp=normalizeTimestamp(input.meta||input);
  const extended={social_political:meta.social_political,technology:meta.technology};
  delete meta.social_political;delete meta.technology;
  const knownCore=CORE.filter(k=>core[k].known);
  const knownMeta=META.filter(k=>meta[k].known);
  const knowledgeGaps=[...CORE.filter(k=>!core[k].known),...META.filter(k=>!meta[k].known),...Object.keys(extended).filter(k=>!extended[k].known)];
  const graphEdges=EDGES.map(([a,b])=>({from:a,to:b,observable:core[a].known&&core[b].known,relationship:'fundamental'}));
  const body={contract:EVENT_CONTRACT,event_id:input.event_id||input.id||null,core,meta,extended,known_features:{core:knownCore,meta:knownMeta,extended:Object.keys(extended).filter(k=>extended[k].known)},knowledge_gaps:knowledgeGaps,graph:{vertices:CORE,edges:graphEdges},evidence_refs:unique(input.evidence_refs||input.evidence||[]),notes:clean(input.notes),claim_policy:'Unknown Diamond features remain explicit knowledge gaps. Event normalization does not establish attribution, causality, exploitability, intent, or severity.'};
  return {...body,event_digest_sha256:sha256(body)};
}
function pivot(input={}){
  const event=input.event?.contract===EVENT_CONTRACT?input.event:normalizeEvent(input.event||input);
  const center=String(input.center||'').toLowerCase();
  if(!CENTERED[center])throw new Error(`Unsupported Diamond pivot center: ${center}`);
  const centerKnown=center in event.core?event.core[center]?.known:event.extended[center]?.known;
  const plan=CENTERED[center];
  const opportunities=[];
  for(const target of plan.direct)opportunities.push({target,kind:'direct_relationship',known:target in event.core?event.core[target].known:event.extended[target]?.known||false});
  for(const target of plan.context)opportunities.push({target,kind:'contextual_axis',known:target in event.core?event.core[target].known:event.extended[target]?.known||false});
  for(const target of plan.hypothesis)opportunities.push({target,kind:'hypothesis_only',known:target in event.core?event.core[target].known:event.extended[target]?.known||false});
  const body={contract:PIVOT_CONTRACT,event_id:event.event_id,event_digest_sha256:event.event_digest_sha256,center,center_known:!!centerKnown,opportunities,knowledge_gap_targets:opportunities.filter(x=>!x.known).map(x=>x.target),evidence_refs:event.evidence_refs,semantics:{possible_not_certain:true,hypothesis_testing_required:true,no_network_action:true},claim_policy:'Diamond pivoting identifies analytically connected knowledge gaps. It does not claim a pivot will succeed or that a discovered relation is causal.'};
  return {...body,pivot_digest_sha256:sha256(body)};
}
function contextualIndicators(input={}){
  const event=input.event?.contract===EVENT_CONTRACT?input.event:normalizeEvent(input.event||input);
  const rows=[];
  for(const k of CORE){if(event.core[k].known)rows.push({role:k,value:event.core[k].value,confidence:event.core[k].confidence,event_id:event.event_id});}
  for(const k of ['methodology','resources','result','direction']){if(event.meta[k].known)rows.push({role:k,value:event.meta[k].value,confidence:event.meta[k].confidence,event_id:event.event_id});}
  const body={contract:CONTEXT_CONTRACT,event_id:event.event_id,event_digest_sha256:event.event_digest_sha256,indicators:rows,relationship_context:{core_edges:EDGES,extended_axes:model().extended_axes},claim_policy:'Contextual indicators retain their Diamond role and event provenance; they are not flat attribution indicators.'};
  return {...body,context_digest_sha256:sha256(body)};
}
function normalizeArc(raw={},index=0){
  const from=String(raw.from||raw.source||'').trim(),to=String(raw.to||raw.target||'').trim();
  if(!from||!to)throw new Error(`Diamond thread arc ${index+1} requires from and to event IDs.`);
  const andOr=String(raw.and_or||raw.andOr||'unknown').toLowerCase();
  const actuality=String(raw.actuality||raw.hypothesis_actual||raw.status||'unknown').toLowerCase();
  return {arc_id:raw.arc_id||`arc-${index+1}`,from,to,confidence:confidence(raw.confidence),and_or:['and','or'].includes(andOr)?andOr:'unknown',actuality:['actual','hypothesis','hypothesized'].includes(actuality)?(actuality==='hypothesized'?'hypothesis':actuality):'unknown',provides:clean(raw.provides),evidence_refs:unique(raw.evidence_refs||raw.evidence||[])};
}
function activityThread(input={}){
  const events=(input.events||[]).map(e=>e?.contract===EVENT_CONTRACT?e:normalizeEvent(e));
  if(!events.length)throw new Error('Diamond activity thread requires at least one event.');
  const ids=new Set(events.map((e,i)=>e.event_id||`event-${i+1}`));events.forEach((e,i)=>{if(!e.event_id)e.event_id=`event-${i+1}`});
  const arcs=(input.arcs||[]).map(normalizeArc);for(const a of arcs)if(!ids.has(a.from)||!ids.has(a.to))throw new Error(`Diamond thread arc references unknown event: ${a.from} -> ${a.to}`);
  const adversaries=unique(events.filter(e=>e.core.adversary.known).map(e=>JSON.stringify(stable(e.core.adversary.value))));
  const victims=unique(events.filter(e=>e.core.victim.known).map(e=>JSON.stringify(stable(e.core.victim.value))));
  const phaseEvents=events.flatMap(e=>e.meta.phase.ukc_phase_refs.map(p=>({phase:p,evidence_refs:e.evidence_refs,event_id:e.event_id})));
  const ukcAnalysis=phaseEvents.length?ukc.analyzePath({path_id:input.thread_id||input.id||null,events:phaseEvents}):null;
  const body={contract:THREAD_CONTRACT,thread_id:input.thread_id||input.id||null,events,arcs,adversary_victim_pair:{adversary_values:adversaries.map(JSON.parse),victim_values:victims.map(JSON.parse),consistent:adversaries.length<=1&&victims.length<=1},ukc_path_analysis:ukcAnalysis,vertical_knowledge_gaps:events.flatMap(e=>e.knowledge_gaps.map(feature=>({event_id:e.event_id,feature}))),claim_policy:'Activity-thread arcs are caller-supplied causal hypotheses or evidence-backed relations. ShatteredCastle(s) does not infer causality from temporal order alone.'};
  return {...body,thread_digest_sha256:sha256(body)};
}
function itemId(x,i=0){return x?.event_id||x?.thread_id||x?.group_id||x?.id||`item-${i+1}`}
function pathValue(obj,path){return String(path||'').split('.').reduce((v,k)=>v==null?null:v[k],obj)}
function valuesFor(item,path){
  const isThread=item?.contract===THREAD_CONTRACT;
  if(isThread){
    if(path==='process.ukc_phases')return unique(item.ukc_path_analysis?.events?.map(e=>e.phase)||[]);
    return unique(item.events.flatMap(e=>{const v=pathValue(e,path);return v==null?[]:[JSON.stringify(stable(v))]})).map(x=>{try{return JSON.parse(x)}catch{return x}});
  }
  const v=pathValue(item,path);return v==null?[]:[v];
}
function normalizeFeatureVector(raw=[]){
  if(!Array.isArray(raw)||!raw.length)throw new Error('Diamond activity group requires a non-empty feature_vector.');
  return raw.map((f,i)=>{const path=String(f.path||f.feature||'').trim();if(!path)throw new Error(`Feature vector item ${i+1} requires path.`);const weight=Number(f.weight??1);if(!(weight>0&&weight<=1))throw new Error(`Feature vector weight must be > 0 and <= 1: ${path}`);return{path,weight}});
}
function pairSimilarity(a,b,vector){
  let hit=0,total=0;const features=[];
  for(const f of vector){total+=f.weight;const av=valuesFor(a,f.path),bv=valuesFor(b,f.path),as=new Set(av.map(x=>JSON.stringify(stable(x)))),overlap=bv.filter(x=>as.has(JSON.stringify(stable(x))));if(overlap.length)hit+=f.weight;features.push({path:f.path,weight:f.weight,matched:overlap.length>0,overlap})}
  return {score:total?hit/total:0,features};
}
function activityGroup(input={}){
  const items=(input.items||input.members||[]).map(x=>x?.contract===THREAD_CONTRACT||x?.contract===EVENT_CONTRACT?x:(x.events?activityThread(x):normalizeEvent(x)));
  if(!items.length)throw new Error('Diamond activity group requires at least one event or thread.');
  const problem=String(input.analytic_problem||input.problem||'').trim();if(!problem)throw new Error('Diamond activity group requires analytic_problem.');
  const vector=normalizeFeatureVector(input.feature_vector||[]);
  const pairwise=[];for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++)pairwise.push({a:itemId(items[i],i),b:itemId(items[j],j),...pairSimilarity(items[i],items[j],vector)});
  const body={contract:GROUP_CONTRACT,group_id:input.group_id||input.id||null,analytic_problem:problem,feature_vector:vector,members:items.map((x,i)=>({id:itemId(x,i),contract:x.contract,digest:x.event_digest_sha256||x.thread_digest_sha256||null})),membership_basis:'caller-supplied',pairwise_similarity:pairwise,group_confidence:confidence(input.group_confidence||input.confidence),outliers:unique(input.outliers||[]),warnings:['Similarity does not establish common adversary or causality.','Shared public infrastructure/common capabilities may overfit unrelated activity.','Re-evaluate feature vector and membership as new evidence arrives.'],claim_policy:'Activity Group v1 preserves an analyst-defined grouping and computes feature-vector similarity. It does not auto-attribute or auto-cluster events.'};
  return {...body,group_digest_sha256:sha256(body)};
}
function groupFamily(input={}){
  const groups=(input.groups||[]).filter(x=>x?.contract===GROUP_CONTRACT);if(!groups.length)throw new Error('Diamond group family requires one or more normalized activity groups.');
  const problem=String(input.analytic_problem||input.problem||'').trim();if(!problem)throw new Error('Diamond group family requires analytic_problem.');
  const body={contract:FAMILY_CONTRACT,family_id:input.family_id||input.id||null,analytic_problem:problem,groups:groups.map(g=>({group_id:g.group_id,digest:g.group_digest_sha256,analytic_problem:g.analytic_problem})),shared_features:clean(input.shared_features),confidence:confidence(input.confidence),membership_basis:'caller-supplied',claim_policy:'Activity Group Families organize explicit group relationships. They do not establish organizational hierarchy, tasking, sponsorship, or attribution without evidence.'};
  return {...body,family_digest_sha256:sha256(body)};
}
function activityAttackOverlay(input={}){
  const threads=(input.threads||[]).map(t=>t?.contract===THREAD_CONTRACT?t:activityThread(t));
  const graph=input.attack_graph||{};const nodes=Array.isArray(graph.nodes)?graph.nodes:[],edges=Array.isArray(graph.edges)?graph.edges:[];
  const nodeIds=new Set(nodes.map(n=>String(n.id)));const eventIds=new Set(threads.flatMap(t=>t.events.map(e=>String(e.event_id))));
  const bindings=(input.bindings||[]).map((b,i)=>({binding_id:b.binding_id||`binding-${i+1}`,event_id:String(b.event_id||''),node_id:String(b.node_id||''),confidence:confidence(b.confidence),evidence_refs:unique(b.evidence_refs||[])}));
  for(const b of bindings){if(!eventIds.has(b.event_id))throw new Error(`Activity-attack binding references unknown event: ${b.event_id}`);if(!nodeIds.has(b.node_id))throw new Error(`Activity-attack binding references unknown attack-graph node: ${b.node_id}`)}
  const boundEvents=new Set(bindings.map(b=>b.event_id));
  const body={contract:OVERLAY_CONTRACT,threads:threads.map(t=>({thread_id:t.thread_id,digest:t.thread_digest_sha256})),attack_graph:{nodes,edges},actual_path_bindings:bindings,unmapped_thread_events:[...eventIds].filter(x=>!boundEvents.has(x)),semantics:{activity_threads_describe_observed_or_hypothesized_actual_activity:true,attack_graph_describes_possible_paths:true,bindings_explicit_only:true},claim_policy:'The activity-attack overlay keeps observed/preferred activity separate from merely possible paths. It does not predict a future path without an explicit analytic model.'};
  return {...body,overlay_digest_sha256:sha256(body)};
}
function runAction(body={}){
  const action=String(body.action||'model').toLowerCase();
  if(action==='model')return model();
  if(action==='event'||action==='normalize_event')return normalizeEvent(body.event||body.input||body);
  if(action==='pivot')return pivot({event:body.event||body.input,center:body.center});
  if(action==='contextualize')return contextualIndicators({event:body.event||body.input});
  if(action==='thread')return activityThread(body.thread||body.input||body);
  if(action==='group')return activityGroup(body.group||body.input||body);
  if(action==='group_family')return groupFamily(body.family||body.input||body);
  if(action==='activity_attack'||action==='overlay')return activityAttackOverlay(body);
  throw new Error(`Unsupported Diamond action: ${action}`);
}
module.exports={
  MODEL_CONTRACT,EVENT_CONTRACT,THREAD_CONTRACT,GROUP_CONTRACT,FAMILY_CONTRACT,PIVOT_CONTRACT,CONTEXT_CONTRACT,OVERLAY_CONTRACT,
  CORE,META,EDGES,DIRECTION_VALUES,CENTERED,
  model,normalizeEvent,pivot,contextualIndicators,activityThread,activityGroup,groupFamily,activityAttackOverlay,runAction,sha256,stable
};
