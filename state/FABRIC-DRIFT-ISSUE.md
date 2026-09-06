# Production Fabric Drift: ScopeSentinel missing from live registry

Canonical source is six-stage:

`scope → discover → assess → validate → impact → remediate`

GitHub Actions run `34028761110` observed production as:

`discover → assess → validate → impact → remediate`

## Evidence

- source-contract job: PASS
- public-contract job: FAIL
- failure: `workflow mismatch: ["discover","assess","validate","impact","remediate"] != ["scope","discover","assess","validate","impact","remediate"]`
- ScopeSentinel service itself was already deployed and smoke-verified separately.

## Exit criteria

1. Deploy canonical GlassCastle workspace to production.
2. Deploy staged Scope navigation and Console contract integration from the workstation.
3. Re-run Fabric Conformance.
4. Both source and public jobs must pass.

Do not close on source changes alone.
