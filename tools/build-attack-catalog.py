#!/usr/bin/env python3
import json,hashlib,pathlib,sys,os
ROOT=pathlib.Path(__file__).resolve().parents[1]
SRC=pathlib.Path(os.environ.get('ATTACK_STIX_DIR',str(ROOT/'vendor'/'attack-v19.2'))).expanduser()
if not SRC.exists():
    fallback=pathlib.Path.home()/'Desktop'/'ATTACK-v19.2-source-cache'
    if fallback.exists(): SRC=fallback
if not SRC.exists():
    raise SystemExit('ATT&CK v19.2 STIX source not found. Set ATTACK_STIX_DIR or place the source under vendor/attack-v19.2.')
OUT=ROOT/'site'/'data'/'attack-v19.2.json'
DOMAINS={'enterprise':'enterprise-attack-19.2.json','mobile':'mobile-attack-19.2.json','ics':'ics-attack-19.2.json'}

def active(o): return not o.get('revoked',False) and not o.get('x_mitre_deprecated',False)
def extid(o,prefix):
    for r in o.get('external_references',[]):
        x=r.get('external_id','')
        if x.startswith(prefix): return x
    return None

def build(domain,filename):
    raw=(SRC/filename).read_bytes(); data=json.loads(raw)
    objs=[o for o in data['objects'] if active(o)]
    tactics=[o for o in objs if o.get('type')=='x-mitre-tactic']
    tactic_by_short={o.get('x_mitre_shortname'):extid(o,'TA') for o in tactics}
    patterns=[o for o in objs if o.get('type')=='attack-pattern']
    p_by_stix={o['id']:o for o in patterns}
    parent={}
    for r in objs:
        if r.get('type')=='relationship' and r.get('relationship_type')=='subtechnique-of':
            if r.get('source_ref') in p_by_stix and r.get('target_ref') in p_by_stix:
                parent[r['source_ref']]=extid(p_by_stix[r['target_ref']],'T')
    tout=[]
    for o in tactics:
        tid=extid(o,'TA')
        if tid: tout.append({'id':tid,'stix_id':o['id'],'name':o['name'],'shortname':o.get('x_mitre_shortname'),'version':o.get('x_mitre_version'),'modified':o.get('modified')})
    tech=[]
    for o in patterns:
        tid=extid(o,'T')
        if not tid: continue
        phase_ids=[]
        for p in o.get('kill_chain_phases',[]):
            ta=tactic_by_short.get(p.get('phase_name'))
            if ta and ta not in phase_ids: phase_ids.append(ta)
        tech.append({'id':tid,'stix_id':o['id'],'name':o['name'],'is_subtechnique':bool(o.get('x_mitre_is_subtechnique')),'parent_id':parent.get(o['id']),'tactic_ids':phase_ids,'platforms':sorted(set(o.get('x_mitre_platforms',[]))),'version':o.get('x_mitre_version'),'modified':o.get('modified')})
    tout.sort(key=lambda x:x['id']); tech.sort(key=lambda x:x['id'])
    subs=sum(x['is_subtechnique'] for x in tech)
    return {'source':{'filename':filename,'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw)},'counts':{'tactics':len(tout),'techniques':len(tech)-subs,'subtechniques':subs,'technique_records':len(tech)},'tactics':tout,'techniques':tech}

catalog={'contract':'shatteredcastles.attack.catalog.v1','version':'ATT&CK-v19.2','released':'2026-08-06','generated_from':'MITRE ATT&CK STIX 2.1','domains':{d:build(d,f) for d,f in DOMAINS.items()}}
OUT.write_text(json.dumps(catalog,separators=(',',':'))+'\n')
print(json.dumps({'output':str(OUT),'bytes':OUT.stat().st_size,'domains':{k:v['counts'] for k,v in catalog['domains'].items()}},indent=2))
