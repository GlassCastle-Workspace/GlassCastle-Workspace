const crypto=require('node:crypto');

const CONTRACT='shatteredcastles.ukc.model.v1';
const ANALYSIS_CONTRACT='shatteredcastles.ukc.path-analysis.v1';
const COVERAGE_CONTRACT='shatteredcastles.ukc.coverage.v1';
const COMPARISON_CONTRACT='shatteredcastles.ukc.comparison.v1';

const PHASES=[
  ['reconnaissance','Reconnaissance','Research, identify, and select targets using active or passive reconnaissance.','initial_foothold'],
  ['weaponization','Weaponization','Prepare infrastructure and other resources required for the attack.','initial_foothold'],
  ['delivery','Delivery','Transmit a weaponized object to the targeted environment.','initial_foothold'],
  ['social_engineering','Social Engineering','Manipulate people into performing unsafe actions.','initial_foothold'],
  ['exploitation','Exploitation','Exploit vulnerabilities or exposed features in systems.','initial_foothold'],
  ['persistence','Persistence','Establish access, actions, or changes that maintain a presence on a system.','initial_foothold'],
  ['defense_evasion','Defense Evasion','Specifically evade detection or avoid other defenses.','initial_foothold'],
  ['command_and_control','Command & Control','Communicate with systems already under attacker control.','initial_foothold'],
  ['pivoting','Pivoting','Tunnel through a controlled system toward systems that are not directly accessible.','pivot'],
  ['discovery','Discovery','Gain knowledge about a system and its network environment.','network_propagation'],
  ['privilege_escalation','Privilege Escalation','Obtain higher permissions on a system or network.','network_propagation'],
  ['execution','Execution','Execute attacker-controlled code on a local or remote system.','network_propagation'],
  ['credential_access','Credential Access','Obtain or control system, service, or domain credentials.','network_propagation'],
  ['lateral_movement','Lateral Movement','Horizontally access and control other remote systems.','network_propagation'],
  ['collection','Collection','Identify and gather information before exfiltration.','action_on_objectives'],
  ['exfiltration','Exfiltration','Remove or aid removal of files and information from the target.','action_on_objectives'],
  ['target_manipulation','Target Manipulation','Manipulate a target system to achieve an attack objective.','action_on_objectives'],
  ['objectives','Objectives','Represent socio-technical objectives intended to achieve a strategic goal.','objectives']
].map(([id,label,definition,macro],i)=>({id,label,definition,macro,canonical_order:i+1,mandatory:false}));

const MACROS=[
  {id:'initial_foothold',label:'Initial Foothold',phase_ids:PHASES.slice(0,8).map(x=>x.id),repeatable:true},
  {id:'pivot',label:'Pivot / Choke Point',phase_ids:['pivoting'],repeatable:true,chokepoint:true},
  {id:'network_propagation',label:'Network Propagation',phase_ids:PHASES.slice(9,14).map(x=>x.id),repeatable:true},
  {id:'action_on_objectives',label:'Action on Objectives',phase_ids:PHASES.slice(14,17).map(x=>x.id),repeatable:true},
  {id:'objectives',label:'Objectives',phase_ids:['objectives'],repeatable:false,strategic:true}
];

const ALIASES={
  c2:'command_and_control',command_control:'command_and_control',commandandcontrol:'command_and_control',
  priv_esc:'privilege_escalation',privilege_escalation:'privilege_escalation',
  creds:'credential_access',credential_theft:'credential_access',credential_access:'credential_access',
  lateral:'lateral_movement',lateral_movement:'lateral_movement',
  social_engineering:'social_engineering',defense_evasion:'defense_evasion',
  target_manipulation:'target_manipulation',action_on_objectives:'objectives'
};
const PHASE_BY_ID=Object.fromEntries(PHASES.map(x=>[x.id,x]));
const ORDER=Object.fromEntries(PHASES.map(x=>[x.id,x.canonical_order]));
const SPECIFIC_OVER_GENERIC={
  privilege_escalation:['execution','exploitation'],
  credential_access:['execution'],
  lateral_movement:['execution','pivoting'],
  collection:['objectives'],exfiltration:['objectives'],target_manipulation:['objectives']
};
function stable(value){
  if(Array.isArray(value))return value.map(stable);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));
  return value;
}
function sha256(value){return crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex')}
function slug(v){return String(v||'').trim().toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'')}
function normalizePhase(value){const s=slug(value);return PHASE_BY_ID[s]?s:(ALIASES[s]||null)}
function phaseRecord(id){return id&&PHASE_BY_ID[id]?{...PHASE_BY_ID[id]}:null}
function explicitPhaseResolution(refs=[]){
  const ids=[...new Set((Array.isArray(refs)?refs:[refs]).map(normalizePhase).filter(Boolean))];
  const suppressed=[];
  for(const specific of ids){for(const generic of SPECIFIC_OVER_GENERIC[specific]||[]){if(ids.includes(generic))suppressed.push(generic)}}
  const retained=ids.filter(x=>!suppressed.includes(x));
  return {retained,suppressed:[...new Set(suppressed)],resolved:retained.length===1?retained[0]:null,policy:'Only explicit UKC labels are resolved. No free-text tactic classification is performed.'};
}
function model(){
  const body={contract:CONTRACT,name:'Unified Kill Chain',version:'Pols-2017-final',suite:'ShatteredCastle(s)',source:{author:'Paul Pols',date:'2017-12-07',artifact:'The Unified Kill Chain thesis',appendix:'Appendix A / Table 28'},phases:PHASES,macros:MACROS,semantics:{canonical_order_is_reference:true,strict_sequence_required:false,phases_may_be_bypassed:true,phases_may_repeat:true,out_of_order_occurrence_allowed:true,branches_and_loops_allowed:true,pivoting_is_chokepoint:true,objectives_are_socio_technical:true,free_text_auto_classification:false},defensive_course_sets:{information_operations:['detect','deny','disrupt','degrade','deceive','destroy'],nist_csf_2014:['know','prevent','detect','respond','recover']},compatibility:{mitre_attack_mapping:'not bundled; UKC phase vocabulary is preserved as the 2017 Pols model'}};
  return {...body,model_digest_sha256:sha256(body)};
}

function eventPhase(event){
  if(typeof event==='string')return {input:event,phase:normalizePhase(event)};
  const refs=event?.phase_refs||event?.phases||null;
  if(refs){const r=explicitPhaseResolution(refs);return {...event,phase:r.resolved,phase_resolution:r}}
  return {...(event||{}),phase:normalizePhase(event?.phase||event?.tactic||event?.ukc_phase)};
}
function pathEvents(input={}){
  const raw=Array.isArray(input)?input:(input.events||input.phases||input.path||[]);
  if(!Array.isArray(raw))throw new Error('Path must provide an array in events, phases, or path.');
  return raw.map((e,index)=>({...eventPhase(e),index}));
}
function analyzePath(input={}){
  const events=pathEvents(input),known=[],unknown=[];
  for(const e of events){
    if(!e.phase||!PHASE_BY_ID[e.phase])unknown.push({index:e.index,input:e.input||e.phase||e.tactic||e.ukc_phase||null,phase_refs:e.phase_refs||e.phases||null});
    else known.push({...e,phase_record:phaseRecord(e.phase)});
  }
  const counts={};for(const e of known)counts[e.phase]=(counts[e.phase]||0)+1;
  const repeats=Object.entries(counts).filter(([,n])=>n>1).map(([phase,count])=>({phase,count}));
  const transitions=[];
  for(let i=1;i<known.length;i++){
    const a=known[i-1],b=known[i],delta=ORDER[b.phase]-ORDER[a.phase];
    transitions.push({from:a.phase,to:b.phase,from_event:a.index,to_event:b.index,canonical_direction:delta>0?'forward':delta<0?'backtrack':'repeat',deviation:delta<=0});
  }
  const pivots=known.filter(e=>e.phase==='pivoting').map(e=>({event_index:e.index,evidence_refs:e.evidence_refs||e.evidence||[],before:known.filter(x=>x.index<e.index).at(-1)?.phase||null,after:known.find(x=>x.index>e.index)?.phase||null}));
  const macroRuns=[];
  for(const e of known){const macro=e.phase_record.macro,last=macroRuns.at(-1);if(last&&last.macro===macro)last.events.push(e.index);else macroRuns.push({macro,events:[e.index]})}
  const observed=[...new Set(known.map(e=>e.phase))];
  const bounds=known.length?[Math.min(...known.map(e=>ORDER[e.phase])),Math.max(...known.map(e=>ORDER[e.phase]))]:[null,null];
  const unobserved=bounds[0]==null?[]:PHASES.filter(p=>p.canonical_order>=bounds[0]&&p.canonical_order<=bounds[1]&&!observed.includes(p.id)).map(p=>p.id);
  const objectives=known.filter(e=>e.phase==='objectives').map(e=>({event_index:e.index,objective:e.objective||e.text||e.summary||null,evidence_refs:e.evidence_refs||e.evidence||[]}));
  const body={contract:ANALYSIS_CONTRACT,model_contract:CONTRACT,model_version:'Pols-2017-final',path_id:input.path_id||input.id||null,events:known.map(e=>({index:e.index,phase:e.phase,macro:e.phase_record.macro,evidence_refs:e.evidence_refs||e.evidence||[],observed:e.observed!==false,phase_resolution:e.phase_resolution||null})),unknown,repeats,transitions,noncanonical_transitions:transitions.filter(x=>x.deviation),pivot_chokepoints:pivots,macro_runs:macroRuns,unobserved_between_canonical_bounds:unobserved,objectives,semantics:{valid_if_known_phases:true,noncanonical_is_not_invalid:true,repeats_are_valid:true,omissions_are_not_failures:true,canonical_order_is_reference:true},valid:unknown.length===0,claim_policy:'UKC path analysis organizes explicit tactical evidence. It does not establish exploitability, attribution, severity, or authorization.'};
  return {...body,analysis_digest_sha256:sha256(body)};
}

function coverage(input={}){
  const observations=Array.isArray(input.observations)?input.observations:[];
  const controls=Array.isArray(input.controls)?input.controls:[];
  const stats=Object.fromEntries(PHASES.map(p=>[p.id,{phase:p.id,label:p.label,macro:p.macro,observations:0,observation_refs:[],controls:0,control_ids:[],courses:[]}]))
  const unresolved=[];
  for(const [i,o] of observations.entries()){
    const r=explicitPhaseResolution(o.phase_refs||o.phases||o.phase||o.ukc_phase||[]);
    const ids=r.resolved?[r.resolved]:r.retained;
    if(!ids.length)unresolved.push({kind:'observation',index:i,input:o.phase_refs||o.phase||null});
    for(const id of ids){stats[id].observations+=1;stats[id].observation_refs.push(...(o.evidence_refs||o.evidence||[]))}
  }
  for(const [i,c] of controls.entries()){
    const r=explicitPhaseResolution(c.phase_refs||c.phases||c.phase||[]),ids=r.resolved?[r.resolved]:r.retained;
    if(!ids.length)unresolved.push({kind:'control',index:i,input:c.phase_refs||c.phase||null});
    for(const id of ids){stats[id].controls+=1;stats[id].control_ids.push(c.id||`control-${i+1}`);if(c.course)stats[id].courses.push(c.course)}
  }
  for(const s of Object.values(stats)){s.observation_refs=[...new Set(s.observation_refs)];s.control_ids=[...new Set(s.control_ids)];s.courses=[...new Set(s.courses)]}
  const observed=Object.values(stats).filter(x=>x.observations>0),gaps=observed.filter(x=>x.controls===0).map(x=>x.phase);
  const macroCoverage=MACROS.map(m=>{const rows=m.phase_ids.map(id=>stats[id]);return{macro:m.id,observed_phases:rows.filter(x=>x.observations).map(x=>x.phase),controlled_phases:rows.filter(x=>x.controls).map(x=>x.phase),coverage_ratio:rows.length?rows.filter(x=>x.controls).length/rows.length:0}});
  const body={contract:COVERAGE_CONTRACT,model_contract:CONTRACT,observed_phase_count:observed.length,controlled_phase_count:Object.values(stats).filter(x=>x.controls).length,phase_coverage:Object.values(stats),control_gaps_on_observed_phases:gaps,pivot_chokepoint:{observed:stats.pivoting.observations>0,control_count:stats.pivoting.controls,control_ids:stats.pivoting.control_ids},macro_coverage:macroCoverage,unresolved,claim_policy:'Coverage describes supplied evidence and controls only. Missing observations are unknown, not proof that a phase did not occur.'};
  return {...body,coverage_digest_sha256:sha256(body)};
}
function lcs(a,b){const d=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)d[i][j]=a[i-1]===b[j-1]?d[i-1][j-1]+1:Math.max(d[i-1][j],d[i][j-1]);return d[a.length][b.length]}
function comparePaths(input={}){
  const paths=(input.paths||[]).map((p,i)=>({id:p.id||p.path_id||`path-${i+1}`,analysis:analyzePath(p)}));
  if(paths.length<2)throw new Error('compare_paths requires at least two paths.');
  const sets=paths.map(p=>new Set(p.analysis.events.map(e=>e.phase))),common=[...sets[0]].filter(x=>sets.every(s=>s.has(x)));
  const pairwise=[];
  for(let i=0;i<paths.length;i++)for(let j=i+1;j<paths.length;j++){
    const a=paths[i].analysis.events.map(e=>e.phase),b=paths[j].analysis.events.map(e=>e.phase),union=new Set([...a,...b]),inter=[...new Set(a)].filter(x=>new Set(b).has(x));
    pairwise.push({a:paths[i].id,b:paths[j].id,phase_set_jaccard:union.size?inter.length/union.size:1,ordered_lcs_ratio:Math.max(a.length,b.length)?lcs(a,b)/Math.max(a.length,b.length):1,shared_phases:inter,unique_to_a:[...new Set(a)].filter(x=>!new Set(b).has(x)),unique_to_b:[...new Set(b)].filter(x=>!new Set(a).has(x))});
  }
  const body={contract:COMPARISON_CONTRACT,model_contract:CONTRACT,paths:paths.map(p=>({id:p.id,analysis_digest_sha256:p.analysis.analysis_digest_sha256,phases:p.analysis.events.map(e=>e.phase),pivot_count:p.analysis.pivot_chokepoints.length})),common_phases:common,pairwise,interpretation:'Similarity metrics compare supplied tactical phase labels. They do not establish actor identity, intent, attribution, or causality.'};
  return {...body,comparison_digest_sha256:sha256(body)};
}
module.exports={CONTRACT,ANALYSIS_CONTRACT,COVERAGE_CONTRACT,COMPARISON_CONTRACT,PHASES,MACROS,model,normalizePhase,explicitPhaseResolution,analyzePath,coverage,comparePaths,sha256,stable};
