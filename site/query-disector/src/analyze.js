import { analyzeLanguage } from './language-analyzer.js';
import { selectDissector } from './registry.js';

function assertDissection(result, dissector) {
  const required = ['review','anatomy','syntax','semantics'];
  const missing = required.filter(k => result?.[k] == null);
  if (missing.length) throw new Error(`${dissector.label} returned an incomplete dissection: missing ${missing.join(', ')}.`);
  if (!Array.isArray(result.anatomy) || !Array.isArray(result.semantics)) throw new Error(`${dissector.label} returned an invalid dissection shape.`);
}

export function analyzeQuery(query, hint='auto'){
  const language=analyzeLanguage(query,hint);

  if (language.status === 'ambiguous' && hint === 'auto') {
    return {
      language,
      selectionRequired:true,
      error:'Language signature is ambiguous. Select a language before dissection so GlassCastle(Q) does not guess the grammar.'
    };
  }
  if(!language.selected) return {language,error:'Unable to identify a supported query language.'};

  const dissector=selectDissector(language.selected.id);
  if(!dissector) return {language,error:`No dissector is registered for ${language.selected.label}.`};

  const result = dissector.dissect(query);
  assertDissection(result, dissector);
  return {language,dissector:{id:dissector.id,label:dissector.label},...result};
}