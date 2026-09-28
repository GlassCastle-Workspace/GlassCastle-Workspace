import { genericTokens, splitPipeline, splitTopLevel, node, op, reviewBase, comparisonParts } from './common.js';
const fns=['groupBy','sort','table','select','rename','regex','parseJson','timeChart','count','collect','head','tail','where','stats'];
function functionCall(stage){
  const m=stage.match(/^([A-Za-z_][\w]*)\s*\((.*)\)\s*$/s); if(!m)return null;
  return {name:m[1],args:splitTopLevel(m[2])};
}
export const cqlDissector={
  id:'cql',label:'CrowdStrike CQL / LogScale',
  dissect(query){
    const parts=splitPipeline(query); const first=parts[0]||'';
    const initial= comparisonParts(first);
    const obs=[];
    if (/\bgroupBy\s*\(/i.test(query)) obs.push('groupBy() aggregates by one or more fields; when no function is supplied, count() is the default aggregation in LogScale.');
    if (/:=/.test(query)) obs.push('The := operator assigns a computed value to a field in LogScale expressions.');
    const review=reviewBase(query,'CrowdStrike CQL / LogScale',`Runs an event search followed by ${Math.max(0,parts.length-1)} pipeline ${parts.length-1===1?'function':'functions'}.`,obs);
    const children=[]; const semantics=[];
    if(initial){children.push(node('Event filter','filter',[node(initial.field,'field'),node(initial.operator,'operator'),node(initial.value,'value')]));semantics.push(op(first,'filter',`Retain events matching ${first}.`));}
    else {children.push(node(first||'Event search','search')); semantics.push(op('event search','search','Evaluate the initial LogScale event-search expression.'));}
    for(const stage of parts.slice(1)){
      const call=functionCall(stage); const name=call?.name||stage.match(/^([A-Za-z_][\w]*)/)?.[1]||'stage';
      children.push(node(name,'function',(call?.args||[stage.slice(name.length).trim()]).filter(Boolean).map(a=>node(a,'argument'))));
      const lower=name.toLowerCase();
      if(lower==='groupby') semantics.push(op(name,'aggregate','Group events by the requested field set and apply the specified aggregate function(s), or count() by default.'));
      else if(lower==='sort') semantics.push(op(name,'order','Order the current rows/events using the supplied sort fields and order.'));
      else if(lower==='table' || lower==='select') semantics.push(op(name,'shape','Project selected fields into the result.'));
      else if(lower==='rename') semantics.push(op(name,'shape','Rename one or more fields.'));
      else if(lower==='regex') semantics.push(op(name,'filter/parse','Apply a regular-expression operation to fields or event text.'));
      else semantics.push(op(name,'transform',`Apply the LogScale ${name} function to the current stream.`));
    }
    return {review,anatomy:genericTokens(query,fns),syntax:node('CrowdStrike CQL / LogScale Query','query',children),semantics};
  }
};