import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../site/index.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../site/style.css',import.meta.url),'utf8');

test('DML section closes before bounty operations',()=>{
  const dml=html.indexOf('<section id="dml"');
  const bounty=html.indexOf('<section id="bounty"');
  const close=html.indexOf('</section>',dml);
  assert.ok(dml>=0&&bounty>dml&&close>dml&&close<bounty);
});

test('responsive navigation keeps a native mobile menu',()=>{
  assert.match(html,/class="mobile-nav"/);
  assert.match(html,/class="nav-models"/);
  assert.match(css,/\.mobile-nav\{display:none/);
  assert.match(css,/@media\(max-width:900px\)[\s\S]*\.mobile-nav\{display:block\}/);
});

test('DML UI uses compact spectrum and evidence gate',()=>{
  assert.match(html,/class="dml-spectrum"/);
  assert.match(html,/class="dml-gate-flow"/);
  assert.doesNotMatch(html,/class="dml-rung/);
  assert.match(html,/PRESENT ≠ DEMONSTRATED/);
});
