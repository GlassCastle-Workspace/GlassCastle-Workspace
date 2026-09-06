# GlassCastle operational state

Machine-readable public-source state that should survive chat/session boundaries lives here.

## Current records

- `DML-RELEASE.json` / `DML-ACCEPTANCE.json` / `DML-SHA256SUMS.txt` — Detection Maturity Level integration release, evidence-backed acceptance, and integrity evidence.
- `FABRIC-DRIFT.json` — canonical-vs-production Security Fabric conformance state.
- `PYRAMID-RELEASE.json` / `PYRAMID-ACCEPTANCE.json` / `PYRAMID-SHA256SUMS.txt` — Pyramid of Pain integration release, cross-stage acceptance, and integrity evidence.
- `ATTACK-RELEASE.json` / `ATTACK-ACCEPTANCE.json` / `ATTACK-SHA256SUMS.txt` — MITRE ATT&CK® v19.2 behavior-lens release, cross-stage acceptance, and integrity evidence.
- `D3FEND-RELEASE.json` / `D3FEND-ACCEPTANCE.json` / `D3FEND-SHA256SUMS.txt` — MITRE D3FEND™ 1.6.0 defense-lens release, cross-stage acceptance, and integrity evidence.

A drift record is evidence, not deployment. Clear or supersede it only after the public conformance gate observes the expected production state.
