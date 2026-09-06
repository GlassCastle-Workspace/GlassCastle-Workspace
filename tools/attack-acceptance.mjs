#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const attack=require('../site/lib/attack-model.js');
const diamond=require('../site/lib/diamond-model.js');
const pyramid=require('../site/lib/pyramid-model.js');
const home=os.homedir();
const kork=require(path.join(home,'Desktop/Kork-SaaS/lib/kork-agent.js'));
const research=require(path.join(home,'Desktop/LaunchGuard-SaaS/lib/research.js'));
const witness=require(path.join(home,'Desktop/GlassWitness-SaaS/lib/agent.js'));
const oracle=require(path.join(home,'Desktop/GlassWitness-SaaS/lib/oracle.js'));
const blast=require(path.join(home,'Desktop/BlastRadial-SaaS/lib/impact-agent.js'));
const consoleAgent=require(path.join(home,'Desktop/GlassCastle-Console-SaaS/lib/investigation-agent.js'));

const model=attack.model();
const selectorProbe=attack.resolve({domain:'enterprise',refs:['T1059.001','PowerShell behavior maybe']});
const behavior=attack.normalizeBehavior({behavior_id:'att-b1',domain:'enterprise',technique_refs:['T1059.001'],status:'observed',confidence:'high',evidence_refs:['fixture:behavior']});
const event=diamond.normalizeEvent({event_id:'dia-att-e1',capability:{value:'PowerShell',confidence:'high'},victim:'controlled-victim',evidence_refs:['fixture:event']});
const indicator=pyramid.normalizeIndicator({indicator_id:'pyr-att-i1',indicator_type:'ttp',status:'detected',purpose:'detection',evidence_refs:['fixture:indicator']});
const composition=attack.compose({domain:'enterprise',behaviors:[behavior],diamond_events:[event],pyramid_indicators:[indicator],ukc_bindings:[{behavior_id:'att-b1',ukc_phase_refs:['Execution'],evidence_refs:['fixture:ukc-binding']}],diamond_bindings:[{behavior_id:'att-b1',event_id:'dia-att-e1',evidence_refs:['fixture:diamond-binding']}],pyramid_bindings:[{behavior_id:'att-b1',indicator_id:'pyr-att-i1',evidence_refs:['fixture:pyramid-binding']}]});
const coverage=attack.coverage({domain:'enterprise',behaviors:[behavior],detections:[{id:'det-1',technique_refs:['T1059.001'],status:'covered',evidence_refs:['fixture:detection']}]});

const korkState={nodes:[{id:'looks-like-powershell',label:'powershell.exe',type:'artifact'},{id:'explicit-att',label:'analyst-tagged',type:'artifact',meta:{attack:{domain:'enterprise',technique_refs:['T1059.001'],status:'observed',provenance:'analyst'}}}],edges:[]};
const ka=kork.attackAnnotations(korkState),kx=kork.deriveSeeds(korkState,{investigation_id:'attack-acceptance'});
const sr=research.deriveResearch({enumeration:{},static_intel:{}});

const artifact={case_id:'GC-ATT-ACCEPT',scope:{state:'clear'},research:{hypotheses:[{id:'HYP-ATT',family:'generic',title:'ATT&CK context acceptance',success_oracle:'controlled fact'}]},attack:behavior};
const planned=witness.planFromArtifact(artifact,'HYP-ATT');
const plan={...planned.plan,scope:{authorized:true,state:'clear',holds:[]}};
const observations=[{run_id:'baseline',phase:'baseline',controlled:true,scope_ok:true,baseline_verified:true,evidence_hash:'1'.repeat(64)},{run_id:'confirm-1',phase:'confirmation',controlled:true,scope_ok:true,baseline_verified:true,oracle_met:true,evidence_hash:'2'.repeat(64)},{run_id:'confirm-2',phase:'confirmation',controlled:true,scope_ok:true,baseline_verified:true,oracle_met:true,evidence_hash:'3'.repeat(64)}];
const wr=oracle.evaluate(plan,observations);

const topology={nodes:[{id:'a',label:'a',type:'host'},{id:'b',label:'b',type:'host'}],edges:[{from:'a',to:'b',type:'resolves_to',confidence:'direct'}]};
const before=blast.analyzeImpact({topology,focus_id:'a'}),after=blast.analyzeImpact({topology,focus_id:'a',attack:[behavior]});
let inv=consoleAgent.fresh('attack-acceptance');inv=consoleAgent.ingest(inv,behavior);inv=consoleAgent.ingest(inv,after);const cs=consoleAgent.summarize(inv);

const out={
  contract:'shatteredcastles.attack.acceptance.v1',generated_at:new Date().toISOString(),source_model:model.contract,model_version:model.version,model_digest_sha256:model.model_digest_sha256,catalog_digest_sha256:model.catalog_digest_sha256,
  model:{enterprise:model.domains.enterprise,mobile:model.domains.mobile,ics:model.domains.ics,free_text_auto_classification:model.semantics.free_text_auto_classification,automatic_actor_attribution:model.semantics.automatic_actor_attribution},
  resolution:{exact_resolved:selectorProbe.resolved.map(x=>x.record.id),free_text_unresolved:selectorProbe.unresolved},
  behavior:{technique_ids:behavior.techniques.map(x=>x.id),tactic_ids:behavior.official_tactics_from_techniques.map(x=>x.id),subtechnique_parent:behavior.techniques[0].parent_id,status:behavior.status},
  composition:{ukc_bindings:composition.ukc_bindings.length,diamond_bindings:composition.diamond_bindings.length,pyramid_bindings:composition.pyramid_bindings.length,all_cross_model_bindings_explicit_only:composition.semantics.all_cross_model_bindings_explicit_only},
  coverage:{technique_ids:coverage.technique_coverage.map(x=>x.technique_id),detection_statuses:coverage.technique_coverage.flatMap(x=>x.statuses),missing_detection_is_unknown:coverage.semantics.missing_detection_evidence_is_unknown_not_proof_of_no_detection,no_weighted_score:coverage.semantics.no_weighted_score},
  kork:{annotations:ka.annotations.length,unannotated_powershell_label_inferred:ka.annotations.some(x=>x.id==='looks-like-powershell'),export_annotations:kx.analysis.attack.annotations.length},
  shatterassay:{inferred_annotations:sr.attack.behavior_annotations.length},
  witness:{authorization_reset:planned.authorization_reset,required_confirmations:plan.required_confirmations,claim_ready:wr.summary.claim_ready,technique_ids:wr.summary.attack.technique_ids,tactic_ids:wr.summary.attack.tactic_ids,proof_effect:wr.summary.attack.proof_effect},
  blast:{attack:after.attack_context,critical_path_impact_before:before.critical_paths[0]?.impact??null,critical_path_impact_after:after.critical_paths[0]?.impact??null,impact_unchanged:(before.critical_paths[0]?.impact??null)===(after.critical_paths[0]?.impact??null)},
  console:{attack:cs.attack,findings:cs.findings,validated:cs.validated},
  boundaries:{free_text_auto_classification:false,automatic_actor_attribution:false,automatic_ukc_mapping:false,automatic_diamond_mapping:false,automatic_pyramid_mapping:false,proof_effect:'none',impact_score_effect:'none',severity_effect:'none'}
};
if(out.resolution.free_text_unresolved.length!==1)throw new Error('Free text ATT&CK selector was not retained as unresolved.');
if(out.kork.unannotated_powershell_label_inferred)throw new Error('Kork inferred ATT&CK from topology label.');
if(out.shatterassay.inferred_annotations!==0)throw new Error('ShatterAssay inferred ATT&CK annotations.');
if(!out.witness.authorization_reset||out.witness.required_confirmations!==2||!out.witness.claim_ready||out.witness.proof_effect!=='none')throw new Error('GlassWitness ATT&CK invariant failed.');
if(!out.blast.impact_unchanged||out.blast.attack.score_effect!=='none'||out.blast.attack.severity_effect!=='none')throw new Error('BlastRadial ATT&CK invariant failed.');
if(out.console.findings!==0||out.console.attack.score_effect!=='none'||out.console.attack.severity_effect!=='none')throw new Error('Console ATT&CK invariant failed.');
fs.writeFileSync(new URL('../state/ATTACK-ACCEPTANCE.json',import.meta.url),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify(out,null,2));
