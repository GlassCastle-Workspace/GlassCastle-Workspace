# GlassCastle(s) Visual System

## Canonical direction

**The interface is the evidence surface.** Public GlassCastle(s) and GlassCastle(s) Mining Co. assets should feel like a live operational topology rather than a static marketing page.

### Foundation

- Typography: **Roboto Mono**
- Void: `#020405`
- Signal green: `#35ff95`
- Boundary violet: `#9a6cff`
- Evidence cyan: `#66d9ff`
- Primary text: `#eaf8f3`
- Muted telemetry: `#8da39c`
- Borders: thin, low-luminance green/violet, never glossy chrome

### Spatial grammar

Use depth to reveal relationships, not to decorate them.

- 3D node fields and relationship lines are preferred hero language.
- Geometry should be inspectable: nodes, links, shells, grids, contours, traces, packets.
- Motion should communicate state or flow.
- Green means signal/observation/healthy path.
- Violet means boundary/control/economic or analytical distinction.
- Cyan may mark evidence in motion or secondary telemetry.
- Panels should resemble instruments, not generic SaaS cards.
- Hover/focus should reveal topology or state rather than merely brighten a button.

### Public GlassCastle(s)

The primary field models the security fabric around a control node:

`REALITY → OBSERVATION → EVIDENCE → INTERPRETATION → DECISION → ACTION`

Representative nodes include `CONTROL`, `OBSERVE`, `EVIDENCE`, `SEC-TP`, `EDGE`, `MODEL`, and `ACTION`.

### GlassCastle(s) Mining Co.

Mining Co. uses the same world with a stronger violet boundary signal. The field models bounded resource authority around `FOREMAN`:

`PROSPECT → ASSAY → CLAIM → EXTRACT → MEASURE`

Representative nodes include `FOREMAN`, `SHAFT-001`, `ASSAY`, `CLAIM`, `EXTRACT`, `YIELD`, and `RESERVE`.

### Interaction doctrine

- Support pointer exploration without making basic reading depend on JavaScript.
- Respect `prefers-reduced-motion`.
- Preserve responsive layouts down to phone widths.
- Keep semantic text and evidence usable if the 3D layer fails to load.
- Avoid scroll-jacking, gratuitous camera movement, and unreadable bloom.

### Anti-patterns

Do not use generic hacker silhouettes, padlocks, code rain, stock SOC imagery, fake terminal noise, neon for neon's sake, or effects that obscure evidence.

## Canonical implementation

The public reference implementation is the Three.js topology field shipped in `site/field.js` and `mining-site/field.js`. New public-facing surfaces should derive from these tokens and interaction principles unless a functional requirement demands otherwise.
