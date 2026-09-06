#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),home=os.homedir();
const attack=require('../site/lib/attack-model.js'),d3fend=require('../site/lib/d3fend-model.js');
const kork=require(path.join(home,'Desktop/Kork-SaaS/lib/kork-agent.js'));
const research=require(path.join(home,'Desktop/LaunchGuard-SaaS/lib/research.js'));
const witness=require(path.join(home,'Desktop/GlassWitness-SaaS/lib/agent.js'));
const oracle=require(path.join(home,'Desktop/GlassWitness-SaaS/lib/oracle.js'));
const blast=require(path.join(home,'Desktop/BlastRadial-SaaS/lib/impact-agent.js'));
const consoleAgent=require(path.join(home,'Desktop/GlassCastle-Console-SaaS/lib/investigation-agent.js'));

const model=d3fend.model();
const behavior=attack.normalizeBehavior({behavior_id:'atk-lsass',domain:'enterprise',technique_refs:['T1003.001'],status:'observed',evidence_refs:['fixture:attack']});
const mapping=d3fend.mapAttack({domain:'enterprise',attack_refs:['T1003.001']});
const chosen=mapping.attack_mappings[0].candidates.find(x=>x.d3fend_id==='D3-ABPI');if(!chosen)throw new Error('Expected D3-ABPI inferred candidate missing for T1003.001');
const defense=d3fend.normalizeDefense({defense_id:'def-abpi',technique_refs:['D3-ABPI'],status:'planned',evidence_refs:['fixture:defense']});
const composition=d3fend.compose({domain:'enterprise',behaviors:[behavior],defenses:[defense],attack_defense_bindings:[{behavior_id:'atk-lsass',defense_id:'def-abpi',basis:'d3fend_inferred',evidence_refs:['fixture:selection']}]});
const alignment=d3fend.alignment({domain:'enterprise',behaviors:[behavior],defenses:[defense]});
const freeText=d3fend.resolve({refs:['isolate LSASS somehow']});
let retiredRejected=false,retiredMessage=null;try{d3fend.mapAttack({domain:'enterprise',attack_refs:['T1562.001']})}catch(e){retiredRejected=true;retiredMessage=String(e.message||e)}
const mobile=d3fend.mapAttack({domain:'mobile',attack_refs:['T1409']});

const korkState={nodes:[{id:'looks-defense-like',label:'isolate powershell',type:'artifact'},{id:'explicit-defense',label:'analyst-selected',type:'artifact',meta:{d3fend:{technique_refs:['D3-ABPI'],status:'planned',provenance:'analyst'}}}],edges:[]};
const ka=kork.d3fendAnnotations(korkState),kx=kork.deriveSeeds(korkState,{investigation_id:'d3fend-acceptance'});
const sr=research.deriveResearch({enumeration:{},static_intel:{}});

const artifact={case_id:'GC-D3F-ACCEPT',scope:{state:'clear'},research:{hypotheses:[{id:'HYP-D3F',family:'generic',title:'D3FEND context acceptance',success_oracle:'controlled fact'}]},d3fend:defense};
const planned=witness.planFromArtifact(artifact,'HYP-D3F');const plan={...planned.plan,scope:{authorized:true,state:'clear',holds:[]}};
const observations=[{run_id:'baseline',phase:'baseline',controlled:true,scope_ok:true,baseline_verified:true,evidence_hash:'1'.repeat(64)},{run_id:'confirm-1',phase:'confirmation',controlled:true,scope_ok:true,baseline_verified:true,oracle_met:true,evidence_hash:'2'.repeat(64)},{run_id:'confirm-2',phase:'confirmation',controlled:true,scope_ok:true,baseline_verified:true,oracle_met:true,evidence_hash:'3'.repeat(64)}];
const wr=oracle.evaluate(plan,observations);

const topology={nodes:[{id:'a',label:'a',type:'host'},{id:'b',label:'b',type:'host'}],edges:[{from:'a',to:'b',type:'resolves_to',confidence:'direct'}]};
const before=blast.analyzeImpact({topology,focus_id:'a'}),after=blast.analyzeImpact({topology,focus_id:'a',attack:[behavior],d3fend:[defense]});
let invBase=consoleAgent.fresh('d3fend-baseline');invBase=consoleAgent.ingest(invBase,before);const csBase=consoleAgent.summarize(invBase);let inv=consoleAgent.fresh('d3fend-acceptance');inv=consoleAgent.ingest(inv,defense);inv=consoleAgent.ingest(inv,after);const cs=consoleAgent.summarize(inv);

const out={contract:'shatteredcastles.d3fend.acceptance.v1',generated_at:new Date().toISOString(),source_model:model.contract,model_version:model.version,model_digest_sha256:model.model_digest_sha256,catalog_digest_sha256:model.catalog_digest_sha256,
 model:{counts:model.counts,ontology_ttl_sha256:model.source.ontology_ttl.sha256,mapping_attack_version:model.source.mapping_attack_version,current_attack_version:model.composition.attack.current_version,full_mappings_are_inferred_relationships:model.semantics.full_mappings_are_inferred_relationships},
 attack_behavior:{technique_ids:behavior.techniques.map(x=>x.id),tactic_ids:behavior.official_tactics_from_techniques.map(x=>x.id)},
 inferred_mapping:{attack_id:mapping.attack_mappings[0].attack_id,candidate_count:mapping.attack_mappings[0].candidate_count,selected_candidate:{d3fend_id:chosen.d3fend_id,d3fend_name:chosen.d3fend_name,tactics:chosen.d3fend_tactics},relationships_are_inferred:mapping.semantics.relationships_are_d3fend_inferred,candidates_are_not_prescriptions:mapping.semantics.candidates_are_not_prescriptions},
 explicit_selection:{defense_id:defense.defense_id,technique_ids:defense.techniques.map(x=>x.id),status:defense.status,implementation_does_not_imply_effectiveness:defense.semantics.implementation_does_not_imply_effectiveness,binding_basis:composition.attack_defense_bindings[0].basis,candidate_pairs:composition.attack_defense_bindings[0].candidate_pairs,binding_explicit:composition.semantics.bindings_explicit_only},
 alignment:{explicit_overlap_present:alignment.attack_alignment[0].explicit_overlap_present,inferred_candidate_overlap_is_not_coverage_proof:alignment.semantics.inferred_candidate_overlap_is_not_coverage_proof},
 negative_controls:{free_text_unresolved:freeText.unresolved,retired_attack_selector_rejected:retiredRejected,retired_attack_selector_error:retiredMessage,mobile_mapping_candidate_count:mobile.attack_mappings[0].candidate_count,mobile_mapping_remains_unknown:mobile.unmapped_current_attack_ids.includes('T1409')&&mobile.semantics.missing_mapping_is_unknown_not_no_countermeasure},
 kork:{annotations:ka.annotations.length,unannotated_defense_like_node_inferred:ka.annotations.some(x=>x.id==='looks-defense-like'),export_annotations:kx.analysis.d3fend.annotations.length},
 shatterassay:{inferred_annotations:sr.d3fend.defense_annotations.length},
 witness:{authorization_reset:planned.authorization_reset,required_confirmations:plan.required_confirmations,claim_ready:wr.summary.claim_ready,technique_ids:wr.summary.d3fend.technique_ids,proof_effect:wr.summary.d3fend.proof_effect,effectiveness_inferred:wr.summary.d3fend.effectiveness_inferred},
 blast:{d3fend:after.d3fend_context,critical_path_impact_before:before.critical_paths[0]?.impact??null,critical_path_impact_after:after.critical_paths[0]?.impact??null,impact_unchanged:(before.critical_paths[0]?.impact??null)===(after.critical_paths[0]?.impact??null)},
 console:{d3fend:cs.d3fend,findings:cs.findings,validated:cs.validated,remediation_queue_before:csBase.remediation_queue.length,remediation_queue_after:cs.remediation_queue.length,remediation_queue_unchanged:csBase.remediation_queue.length===cs.remediation_queue.length},
 boundaries:{automatic_remediation:false,automatic_authorization:false,effectiveness_inferred:false,proof_effect:'none',impact_score_effect:'none',severity_effect:'none'}};
if(!out.inferred_mapping.relationships_are_inferred||!out.inferred_mapping.candidates_are_not_prescriptions)throw new Error('D3FEND mapping provenance invariant failed');
if(out.negative_controls.free_text_unresolved.length!==1||!out.negative_controls.retired_attack_selector_rejected||!out.negative_controls.mobile_mapping_remains_unknown)throw new Error('Negative-control invariant failed');
if(out.kork.unannotated_defense_like_node_inferred||out.shatterassay.inferred_annotations!==0)throw new Error('Inference boundary failed');
if(!out.witness.authorization_reset||!out.witness.claim_ready||out.witness.required_confirmations!==2||out.witness.effectiveness_inferred!==false)throw new Error('Witness invariant failed');
if(!out.blast.impact_unchanged||out.blast.d3fend.score_effect!=='none'||out.blast.d3fend.severity_effect!=='none'||out.blast.d3fend.effectiveness_inferred!==false)throw new Error('Blast invariant failed');
if(out.console.findings!==0||!out.console.remediation_queue_unchanged||out.console.d3fend.effectiveness_inferred!==false)throw new Error('Console invariant failed');
fs.writeFileSync(new URL('../state/D3FEND-ACCEPTANCE.json',import.meta.url),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out,null,2));
