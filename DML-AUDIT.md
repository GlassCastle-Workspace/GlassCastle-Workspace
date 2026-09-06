# Detection Maturity Level Audit for ShatteredCastle(s)

## Source

Primary source: Ryan Stillions, **The DML Model**, April 21, 2014. ShatteredCastle(s) implements the original DML-0 through DML-8 ladder as an evidence-backed detection maturity lens. Supporting literature consistently describes DML as measuring the ability to consume and act upon threat information for detection and response.

Original source: `https://ryanstillions.blogspot.com/2014/04/the-dml-model_21.html`

## Source invariants retained

1. DML has nine original levels numbered 0 through 8.
2. DML-0 is None or Unknown.
3. DML-1 is Atomic Indicators.
4. DML-2 is Host & Network Artifacts.
5. DML-3 is Tools.
6. DML-4 is Procedures.
7. DML-5 is Techniques.
8. DML-6 is Tactics.
9. DML-7 is Strategy.
10. DML-8 is Goals.
11. Higher DML levels are more semantically abstract, not numerically more severe.
12. DML concerns detection maturity, not prevention.
13. Maturity is about applying threat information to detection/response, not merely possessing intelligence.
14. The later DML-9 Identity extension is not part of the original Stillions model and is excluded from ShatteredCastle DML v1.

## ShatteredCastle evidence rule

A caller must explicitly assign a DML level to a detection record. ShatteredCastle never derives a DML level from free text, an ATT&CK label, a Pyramid category, scanner output, or topology.

`demonstrated=true` additionally requires validated/deployed status, explicit consume capability with evidence, detection evidence, and explicit action capability with evidence.

## Assessment semantics

Assessments report the highest present and highest demonstrated DML level **within the supplied scope**. They are not cumulative and do not infer lower-level coverage from a higher-level analytic. An analytic-scoped DML-8 record is not an organization-wide DML-8 certification.

## Semantic bridges

- ATT&CK technique → candidate DML-5.
- ATT&CK tactic → candidate DML-6.
- Pyramid atomic indicators → candidate DML-1.
- Pyramid host/network artifacts → candidate DML-2.
- Pyramid tools → candidate DML-3.
- Pyramid TTP → ambiguous candidate DML-4/5/6 until explicit evidence distinguishes procedure, technique, or tactic.

These are semantic correspondences only. They do not prove a detection exists or that a maturity level is demonstrated.

## Deliberate v1 limits

- No automatic DML assignment.
- No DML-9 Identity / automatic attribution.
- No prevention claim.
- No weighted maturity score.
- No assumption that higher level implies lower-level coverage.
- No organization-wide maturity claim unless explicitly scoped to the organization.
- No DML-driven authorization, severity, proof-threshold, impact-score, or remediation-priority changes.
