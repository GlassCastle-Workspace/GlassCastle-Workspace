import { genericTokens, splitTopLevel, node, op, reviewBase } from './common.js';
const clauses=['SELECT','FROM','WHERE','GROUP BY','HAVING','ORDER BY','LIMIT','JOIN','LEFT JOIN','RIGHT JOIN','INNER JOIN','FULL JOIN','WITH','ON','AS'];
function findClauses(query){
  const rx=/\b(SELECT|FROM|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT|OFFSET|LEFT\s+JOIN|RIGHT\s+JOIN|FULL(?:\s+OUTER)?\s+JOIN|INNER\s+JOIN|JOIN)\b/ig;
  const matches=[]; let m; while((m=rx.exec(query))) matches.push({name:m[1].toUpperCase().replace(/\s+/g,' '),start:m.index,end:rx.lastIndex});
  return matches.map((x,i)=>({...x,body:query.slice(x.end,matches[i+1]?.start??query.length).trim().replace(/;$/,'')}));
}
export const sqlDissector={
  id:'sql',label:'SQL',
  dissect(query){
    const found=findClauses(query); const by=Object.fromEntries(found.map(c=>[c.name,c.body]));
    const obs=[]; if(by['GROUP BY']) obs.push('GROUP BY changes row granularity to one output row per grouping key combination, subject to the selected aggregations.');
    if(by['HAVING']) obs.push('HAVING filters grouped/aggregated results, while WHERE filters rows before grouping.');
    const review=reviewBase(query,'SQL',by.SELECT?`Selects ${splitTopLevel(by.SELECT).length} expression${splitTopLevel(by.SELECT).length===1?'':'s'} from ${by.FROM||'the source relation'}${by.WHERE?' with a row filter':''}${by['GROUP BY']?' and grouping':''}.`:'Processes a SQL statement.',obs);
    const children=found.map(c=>node(c.name,'clause',splitTopLevel(c.body).map(v=>node(v,c.name.includes('BY')?'expression':'clause-item'))));
    const semantics=[];
    for(const c of found){
      const meaning={SELECT:['projection','Choose or compute the output expressions.'],FROM:['source','Read rows from the named relation or table expression.'],WHERE:['filter','Filter source rows before grouping and projection.'],'GROUP BY':['aggregate-shape','Partition rows into groups sharing the grouping expressions.'],HAVING:['filter','Filter groups after aggregation.'],'ORDER BY':['order','Sort result rows using the supplied expressions.'],LIMIT:['limit','Restrict the number of returned rows.'],JOIN:['combine','Combine rows from another relation using join criteria.'],'LEFT JOIN':['combine','Keep all left-side rows while joining matching right-side rows.'],'INNER JOIN':['combine','Keep rows with matching join conditions on both sides.']};
      const [cat,effect]=meaning[c.name]||['clause',`Apply the SQL ${c.name} clause.`]; semantics.push(op(c.name,cat,effect,c.body));
    }
    return {review,anatomy:genericTokens(query,clauses),syntax:node('SQL Statement','query',children),semantics};
  }
};