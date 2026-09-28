function isEscaped(input, index) {
  let slashes = 0;
  for (let i = index - 1; i >= 0 && input[i] === '\\'; i--) slashes++;
  return slashes % 2 === 1;
}

export function splitPipeline(input) {
  const parts = [];
  let current = '';
  let quote = null;
  let depth = 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quote) {
      current += ch;
      if (ch === quote && !isEscaped(input, i)) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    if (ch === ')' || ch === ']' || ch === '}') depth = Math.max(0, depth - 1);
    if (ch === '|' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim() || parts.length) parts.push(current.trim());
  return parts.filter(Boolean);
}

export function splitTopLevel(input, delimiter = ',') {
  const parts = [];
  let current = '';
  let quote = null;
  let depth = 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quote) {
      current += ch;
      if (ch === quote && !isEscaped(input, i)) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    if (ch === ')' || ch === ']' || ch === '}') depth = Math.max(0, depth - 1);
    if (ch === delimiter && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function positionAt(input, index) {
  const prefix = input.slice(0, index);
  const lines = prefix.split('\n');
  return { offset: index, line: lines.length, column: lines.at(-1).length + 1 };
}

export function tokenize(query, keywordSet = new Set()) {
  const rx = /(`[^`]*`|"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|>=|<=|!=|==|:=|=~|!~|[()\[\]{},;|]|[-+*/%<>:=]|\b\d+(?:\.\d+)?\b|[A-Za-z_@#][A-Za-z0-9_.:@#-]*|\S)/g;
  const tokens = [];
  for (const match of query.matchAll(rx)) {
    const value = match[0];
    const upper = value.toUpperCase();
    let type = 'identifier';
    if (value === '|') type = 'pipe';
    else if (/^[()\[\]{},;]$/.test(value)) type = 'delimiter';
    else if (/^(>=|<=|!=|==|:=|=~|!~|[-+*/%<>:=])$/.test(value)) type = 'operator';
    else if (/^\d+(\.\d+)?$/.test(value)) type = 'number';
    else if (/^['"`]/.test(value)) type = 'literal';
    else if (keywordSet.has(upper)) type = 'keyword';
    const start = positionAt(query, match.index);
    const end = positionAt(query, match.index + value.length);
    tokens.push({ index: tokens.length, value, type, start, end });
  }
  return tokens;
}

export function scanStructure(query) {
  const diagnostics = [];
  const pairs = { ')': '(', ']': '[', '}': '{' };
  const names = { '(': 'parenthesis', '[': 'bracket', '{': 'brace' };
  const stack = [];
  let quote = null;
  let quoteStart = -1;
  let topLevelPipeAt = null;
  let stageHasContent = false;

  for (let i = 0; i < query.length; i++) {
    const ch = query[i];
    if (quote) {
      if (ch === quote && !isEscaped(query, i)) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      quoteStart = i;
      stageHasContent = true;
      continue;
    }
    if ('([{'.includes(ch)) {
      stack.push({ ch, index: i });
      stageHasContent = true;
      continue;
    }
    if (')]}'.includes(ch)) {
      const open = stack.pop();
      if (!open || open.ch !== pairs[ch]) {
        diagnostics.push({ severity: 'error', code: 'UNMATCHED_CLOSER', message: `Unmatched ${ch} at line ${positionAt(query, i).line}, column ${positionAt(query, i).column}.`, position: positionAt(query, i) });
      }
      stageHasContent = true;
      continue;
    }
    if (ch === '|' && stack.length === 0) {
      if (!stageHasContent) diagnostics.push({ severity: 'error', code: 'EMPTY_PIPELINE_STAGE', message: `Empty pipeline stage before | at line ${positionAt(query, i).line}, column ${positionAt(query, i).column}.`, position: positionAt(query, i) });
      topLevelPipeAt = i;
      stageHasContent = false;
      continue;
    }
    if (!/\s/.test(ch)) stageHasContent = true;
  }

  if (quote) {
    diagnostics.push({ severity: 'error', code: 'UNCLOSED_QUOTE', message: `Unclosed ${quote} quote beginning at line ${positionAt(query, quoteStart).line}, column ${positionAt(query, quoteStart).column}.`, position: positionAt(query, quoteStart) });
  }
  for (const open of stack.reverse()) {
    diagnostics.push({ severity: 'error', code: 'UNCLOSED_DELIMITER', message: `Unclosed ${names[open.ch]} beginning at line ${positionAt(query, open.index).line}, column ${positionAt(query, open.index).column}.`, position: positionAt(query, open.index) });
  }
  if (topLevelPipeAt !== null && !stageHasContent) {
    diagnostics.push({ severity: 'error', code: 'TRAILING_PIPE', message: `Pipeline ends after | at line ${positionAt(query, topLevelPipeAt).line}, column ${positionAt(query, topLevelPipeAt).column}.`, position: positionAt(query, topLevelPipeAt) });
  }

  return diagnostics;
}

export function balanced(query) {
  return !scanStructure(query).some(d => d.severity === 'error');
}

export function firstWord(s) {
  return (s.trim().match(/^([^\s(]+)/)?.[1] || '').toLowerCase();
}

export function cleanValue(v='') {
  return v.trim().replace(/^['"`]|['"`]$/g, '');
}

export function comparisonParts(text) {
  const m = text.match(/^\s*([\w.@#-]+)\s*(==|=|!=|>=|<=|>|<|:=|=~|!~)\s*(.+?)\s*$/s);
  if (!m) return null;
  return { field: m[1], operator: m[2], value: m[3] };
}

export function node(label, kind='construct', children=[], meta={}) {
  return { label, kind, children, meta };
}

export function op(label, category, effect, detail='') {
  return { label, category, effect, detail };
}

export function reviewBase(query, language, summary, observations=[]) {
  const diagnostics = scanStructure(query);
  const errors = diagnostics.filter(d => d.severity === 'error');
  return {
    language,
    summary,
    validity: errors.length ? `${errors.length} structural ${errors.length === 1 ? 'issue' : 'issues'} detected` : 'Structurally plausible',
    observations,
    diagnostics
  };
}