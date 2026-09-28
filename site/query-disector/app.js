import { analyzeQuery } from './src/analyze.js';
import { languages } from './src/language-analyzer.js';

const $ = s => document.querySelector(s);
const input=$('#query');
const select=$('#language');
const run=$('#analyze');
const sample=$('#sample');
const status=$('#status');
const out=$('#output');
const selectionPrompt=$('#selection-prompt');

const samples={
  spl:'index=zeek service=ssl\n| stats count by id.orig_h\n| sort -count',
  esql:'FROM logs-*\n| WHERE event.category == "authentication" AND event.outcome == "failure"\n| STATS failed_count = COUNT(*) BY user.name\n| SORT failed_count DESC',
  kusto:'SecurityEvent\n| where TimeGenerated > ago(24h)\n| summarize Total = count() by Account\n| top 20 by Total desc',
  cql:'#event_simpleName=NetworkConnectIP4\n| groupBy(RemoteAddressIP4, function=count(as=connections))\n| sort(connections, order=desc)',
  sql:'SELECT src_ip, COUNT(*) AS total\nFROM events\nWHERE service = \'ssl\'\nGROUP BY src_ip\nORDER BY total DESC;'
};

for(const l of languages){
  const o=document.createElement('option');
  o.value=l.id;
  o.textContent=l.label;
  select.appendChild(o);
}

sample.addEventListener('change',()=>{
  if(samples[sample.value]){
    input.value=samples[sample.value];
    select.value='auto';
    analyze();
  }
});
run.addEventListener('click', analyze);
input.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter') analyze();});

function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function pct(n){return `${Math.round((n||0)*100)}%`;}
function badge(type){return `<span class="badge badge-${esc(type)}">${esc(type)}</span>`;}
function renderTree(n, depth=0){
  if(!n)return'';
  return `<div class="tree-node" style="--depth:${depth}"><div class="tree-row"><span class="tree-joint">${depth?'└─':'◆'}</span>${badge(n.kind||'node')}<span>${esc(n.label)}</span></div>${(n.children||[]).map(c=>renderTree(c,depth+1)).join('')}</div>`;
}
function setFlow(stage){
  const order=['input','analyzer','selection','dissection'];
  const current=order.indexOf(stage);
  document.querySelectorAll('[data-flow]').forEach(el=>{
    const i=order.indexOf(el.dataset.flow);
    el.classList.toggle('active',i===current);
    el.classList.toggle('complete',i<current);
  });
}
function renderLanguageProfile(language, dissector=null){
  const display=language.selected || language.candidate;
  $('#detected-language').textContent=display?.label || 'Undetermined';
  $('#confidence').textContent=pct(language.confidence);
  $('#family').textContent=display?.family || '—';
  $('#selected-dissector').textContent=dissector?.label || 'Awaiting selection';
  $('#evidence').innerHTML=language.evidence?.length ? language.evidence.map(x=>`<li>${esc(x)}</li>`).join('') : '<li>No strong signature evidence.</li>';
  $('#alternatives').innerHTML=language.alternatives?.length ? language.alternatives.map(a=>`<span class="chip">${esc(a.label)} · ${a.score}</span>`).join('') : '<span class="muted">None surfaced</span>';
}
function showSelection(language){
  const choices=[];
  if(language.candidate) choices.push(language.candidate);
  for(const alt of language.alternatives||[]) if(!choices.some(x=>x.id===alt.id)) choices.push(alt);
  selectionPrompt.hidden=false;
  selectionPrompt.innerHTML=`<p><strong>Language selection required.</strong> The signature is not distinctive enough to safely choose a grammar. Pick the intended language and GlassCastle(Q) will continue with that disector.</p><div class="selection-options">${choices.map(x=>`<button data-language-choice="${esc(x.id)}">${esc(x.label)}</button>`).join('')}</div>`;
  selectionPrompt.querySelectorAll('[data-language-choice]').forEach(btn=>btn.addEventListener('click',()=>{
    select.value=btn.dataset.languageChoice;
    analyze();
  }));
}
function renderReview(r){
  const diagnostics=r.review.diagnostics||[];
  const diagHtml=diagnostics.length ? `<ul class="diagnostics">${diagnostics.map(d=>`<li class="diag-${esc(d.severity)}"><strong>${esc(d.code)}</strong> · ${esc(d.message)}</li>`).join('')}</ul>` : '';
  $('#review').innerHTML=`<p class="lede">${esc(r.review.summary)}</p><div class="review-grid"><div><span class="eyebrow">Validity</span><strong>${esc(r.review.validity)}</strong></div><div><span class="eyebrow">Selected disector</span><strong>${esc(r.dissector.label)}</strong></div></div>${r.review.observations.length?`<ul class="observations">${r.review.observations.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}${diagHtml}`;
}
function renderDissection(r){
  renderReview(r);
  $('#anatomy').innerHTML=`<div class="tokens">${r.anatomy.map(t=>`<button class="token token-${esc(t.type)}" title="${esc(t.type)} at line ${t.start?.line ?? '?'} column ${t.start?.column ?? '?'}"><span>${esc(t.value)}</span><small>${esc(t.type)}</small><em>L${t.start?.line ?? '?'}:C${t.start?.column ?? '?'}</em></button>`).join('')}</div>`;
  $('#syntax').innerHTML=renderTree(r.syntax);
  $('#semantics').innerHTML=`<div class="flow">${r.semantics.map((s,i)=>`<div class="semantic"><div class="step">${i+1}</div><div><div class="semantic-head">${badge(s.category)}<strong>${esc(s.label)}</strong></div><p>${esc(s.effect)}</p>${s.detail?`<code>${esc(s.detail)}</code>`:''}</div></div>`).join('')}</div>`;
}
function clearDissection(message='Select a language to continue.'){
  $('#review').innerHTML=`<div class="empty"><strong>Dissection paused.</strong><br>${esc(message)}</div>`;
  $('#anatomy').innerHTML='';
  $('#syntax').innerHTML='';
  $('#semantics').innerHTML='';
}
function persist(q){
  localStorage.setItem('glasscastle-q:last',JSON.stringify({q,lang:select.value,sample:sample.value}));
}
function analyze(){
  const q=input.value.trim();
  selectionPrompt.hidden=true;
  selectionPrompt.innerHTML='';
  out.hidden=false;
  setFlow('analyzer');
  if(!q){
    status.textContent='Enter a query to disect.';
    clearDissection('No query input yet.');
    renderLanguageProfile({confidence:0,evidence:[],alternatives:[]});
    setFlow('input');
    return;
  }

  const r=analyzeQuery(q,select.value);
  window.__lastAnalysis=r;
  renderLanguageProfile(r.language,r.dissector);

  if(r.selectionRequired){
    status.innerHTML=`<span class="warn">Ambiguous language signature.</span> ${pct(r.language.confidence)} confidence in ${esc(r.language.candidate?.label||'the leading candidate')}.`;
    clearDissection(r.error);
    showSelection(r.language);
    setFlow('selection');
    persist(q);
    return;
  }
  if(r.error){
    status.innerHTML=`<span class="error">${esc(r.error)}</span>`;
    clearDissection(r.error);
    setFlow('selection');
    persist(q);
    return;
  }

  status.innerHTML=`<strong>${esc(r.language.selected.label)}</strong> · ${pct(r.language.confidence)} confidence · ${esc(r.language.selected.family)}${r.language.forced?' · manually selected':''}`;
  renderDissection(r);
  setFlow('dissection');
  persist(q);
}

for(const tab of document.querySelectorAll('[data-tab]')) tab.addEventListener('click',()=>{
  document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===tab));
  document.querySelectorAll('.panel').forEach(p=>p.hidden=p.id!==tab.dataset.tab);
});

try{
  const saved=JSON.parse(localStorage.getItem('glasscastle-q:last') || localStorage.getItem('query-dissector:last'));
  if(saved?.q){input.value=saved.q;select.value=saved.lang||'auto';sample.value=saved.sample||'';}
}catch{}

setFlow('input');
analyze();