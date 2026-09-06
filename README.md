# GlassCastle(s)

## Security Through Visibility

**[glasscastles.vercel.app](https://glasscastles.vercel.app/) · [Security policy](SECURITY.md) · [Sec-TP RC1](https://glasscastle-sectp.vercel.app/)**

**GlassCastle(s) makes complex systems visible enough to inspect, understand, and improve.**

We build evidence-first security, connectivity, and analytical systems for people who need to know what their environments are actually doing. Our work emphasizes observable relationships, provenance, uncertainty, explicit boundaries, and operational state instead of opaque conclusions.

> **Evidence before assertion. Visibility before assumption.**

## ShatteredCastle(s) Security Fabric

**ShatteredCastle(s)** is the umbrella name for the GlassCastle(s) security tool and SaaS suite.

**Scope → Discover → Assess → Validate → Impact → Remediate**

- **ScopeSentinel · Scope** — https://scopesentinel-saas.vercel.app/  
  Compile program prose, structured scope, exclusions, rate limits, asset-identity mismatches, and unresolved ambiguities into a fail-closed execution contract.
- **Kork · Discover** — https://kork-saas.vercel.app/  
  Pin artifacts, map relationships, preserve provenance, and build an inspectable investigation topology.
- **ShatterAssay · Assess** — https://glasscastle-launchguard.vercel.app/
  Perform bounded outside-in assessment and static research while enforcing the current scope envelope.
- **GlassWitness · Validate** — https://glasswitness-saas.vercel.app/  
  Turn controlled baselines, independent confirmations, negative controls, and evidence hashes into deterministic validation receipts.
- **BlastRadial · Impact** — https://blastradial-saas.vercel.app/  
  Model downstream propagation and identify relationship paths carrying the greatest consequence.
- **Investigation Console · Remediate** — https://glasscastle-investigation-console.vercel.app/  
  Bring scope, evidence, findings, validation, impact, claims, and remediation into one local-first investigation surface.

The fabric is intentionally fail-closed: **unknown policy does not become permission, scanner output does not become proof, and proof does not silently rewrite impact.**

### Unified Kill Chain attack-model lens

ShatteredCastle(s) also exposes the final 2017 Unified Kill Chain developed by Paul Pols as a separate tactical attack-path model. The UKC does **not** replace the six-stage defender workflow. It describes attacker paths using 18 tactical phases and explicitly permits bypassed, repeated, branched, and out-of-order phase occurrence. Pivoting is modeled as a choke point.

- Public model/API: `https://glasscastles.vercel.app/api/v1/ukc`
- Offline utility: `node tools/ukc-engine.mjs model`
- Model audit: [UKC-AUDIT.md](UKC-AUDIT.md)

The UKC implementation is versioned as `Pols-2017-final`. Current MITRE ATT&CK mappings are intentionally not silently merged into this historical model.

### Diamond Model intrusion-relationship lens

ShatteredCastle(s) also implements the original 2013 Diamond Model of Intrusion Analysis by Sergio Caltagirone, Andrew Pendergast, and Christopher Betz. Diamond complements UKC rather than replacing it: UKC models explicit tactical progression while Diamond models the relationships among **Adversary, Infrastructure, Capability, and Victim** within evidence-bearing intrusion events.

- Public model/API: `https://glasscastles.vercel.app/api/v1/diamond`
- Offline utility: `node tools/diamond-engine.mjs model`
- Model audit: [DIAMOND-AUDIT.md](DIAMOND-AUDIT.md)

Unknown Diamond features remain knowledge gaps, per-feature confidence is preserved as supplied, Phase may explicitly reference UKC, and v1 does not auto-attribute, auto-cluster Activity Groups, infer causality, or alter impact scores.

### Pyramid of Pain adversary-cost lens

ShatteredCastle(s) implements David J. Bianco's revised Pyramid of Pain as a third orthogonal lens. It ranks explicitly supplied detection-indicator categories by **relative adversary replacement burden**, from hashes through TTPs. The rank is ordinal only: it is not a severity score, dollar estimate, attribution signal, or permission to act.

- Public model/API: `https://glasscastles.vercel.app/api/v1/pyramid`
- Offline utility: `node tools/pyramid-engine.mjs model`
- Model audit: [PYRAMID-AUDIT.md](PYRAMID-AUDIT.md)

The composition follows Bianco's own kill-chain guidance: indicators can be explicitly bound to UKC phases to build a detection plan, while explicit Pyramid-to-Diamond bindings preserve event context. ShatteredCastle(s) never guesses an indicator type from its value and never converts a Pyramid tier into a numeric adversary-cost claim.

### MITRE ATT&CK® adversary-behavior lens

ShatteredCastle(s) integrates **MITRE ATT&CK® v19.2** as a separate behavior taxonomy. ATT&CK tactics represent adversary goals, techniques represent how those goals are pursued, and sub-techniques provide lower-level behavior descriptions. The local compact catalog covers Enterprise, Mobile, and ICS while preserving exact ATT&CK identifiers, tactic membership, platforms, parent relationships, object versions, modification times, and source hashes.

- Public model/API: `https://glasscastles.vercel.app/api/v1/attack`
- Offline utility: `node tools/attack-engine.mjs model`
- Model audit: [ATTACK-AUDIT.md](ATTACK-AUDIT.md)

ATT&CK selectors are exact-only. ShatteredCastle(s) does not classify free text, scanner findings, topology labels, or telemetry into ATT&CK techniques automatically. Cross-model bindings to UKC, Diamond, and Pyramid are explicit-only; ATT&CK context does not change authorization, proof thresholds, severity, or BlastRadial impact scores.

© 2026 The MITRE Corporation. This work is reproduced and distributed with the permission of The MITRE Corporation. MITRE does not endorse GlassCastle(s) or ShatteredCastle(s). See the MITRE ATT&CK Terms of Use for license details.

## Public front doors

- **GlassCastle(s)** — https://glasscastles.vercel.app/
- **GlassCastle(s) Mining Co.** — https://glasscastles-mining.vercel.app/
- **ScopeSentinel · Scope** — https://scopesentinel-saas.vercel.app/
- **Kork · Discover** — https://kork-saas.vercel.app/
- **ShatterAssay · Assess** — https://glasscastle-launchguard.vercel.app/
- **GlassWitness · Validate** — https://glasswitness-saas.vercel.app/
- **BlastRadial · Impact** — https://blastradial-saas.vercel.app/
- **Investigation Console · Remediate** — https://glasscastle-investigation-console.vercel.app/
- **Sec-TP RC1 · Secure capability transport** — https://glasscastle-sectp.vercel.app/
- **Web3 Launch Readiness · Bounded evidence service** — https://web3-launch-readiness.vercel.app/

The public visual system uses **Roboto Mono**, void-black surfaces, emerald signal (`#35ff95`), violet boundary (`#9a6cff`), and evidence-first hierarchy across the live product family.

## Buy something useful

The shortest path from curiosity to a real GlassCastle artifact:

- **$3 Outside-In Launch Readiness Mini Kit** — a repeatable self-service workflow plus machine-readable evidence template. [Buy with Stripe](https://buy.stripe.com/7sYcN56vv5I93V3h2Y0VO04) · [Ko-fi](https://ko-fi.com/s/ed21feb147)
- **$25 Real-Device APK Smoke Test** — one bounded test pass on GlassCastle-owned physical Android hardware. You provide the APK URL and what you want tested; fulfillment begins when a compatible reviewed Android node is online. [Book the smoke test](https://buy.stripe.com/5kQaEX7zzgmN8bjbIE0VO08)
- **$50 Web3 Launch Readiness Evidence Snapshot** — one bounded public launch surface reviewed and packaged by GlassCastle(s). [Book the Snapshot](https://buy.stripe.com/eVqaEXf210nP0IR4gc0VO05) · [View the offer](https://web3-launch-readiness.vercel.app/)

For larger work: **$250 Surface Survey** · [Book](https://book.stripe.com/8x25kD5rr3A1dvDaEA0VO06) | **$750 Evidence Expedition** · [Book](https://book.stripe.com/5kQfZhbPP2vXajr8ws0VO07)

[Compare the evidence ladder](OFFER-LADDER.md)

### What we build

- **Security visibility** — bounded observations, evidence packaging, relationship maps, and investigation workflows
- **Secure connectivity** — capability-scoped tunnels, routing, translation, and protocol boundaries
- **Edge + device systems** — endpoint runtimes, orchestration, field nodes, and human/device interfaces
- **Analytical systems** — search, discovery, representation, provenance, and relationship-centric security analytics
- **Technical services** — clearly scoped assessments and evidence-driven reviews with limitations stated up front

### Evidence ladder

**Prospect → Ore → Assay → Survey → Expedition**

Each step increases evidence depth without silently expanding authority.

- **Prospect · Free — Outside-In Launch Readiness Quick Scan** — inspect one public surface yourself in about five minutes. [Run the Quick Scan](FREE-QUICK-SCAN.md)
- **Ore · $3 — Outside-In Launch Readiness Mini Kit** — repeatable self-service workflow with a machine-readable evidence template. [Get the Mini Kit](https://buy.stripe.com/7sYcN56vv5I93V3h2Y0VO04) · [Ko-fi](https://ko-fi.com/s/ed21feb147)
- **Assay · $50 — Web3 Launch Readiness Evidence Snapshot** — one bounded public launch surface reviewed and packaged by GlassCastle(s). [Book the Snapshot](https://buy.stripe.com/eVqaEXf210nP0IR4gc0VO05) · [View the offer](https://web3-launch-readiness.vercel.app/)
- **Survey · $250 — GlassCastle Surface Survey** — up to five related public targets examined together with a compact evidence map. [Review scope](SURFACE-SURVEY.md) · [Book with Stripe](https://book.stripe.com/8x25kD5rr3A1dvDaEA0VO06)
- **Expedition · $750 — GlassCastle Evidence Expedition** — one bounded investigation objective across multiple public evidence sources. [Review scope](EVIDENCE-EXPEDITION.md) · [Book with Stripe](https://book.stripe.com/5kQfZhbPP2vXajr8ws0VO07)

### Technical evaluation

- **Sec-TP v0.6.0rc1** — research/reference secure capability tunnel with TCP/QUIC carriers, pinned identity, default-deny authorization, bounded sessions, tamper-evident audit chaining, and HHT-informed defensive telemetry. RC1 passed 162 automated tests before packaging. It is not an audited production VPN. [Evaluate Sec-TP RC1](SECTP-RC1.md) · [Download release](https://glasscastle-sectp.vercel.app/)

Publication is exposure, not demand. GlassCastle(s) reports revenue only when a payment provider verifies a completed payment.

### How we work

A GlassCastle result should make five things visible:

**Observation → Evidence → Meaning → Boundary → Next useful action**

We say when something is experimental. We distinguish hypotheses from measurements. We do not present estimates as realized value, and we do not hide uncertainty because it makes a slide look cleaner.

### Current architecture

- **GlassCastle Fabric** — secure connectivity, translation, routing, and protocol normalization
- **GlassCastle Edge** — endpoint runtimes, device orchestration, and human/device boundaries
- **GlassCastle Intelligence** — search, discovery, representation, and security analytics
- **GlassCastle Economy** — external value, revenue experiments, and economic truth
- **GlassCastle Control Plane** — governance, evidence, reconciliation, and execution boundaries

### Operating principles

`Evidence before assertion.`  
`Latest != canonical.`  
`Unknown != False.`  
`Security Through Visibility.`
