---
name: Colors
type: design/color
description: Warm carbon, amber signal, and disciplined positive and negative states.
---

# Colors

A dark, warm control room rather than cool slate or a cream editorial surface. Amber identifies active work and primary actions; green identifies a positive result; red identifies a failure or destructive action. Color is functional, never a decoration applied to every panel.

```colors
Carbon:
  value: "#0B0A07"
  description: Warm near-black app background and the field around the instrument.
Bone:
  value: "#ECE5D6"
  description: Warm off-white primary text and foreground details.
Astra Amber:
  value: "#FFB020"
  description: The agent, active work, primary controls and the targeting reticle.
Phosphor:
  value: "#57E39A"
  description: Positive qualification, ready states and confirmed successful actions.
Flare:
  value: "#FF5D4A"
  description: Failures, rejected drafts and destructive controls.
```

## Surface and state derivations

The supporting warm neutrals come from the same designer-defined ramp. The light email surface is an intentional figure-ground change: a letter inside the instrument, not a separate brand or a parchment effect.

~~~
Define once as semantic tokens; do not scatter raw values in components.

--background / Carbon: #0B0A07
--surface / Graphite: #131108
--surface-raised / Slate: #1B1810
--border / Ember Line: #2B261C
--text / Bone: #ECE5D6
--text-muted / Ash: #948B79
--text-faint: #6E675A (nonessential metadata only; use higher-contrast Ash for readable labels)
--text-soft: #A79E8C
--well: #100E08
--rule: #221E16
--accent / Astra Amber: #FFB020
--amber-bright: #FFC24D
--amber-deep: #C77F12
--positive / Phosphor: #57E39A
--negative / Flare: #FF5D4A
--amber-tint: rgba(255,176,32,.08)
--phosphor-tint: rgba(87,227,154,.10)
--flare-tint: rgba(255,93,74,.10)
--focus-ring: 0 0 0 2px rgba(255,176,32,.5)

Draft-only light surface: #F3F1EC; ink #1B1A16; stronger subject ink #141310; meta #8A8577; rule #E1DDD3. Flat, no texture. Citation chip surface #161309; border #241F16; link glyph #C9A15F. Readout/confirmation may use the subtle same-family surface gradient #14120C -> #100E08; do not introduce a saturated gradient.

All status backgrounds are full subtle tints plus text/glyph. No colored border on only one side of a rounded surface. Amber glow applies only to live/active controls and indicators; never bloom every panel. The positive live dot can use static Phosphor glow. No blue-gray replacement neutrals.
~~~
