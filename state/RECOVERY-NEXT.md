# Next executable action

When the GlassCastle workstation / Remote Desktop Commander becomes reachable:

1. **Do not deploy immediately.** Pull/review the newer canonical GitHub changes made while the workstation was offline.
2. From the canonical workspace, run `node tools/fabric-deploy-preflight.mjs` and require `ok: true`. Every local `.vercel/project.json` must match `state/FABRIC-DEPLOYMENT-MANIFEST.json` by project ID, project name, and team ID.
3. Inspect each affected local working tree and preserve unrelated changes. Reconcile only the staged ScopeSentinel navigation / Console contract changes with canonical source.
4. Run regressions separately per project so a connector timeout cannot hide which stage failed:
   - ScopeSentinel
   - Kork
   - ShatteredCastle(s)
   - GlassWitness
   - BlastRadial
   - Investigation Console
   - public hub / registry source checks
5. Verify browser-first inline scripts parse where relevant.
6. Deploy only after the identity preflight and stage-specific regression for that project are green.
7. Required production destinations are defined in `state/FABRIC-DEPLOYMENT-MANIFEST.json`.
8. After deployment, run public conformance. The required workflow is:
   `scope → discover → assess → validate → impact → remediate`.
9. Require all Fabric Conformance jobs to pass:
   - `source-contract`
   - `scope-contract-tools`
   - `scope-bootstrap`
   - `scope-api-smoke`
   - `scope-to-assess-smoke`
   - `public-contract`
   - `drift-ledger`
10. GitHub issue #1 should auto-close only after all required jobs are green. If it remains open, production convergence is not established.

## Current proven state while workstation is offline

- ScopeSentinel production service: healthy.
- Scope compiler / ALLOW / BLOCK / rate constraints: passing CI.
- Execution envelope: passing CI with `authorized: false` and explicit authorization required.
- Scoped assessment guard:
  - missing authorization assertion → refused;
  - ScopeSentinel `BLOCK` → refused even with explicit authorization;
  - ScopeSentinel `ALLOW` + explicit authorization → bounded Shattered assessment passes on the GlassCastle-owned public hub.
- Canonical source: six-stage.
- Public parent registry: still observed as five-stage, missing `scope`.
- Vercel connector available in this chat cannot inspect the GlassCastle team/project: direct known project lookup returns `403`.

Do not infer production convergence from source commits, ScopeSentinel health, or successful downstream handoff tests. `public-contract` is the final authority for the public fabric topology.
