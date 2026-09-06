# MITRE D3FEND™ Audit for ShatteredCastle(s)

## Source

ShatteredCastle(s) pins **MITRE D3FEND™ ontology 1.6.0**, released August 31, 2026. Current MITRE version metadata reports SHA-256 `4909a5bb66b75d2c359624398848936fb56a6b246bcd5cfcd277977a1277753a` for `d3fend.ttl`. The ontology and its full inferred-mappings data are normalized into a compact deterministic catalog; raw source material is retained outside the GlassCastle repository.

## Source invariants retained

1. D3FEND is a knowledge graph of cybersecurity countermeasures.
2. Defensive tactic display order is Model, Harden, Detect, Isolate, Deceive, Evict, Restore.
3. Ontology 1.6.0 yields 7 defensive tactics, 30 top-level defensive-technique families, and 271 defensive techniques in the ShatteredCastle defensive-technique traversal.
4. The D3FEND full-mappings data contains inferred relationships generated from the ontology. An inferred mapping is not a direct observation, prescription, or effectiveness claim.
5. D3FEND 1.6.0 inherits an ATT&CK v19.0 mapping substrate. ShatteredCastle ATT&CK is v19.2; only exact current ATT&CK external-ID joins are accepted.
6. The full inferred mapping data contains Enterprise, ICS, and SPARTA rows. It contains no Mobile mapping rows.
7. Missing mapping data remains unknown rather than proof that no related countermeasure exists.
8. A selected or implemented defensive technique does not itself prove deployment quality, coverage, efficacy, prevention, detection, or risk reduction.
9. D3FEND context does not expand authorization, alter validation thresholds, change vulnerability severity, or modify BlastRadial impact scores.

## ShatteredCastle(s) contracts

- `shatteredcastles.d3fend.model.v1`
- `shatteredcastles.d3fend.defense.v1`
- `shatteredcastles.d3fend.attack-map.v1`
- `shatteredcastles.d3fend.alignment.v1`
- `shatteredcastles.d3fend.composition.v1`

## Operations

The public D3FEND API supports:

- `model`
- `catalog`
- `resolve`
- `normalize_defense`
- `map_attack`
- `alignment`
- `compose`

All operations are deterministic and zero-target-network.

## ATT&CK composition

ATT&CK answers **what adversary behavior is explicitly represented**. D3FEND answers **which defensive techniques its knowledge graph can relate to that behavior**. `map_attack` exposes D3FEND-inferred candidate relationships. `compose` requires explicit analyst/operator selection before a candidate enters a ShatteredCastle defensive plan.

## Deliberate v1 limits

- No free-text defensive-technique classification.
- No automatic remediation selection.
- No inference that an implemented defense is effective.
- No severity or impact-score changes from D3FEND context.
- No authorization expansion.
- No fabricated Mobile ATT&CK mapping coverage.
- No acceptance of D3FEND ATT&CK v19.0-only identifiers that are invalid in current ShatteredCastle ATT&CK v19.2.

See [D3FEND-NOTICE.md](D3FEND-NOTICE.md) for source/license/trademark notice.
