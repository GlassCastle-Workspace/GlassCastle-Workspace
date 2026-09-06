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
- `glasscastles.scopesentinel.diff.v1`
- `glasscastles.scoped-assessment.v1`
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

The envelope also advertises `authorization_assertion_required: true`. The researcher must explicitly assert current authorization before live execution. Policy compilation and human authorization remain separate facts.

## Operator tooling

### Preflight one intended operation

```bash
node tools/scope-preflight.mjs \
  --program ProgramName \
  --policy policy.txt \
  --scope structured-scope.json \
  --host target.example \
  --action automation
```

Output includes the compiled contract digest, source hashes, holds, the full `ALLOW` / `HOLD` / `BLOCK` decision, and any rate or action constraints.

### Compare two scope contracts

```bash
node tools/scope-diff.mjs before.json after.json
```

The diff keeps four kinds of change separate:

- authority expansion
- authority reduction
- ambiguity / hold changes
- rate-policy changes

A scope diff is evidence about authorization policy drift. It does not authorize execution.

### Inspect a fail-closed execution envelope

```bash
node tools/scope-envelope.mjs \
  --program ProgramName \
  --policy policy.txt \
  --scope structured-scope.json \
  --host target.example \
  --action automation \
  --max-requests 6
```

The returned Shattered bounty envelope must remain `authorized: false` until a separate explicit authorization assertion occurs.

### Perform a scoped Shattered assessment

```bash
node tools/scoped-assess.mjs \
  --program ProgramName \
  --policy policy.txt \
  --scope structured-scope.json \
  --target https://target.example \
  --authorized yes \
  --max-requests 4
```

This path refuses execution unless ScopeSentinel returns `ALLOW`, its generated envelope is structurally fail-closed, and the caller supplies the explicit authorization assertion. It then passes the exact ScopeSentinel host/budget envelope to ShatteredCastle.

CI continuously exercises this handoff against the GlassCastle-owned public hub with a four-request ceiling.

## Deployment and conformance

Canonical deployment identities live in:

`state/FABRIC-DEPLOYMENT-MANIFEST.json`

When the GlassCastle workstation is reachable, run:

```bash
node tools/fabric-deploy-preflight.mjs
```

before any production deployment. It fails if a local `.vercel/project.json` does not match the expected project ID, project name, or team ID.

`Fabric Conformance` CI independently checks source topology, ScopeSentinel drift semantics, live stage-zero API behavior, fail-closed envelopes, the owned Scope-to-Shattered handoff, and the public fabric registry. Production drift remains open as GitHub issue #1 until all required jobs are green.

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
