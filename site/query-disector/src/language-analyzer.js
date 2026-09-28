const defs = [
  {
    id: 'spl', label: 'Splunk SPL', family: 'Pipeline / Search', dialect: 'Search Processing Language',
    tests: [
      [/\bindex\s*=\s*[^\s|]+/i, 5, 'index=… search constraint'],
      [/\bsourcetype\s*=\s*[^\s|]+/i, 5, 'sourcetype=… search constraint'],
      [/\|\s*(stats|timechart|chart|eval|rex|table|fields|dedup)\b/i, 6, 'SPL processing command'],
      [/\|\s*sort\s+-[\w.]+/i, 4, 'SPL descending sort shorthand'],
      [/\bstats\s+[^|]*\bby\s+[\w.]+/i, 4, 'stats … by … pattern']
    ]
  },
  {
    id: 'esql', label: 'Elastic ES|QL', family: 'Pipeline', dialect: 'Elasticsearch Query Language',
    tests: [
      [/^\s*(?:SET\s+[^;]+;\s*)?FROM\s+[^|\n]+/i, 8, 'FROM source command'],
      [/\|\s*(STATS|EVAL|KEEP|DROP|RENAME|ENRICH|MV_EXPAND|DISSECT|GROK)\b/i, 5, 'ES|QL processing command'],
      [/\|\s*WHERE\s+[^|]*(==|LIKE|RLIKE|IS\s+NULL|IS\s+NOT\s+NULL)/i, 3, 'ES|QL WHERE expression']
    ]
  },
  {
    id: 'kusto', label: 'Microsoft KQL / Kusto', family: 'Pipeline / Tabular', dialect: 'Kusto Query Language',
    tests: [
      [/^\s*[A-Za-z_][\w.]*\s*\|/s, 3, 'table expression piped to operators'],
      [/\|\s*(summarize|project|extend|project-away|project-rename|mv-expand|parse|make-series|render)\b/i, 7, 'Kusto tabular operator'],
      [/\bago\s*\(|\bdatetime\s*\(|\bcountif\s*\(/i, 4, 'Kusto function signature'],
      [/\|\s*(top|take|limit)\s+\d+\b/i, 2, 'Kusto row-limiting operator']
    ]
  },
  {
    id: 'cql', label: 'CrowdStrike CQL / LogScale', family: 'Pipeline / Event Search', dialect: 'Falcon LogScale query language',
    tests: [
      [/\bgroupBy\s*\(/i, 9, 'LogScale groupBy() function'],
      [/\b(?:count|collect|selectFromMax|tail|head|sort)\s*\([^)]*\bas\s*=/i, 5, 'LogScale named function argument'],
      [/[A-Za-z_@#][\w.@#]*\s*:=\s*/i, 7, 'LogScale assignment operator :='],
      [/\|\s*(groupBy|sort|table|select|rename|regex|parseJson|timeChart)\s*\(/i, 6, 'LogScale pipeline function'],
      [/#event_simpleName\s*=|@timestamp/i, 4, 'Falcon/LogScale field signature']
    ]
  },
  {
    id: 'sql', label: 'SQL', family: 'Clause / Relational', dialect: 'Generic SQL',
    tests: [
      [/^\s*(WITH\b[\s\S]+?\bSELECT\b|SELECT\b)/i, 8, 'SELECT statement'],
      [/\bFROM\s+[\w."`\[\]-]+/i, 4, 'FROM clause'],
      [/\b(GROUP\s+BY|ORDER\s+BY|HAVING|JOIN)\b/i, 4, 'SQL clause'],
      [/;\s*$/, 1, 'statement terminator']
    ]
  }
];

export const languages = defs.map(({tests, ...rest}) => rest);

function languageDescriptor(d) {
  return d ? { id:d.id, label:d.label, family:d.family, dialect:d.dialect } : null;
}

export function analyzeLanguage(query, hint='auto') {
  const trimmed = query.trim();
  if (!trimmed) return { status:'unknown', selected:null, candidate:null, confidence:0, margin:0, evidence:[], signals:[], alternatives:[], ambiguous:true, scores:[] };

  if (hint && hint !== 'auto') {
    const d = defs.find(x => x.id === hint);
    return {
      status: d ? 'forced' : 'unknown', selected: languageDescriptor(d), candidate: languageDescriptor(d), confidence: d ? 1 : 0,
      margin: d ? 1 : 0, evidence: d ? ['Language selected explicitly'] : [], signals: d ? [{reason:'Language selected explicitly',weight:1}] : [],
      alternatives: [], ambiguous: false, forced: true, scores: []
    };
  }

  const scored = defs.map(d => {
    let score = 0;
    const signals=[];
    for (const [rx, weight, reason] of d.tests) {
      if (rx.test(trimmed)) { score += weight; signals.push({reason,weight}); }
    }
    return { id:d.id,label:d.label,family:d.family,dialect:d.dialect,score,signals };
  }).sort((a,b)=>b.score-a.score || a.label.localeCompare(b.label));

  const top = scored[0];
  const second = scored[1];
  const margin = Math.max(0, top.score - second.score);
  const evidenceStrength = Math.min(1, top.score / 12);
  const separation = top.score ? margin / top.score : 0;
  const confidence = top.score ? Math.min(.99, .35 + (.4 * evidenceStrength) + (.24 * separation)) : 0;
  const ambiguous = top.score < 4 || (second.score > 0 && margin <= 2) || confidence < .62;
  const candidate = top.score ? languageDescriptor(top) : null;
  const selected = !ambiguous ? candidate : null;

  return {
    status: !top.score ? 'unknown' : ambiguous ? 'ambiguous' : 'identified',
    selected,
    candidate,
    confidence,
    margin,
    evidence: top.signals.map(x=>x.reason),
    signals: top.signals,
    alternatives: scored.slice(1,4).filter(x=>x.score>0).map(x=>({id:x.id,label:x.label,family:x.family,dialect:x.dialect,score:x.score})),
    ambiguous,
    scores: scored.map(x=>({id:x.id,label:x.label,score:x.score}))
  };
}