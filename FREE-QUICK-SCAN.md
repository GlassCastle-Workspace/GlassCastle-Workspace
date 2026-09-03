# GlassCastle(s) Outside-In Launch Readiness Quick Scan

**Tier 0 · Prospect · Free**

A five-minute, evidence-first check of a public website or launch surface. This is not a penetration test, compliance assessment, vulnerability scan, or security guarantee. It is a compact way to capture what is publicly observable before launch.

## 1. Identify the public target

Record exactly what you are checking:

- Public URL: `____________________________`
- Date/time (UTC): `________________________`
- Expected hostname: `_______________________`

Do not submit credentials, secrets, private admin URLs, or non-public systems.

## 2. DNS

Record the public resolution you can actually observe.

```bash
dig +short example.com A
dig +short example.com AAAA
dig +short example.com CNAME
```

Evidence notes:

- [ ] Target resolves
- [ ] Result matches the hostname/environment you expected
- [ ] Unexpected or stale records noted

## 3. TLS

Inspect the certificate presented by the public HTTPS service.

```bash
openssl s_client -connect example.com:443 -servername example.com </dev/null 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates
```

Evidence notes:

- [ ] Certificate is currently valid
- [ ] Subject/SAN covers the intended hostname
- [ ] Issuer and expiration recorded
- [ ] Any hostname or expiration mismatch noted

## 4. HTTP behavior

Capture the public response path and headers.

```bash
curl -sS -I -L https://example.com/
```

Evidence notes:

- [ ] HTTPS responds successfully
- [ ] Redirect chain is expected
- [ ] Final hostname is expected
- [ ] Server/proxy headers that disclose implementation detail are noted

## 5. Security headers

From the final HTTP response, look for the presence and suitability of:

- [ ] `Strict-Transport-Security`
- [ ] `Content-Security-Policy`
- [ ] `X-Content-Type-Options`
- [ ] `Referrer-Policy`
- [ ] `Permissions-Policy`
- [ ] framing protection via CSP `frame-ancestors` or `X-Frame-Options`

Absence is evidence, not automatically a vulnerability. Whether a header is appropriate depends on the application.

## 6. Public links and assets

Open the site normally and inspect only public resources.

- [ ] Primary navigation links resolve
- [ ] Images/scripts/styles load over HTTPS
- [ ] No obvious mixed-content requests
- [ ] Public API/docs links point to intended environments
- [ ] No accidental staging/dev hostname is visibly linked
- [ ] Broken or unexpected public resources are recorded

## 7. Make an evidence note

For every observation, record:

```text
Observation:
Evidence source:
Expected:
Observed:
Difference:
Confidence:
Follow-up:
```

GlassCastle(s) doctrine:

> **Evidence before assertion. Unknown is not False.**

## What next?

If this quick scan is enough, keep the notes and ship with better visibility.

If you want a reusable self-service checklist plus a machine-readable evidence template, use the **Outside-In Launch Readiness Mini Kit ($3)**:

https://buy.stripe.com/7sYcN56vv5I93V3h2Y0VO04

If you want GlassCastle(s) to perform a bounded outside-in review and package the evidence for one public target, use the **Web3 Launch Readiness Evidence Snapshot ($50)**. The public target URL is collected during checkout:

https://buy.stripe.com/eVqaEXf210nP0IR4gc0VO05

---

**Scope boundary:** public, non-destructive observation only. No credentialed testing, exploitation, private-system access, source-code audit, smart-contract audit, compliance certification, or security guarantee.