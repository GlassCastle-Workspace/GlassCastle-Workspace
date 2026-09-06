#!/usr/bin/env node
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const manifestPath=new URL('../state/FABRIC-DEPLOYMENT-MANIFEST.json',import.meta.url);
const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
function expand(p){return p.startsWith('~/')?path.join(os.homedir(),p.slice(2)):p}
async function exists(p){try{await fs.access(p);return true}catch{return false}}
const rows=[];let ok=true;
for(const p of manifest.projects||[]){
  const root=expand(p.local_root),link=path.join(root,'.vercel','project.json');
  const row={stage:p.stage,name:p.name,root,expected:{project_id:p.project_id,project_name:p.project_name,org_id:manifest.team_id},actual:null,ok:false,errors:[]};
  if(!(await exists(root)))row.errors.push('local_root_missing');
  if(!(await exists(link)))row.errors.push('vercel_link_missing');
  if(!row.errors.length){
    try{
      const actual=JSON.parse(await fs.readFile(link,'utf8'));row.actual={project_id:actual.projectId||null,project_name:actual.projectName||null,org_id:actual.orgId||null};
      if(actual.projectId!==p.project_id)row.errors.push('project_id_mismatch');
      if(actual.projectName!==p.project_name)row.errors.push('project_name_mismatch');
      if(actual.orgId!==manifest.team_id)row.errors.push('org_id_mismatch');
    }catch(e){row.errors.push(`vercel_link_invalid:${e.message}`)}
  }
  row.ok=row.errors.length===0;if(!row.ok)ok=false;rows.push(row);
}
const out={contract:'glasscastles.fabric.deployment-preflight.v1',checked_at:new Date().toISOString(),ok,workflow:manifest.workflow,projects:rows};
console.log(JSON.stringify(out,null,2));
if(!ok)process.exit(1);
