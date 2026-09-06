const crypto=require('node:crypto');
const ukc=require('./ukc-model');
const diamond=require('./diamond-model');

const MODEL_CONTRACT='shatteredcastles.pyramid.model.v1';
const INDICATOR_CONTRACT='shatteredcastles.pyramid.indicator.v1';
const PORTFOLIO_CONTRACT='shatteredcastles.pyramid.portfolio.v1';
const UKC_PLAN_CONTRACT='shatteredcastles.pyramid.ukc-plan.v1';
const DIAMOND_OVERLAY_CONTRACT='shatteredcastles.pyramid.diamond-overlay.v1';

const CATEGORIES=[
  {id:'hash_value',label:'Hash Values',pain_tier:1,ordinal:1,aliases:['hash','hashes','file_hash','hash_value','hash_values']},
  {id:'ip_address',label:'IP Addresses',pain_tier:2,ordinal:2,aliases:['ip','ip_address','ip_addresses']},
  {id:'domain_name',label:'Domain Names',pain_tier:3,ordinal:3,aliases:['domain','domain_name','domain_names','fqdn']},
  {id:'network_artifact',label:'Network Artifacts',pain_tier:4,ordinal:4,aliases:['network_artifact','network_artifacts','network']},
  {id:'host_artifact',label:'Host Artifacts',pain_tier:4,ordinal:5,aliases:['host_artifact','host_artifacts','host']},
  {id:'tool',label:'Tools',pain_tier:5,ordinal:6,aliases:['tool','tools']},
  {id:'ttp',label:'Tactics, Techniques and Procedures',pain_tier:6,ordinal:7,aliases:['ttp','ttps','tactic_technique_procedure','tactics_techniques_procedures']}
];
const STATUS=['detected','detectable','gap','unknown'];
const PURPOSE=['detection','attribution','prediction','profiling','unspecified'];

function stable(value){
  if(Array.isArray(value))return value.map(stable);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));
  return value;
}
function sha256(value){return crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex')}
function unique(xs){return [...new Set((xs||[]).filter(x=>x!=null&&x!==''))]}
function clean(value){
  if(value==null||value==='')return null;
  if(typeof value==='string'||typeof value==='number'||typeof value==='boolean')return value;
  if(Array.isArray(value))return value.map(clean).filter(v=>v!=null);
  if(typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,clean(v)]).filter(([,v])=>v!=null));
  return String(value);
}
function token(raw){return String(raw||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')}
const BY_ALIAS=Object.fromEntries(CATEGORIES.flatMap(c=>[c.id,...c.aliases].map(a=>[a,c])));
function category(raw){const hit=BY_ALIAS[token(raw)];if(!hit)throw new Error(`Pyramid indicator_type must be explicit and supported: ${raw||'missing'}`);return hit}
function normalizeStatus(raw){const t=token(raw||'unknown');if(!STATUS.includes(t))throw new Error(`Unsupported Pyramid status: ${raw}`);return t}
function normalizePurpose(raw){const t=token(raw||'unspecified');if(!PURPOSE.includes(t))throw new Error(`Unsupported indicator purpose: ${raw}`);return t}
function normalizeUkcRefs(raw){const r=ukc.explicitPhaseResolution(raw||[]);return{refs:r.resolved?[r.resolved]:r.retained,resolution:r}}

function model(){
  const body={
    contract:MODEL_CONTRACT,name:'Pyramid of Pain',version:'Bianco-2014-revised',suite:'ShatteredCastle(s)',
    source:{author:'David J. Bianco',published:'2013-03-01',revision:'2014-01-17',revision_note:'Hash Values added as the bottom layer in the 2014 revision.'},
    categories:CATEGORIES.map(({aliases,...x})=>x),pain_tiers:6,
    semantics:{
      ordinal_relative_adversary_change_burden:true,quantitative_cost_score:false,network_and_host_artifacts_share_tier:true,
      explicit_indicator_type_required:true,automatic_value_classification:false,automatic_maliciousness_inference:false,
      automatic_attribution:false,indicator_purpose_matters:true,defender_detection_planning_lens:true
    },
    composition:{
      ukc:{contract:ukc.CONTRACT,role:'progression',binding:'explicit-only'},
      diamond:{contract:diamond.MODEL_CONTRACT,role:'relationship',binding:'explicit-only'},
      pyramid:{role:'relative adversary change burden and defender detection leverage'}
    }
  };
  return {...body,model_digest_sha256:sha256(body)};
}

function normalizeIndicator(input={}){
  const c=category(input.indicator_type||input.type||input.category);
  const phase=normalizeUkcRefs(input.ukc_phase_refs||input.phases||input.phase_refs||[]);
  const body={
    contract:INDICATOR_CONTRACT,indicator_id:input.indicator_id||input.id||null,indicator_type:c.id,label:c.label,
    pain_tier:c.pain_tier,pain_rank_semantics:'ordinal-only',value:clean(input.value),purpose:normalizePurpose(input.purpose),
    status:normalizeStatus(input.status),confidence:clean(input.confidence),evidence_refs:unique(input.evidence_refs||input.evidence||[]),
    ukc_phase_refs:phase.refs,ukc_phase_resolution:phase.resolution,diamond_event_refs:unique(input.diamond_event_refs||input.event_refs||[]),
    notes:clean(input.notes),
    claim_policy:'Pyramid normalization preserves an explicitly supplied indicator type and relative tier. It does not establish maliciousness, attribution, causality, scope, authorization, or a numeric adversary cost.'
  };
  return {...body,indicator_digest_sha256:sha256(body)};
}

function portfolio(input={}){
  const indicators=(input.indicators||input.items||[]).map(normalizeIndicator);
  const byType=Object.fromEntries(CATEGORIES.map(c=>[c.id,{indicator_type:c.id,label:c.label,pain_tier:c.pain_tier,total:0,status:Object.fromEntries(STATUS.map(s=>[s,0]))}]));
  for(const i of indicators){const row=byType[i.indicator_type];row.total++;row.status[i.status]++}
  const byTier=[];
  for(let tier=1;tier<=6;tier++){
    const rows=Object.values(byType).filter(x=>x.pain_tier===tier);
    byTier.push({pain_tier:tier,total:rows.reduce((n,x)=>n+x.total,0),detected:rows.reduce((n,x)=>n+x.status.detected,0),detectable:rows.reduce((n,x)=>n+x.status.detectable,0),gap:rows.reduce((n,x)=>n+x.status.gap,0),unknown:rows.reduce((n,x)=>n+x.status.unknown,0),indicator_types:rows.map(x=>x.indicator_type)});
  }
  const present=byTier.filter(x=>x.total>0);
  const body={contract:PORTFOLIO_CONTRACT,threat_domain:clean(input.threat_domain),indicators,by_type:Object.values(byType),by_tier:byTier,highest_supplied_pain_tier:present.length?Math.max(...present.map(x=>x.pain_tier)):null,semantics:{coverage_is_input_bound:true,missing_indicator_types_are_unknown_not_absent:true,no_weighted_score:true},claim_policy:'Portfolio summaries describe only supplied indicators and statuses. Higher Pyramid tier is an ordinal replacement-burden concept, not a severity score or quantified adversary cost.'};
  return {...body,portfolio_digest_sha256:sha256(body)};
}

function ukcPlan(input={}){
  const p=portfolio(input);
  const phases=ukc.PHASES.map(ph=>({phase:ph.id,label:ph.label,macro:ph.macro,indicators:[],detected:0,detectable:0,gap:0,unknown:0,highest_supplied_pain_tier:null}));
  const byId=Object.fromEntries(phases.map(x=>[x.phase,x]));
  const unbound=[];
  for(const i of p.indicators){
    if(!i.ukc_phase_refs.length){unbound.push(i.indicator_id||i.indicator_digest_sha256);continue}
    for(const ref of i.ukc_phase_refs){const row=byId[ref];if(!row)continue;row.indicators.push({indicator_id:i.indicator_id,indicator_type:i.indicator_type,pain_tier:i.pain_tier,status:i.status,evidence_refs:i.evidence_refs});row[i.status]++;row.highest_supplied_pain_tier=Math.max(row.highest_supplied_pain_tier||0,i.pain_tier)}
  }
  const observed=phases.filter(x=>x.indicators.length);
  const body={contract:UKC_PLAN_CONTRACT,threat_domain:p.threat_domain,model_contracts:{ukc:ukc.CONTRACT,pyramid:MODEL_CONTRACT},phase_plan:phases,phases_with_supplied_indicators:observed.map(x=>x.phase),unbound_indicator_refs:unbound,short_term_candidates:observed.flatMap(x=>x.indicators.filter(i=>i.status==='detectable').map(i=>({phase:x.phase,...i}))),gaps:observed.flatMap(x=>x.indicators.filter(i=>i.status==='gap').map(i=>({phase:x.phase,...i}))),semantics:{phase_binding_explicit_only:true,pyramid_ranking_ordinal_only:true,defender_cost_not_modeled:true,missing_phase_indicators_are_unknown_not_proof_of_absence:true},claim_policy:'The UKC-Pyramid plan organizes explicitly bound detection indicators by attack phase and relative Pyramid tier. It does not infer attacker activity, recommend intrusive action, or quantify defender/adversary cost.'};
  return {...body,plan_digest_sha256:sha256(body)};
}

function diamondOverlay(input={}){
  const indicators=(input.indicators||[]).map(normalizeIndicator);
  const events=(input.events||[]).map(e=>e?.contract===diamond.EVENT_CONTRACT?e:diamond.normalizeEvent(e));
  const indicatorIds=new Set(indicators.map((i,n)=>String(i.indicator_id||`indicator-${n+1}`)));
  const eventIds=new Set(events.map((e,n)=>String(e.event_id||`event-${n+1}`)));
  indicators.forEach((i,n)=>{if(!i.indicator_id)i.indicator_id=`indicator-${n+1}`});
  events.forEach((e,n)=>{if(!e.event_id)e.event_id=`event-${n+1}`});
  const bindings=(input.bindings||[]).map((b,n)=>({binding_id:b.binding_id||`binding-${n+1}`,indicator_id:String(b.indicator_id||''),event_id:String(b.event_id||''),diamond_feature:clean(b.diamond_feature||b.feature),confidence:clean(b.confidence),evidence_refs:unique(b.evidence_refs||[])}));
  for(const b of bindings){if(!indicatorIds.has(b.indicator_id))throw new Error(`Pyramid-Diamond binding references unknown indicator: ${b.indicator_id}`);if(!eventIds.has(b.event_id))throw new Error(`Pyramid-Diamond binding references unknown event: ${b.event_id}`)}
  const boundIndicators=new Set(bindings.map(x=>x.indicator_id)),boundEvents=new Set(bindings.map(x=>x.event_id));
  const body={contract:DIAMOND_OVERLAY_CONTRACT,model_contracts:{pyramid:MODEL_CONTRACT,diamond:diamond.MODEL_CONTRACT},indicators:indicators.map(i=>({indicator_id:i.indicator_id,indicator_type:i.indicator_type,pain_tier:i.pain_tier,digest:i.indicator_digest_sha256})),events:events.map(e=>({event_id:e.event_id,digest:e.event_digest_sha256})),bindings,unbound_indicators:indicators.filter(i=>!boundIndicators.has(i.indicator_id)).map(i=>i.indicator_id),unbound_events:events.filter(e=>!boundEvents.has(e.event_id)).map(e=>e.event_id),semantics:{bindings_explicit_only:true,diamond_role_not_inferred_from_indicator_type:true,pyramid_tier_does_not_change_diamond_confidence:true},claim_policy:'The Pyramid-Diamond overlay links explicit detection indicators to explicit intrusion-analysis events. It does not infer Diamond vertices, actor identity, causality, or maliciousness.'};
  return {...body,overlay_digest_sha256:sha256(body)};
}

function runAction(body={}){
  const action=token(body.action||'model');
  if(action==='model')return model();
  if(action==='indicator'||action==='normalize_indicator')return normalizeIndicator(body.indicator||body.input||body);
  if(action==='portfolio')return portfolio(body.portfolio||body.input||body);
  if(action==='ukc_plan'||action==='plan')return ukcPlan(body.plan||body.input||body);
  if(action==='diamond_overlay'||action==='overlay')return diamondOverlay(body.overlay||body.input||body);
  throw new Error(`Unsupported Pyramid action: ${action}`);
}

module.exports={MODEL_CONTRACT,INDICATOR_CONTRACT,PORTFOLIO_CONTRACT,UKC_PLAN_CONTRACT,DIAMOND_OVERLAY_CONTRACT,CATEGORIES,STATUS,PURPOSE,model,normalizeIndicator,portfolio,ukcPlan,diamondOverlay,runAction,sha256,stable};
