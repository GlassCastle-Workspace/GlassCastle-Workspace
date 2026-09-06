# MITRE ATT&CK® Audit for ShatteredCastle(s)

## Source

ShatteredCastle(s) pins **MITRE ATT&CK® v19.2**, released August 6, 2026. The release is sourced from MITRE/CTI and normalized into a compact, deterministic catalog for Enterprise, Mobile, and ICS. Raw upstream STIX is used only during catalog generation and is not committed to the GlassCastle repository.

Source bundle SHA-256 values:

- Enterprise: `f7eaf37fe53b50404084fe1fe67237278f7317e61c11ad550295722d13ede259`
- Mobile: `e69c3886a3c55311f3f08fac2543bf4ee9647dba7106878274b4cc288e2051f8`
- ICS: `8a462b5d0103fba3eb941575bd15f3f7968c1362ac724cb03909415bdd5377c1`

## Model invariants retained

1. ATT&CK is a knowledge base and model of adversary behavior based on real-world observations.
2. Tactics represent the adversary's tactical goal, or **why** an action is performed.
3. Techniques represent **how** an adversary pursues a tactical goal.
4. Sub-techniques are lower-level descriptions of adversarial behavior.
5. ATT&CK is domain-specific. v1 exposes Enterprise, Mobile, and ICS as distinct catalogs.
6. A technique may belong to multiple tactics. The official catalog association is preserved rather than rewritten into a forced sequence.
7. Enterprise ATT&CK v19.2 contains 15 tactics, 222 techniques, and 475 sub-techniques. Mobile contains 12 tactics, 77 techniques, and 47 sub-techniques. ICS contains 12 tactics, 79 techniques, and 18 sub-techniques.
8. Enterprise v19 includes Stealth (`TA0005`) and Defense Impairment (`TA0112`) as separate tactics.
9. ATT&CK tactics are not silently converted into UKC phases. ATT&CK behavior and kill-chain progression remain different models.
10. Missing ATT&CK detection evidence is unknown, not proof that a behavior is undetectable or uncovered.

## ShatteredCastle(s) contracts

- `shatteredcastles.attack.model.v1`
- `shatteredcastles.attack.catalog.v1`
- `shatteredcastles.attack.resolve.v1`
- `shatteredcastles.attack.behavior.v1`
- `shatteredcastles.attack.coverage.v1`
- `shatteredcastles.attack.composition.v1`

## Operations

The public API supports `model`, `catalog`, `resolve`, `normalize_behavior`, `coverage`, and `compose`. All are deterministic and zero-target-network. Exact ATT&CK external IDs and exact catalog names are accepted selectors; arbitrary prose is never semantically classified into ATT&CK techniques.

## Orthogonal composition

- **UKC** describes explicit tactical progression.
- **Diamond** describes intrusion-event relationships.
- **Pyramid of Pain** describes relative adversary replacement burden for explicitly typed indicators.
- **ATT&CK** describes explicitly selected adversary tactics, techniques, and sub-techniques.

Cross-model relations are caller-supplied bindings. Vocabulary similarity never creates an implicit mapping.

## Deliberate v1 limits

- No free-text ATT&CK classification.
- No automatic actor, group, campaign, or software attribution.
- No automatic UKC, Diamond, or Pyramid mapping.
- No technique-frequency severity score.
- No ATT&CK-driven impact-score adjustment.
- No ATT&CK-driven authorization expansion.
- No target-network action in the ATT&CK API.

## MITRE notice

© 2026 The MITRE Corporation. This work is reproduced and distributed with the permission of The MITRE Corporation.

MITRE ATT&CK® and ATT&CK® are registered trademarks of The MITRE Corporation. This integration does not imply MITRE affiliation, sponsorship, or endorsement. License and branding terms remain governed by MITRE's official ATT&CK Terms of Use and Legal & Branding guidance.
