#!/usr/bin/env python3
import argparse, collections, hashlib, json, pathlib

VERSION='1.6.0'
ATTACK_MAPPING_VERSION='v19.0'
TACTIC_ORDER=['Model','Harden','Detect','Isolate','Deceive','Evict','Restore']

def sha256_file(path):
    h=hashlib.sha256()
    with open(path,'rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
    return h.hexdigest()

def val(row,key): return row.get(key,{}).get('value')
def iri_fragment(uri):
    if not uri:return None
    return uri.rsplit('#',1)[-1] if '#' in uri else uri.rsplit('/',1)[-1]
def refs(v):
    if not v:return []
    if not isinstance(v,list):v=[v]
    return [x.get('@id') if isinstance(x,dict) else x for x in v if x]
def literal(v):
    if isinstance(v,dict):return v.get('@value') or v.get('@id')
    return v

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--source-dir',default=str(pathlib.Path.home()/'Desktop/D3FEND-Source-1.6.0'))
    ap.add_argument('--attack-catalog',default='site/data/attack-v19.2.json')
    ap.add_argument('--output',default='site/data/d3fend-1.6.0.json')
    a=ap.parse_args(); src=pathlib.Path(a.source_dir); out=pathlib.Path(a.output)
    ontology_path=src/f'd3fend-{VERSION}.json'; mappings_path=src/f'd3fend-full-mappings-{VERSION}.json'; ttl_path=src/f'd3fend-{VERSION}.ttl'
    ontology=json.load(open(ontology_path)); graph=ontology['@graph']; byid={o.get('@id'):o for o in graph if o.get('@id')}
    parents={k:[x for x in refs(o.get('rdfs:subClassOf')) if x and not str(x).startswith('_:')] for k,o in byid.items()}
    from functools import lru_cache
    @lru_cache(None)
    def ancestor(node,target):
        if node==target:return True
        return any(ancestor(p,target) for p in parents.get(node,[]) if p!=node)
    top_ids={k for k in byid if 'd3f:DefensiveTechnique' in parents.get(k,[])}
    @lru_cache(None)
    def roots(node):
        r={node} if node in top_ids else set()
        for p in parents.get(node,[]):
            if p in byid:r|=roots(p)
        return frozenset(r)
    tactics=[]
    for o in graph:
        ts=refs(o.get('@type')) if isinstance(o.get('@type'),list) else ([o.get('@type')] if o.get('@type') else [])
        if 'd3f:DefensiveTactic' in ts:
            tactics.append({'id':o['@id'].split(':',1)[-1],'iri':o['@id'],'name':o.get('rdfs:label'),'definition':o.get('d3f:definition'),'display_order':o.get('d3f:display-order')})
    tactics.sort(key=lambda x:(x['display_order'] if isinstance(x['display_order'],int) else 999,x['name']))
    techniques=[]; iri_to_d3={}
    for node,o in byid.items():
        d3=o.get('d3f:d3fend-id')
        if not d3 or node=='d3f:DefensiveTechnique' or not ancestor(node,'d3f:DefensiveTechnique'):continue
        root_ids=sorted(roots(node)); tactic_names=[]
        for r in root_ids:
            en=refs(byid[r].get('d3f:enables'))
            tactic_names += [x.split(':',1)[-1] for x in en if x.startswith('d3f:')]
        direct_parent_ids=[]
        for p in parents.get(node,[]):
            po=byid.get(p); pd=po.get('d3f:d3fend-id') if po else None
            if pd and ancestor(p,'d3f:DefensiveTechnique'):direct_parent_ids.append(pd)
        rec={'id':d3,'iri':node,'name':o.get('rdfs:label'),'definition':o.get('d3f:definition'),'synonyms':o.get('d3f:synonym') if isinstance(o.get('d3f:synonym'),list) else ([o.get('d3f:synonym')] if o.get('d3f:synonym') else []),'parent_ids':sorted(set(direct_parent_ids)),'top_family_ids':sorted(byid[r].get('d3f:d3fend-id') for r in root_ids if byid[r].get('d3f:d3fend-id')),'tactics':sorted(set(tactic_names),key=lambda x:TACTIC_ORDER.index(x) if x in TACTIC_ORDER else 99),'display_order':o.get('d3f:display-order')}
        techniques.append(rec); iri_to_d3[node.split(':',1)[-1]]=d3
    techniques.sort(key=lambda x:x['id']); by_d3={x['id']:x for x in techniques}
    # Current ATT&CK exact IDs for safe joins.
    attack=json.load(open(a.attack_catalog)); current_ids={fw:{x['id'] for x in attack['domains'][fw]['techniques']} for fw in ('enterprise','mobile','ics')}
    bindings=json.load(open(mappings_path))['results']['bindings']
    grouped={}; framework_rows=collections.Counter(); framework_attack=collections.defaultdict(set); framework_pairs=collections.defaultdict(set)
    for r in bindings:
        fw=val(r,'framework_key'); aid=val(r,'off_tech_id'); tech_uri=val(r,'def_tech'); frag=iri_fragment(tech_uri); did=iri_to_d3.get(frag)
        framework_rows[fw]+=1
        if aid:framework_attack[fw].add(aid)
        if aid and did:framework_pairs[fw].add((aid,did))
        if not (fw and aid and did):continue
        key=(fw,aid,did)
        e=grouped.setdefault(key,{'framework':fw,'attack_id':aid,'d3fend_id':did,'d3fend_name':by_d3[did]['name'],'d3fend_tactics':by_d3[did]['tactics'],'top_family_ids':by_d3[did]['top_family_ids'],'inferred_path_count':0,'query_techniques':set(),'defensive_artifact_relations':set(),'defensive_artifacts':set(),'offensive_artifact_relations':set(),'offensive_artifacts':set(),'attack_tactics':set()})
        e['inferred_path_count']+=1
        for field,target in [('query_def_tech_label','query_techniques'),('def_artifact_rel_label','defensive_artifact_relations'),('def_artifact_label','defensive_artifacts'),('off_artifact_rel_label','offensive_artifact_relations'),('off_artifact_label','offensive_artifacts'),('off_tactic_label','attack_tactics')]:
            v=val(r,field)
            if v:e[target].add(v)
    mappings=[]
    for e in grouped.values():
        for k in ['query_techniques','defensive_artifact_relations','defensive_artifacts','offensive_artifact_relations','offensive_artifacts','attack_tactics']:e[k]=sorted(e[k])
        e['current_attack_exact_id']=e['attack_id'] in current_ids.get(e['framework'],set())
        mappings.append(e)
    mappings.sort(key=lambda x:(x['framework'],x['attack_id'],x['d3fend_id']))
    mapping_stats={}
    for fw in sorted(framework_rows):
        aids=framework_attack[fw]; cur=current_ids.get(fw,set())
        mapping_stats[fw]={'rows':framework_rows[fw],'attack_ids':len(aids),'d3fend_pairs':len(framework_pairs[fw]),'current_attack_exact_ids':len(aids&cur) if cur else None,'not_current_attack_ids':sorted(aids-cur) if cur else []}
    mapping_stats['mobile']={'rows':0,'attack_ids':0,'d3fend_pairs':0,'current_attack_exact_ids':0,'not_current_attack_ids':[],'note':'D3FEND 1.6.0 full inferred mappings contain no Mobile framework rows.'}
    body={'contract':'shatteredcastles.d3fend.catalog.v1','version':VERSION,'released':'2026-08-31','source':{'ontology_json':{'filename':ontology_path.name,'sha256':sha256_file(ontology_path),'bytes':ontology_path.stat().st_size},'ontology_ttl':{'filename':ttl_path.name,'sha256':sha256_file(ttl_path),'bytes':ttl_path.stat().st_size},'full_mappings_json':{'filename':mappings_path.name,'sha256':sha256_file(mappings_path),'bytes':mappings_path.stat().st_size},'mapping_attack_version':ATTACK_MAPPING_VERSION},'counts':{'defensive_tactics':len(tactics),'top_level_technique_families':len(top_ids),'defensive_techniques':len(techniques),'inferred_mapping_pairs':len(mappings)},'tactics':tactics,'techniques':techniques,'mapping_stats':mapping_stats,'inferred_attack_mappings':mappings,'semantics':{'full_mappings_are_inferred_relationships':True,'mapping_is_not_control_effectiveness':True,'attack_join_exact_id_only':True,'missing_mapping_is_unknown_not_no_countermeasure':True}}
    out.parent.mkdir(parents=True,exist_ok=True); out.write_text(json.dumps(body,separators=(',',':'),sort_keys=True)+'\n')
    print(json.dumps({'output':str(out.resolve()),'bytes':out.stat().st_size,'counts':body['counts'],'mapping_stats':mapping_stats},indent=2))
if __name__=='__main__':main()
