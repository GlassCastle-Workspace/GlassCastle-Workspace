import { splitPipeline, splitTopLevel, tokenize, node, op, reviewBase, comparisonParts, cleanValue, firstWord } from '../core.js';

export const commonKeywords = new Set('BY AS WHERE AND OR NOT IN LIKE RLIKE IS NULL TRUE FALSE FROM SELECT GROUP ORDER HAVING LIMIT ASC DESC ON JOIN LET SORT STATS EVAL KEEP DROP RENAME PROJECT EXTEND SUMMARIZE TOP TAKE DISTINCT SEARCH TABLE FIELDS TIMECHART'.split(' '));

export function genericTokens(query, extra=[]) {
  const kws = new Set([...commonKeywords, ...extra.map(x=>x.toUpperCase())]);
  const tokens = tokenize(query, kws);
  const functionNames = new Set();
  query.replace(/\b([A-Za-z_][\w]*)\s*\(/g, (_,f)=>{ functionNames.add(f); return _; });
  return tokens.map(t => functionNames.has(t.value) ? {...t,type:'function'} : t);
}

export function genericPipelineSyntax(query, language) {
  const parts = splitPipeline(query);
  return node('Query', 'query', parts.map((p,i)=>node(i===0?`${language} input`:`Pipeline stage ${i}`, i===0?'source':'stage', [node(p,'expression')])));
}

export function parseFilterWords(segment) {
  const pieces = segment.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
  return pieces.map(p => comparisonParts(p)).filter(Boolean);
}

export function searchSemantic(filters) {
  return filters.map(f=>op(`${f.field} ${f.operator} ${f.value}`,'filter',`Retain records where ${f.field} ${humanOp(f.operator)} ${cleanValue(f.value)}.`));
}

function humanOp(v){ return ({'=':'equals','==':'equals','!=':'does not equal','>':'is greater than','<':'is less than','>=':'is at least','<=':'is at most',':=':'is assigned','~=~':'matches'}[v] || v); }

export function summarizePipeline(query, language) {
  const parts = splitPipeline(query);
  const names = parts.map(p=>firstWord(p)).filter(Boolean);
  return reviewBase(query, language,
    `A ${language} query with ${parts.length} ${parts.length===1?'stage':'stages'}${names.length?`: ${names.join(' → ')}`:''}.`,
    [`Pipeline depth: ${parts.length}.`]
  );
}

export { splitPipeline, splitTopLevel, node, op, reviewBase, comparisonParts, cleanValue, firstWord };