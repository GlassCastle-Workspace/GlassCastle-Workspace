import { splDissector } from './dissectors/spl.js';
import { esqlDissector } from './dissectors/esql.js';
import { kustoDissector } from './dissectors/kusto.js';
import { cqlDissector } from './dissectors/cql.js';
import { sqlDissector } from './dissectors/sql.js';

const requiredFields = ['id','label','dissect'];
const registry = new Map();

export function registerDissector(dissector) {
  if (!dissector || requiredFields.some(k => !dissector[k])) throw new TypeError('Invalid dissector: id, label, and dissect() are required.');
  if (typeof dissector.dissect !== 'function') throw new TypeError(`Invalid dissector ${dissector.id}: dissect must be a function.`);
  if (registry.has(dissector.id)) throw new Error(`Duplicate dissector id: ${dissector.id}`);
  registry.set(dissector.id, Object.freeze(dissector));
  return dissector;
}

[splDissector, esqlDissector, kustoDissector, cqlDissector, sqlDissector].forEach(registerDissector);

export function selectDissector(languageId){ return registry.get(languageId) || null; }
export function registeredDissectors(){ return [...registry.values()].map(d=>({id:d.id,label:d.label,capabilities:d.capabilities||['review','anatomy','syntax','semantics']})); }