# Sec-TP v0.6.0rc1 — Evaluator Guide

Sec-TP (Secret Tunnel Protocol) is a research/reference secure capability tunnel from GlassCastle(s). RC1 is available for controlled technical evaluation.

## Get RC1

- Release page: https://glasscastle-sectp.vercel.app
- Wheel: https://glasscastle-sectp.vercel.app/downloads/sectp_hht-0.6.0rc1-py3-none-any.whl
- Source distribution: https://glasscastle-sectp.vercel.app/downloads/sectp_hht-0.6.0rc1.tar.gz

## Verify the bytes

```text
wheel  7d3318907e8644195b5b96c50c501e98fd007f95c3320c5ec0fbec0c7507f5ad
sdist  2e7775e1985da0b86e1f6f62415f0d47ff3f0086fe0bbca1fd22f876b312710c
```

The public artifacts were fetched back over HTTPS and matched the canonical Operations release hashes.

## What RC1 includes

- recursive Sec-TP envelopes
- TCP and QUIC carriers
- pinned gateway certificates and Ed25519 client proof
- default-deny capability authorization
- bounded authenticated sessions and rate controls
- tamper-evident audit chaining
- HHT-informed defensive scheduling/telemetry, never cryptographic entropy
- bounded PocketLync integration
- constrained repository inspection and verification capabilities
- modelled security posture and runtime attestation checks

## Quick install

```bash
python -m venv .venv
source .venv/bin/activate
pip install https://glasscastle-sectp.vercel.app/downloads/sectp_hht-0.6.0rc1-py3-none-any.whl
sectp --help
sectp inspect "hello from evaluator"
```

## Send evaluator feedback

Use the dedicated public intake template:

https://github.com/GlassCastle-Workspace/GlassCastle-Workspace/issues/new?template=sectp-evaluation.md

Useful reports include install failures, interoperability issues, security-model concerns, reproducible crashes, operator-workflow friction, and documentation inaccuracies. Include a minimal reproduction when safe, and remove credentials, tokens, private keys, addresses, or other sensitive data.

For a potentially serious security vulnerability, keep the public issue minimal and do not post working exploit details.

## Evaluation boundary

RC1 passed 162 automated tests and Ruff lint before packaging, plus a fresh isolated wheel-install smoke test.

It is **not an audited production VPN**. Pairing grants zero capabilities by itself. HHT never supplies keys, nonces, authentication, or execution authority. Arbitrary remote shell access is intentionally outside the design.
