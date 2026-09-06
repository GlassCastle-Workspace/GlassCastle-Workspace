# ScopeSentinel

ScopeSentinel is the policy and authorization preflight stage for the GlassCastle(s) Security Fabric.

**Scope → Discover → Assess → Validate → Impact → Remediate**

Production: https://scopesentinel-saas.vercel.app/

## Purpose

ScopeSentinel compiles human program rules, structured scope, structured asset instructions, rate limits, exclusions, account restrictions, and observed asset identities into a deterministic fail-closed contract.

It does **not** contact bounty targets. It does **not** assert researcher authorization on behalf of a user. It does **not** turn ambiguous prose into permission.

## Core contracts

- `glasscastles.scopesentinel.contract.v1`
- `glasscastles.scopesentinel.decision.v1`
- `glasscastles.scopesentinel.execution-envelope.v1`
- `glasscastles.scopesentinel.hold.v1`
- `glasscastles.scopesentinel.agent-api.v1`

Machine API:

- `GET /api/v1/capabilities`
- `POST /api/v1/compile`
- `POST /api/v1/decide`
- `POST /api/v1/envelope`
- `POST /api/v1/agent`
- `GET /openapi.json`

## Decision precedence

The compiler follows this order:

1. explicit structured-scope exclusion or asset instruction
2. explicit structured-scope inclusion
3. explicit policy prohibition or permission
4. constrained permission such as a documented request-rate ceiling
5. inferred mention
6. unknown

Unknown and conflicting evidence become `HOLD`, never implicit `ALLOW`.

Decision states:

- `ALLOW` — requested asset/action is supported by explicit current evidence
- `BLOCK` — requested asset/action conflicts with an explicit prohibition or exclusion
- `HOLD` — evidence is absent, contradictory, or policy requires clarification

Holds are scoped where possible to `asset`, `account`, `action`, or `generic`, so an unresolved account-testing ambiguity does not unnecessarily block a passive operation on an otherwise clear asset.

## Downstream execution envelope

ScopeSentinel can derive a ShatteredCastle-compatible execution envelope.

A clear policy decision may produce `scope_state: clear`, but exported envelopes deliberately begin with:

```json
{"authorized": false}
```

The researcher must explicitly assert current authorization before live execution. Policy compilation and human authorization remain separate facts.

## Hyatt acceptance benchmark

ScopeSentinel was validated against the previously captured Hyatt HackerOne policy HTML and a fresh 61-entry structured-scope snapshot.

The compiler independently reproduced these known boundaries:

- `scapegoat.hyatt.com` → `ALLOW`
- `jira.hyattdev.com` → `HOLD` because prose mentions it but structured scope does not
- `newsroom.images.hyatt.com` → `ALLOW`
- `newsroom.hyatt.com` → `BLOCK` from the structured asset instruction saying not to test it
- automation → `ALLOW` with an explicit **100 requests/minute** constraint
- researcher-owned account testing → `HOLD` because owned/permissioned-account language conflicts with designated-target-account restrictions
- Android package observed as `com.Hyatt.hyt` vs structured `com.Hyatt` → `asset_identity_mismatch`
- generated execution envelope → `scope_state: clear`, `authorized: false`

The acceptance artifact on the GlassCastle workstation is:

`ScopeSentinel-SaaS/release/v0.1.0/HYATT-ACCEPTANCE.json`

Recorded SHA-256:

`45e9787a699c8df7948215e59dc22a7cc86daa074e865df18a5913f36f4700e1`

## Doctrine

**Policy should never become permission by accident.**

ScopeSentinel exists to keep scope, policy interpretation, authorization, and execution separate enough that downstream tools cannot silently blur them together.
