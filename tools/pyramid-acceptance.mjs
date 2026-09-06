#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const pyramid=require('../site/lib/pyramid-model.js');
const home=os.homedir();
const kork=require(path.join(home,'Desktop/Kork-SaaS/lib/kork-agent.js'));
const research=require(path.join(home,'Desktop/LaunchGuard-SaaS/lib/research.js'));
const witness=require(path.join(home,'Desktop/GlassWitness-SaaS/lib/agent.js'));
const oracle=require(path.join(home,'Desktop/GlassWitness-SaaS/lib/oracle.js'));
const blast=require(path.join(home,'Desktop/BlastRadial-SaaS/lib/impact-agent.js'));
const consoleAgent=require(path.join(home,'Desktop/GlassCastle-Console-SaaS/lib/investigation-agent.js'));

const model=pyramid.model();
const indicatorA=pyramid.normalizeIndicator({indicator_id:'pyr-i1',indicator_type:'domain_name',status:'detected',purpose:'detection',ukc_phase_refs:['Command & Control'],evidence_refs:['fixture:domain']});
const indicatorB=pyramid.normalizeIndicator({indicator_id:'pyr-i2',indicator_type:'ttp',status:'gap',purpose:'detection',ukc_phase_refs:['Command & Control'],evidence_refs:['fixture:ttp']});
const indicatorC=pyramid.normalizeIndicator({indicator_id:'pyr-i3',indicator_type:'tool',status:'detectable',purpose:'detection',ukc_phase_refs:['Pivoting'],evidence_refs:['fixture:tool']});
const portfolio=pyramid.portfolio({threat_domain:'controlled-acceptance-fixture',indicators:[indicatorA,indicatorB,indicatorC]});
const ukcPlan=pyramid.ukcPlan({threat_domain:'controlled-acceptance-fixture',indicators:[indicatorA,indicatorB,indicatorC]});
const event={event_id:'dia-pyr-e1',infrastructure:'controlled.example',capability:'controlled-tool',victim:'controlled-victim'};
const overlay=pyramid.diamondOverlay({indicators:[indicatorA],events:[event],bindings:[{indicator_id:'pyr-i1',event_id:'dia-pyr-e1',diamond_feature:'infrastructure',confidence:'high',evidence_refs:['fixture:binding']}]});

const korkState={nodes:[{id:'looks-like-ip',label:'203.0.113.10',type:'ip'},{id:'explicit',label:'analyst-tagged',type:'artifact',meta:{pyramid:{indicator_type:'ip_address',status:'detected',provenance:'analyst'}}}],edges:[]};
const ka=kork.pyramidAnnotations(korkState),kx=kork.deriveSeeds(korkState,{investigation_id:'pyramid-acceptance'});
const sr=research.deriveResearch({enumeration:{},static_intel:{}});

const artifact={case_id:'GC-PYR-ACCEPT',scope:{state:'clear'},research:{hypotheses:[{id:'HYP-PYR',family:'generic',title:'Pyramid context acceptance',success_oracle:'controlled fact'}]},pyramid:portfolio};
const planned=witness.planFromArtifact(artifact,'HYP-PYR');
const plan={...planned.plan,scope:{authorized:true,state:'clear',holds:[]}};
const observations=[{run_id:'baseline',phase:'baseline',controlled:true,scope_ok:true,baseline_verified:true,evidence_hash:'1'.repeat(64)},{run_id:'confirm-1',phase:'confirmation',controlled:true,scope_ok:true,baseline_verified:true,oracle_met:true,evidence_hash:'2'.repeat(64)},{run_id:'confirm-2',phase:'confirmation',controlled:true,scope_ok:true,baseline_verified:true,oracle_met:true,evidence_hash:'3'.repeat(64)}];
const wr=oracle.evaluate(plan,observations);

const topology={nodes:[{id:'a',label:'a',type:'host'},{id:'b',label:'b',type:'host'}],edges:[{from:'a',to:'b',type:'resolves_to',confidence:'direct'}]};
const before=blast.analyzeImpact({topology,focus_id:'a'}),after=blast.analyzeImpact({topology,focus_id:'a',pyramid:[portfolio]});
let inv=consoleAgent.fresh('pyramid-acceptance');inv=consoleAgent.ingest(inv,portfolio);inv=consoleAgent.ingest(inv,after);const cs=consoleAgent.summarize(inv);

const c2=ukcPlan.phase_plan.find(x=>x.phase==='command_and_control');
const pivot=ukcPlan.phase_plan.find(x=>x.phase==='pivoting');
const out={
  contract:'shatteredcastles.pyramid.acceptance.v1',generated_at:new Date().toISOString(),source_model:model.contract,model_digest_sha256:model.model_digest_sha256,
  model:{categories:model.categories.length,pain_tiers:model.pain_tiers,quantitative_cost_score:model.semantics.quantitative_cost_score,automatic_value_classification:model.semantics.automatic_value_classification},
  portfolio:{indicators:portfolio.indicators.length,highest_supplied_pain_tier:portfolio.highest_supplied_pain_tier,weighted_score_present:Object.prototype.hasOwnProperty.call(portfolio,'score')||Object.prototype.hasOwnProperty.call(portfolio,'weighted_score')},
  ukc_plan:{c2:{detected:c2.detected,gap:c2.gap,highest_supplied_pain_tier:c2.highest_supplied_pain_tier},pivot:{detectable:pivot.detectable,highest_supplied_pain_tier:pivot.highest_supplied_pain_tier},phase_binding_explicit_only:ukcPlan.semantics.phase_binding_explicit_only},
  diamond_overlay:{bindings:overlay.bindings.length,bindings_explicit_only:overlay.semantics.bindings_explicit_only,diamond_role_not_inferred_from_indicator_type:overlay.semantics.diamond_role_not_inferred_from_indicator_type},
  kork:{annotations:ka.annotations.length,unannotated_ip_like_node_inferred:ka.annotations.some(x=>x.id==='looks-like-ip'),export_annotations:kx.analysis.pyramid.annotations.length},
  shatterassay:{inferred_annotations:sr.pyramid.indicator_annotations.length},
  witness:{authorization_reset:planned.authorization_reset,required_confirmations:plan.required_confirmations,claim_ready:wr.summary.claim_ready,pyramid_indicator_count:wr.summary.pyramid.indicator_count,proof_effect:wr.summary.pyramid.proof_effect},
  blast:{pyramid:after.pyramid_context,critical_path_impact_before:before.critical_paths[0]?.impact??null,critical_path_impact_after:after.critical_paths[0]?.impact??null,impact_unchanged:(before.critical_paths[0]?.impact??null)===(after.critical_paths[0]?.impact??null)},
  console:{pyramid:cs.pyramid,findings:cs.findings,validated:cs.validated},
  boundaries:{automatic_value_classification:false,automatic_maliciousness_inference:false,automatic_attribution:false,quantitative_cost_score:false,impact_score_effect:'none',severity_effect:'none'}
};
if(out.kork.unannotated_ip_like_node_inferred)throw new Error('Kork inferred Pyramid annotation from label');
if(out.shatterassay.inferred_annotations!==0)throw new Error('ShatterAssay inferred Pyramid annotations');
if(!out.witness.authorization_reset||!out.witness.claim_ready||out.witness.proof_effect!=='none')throw new Error('Witness invariant failed');
if(!out.blast.impact_unchanged||out.blast.pyramid.score_effect!=='none'||out.blast.pyramid.severity_effect!=='none')throw new Error('Blast invariant failed');
if(out.console.findings!==0||out.console.pyramid.score_effect!=='none'||out.console.pyramid.severity_effect!=='none')throw new Error('Console invariant failed');
fs.writeFileSync(new URL('../state/PYRAMID-ACCEPTANCE.json',import.meta.url),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify(out,null,2));
