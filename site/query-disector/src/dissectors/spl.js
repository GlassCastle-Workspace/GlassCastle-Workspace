import { genericTokens, splitPipeline, node, op, reviewBase, comparisonParts, cleanValue } from './common.js';

const commands = new Set(['search','stats','eval','where','sort','table','fields','timechart','chart','dedup','rename','rex','top','rare','head','tail','eventstats','streamstats','transaction']);

function parseSearch(segment){
  const pieces = segment.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
  return pieces.map(p=>comparisonParts(p)).filter(Boolean);
}
function parseStats(segment){
  const body = segment.replace(/^stats\s+/i,'');
  const m = body.match(/^([\s\S]*?)(?:\s+BY\s+([\s\S]+))?$/i);
  const aggText=(m?.[1]||'').trim();
  const byText=(m?.[2]||'').trim();
  const aggs = aggText.match(/[A-Za-z_][\w]*\s*\([^)]*\)(?:\s+AS\s+(?:"[^"]+"|'[^']+'|[\w.]+))?|\bcount\b(?:\s+AS\s+[\w.]+)?/ig) || [];
  const groups = byText ? byText.split(/\s*,\s*|\s+/).filter(Boolean) : [];
  return {aggs, groups};
}
export const splDissector = {
  id:'spl', label:'Splunk SPL',
  dissect(query){
    const parts=splitPipeline(query);
    const search=parseSearch(parts[0]||'');
    const stages=parts.slice(1);
    const reviewObs=[];
    const statsStage=stages.find(s=>/^stats\b/i.test(s));
    if (statsStage) {
      const {groups}=parseStats(statsStage);
      reviewObs.push(groups.length?`The stats command changes event-level results into grouped aggregate rows keyed by ${groups.join(', ')}.`:'The stats command collapses the incoming results into aggregate output.');
    }
    if (!/\b(earliest|latest)\s*=/.test(parts[0]||'')) reviewObs.push('No explicit earliest/latest time modifier is present in the query text; the effective time range may come from the surrounding search context.');
    const summary = search.length
      ? `Searches ${search.map(f=>`${f.field}${f.operator}${cleanValue(f.value)}`).join(' and ')}, then applies ${stages.length} pipeline ${stages.length===1?'command':'commands'}.`
      : `Applies ${parts.length} SPL stage${parts.length===1?'':'s'} to the incoming search context.`;
    const review=reviewBase(query,'Splunk SPL',summary,reviewObs);
    const syntaxChildren=[];
    if (parts[0]) {
      syntaxChildren.push(node('Search expression','search',search.length?search.map(f=>node(`${f.field} ${f.operator} ${f.value}`,'comparison',[node(f.field,'field'),node(f.operator,'operator'),node(f.value,'value')])):[node(parts[0],'expression')]));
    }
    for (const stage of stages) {
      const cmd=stage.match(/^([A-Za-z_][\w-]*)/)?.[1]?.toLowerCase()||'stage';
      if (cmd==='stats') {
        const {aggs,groups}=parseStats(stage);
        syntaxChildren.push(node('stats','command',[
          node('Aggregations','clause',aggs.map(a=>node(a,'aggregation'))),
          ...(groups.length?[node('BY','clause',groups.map(g=>node(g,'field')))]:[])
        ]));
      } else if (cmd==='sort') {
        const specs=stage.replace(/^sort\s+/i,'').split(/\s+/).filter(Boolean);
        syntaxChildren.push(node('sort','command',specs.map(s=>node(s.startsWith('-')?`${s.slice(1)} descending`:s.startsWith('+')?`${s.slice(1)} ascending`:s,'sort-key'))));
      } else syntaxChildren.push(node(cmd,'command',[node(stage.slice(cmd.length).trim()||'(no arguments)','arguments')]));
    }
    const semantics=[];
    for (const f of search) semantics.push(op(`${f.field}${f.operator}${f.value}`,'filter',`Restrict matching events using ${f.field} ${f.operator} ${f.value}.`));
    for (const stage of stages) {
      const cmd=stage.match(/^([A-Za-z_][\w-]*)/)?.[1]?.toLowerCase();
      if (cmd==='stats') { const {aggs,groups}=parseStats(stage); semantics.push(op('stats','aggregate',`Calculate ${aggs.join(', ')||'aggregate statistics'}${groups.length?` for each distinct ${groups.join(', ')} group`: ' across all incoming results'}.`)); }
      else if (cmd==='sort') semantics.push(op('sort','order','Reorder the result rows according to the specified sort keys.'));
      else if (cmd==='eval') semantics.push(op('eval','derive','Create or replace fields using expressions.'));
      else if (cmd==='where' || cmd==='search') semantics.push(op(cmd,'filter','Filter the current pipeline results using the supplied expression.'));
      else if (cmd==='table' || cmd==='fields') semantics.push(op(cmd,'shape','Select or arrange fields in the result set.'));
      else semantics.push(op(cmd||'stage','transform',`Apply the SPL ${cmd||'pipeline'} operation to the current result set.`));
    }
    return {review, anatomy:genericTokens(query,[...commands]), syntax:node('SPL Query','query',syntaxChildren), semantics};
  }
};