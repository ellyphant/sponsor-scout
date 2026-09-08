---
name: Typography
type: design/typography
description: IBM Plex Mono for the console, Switzer for the human-readable email.
---

# Typography

IBM Plex Mono gives the console its instrument-like precision. It carries navigation, labels, data, timestamps, explanations, buttons and forms. Switzer appears only in the letter's subject and body, where the interface becomes the message a sponsor will read.

```typography
fonts:
  IBM Plex Mono:
    src: https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap
  Switzer:
    src: https://api.fontshare.com/v2/css?f[]=switzer@400,500,600&display=swap

styles:
  Display:
    font: IBM Plex Mono
    size: 60px
    weight: 600
    letterSpacing: -0.01em
    lineHeight: 0.95
    case: uppercase
    description: Front-door display moments and occasional large run numerals.
  Body:
    font: IBM Plex Mono
    size: 13px
    weight: 400
    lineHeight: 1.55
    description: Console text, cited explanations and general data.
```

Hierarchy relies on weight, case, tracking and color. Compact labels frame readable data; a few large numbers create contrast without turning every heading into a billboard. Numeric alignment is essential to the live view.

~~~
Preserve the designer's derived styles:
- Metric: IBM Plex Mono 27px, weight 600, line-height 1.0, tabular-nums. Mobile compact readout 21px.
- SectionLabel: IBM Plex Mono 11px, weight 600, tracking .20em, uppercase. Dense wireframe overlines may use 10px with .18em.
- Body data rows: IBM Plex Mono 13px, weight 500; explanatory text 13px/1.55 weight 400. Long case explanations can use 12.5px/1.6 with sufficient contrast.
- Micro: IBM Plex Mono 11px, weight 400, tracking .03em, tabular-nums on timestamps and IDs.
- Sponsor title: IBM Plex Mono 16px, weight 600.
- Confirm recipient: IBM Plex Mono 19px, weight 600; wrap long addresses.
- Citation chip: IBM Plex Mono 10px, tracking .02em; full source accessible on focus/hover.
- DraftSubject: Switzer 15px, weight 600, line-height 1.3.
- DraftBody: Switzer 13.5px, weight 400, line-height 1.62. Editable mobile letter fields can use 16px for touch legibility.
- Code digit: IBM Plex Mono 22px with tabular-nums.

Every counter, timer, rating, date, aligned capacity and digit box uses font-variant-numeric: tabular-nums. Define font families once with monospace/sans-serif fallbacks; do not replace them with a generic default. Load fonts with display=swap and reserve line heights. Use fluid clamp() for the rare 60px display style on small screens.
~~~
