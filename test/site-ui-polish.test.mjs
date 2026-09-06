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


test('all analytical lenses share the answers and does-not-prove contract',()=>{
  const ids=['ukc','diamond','pyramid','attack','d3fend','dml'];
  for(const id of ids){
    const m=html.match(new RegExp(`<section id="${id}"[\\s\\S]*?</section>`));
    assert.ok(m,`${id} section missing`);
    assert.match(m[0],/class="model-contract"/);
    assert.match(m[0],/ANSWERS/);
    assert.match(m[0],/DOES NOT PROVE/);
    assert.match(m[0],/class="model-actions ukc-actions"/);
  }
});

test('analytical UI keeps each model recognizable without old redundant rule cards',()=>{
  assert.match(html,/class="ukc-track"/);
  assert.match(html,/class="diamond-shape"/);
  assert.match(html,/class="pyramid-stack"/);
  assert.match(html,/class="attack-matrix"/);
  assert.match(html,/class="d3fend-bridge"/);
  assert.match(html,/class="dml-spectrum"/);
  for(const old of ['attack-rule','d3fend-rule','dml-boundary','pyramid-note'])assert.doesNotMatch(html,new RegExp(`class="${old}"`));
});
