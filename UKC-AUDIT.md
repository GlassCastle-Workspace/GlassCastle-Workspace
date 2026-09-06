# ShatteredCastle(s) Unified Kill Chain Audit

Source reviewed: Paul Pols, *The Unified Kill Chain: Designing a Unified Kill Chain for analyzing, comparing and defending against cyber attacks*, Cyber Security Academy, December 7, 2017.

## Audit conclusion

The UKC is useful to ShatteredCastle(s) as a **tactical attack-path meta-model**, not as a rigid scanner checklist or mandatory 18-step progression. The thesis explicitly concludes that attack phases may be bypassed, repeated, or occur out of sequence. Successful attacks can form trees and may contain loops.

ShatteredCastle(s) therefore implements UKC as a versioned graph vocabulary beneath the suite's separate defender workflow:

`Scope -> Discover -> Assess -> Validate -> Impact -> Remediate`

The UKC lens describes attacker paths. The six-stage fabric describes how ShatteredCastle(s) governs research and defense work. They are intentionally not the same model.

## Source-derived requirements

1. **Tactical abstraction.** The thesis distinguishes operational techniques, tactical phases, and strategic objectives, and develops UKC primarily at the tactical level (pp. 11-12).
2. **Ordered arrangement, not mandatory sequence.** ATT&CK tactics become kill-chain phases when placed in attack-specific temporal context, but case studies falsify a deterministic mandatory sequence (pp. 24-25, 68, 81).
3. **Branches and loops.** Each viable branch of an attack tree may form an attack-specific chain; phases may repeat in loops (pp. 35, 77).
4. **Pivoting is a choke point.** Pivoting is distinct from C2, Discovery, and Lateral Movement and exposes bottlenecks created by segmentation (pp. 45-46).
5. **Prefer tactical specificity.** When overlapping labels apply, the thesis uses the most specific phase description rather than repeating generic phases (pp. 34-35).
6. **Objectives are socio-technical.** Collection, Exfiltration, and Target Manipulation describe technical action on objectives; Objectives represents the socio-technical goal (pp. 63-64, 87).
7. **Defense is layered.** Because phases may be bypassed, defensive strategy should emphasize vital or frequent phases, choke points, assume breach, and defense in depth rather than only the earliest phase (pp. 79-80).

## Final Pols 2017 phase vocabulary

1. Reconnaissance
2. Weaponization
3. Delivery
4. Social Engineering
5. Exploitation
6. Persistence
7. Defense Evasion
8. Command & Control
9. Pivoting
10. Discovery
11. Privilege Escalation
12. Execution
13. Credential Access
14. Lateral Movement
15. Collection
16. Exfiltration
17. Target Manipulation
18. Objectives

Canonical source: Appendix A, Table 28, p. 87.

## Implementation interpretation

These choices are ShatteredCastle(s) implementation decisions, not claims made verbatim by the thesis:

- The model contract is `shatteredcastles.ukc.model.v1`.
- `canonical_order` is a reference order and every phase has `mandatory:false`.
- Pivot events are emitted as explicit `pivot_chokepoints`.
- Repeated phases and backtracking transitions are reported without invalidating a path.
- Coverage distinguishes *unobserved* from *negative*. Missing phase evidence never means the phase did not occur.
- Automatic free-text-to-UKC classification is disabled. Upstream mappings must supply explicit phase labels and evidence provenance.
- Current MITRE ATT&CK mappings are not bundled into the Pols 2017 model. Any modern ATT&CK adapter must be separately versioned and must not silently alter UKC semantics.
- An explicit specificity resolver only suppresses known generic overlaps when multiple UKC labels have already been supplied. It does not infer tactics from prose.

## Machine interfaces

- `GET /api/v1/ukc` -> versioned UKC model
- `POST /api/v1/ukc {action: analyze_path}` -> branch/loop/chokepoint-aware path analysis
- `POST /api/v1/ukc {action: coverage}` -> observation/control coverage matrix
- `POST /api/v1/ukc {action: compare_paths}` -> tactical convergence/divergence
- `tools/ukc-engine.mjs` -> offline equivalent

## Claim boundary

UKC classification organizes evidence. It does not by itself establish exploitability, actor attribution, severity, authorization, or business impact. Those remain responsibilities of the ShatteredCastle(s) Scope, Validate, and Impact stages.
