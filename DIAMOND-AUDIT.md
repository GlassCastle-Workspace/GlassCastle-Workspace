# Diamond Model Audit for ShatteredCastle(s)

## Source

Primary source: **The Diamond Model of Intrusion Analysis**, Sergio Caltagirone, Andrew Pendergast, and Christopher Betz (2013), supplied as `DMIA.pdf`.

ShatteredCastle(s) implements the paper as an **intrusion-relationship analysis model** beside the Unified Kill Chain sequence model. It does not treat Diamond as an attribution engine, scanner taxonomy, or vulnerability-severity framework.

## Source invariants retained

1. The atomic analytic object is an **event**.
2. The four core event features are **Adversary, Infrastructure, Capability, Victim**.
3. The core event graph contains the paper's five fundamental edges, not a complete six-edge clique.
4. Meta-features are **Timestamp, Phase, Result, Direction, Methodology, Resources**.
5. Every supplied feature may carry an independent confidence value; ShatteredCastle(s) does not invent a universal confidence scale.
6. Missing features remain **knowledge gaps** and do not make an event invalid.
7. The extended **Social-Political** feature describes the Adversary-Victim axis; **Technology** describes the Capability-Infrastructure axis.
8. Diamond Phase remains pluggable. When explicitly tagged with the ShatteredCastle(s) UKC model, the phase is resolved through the UKC contract; otherwise it remains a local/custom phase.
9. Analytic pivoting identifies possible connected evidence and hypotheses. Pivot success is never assumed.
10. Activity Threads are caller-supplied causal graphs. Their arcs preserve confidence, AND/OR, hypothesis/actual, and Provides semantics.
11. Activity Groups are analytic-problem-specific. v1 computes weighted feature similarity but leaves membership explicit to avoid silent clustering/attribution and overfitting.
12. Activity-Attack overlays keep observed/hypothesized actual activity distinct from merely possible attack-graph paths.

## ShatteredCastle(s) contracts

- `shatteredcastles.diamond.model.v1`
- `shatteredcastles.diamond.event.v1`
- `shatteredcastles.diamond.pivot.v1`
- `shatteredcastles.diamond.contextual-indicator.v1`
- `shatteredcastles.diamond.thread.v1`
- `shatteredcastles.diamond.group.v1`
- `shatteredcastles.diamond.group-family.v1`
- `shatteredcastles.diamond.activity-attack.v1`

## Operations

The public Diamond API supports:

- `model`
- `normalize_event`
- `pivot`
- `contextualize`
- `thread`
- `group`
- `group_family`
- `activity_attack`

All operations are deterministic and zero-target-network. The model is analytical context only; it does not expand scope, assert authorization, test a target, or generate vulnerability claims.

## UKC composition

Diamond answers **who/what/which infrastructure/which victim and how those features relate**. UKC answers **where explicitly supplied activity sits in a tactical progression**. Diamond's Phase feature can reference explicit UKC phase IDs. Neither model is allowed to infer the other's evidence.

## Deliberate v1 limits

- No automatic adversary attribution.
- No automatic Activity Group clustering or membership.
- No automatic event causality from timestamps.
- No automatic Diamond vertex assignment from IP/domain/file type.
- No automatic impact-score changes from Diamond artifacts.
- No automatic future-path prediction from an Activity-Attack overlay.

These boundaries preserve evidence before assertion and leave implementation-specific confidence, clustering, forecasting, and mitigation optimization for separately validated models.
