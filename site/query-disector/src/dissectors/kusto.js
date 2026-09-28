import { genericTokens, splitPipeline, splitTopLevel, node, op, reviewBase } from './common.js';
const ops=['where','summarize','project','project-away','project-rename','extend','sort','order','top','take','limit','distinct','join','union','render','parse','mv-expand','make-series'];
function parseSummarize(stage){
  const body=stage.replace(/^summarize\s+/i,'');
  const idx=body.search(/\s+by\s+/i);
  return {aggs:splitTopLevel(idx>=0?body.slice(0,idx):body),groups:splitTopLevel(idx>=0?body.slice(idx).replace(/^\s+by\s+/i,''):'')};
}
export const kustoDissector={
  id:'kusto',label:'Microsoft KQL / Kusto',
  dissect(query){
    const parts=splitPipeline(query); const source=parts[0]||'';
    const obs=[];
    if (/\|\s*summarize\b/i.test(query)) obs.push('summarize returns a new table consisting of grouping expressions and aggregation results; unspecified input columns do not automatically flow through.');
    const review=reviewBase(query,'Microsoft KQL / Kusto',`Starts from ${source || 'a tabular expression'} and applies ${Math.max(0,parts.length-1)} tabular ${parts.length-1===1?'operator':'operators'}.`,obs);
    const children=[node(source||'Source expression','source')];
    const semantics=[op(source||'source','source',`Use ${source||'the source expression'} as the initial tabular dataset.`)];
    for(const stage of parts.slice(1)){
      const cmd=stage.match(/^([A-Za-z_-]+)/)?.[1]?.toLowerCase()||'stage';
      if(cmd==='summarize'){
        const {aggs,groups}=parseSummarize(stage);
        children.push(node('summarize','operator',[node('Aggregations','clause',aggs.map(a=>node(a,'aggregation'))),...(groups.length?[node('by','clause',groups.map(g=>node(g,'group-expression')))]:[])]));
        semantics.push(op('summarize','aggregate',`Group incoming rows${groups.length?` by ${groups.join(', ')}`:''} and compute ${aggs.join(', ')||'aggregate values'}.`));
      } else {
        children.push(node(cmd,'operator',[node(stage.slice(cmd.length).trim()||'(no arguments)','arguments')]));
        const meanings={where:['filter','Filter rows using a predicate.'],project:['shape','Choose, rename, or compute output columns.'],extend:['derive','Add calculated columns while preserving existing columns.'],sort:['order','Sort rows by one or more expressions.'],order:['order','Sort rows by one or more expressions.'],top:['rank','Return the highest-ranked rows according to an ordering expression.'],take:['limit','Return up to the requested number of arbitrary rows.'],limit:['limit','Return up to the requested number of rows.'],distinct:['deduplicate','Return distinct combinations of the specified expressions.'],join:['combine','Combine rows with another tabular expression.'],render:['presentation','Attach visualization instructions to the result.']};
        const [cat,effect]=meanings[cmd]||['transform',`Apply the Kusto ${cmd} operator.`]; semantics.push(op(cmd,cat,effect));
      }
    }
    return {review,anatomy:genericTokens(query,ops),syntax:node('Kusto Query','query',children),semantics};
  }
};