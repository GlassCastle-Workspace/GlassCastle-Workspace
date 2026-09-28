import { analyzeQuery } from './src/analyze.js';
import { languages } from './src/language-analyzer.js';

const $ = s => document.querySelector(s);
const input = $('#query');
const select = $('#language');
const run = $('#analyze');
const sample = $('#sample');
const status = $('#status');
const out = $('#output');
const selectionPrompt = $('#selection-prompt');
const lineNumbers = $('#line-numbers');
const queryMetrics = $('#query-metrics');
const cursorPosition = $('#cursor-position');
let analyzeTimer = null;

const samples = {
  spl:'index=zeek service=ssl\n| stats count by id.orig_h\n| sort -count',
  esql:'FROM logs-*\n| WHERE event.category == "authentication" AND event.outcome == "failure"\n| STATS failed_count = COUNT(*) BY user.name\n| SORT failed_count DESC',
  kusto:'SecurityEvent\n| where TimeGenerated > ago(24h)\n| summarize Total = count() by Account\n| top 20 by Total desc',
  cql:'#event_simpleName=NetworkConnectIP4\n| groupBy(RemoteAddressIP4, function=count(as=connections))\n| sort(connections, order=desc)',
  sql:'SELECT src_ip, COUNT(*) AS total\nFROM events\nWHERE service = \'ssl\'\nGROUP BY src_ip\nORDER BY total DESC;'
};

for (const l of languages) {
  const o = document.createElement('option');
  o.value = l.id;
  o.textContent = l.label;
  select.appendChild(o);
}

sample.addEventListener('change', () => {
  if (!samples[sample.value]) return;
  input.value = samples[sample.value];
  select.value = 'auto';
  updateEditorChrome();
  analyze();
});
select.addEventListener('change', analyze);
run.addEventListener('click', analyze);
input.addEventListener('input', () => {
  updateEditorChrome();
  scheduleAnalyze();
});
input.addEventListener('scroll', () => { lineNumbers.scrollTop = input.scrollTop; });
input.addEventListener('click', updateCursor);
input.addEventListener('keyup', updateCursor);
input.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    clearTimeout(analyzeTimer);
    analyze();
  }
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = input.selectionStart;
    const end = input.selectionEnd;
    input.setRangeText('  ', start, end, 'end');
    updateEditorChrome();
    scheduleAnalyze();
  }
});

$('#copy-query').addEventListener('click', async () => {
  if (!input.value) return;
  try {
    await navigator.clipboard.writeText(input.value);
    flashButton($('#copy-query'), 'Copied');
  } catch {
    input.select();
    document.execCommand('copy');
    flashButton($('#copy-query'), 'Copied');
  }
});
$('#clear-query').addEventListener('click', () => {
  input.value = '';
  sample.value = '';
  select.value = 'auto';
  updateEditorChrome();
  clearTimeout(analyzeTimer);
  analyze();
  input.focus();
});

function scheduleAnalyze() {
  clearTimeout(analyzeTimer);
  analyzeTimer = setTimeout(analyze, 650);
}
function flashButton(button, text) {
  const original = button.textContent;
  button.textContent = text;
  setTimeout(() => { button.textContent = original; }, 900);
}
function esc(s='') { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function pct(n) { return `${Math.round((n || 0) * 100)}%`; }
function badge(type) { return `<span class="badge badge-${esc(type)}">${esc(type)}</span>`; }
function renderTree(n, depth=0) {
  if (!n) return '';
  return `<div class="tree-node" style="--depth:${depth}"><div class="tree-row">${badge(n.kind || 'node')}<span>${esc(n.label)}</span></div>${(n.children || []).map(c => renderTree(c, depth + 1)).join('')}</div>`;
}
function renderLanguageProfile(language, dissector=null) {
  const display = language.selected || language.candidate;
  $('#detected-language').textContent = display?.label || 'Undetermined';
  $('#confidence').textContent = pct(language.confidence);
  $('#confidence-bar').style.width = pct(language.confidence);
  $('#family').textContent = display?.family || '—';
  $('#selected-dissector').textContent = dissector?.label || 'Awaiting selection';
  $('#evidence').innerHTML = language.evidence?.length
    ? language.evidence.map(x => `<li>${esc(x)}</li>`).join('')
    : '<li>No strong language signature evidence.</li>';
  $('#alternatives').innerHTML = language.alternatives?.length
    ? language.alternatives.map(a => `<div class="alternative"><span>${esc(a.label)}</span><b>${esc(a.score)}</b></div>`).join('')
    : '<span class="muted">No competing signatures surfaced.</span>';
}
function showSelection(language) {
  const choices = [];
  if (language.candidate) choices.push(language.candidate);
  for (const alt of language.alternatives || []) if (!choices.some(x => x.id === alt.id)) choices.push(alt);
  selectionPrompt.hidden = false;
  selectionPrompt.innerHTML = `<p><strong>Choose the query language.</strong> This query is too generic to select a grammar safely.</p><div class="selection-options">${choices.map(x => `<button data-language-choice="${esc(x.id)}">${esc(x.label)}</button>`).join('')}</div>`;
  selectionPrompt.querySelectorAll('[data-language-choice]').forEach(btn => btn.addEventListener('click', () => {
    select.value = btn.dataset.languageChoice;
    analyze();
  }));
}
function renderReview(r) {
  const diagnostics = r.review.diagnostics || [];
  const observations = r.review.observations || [];
  $('#review').innerHTML = `
    <p class="lede">${esc(r.review.summary)}</p>
    <div class="review-meta">
      <span>Validity <strong>${esc(r.review.validity)}</strong></span>
      <span>Parser <strong>${esc(r.dissector.label)}</strong></span>
    </div>
    ${observations.length ? `<section class="observations-wrap"><h2>Notes</h2><ul class="observations">${observations.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>` : ''}
    ${diagnostics.length ? `<section class="diagnostics-wrap"><h2>Diagnostics</h2><ul class="diagnostics">${diagnostics.map(d => `<li class="diag-${esc(d.severity)}"><strong>${esc(d.code)}</strong> · ${esc(d.message)}</li>`).join('')}</ul></section>` : ''}`;
}
function renderAnatomy(r) {
  const tokens = [...r.anatomy].sort((a,b) => (a.start?.offset ?? 0) - (b.start?.offset ?? 0));
  const q = input.value;
  let cursor = 0;
  let annotated = '';
  tokens.forEach((t, i) => {
    const start = t.start?.offset ?? cursor;
    const end = t.end?.offset ?? start;
    if (start < cursor || end < start) return;
    annotated += esc(q.slice(cursor, start));
    annotated += `<button class="query-token token-${esc(t.type)}" data-token-index="${i}" type="button">${esc(q.slice(start, end) || t.value)}</button>`;
    cursor = end;
  });
  annotated += esc(q.slice(cursor));

  $('#anatomy').innerHTML = `
    <p class="panel-title">Click any part of the query to inspect it in place.</p>
    <pre class="annotated-query">${annotated}</pre>
    <div class="token-inspector" id="token-inspector">Select a token to see its role and source position.</div>`;

  $('#anatomy').querySelectorAll('[data-token-index]').forEach(btn => btn.addEventListener('click', () => {
    const token = tokens[Number(btn.dataset.tokenIndex)];
    if (!token?.start || !token?.end) return;
    $('#anatomy').querySelectorAll('.query-token.active-token').forEach(x => x.classList.remove('active-token'));
    btn.classList.add('active-token');
    $('#token-inspector').innerHTML = `<strong>${esc(token.value)}</strong>${esc(token.type)} · line ${token.start.line ?? '?'} · column ${token.start.column ?? '?'}<br><code>offset ${token.start.offset}–${token.end.offset}</code>`;
    input.focus();
    input.setSelectionRange(token.start.offset, token.end.offset);
    updateCursor();
  }));
}
function renderDissection(r) {
  renderReview(r);
  renderAnatomy(r);
  $('#syntax').innerHTML = `<p class="panel-title">The grammatical structure recognized by the selected parser.</p><div class="syntax-tree">${renderTree(r.syntax)}</div>`;
  $('#semantics').innerHTML = `<p class="panel-title">How the query changes or interprets the data, in execution order.</p><div class="flow">${r.semantics.map((s, i) => `<div class="semantic"><div class="step">${String(i + 1).padStart(2, '0')}</div><div><div class="semantic-head">${badge(s.category)}<strong>${esc(s.label)}</strong></div><p>${esc(s.effect)}</p>${s.detail ? `<code>${esc(s.detail)}</code>` : ''}</div></div>`).join('')}</div>`;
}
function clearDissection(message='Select a language to continue.') {
  $('#review').innerHTML = `<div class="empty"><div><strong>Nothing to dissect yet</strong>${esc(message)}</div></div>`;
  $('#anatomy').innerHTML = '';
  $('#syntax').innerHTML = '';
  $('#semantics').innerHTML = '';
}
function persist(q) {
  localStorage.setItem('glasscastle-q:last', JSON.stringify({ q, lang:select.value, sample:sample.value }));
}
function analyze() {
  const q = input.value.trim();
  selectionPrompt.hidden = true;
  selectionPrompt.innerHTML = '';
  out.hidden = false;
  if (!q) {
    status.textContent = '';
    clearDissection('Paste or type a query above.');
    renderLanguageProfile({ confidence:0, evidence:[], alternatives:[] });
    return;
  }

  const r = analyzeQuery(q, select.value);
  window.__lastAnalysis = r;
  renderLanguageProfile(r.language, r.dissector);

  if (r.selectionRequired) {
    status.innerHTML = `<span class="warn">Language is ambiguous.</span> Pick the intended language to continue.`;
    clearDissection(r.error);
    showSelection(r.language);
    persist(q);
    return;
  }
  if (r.error) {
    status.innerHTML = `<span class="error">${esc(r.error)}</span>`;
    clearDissection(r.error);
    persist(q);
    return;
  }

  status.textContent = '';
  renderDissection(r);
  persist(q);
}

for (const tab of document.querySelectorAll('[data-tab]')) tab.addEventListener('click', () => {
  document.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('active', x === tab));
  document.querySelectorAll('.panel').forEach(p => {
    const active = p.id === tab.dataset.tab;
    p.hidden = !active;
    p.classList.toggle('active-panel', active);
  });
});

function updateEditorChrome() {
  const lines = input.value.split('\n');
  lineNumbers.textContent = lines.map((_, i) => i + 1).join('\n');
  queryMetrics.textContent = `${lines.length} ${lines.length === 1 ? 'line' : 'lines'} · ${input.value.length} chars`;
  updateCursor();
}
function updateCursor() {
  const pos = input.selectionStart ?? 0;
  const prefix = input.value.slice(0, pos);
  const line = prefix.split('\n').length;
  const col = prefix.length - prefix.lastIndexOf('\n');
  cursorPosition.textContent = `Ln ${line}, Col ${col}`;
}

try {
  const saved = JSON.parse(localStorage.getItem('glasscastle-q:last') || localStorage.getItem('query-dissector:last'));
  if (saved?.q) {
    input.value = saved.q;
    select.value = saved.lang || 'auto';
    sample.value = saved.sample || '';
  }
} catch {}

updateEditorChrome();
analyze();