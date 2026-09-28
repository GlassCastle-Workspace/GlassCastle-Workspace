import { genericTokens, splitPipeline, splitTopLevel, node, op, reviewBase } from './common.js';

const commands=['FROM','ROW','SHOW','METRICS','TS','WHERE','STATS','EVAL','KEEP','DROP','RENAME','SORT','LIMIT','ENRICH','LOOKUP','MV_EXPAND','DISSECT','GROK','FORK'];
function parseStats(stage){
  const body=stage.replace(/^STATS\s+/i,'');
  const idx=body.search(/\s+BY\s+/i);
  const aggText=idx>=0?body.slice(0,idx):body;
  const byText=idx>=0?body.slice(idx).replace(/^\s+BY\s+/i,''):'';
  return {aggs:splitTopLevel(aggText),groups:splitTopLevel(byText)};
}
export const esqlDissector={
  id:'esql',label:'Elastic ES|QL',
  dissect(query){
    const parts=splitPipeline(query);
    const source=parts[0]||'';
    const src=source.match(/^(?:SET\s+[\s\S]+?;\s*)?FROM\s+([\s\S]+)$/i)?.[1]?.trim();
    const observations=[];
    if (/\|\s*STATS\b/i.test(query)) observations.push('STATS changes the row shape to grouping expressions plus computed aggregations.');
    if (/\bSTATS\b[\s\S]*?\bWHERE\b/i.test(query)) observations.push('A WHERE inside a STATS aggregation applies to that aggregation, which is not the same as a separate pipeline WHERE stage.');
    const review=reviewBase(query,'Elastic ES|QL',src?`Reads from ${src}, then applies ${Math.max(0,parts.length-1)} processing ${parts.length-1===1?'command':'commands'}.`:`Runs an ES|QL source command followed by ${Math.max(0,parts.length-1)} processing stages.`,observations);
    const children=[];
    children.push(node(source.match(/^\s*([A-Z_]+)/i)?.[1]?.toUpperCase()||'SOURCE','source',[node(src||source,'source-target')]));
    const semantics=[];
    semantics.push(op('source','source',src?`Produce the initial table from ${src}.`:'Produce the initial ES|QL table.'));
    for(const stage of parts.slice(1)){
      const cmd=stage.match(/^([A-Za-z_]+)/)?.[1]?.toUpperCase()||'STAGE';
      if(cmd==='STATS'){
        const {aggs,groups}=parseStats(stage);
        children.push(node('STATS','command',[node('Aggregations','clause',aggs.map(a=>node(a,'aggregation'))),...(groups.length?[node('BY','clause',groups.map(g=>node(g,'grouping-expression')))]:[])]));
        semantics.push(op('STATS','aggregate',`Calculate ${aggs.join(', ')||'aggregations'}${groups.length?` grouped by ${groups.join(', ')}`:' across the full incoming table'}.`));
      } else {
        children.push(node(cmd,'command',[node(stage.slice(cmd.length).trim()||'(no arguments)','arguments')]));
        const meanings={WHERE:['filter','Retain rows that satisfy the boolean expression.'],EVAL:['derive','Add or replace computed columns.'],KEEP:['shape','Keep only the specified columns.'],DROP:['shape','Remove the specified columns.'],RENAME:['shape','Rename columns.'],SORT:['order','Order rows using the supplied expressions.'],LIMIT:['limit','Restrict the number of output rows.'],ENRICH:['enrich','Add fields from an enrichment policy.'],MV_EXPAND:['expand','Expand multivalued data into rows.']};
        const [cat,effect]=meanings[cmd]||['transform',`Apply the ES|QL ${cmd} processing command.`];
        semantics.push(op(cmd,cat,effect));
      }
    }
    return {review,anatomy:genericTokens(query,commands),syntax:node('ES|QL Query','query',children),semantics};
  }
};