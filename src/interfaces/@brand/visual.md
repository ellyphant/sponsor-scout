---
name: Visual Direction
description: A warm-carbon sponsorship instrument with live evidence and deliberate human approval.
---

# Visual Direction

Sponsor Scout is an instrument, not a generic dark dashboard. Its warm-carbon control room combines monospace data, timestamped activity, fine rules and amber signals. The result should feel precise and alive without simulating a hacker terminal or inventing activity to fill space.

The palette is warm rather than blue-gray: dark carbon, off-white text, amber action, a cool green positive note and red failure. The one light area is the email itself. It is a flat, readable letter inside a dark instrument, never a parchment or editorial-page motif.

## Logo and mark

The targeting reticle represents reconnaissance and selecting a useful opportunity. Use the real image mark in navigation and the image lockup at the welcome. The center can pulse while Astra is actually working, then settle when idle.

![Sponsor Scout horizontal logo with a targeting reticle and Bone SPONSOR lettering beside amber SCOUT lettering](https://i.mscdn.ai/o/BqBHIShPM59EtKMh/images/af0e0ca6-4a0e-49ec-acd3-61f8c24909c2_1788894828015.png)

![Sponsor Scout amber targeting-reticle app mark on a dark carbon field](https://i.mscdn.ai/o/BqBHIShPM59EtKMh/images/af0e0ca6-4a0e-49ec-acd3-61f8c24909c2_1788894828901.png)

~~~
The designer also placed copies at dist/interfaces/web/public/logo-lockup.png and dist/interfaces/web/public/app-icon.png. Treat those as temporary local assets, not source binaries to commit. Use the hosted URLs above, request sensible image sizes where supported, and reserve explicit dimensions. Do not rebuild the logo as a plain text wordmark or hardcode root-absolute /logo-lockup.png paths. Brand asset metadata may later use the designer's final hosted app icon and share image.
~~~

## Spatial system

The app has a compact, [fixed navigation rail]{68px on desktop. Reticle above Run/Queue/Sponsors/Events; profile at the bottom. Icon stroke-width 1.5, currentColor, with short labels/tooltips. Active item amber, queue count Phosphor. No extra top navigation or breadcrumbs.} beside a fluid content area. Dense rows and fine dividers create hierarchy without boxing every fact into a card.

The carbon background carries a nearly invisible [geometric grid]{One fixed CSS gradient layer, 44px spacing, rgba(255,255,255,.02). No DOM grid nodes, grain or CRT scanlines.}. Readout and action bars stay pinned. Data lists, activity, and the case/letter panes scroll within the viewport.

~~~
Spacing scale 4/8/12/16/24/32/48/64. Designer's density accents: log/table row vertical padding 9px (cited finding rows may use 10px); panel padding 16–18px. Typical app page inset 24px desktop, 16px mobile. Buttons/chips radius 6–8px; panels 12–14px; pills 20px. Main panel shadow 0 24px 60px rgba(0,0,0,.55). Borders 1px solid Ember Line. Subtle readout gradient #14120C -> #100E08 is permitted, never saturated AI gradients.

Wireframe-specific dimensions are reference sizes, not fixed viewport assumptions: readout 520px; activity 544px; case 560px; confirmation 420px; preflight 500px; sign-in composition 420px. Build fluid layouts, retaining padding, hierarchy and ratios rather than clipping to these sizes.
~~~

## Live run: activity and findings

The run is the focal screen. A pinned readout leads into a wider activity pane and a compact This run list. Every visible action happened; every qualification finding has sources. A run with a few useful results should look intentional, not padded with vanity metrics.

![Run Status Readout](src/.wireframes/run-status-header.html)

The readout uses actual Researched, Qualified, Matched, and Drafts counts, scoped to the run. Scope distinguishes new companies from the maintained list. All counters and time values stay aligned; sampled numbers in the reference are not actual app state.

![Live Run — Activity & Findings](src/.wireframes/live-run-stream.html)

The activity stream has timestamp and node columns on a connecting spine. An action uses amber; a qualification finding uses a positive or negative verdict with a concise explanation and [source chips]{Ash text, source-surface tint, a warm gold external-link glyph, and a real URL. No fabricated live sources or citations that only decorate the page.}. A match quotes the host's actual ask. It never displays raw model thinking or interior monologue.

The compact result list identifies sponsors as they finish and links their draft into Queue. It is not a column of partially assembled cards. On mobile it yields to the stream and the results remain available through Queue.

~~~
Desktop Run ratio approximately 62/38. Activity row grid: 56px timestamp, 20px node/spine, minmax(0,1fr) content. Nodes 8px diameter with 1.5px stroke. Spine is a neutral one-pixel rule, not a colored border accent. Header overline 11px/.20em; activity body 13px/1.5; explanation 12.5px/1.55. Citation chips 10px, .02em tracking, 3px 7px padding, 5px radius, 6px gap; see color tokens. LIVE dot 9px, optional static Phosphor glow and 1.6s opacity/scale pulse (1 to .35 opacity, 1 to .75 scale).

Rows can enter by translateY(6px) to zero plus opacity over 400ms. Stagger a batch lightly; do not replay a long synthetic sequence when opening live state. Prefer settled complete findings over fake token-by-token assembly.
~~~

### Streaming craft

Live public text can feel responsive without forcing a mechanical typewriter. The display follows the model's actual available output, and stable space prevents jumpy content.

~~~
- Drain buffered public text with requestAnimationFrame: reveal about 18% of remaining buffer per frame with a 3-character floor. Do not manufacture text while waiting.
- Buffer structured findings, scores, citations and matches until complete, then reveal the entire unit. No naked partial decimals or source links popping in after a verdict.
- Caret 8×15px, inline, vertical-align -2px with 3px left gap. Solid during reveal, blink only after approximately 400ms without additional text, fade on completion. Narrow mobile variant 7×13px.
- Reserve caret width and stable row identity. Tool starts resolve in the same row. Known provider operations may show a labelled working state without per-query details.
- Auto-follow the stream until the user scrolls up; keep their position and offer Jump to latest. Growth is downwards inside a scroll pane, not a changing page height.
- Counter animation uses real targets and tabular numbers. Reduced motion shows the final state immediately.
- Static screenshots cannot capture mid-stream behavior. Use the browser flow or code reasoning to verify live transitions, not repeated screenshot attempts at transient frames.
~~~

## Approval: the case and the letter

A review packet shows a company's case on one side and the email on the other. Dark mono evidence frames a flat light Switzer letter. The visual difference clarifies the boundary between a machine's proposal and a message to a person.

![Approval — Case + Draft](src/.wireframes/approval-email-card.html)

Show qualification factors and citations, accepted event matches, the verbatim asks, researched contact evidence, and the exact envelope. [No funding meter]{CoHost supplies only free-text sponsorshipNeed. Do not show funding secured, budget gaps, numeric asks inferred by the model, or invented progress percentages. If a real host wrote an amount in the ask, it can appear as part of the quote.} or unsupported budget chip appears.

The primary action is Review recipient, not one-tap dispatch. Edit draft and Reject remain visible. A required confirmation checkbox enables the final send action.

![Confirm Recipient Gate](src/.wireframes/confirm-recipient.html)

~~~
Case header: 16px semibold sponsor name; 11px metadata; qualification pill 11px with 20px radius, 5px 11px padding, positive full tint. Sections use 14px 18px padding and neutral full-width separators. Contact field has deep well, full border, 8px radius, 11px 12px padding. Envelope labels 10px/.14em, fixed label area about 64px; real addresses wrap.

Email preview: flat light surface, 10px radius, 16px 18px padding, 14px 18px inset within reference card. Switzer subject 15px/600/1.3; body 13.5px/1.62. Action gap 10px, button padding 11px 14px, radius 8px. Primary amber with static 0 0 22px rgba(255,176,32,.28) glow; neutral edit; outlined/tinted Flare rejection, not a one-sided accent.

Two-pane approval above 900px; stacked/full-height sheet below. Confirmation is centered desktop and bottom sheet mobile; 220ms ease-out, ~55% backdrop dim, static 4px blur. Disabled Dispatch opacity .32. Optional mobile drag dismiss beyond 40% height, always with a labelled Cancel alternative. Successful accepted dispatch or sample simulation can exit with slide/fade over 260ms, but use different truthful toasts and distinct statuses. Never claim Sample sent. Test delivery leaves the live packet pending.
~~~

## First-use and sign-in

The branded sign-in and preflight are part of the console, not generic forms. Show real connection states and missing prerequisites without inventing green checks. Research may proceed when email setup is incomplete; sending cannot.

![First-Use Preflight](src/.wireframes/preflight-setup.html)

![Operator Sign-In](src/.wireframes/operator-login.html)

~~~
Sign-in reference padding 42px 40px 34px, 18px outer radius, carbon field, restrained top amber glow; reduce padding on mobile. Email/code states crossfade 200ms in the same reserved region. Code boxes 46×56px, 9px gaps/radius, numeric content 22px; active amber ring. Error tint Flare, optional ±4px shake over 300ms, three cycles; success Phosphor. Provide reduced-motion variants. Do not copy illustrative email or code values, or the wireframe's unverified expiration duration.

Preflight is a grouped status list, 9px indicator dots, 15px vertical row padding, clearly labelled configuration actions. Disabled start uses .5 opacity only when scouting prerequisites actually fail. Email readiness is independent. Values and statuses come from real checks, not static visual examples.
~~~

## Lists and mobile

Sponsors and events use dense open-divider rows, aligned numbers and clear hover/focus treatment. The inspector slides in from the side and retains list position. Unknown facts use a clear label rather than invented values.

![Mobile — Run View](src/.wireframes/mobile-run.html)

~~~
Row hover is Slate. Drawers animate over 240ms, with tap-outside/Escape and focus return. Mobile uses a fixed bottom bar for Run/Queue/Sponsors/Events, two-by-two metrics, condensed list rows and full-height inspectors. Support 360px and up; no desktop-width bottom bar. Respect dvh, safe areas and on-screen keyboards. Minimum usable action target 44px. Typography and layout remain legible rather than scaling the desktop down.

Use only opacity/transform for animated glow-associated elements; never animate blur/filter/shadow spread. Glow itself is static. Apply reduced-motion paths to every entrance, exit, caret, pulse, counter and auth transition. Always full subtle backgrounds for status, never a colored subset of borders on a rounded card. Error states, modals, toasts and loading skeletons use this same system.
~~~
