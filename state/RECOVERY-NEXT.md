# Next executable action

When the GlassCastle workstation / Remote Desktop Commander becomes reachable:

1. Run the staged six-app regression gate from the existing local working trees.
2. Deploy the staged ScopeSentinel navigation/Console integration changes for Kork, ShatteredCastle(s), GlassWitness, BlastRadial, Investigation Console, and the public hub/registry.
3. Run `node tools/fabric-conformance.mjs public` or wait for the GitHub `Fabric Conformance` workflow.
4. Require both jobs to pass before clearing `FABRIC-DRIFT.json`.

Do not infer production convergence merely from a successful source commit.
