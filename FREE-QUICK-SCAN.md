# GlassCastle(s) Outside-In Launch Readiness Quick Scan

**Prospect · Free · One public target · About 5 minutes**

**See what your public launch surface exposes before you ship.**

The Quick Scan is a compact, evidence-first check of one public website or launch surface. It helps you capture what is observable now, compare it with what you expected, and leave with useful follow-up questions.

> **Security Through Visibility.** Start with the evidence.

## What you inspect

- public DNS resolution
- presented TLS certificate
- HTTP response and redirects
- common security-header presence
- public links and assets
- obvious environment mismatches or stale references

## What you keep

A small evidence note for each observation:

```text
Observation:
Evidence source:
Expected:
Observed:
Difference:
Confidence:
Follow-up:
```

## 1. Identify the public target

Record exactly what you are checking:

- Public URL: `____________________________`
- Date/time (UTC): `________________________`
- Expected hostname: `_______________________`

Do not submit credentials, secrets, private admin URLs, or non-public systems.

## 2. DNS

```bash
dig +short example.com A
dig +short example.com AAAA
dig +short example.com CNAME
```

- [ ] Target resolves
- [ ] Result matches the hostname/environment you expected
- [ ] Unexpected or stale records noted

## 3. TLS

```bash
openssl s_client -connect example.com:443 -servername example.com </dev/null 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates
```

- [ ] Certificate is currently valid
- [ ] Subject/SAN covers the intended hostname
- [ ] Issuer and expiration recorded
- [ ] Any hostname or expiration mismatch noted

## 4. HTTP behavior

```bash
curl -sS -I -L https://example.com/
```

- [ ] HTTPS responds successfully
- [ ] Redirect chain is expected
- [ ] Final hostname is expected
- [ ] Server/proxy headers that disclose implementation detail are noted

## 5. Security headers

Look for the presence and suitability of:

- [ ] `Strict-Transport-Security`
- [ ] `Content-Security-Policy`
- [ ] `X-Content-Type-Options`
- [ ] `Referrer-Policy`
- [ ] `Permissions-Policy`
- [ ] framing protection via CSP `frame-ancestors` or `X-Frame-Options`

Absence is evidence, not automatically a vulnerability. Suitability depends on the application.

## 6. Public links and assets

- [ ] Primary navigation links resolve
- [ ] Images/scripts/styles load over HTTPS
- [ ] No obvious mixed-content requests
- [ ] Public API/docs links point to intended environments
- [ ] No accidental staging/dev hostname is visibly linked
- [ ] Broken or unexpected public resources are recorded

## Boundary

**Public, non-destructive observation only.** This is not a penetration test, vulnerability scan, compliance assessment, source-code audit, smart-contract audit, exploit attempt, credentialed review, or security guarantee.

## Choose the next depth

- **Need a reusable self-service artifact?** Outside-In Launch Readiness Mini Kit · **$3**
- **Want GlassCastle(s) to inspect one public target and package the evidence?** Evidence Snapshot · **$50**
- **Need several related public targets examined together?** Surface Survey · **$250**

[Get the $3 Mini Kit](https://buy.stripe.com/7sYcN56vv5I93V3h2Y0VO04) · [Book the $50 Evidence Snapshot](https://buy.stripe.com/eVqaEXf210nP0IR4gc0VO05)

**Evidence before assertion. Unknown != False.**