# GlassCastle operational state

Machine-readable public-source state that should survive chat/session boundaries lives here.

## Current records

- `FABRIC-DRIFT.json` — canonical-vs-production Security Fabric conformance state.
- `PYRAMID-RELEASE.json` / `PYRAMID-ACCEPTANCE.json` / `PYRAMID-SHA256SUMS.txt` — Pyramid of Pain integration release, cross-stage acceptance, and integrity evidence.
- `ATTACK-RELEASE.json` / `ATTACK-ACCEPTANCE.json` / `ATTACK-SHA256SUMS.txt` — MITRE ATT&CK® v19.2 behavior-lens release, cross-stage acceptance, and integrity evidence.

A drift record is evidence, not deployment. Clear or supersede it only after the public conformance gate observes the expected production state.
