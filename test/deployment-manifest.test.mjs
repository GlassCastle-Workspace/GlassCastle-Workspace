import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const m=JSON.parse(fs.readFileSync(new URL('../state/FABRIC-DEPLOYMENT-MANIFEST.json',import.meta.url),'utf8'));
const STAGES=['scope','discover','assess','validate','impact','remediate'];

test('manifest uses canonical six-stage order',()=>assert.deepEqual(m.workflow,STAGES));
test('exactly one project exists for every stage plus hub',()=>{
  const stages=m.projects.map(x=>x.stage);for(const s of STAGES)assert.equal(stages.filter(x=>x===s).length,1);assert.equal(stages.filter(x=>x==='hub').length,1);assert.equal(m.projects.length,7);
});
test('Vercel identities are unique and complete',()=>{
  const ids=m.projects.map(x=>x.project_id),names=m.projects.map(x=>x.project_name),roots=m.projects.map(x=>x.local_root);
  assert.equal(new Set(ids).size,ids.length);assert.equal(new Set(names).size,names.length);assert.equal(new Set(roots).size,roots.length);
  for(const p of m.projects){assert.match(p.project_id,/^prj_[A-Za-z0-9]+$/);assert.ok(p.project_name);assert.ok(p.local_root.startsWith('~/Desktop/'));}
});
test('production URLs are unique HTTPS endpoints',()=>{
  const urls=m.projects.map(x=>x.production_url);assert.equal(new Set(urls).size,urls.length);for(const u of urls)assert.equal(new URL(u).protocol,'https:');
});
