# Pyramid of Pain Audit for ShatteredCastle(s)

## Source

Primary sources: David J. Bianco, **The Pyramid of Pain** (March 1, 2013; revised January 17, 2014) and **What Do You Get When You Cross a Pyramid With A Chain?** (March 7, 2013).

ShatteredCastle(s) implements the Pyramid as a **defender detection-planning and relative adversary-change-burden lens** beside UKC progression and Diamond relationships. It is not a vulnerability-severity model, attribution engine, maliciousness classifier, authorization mechanism, or quantitative economic model.

## Source invariants retained

1. The revised Pyramid contains seven indicator categories: Hash Values, IP Addresses, Domain Names, Network Artifacts, Host Artifacts, Tools, and Tactics/Techniques/Procedures.
2. Network Artifacts and Host Artifacts occupy the same relative pain tier, producing six ordinal tiers across seven categories.
3. Higher tiers represent greater relative adversary effort to replace or change the denied indicator class.
4. The ranking is qualitative and ordinal. ShatteredCastle(s) does not convert tiers into dollars, time estimates, probabilities, severity, or impact.
5. Hash Values were added in Bianco's January 2014 revision as the bottom layer.
6. Indicator purpose matters. Detection, attribution, prediction, and profiling are distinct analytic purposes and are not silently conflated.
7. Pyramid is complementary to a kill-chain model. It can prioritize detection indicators within explicit attack phases without replacing the attack progression model.
8. Missing indicator categories or phases are unknown, not proof of absence.
9. Indicator type is explicit. A string that looks like an IP, domain, hash, tool name, or behavior is never auto-classified by v1.
10. A higher Pyramid tier does not establish that an indicator is malicious, actor-specific, causal, unique, or operationally usable.

## ShatteredCastle(s) contracts

- `shatteredcastles.pyramid.model.v1`
- `shatteredcastles.pyramid.indicator.v1`
- `shatteredcastles.pyramid.portfolio.v1`
- `shatteredcastles.pyramid.ukc-plan.v1`
- `shatteredcastles.pyramid.diamond-overlay.v1`

## Operations

The public Pyramid API supports:

- `model`
- `normalize_indicator`
- `portfolio`
- `ukc_plan`
- `diamond_overlay`

All operations are deterministic and zero-target-network. The model does not expand scope, assert authorization, probe a target, or generate vulnerability claims.

## UKC composition

UKC answers **where explicitly supplied activity sits in tactical progression**. Pyramid answers **how resistant an explicitly typed detection indicator is to adversary replacement, in relative ordinal terms**. The UKC-Pyramid plan binds indicators to phases only when the caller supplies those phase references. No indicator text is converted into an attack phase automatically.

## Diamond composition

Diamond answers **which adversary/capability/infrastructure/victim relationships are represented in an intrusion event**. Pyramid indicators may be explicitly bound to Diamond event IDs, with an optional explicit Diamond feature label. The overlay never infers a Diamond vertex from indicator type and never changes Diamond confidence.

## Deliberate v1 limits

- No automatic indicator-type classification.
- No automatic maliciousness or attribution inference.
- No numeric adversary-cost or defender-cost score.
- No tier-driven vulnerability severity or impact adjustment.
- No automatic UKC phase mapping.
- No automatic Diamond vertex or event mapping.
- No target-network action in the Pyramid API.
