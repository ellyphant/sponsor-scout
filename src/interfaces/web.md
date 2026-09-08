---
name: Sponsor Scout Operator Console
description: A responsive terminal-inspired workspace for live research, sponsor evidence, and deliberate outreach approval.
---

# Sponsor Scout Operator Console

A full-screen private workbench for Elly. The console makes Astra's work inspectable: actual research activity, cited qualification, specific event matches, and a letter she can edit. It is an app, not a scrolling marketing page.

The brand is warm carbon, amber signal, and IBM Plex Mono. The drafted email is the sole light surface, set in Switzer. Follow the shared visual, color, typography and voice specs. Wireframes resolve composition, but all names, numbers, addresses, sources and statuses in them are illustrative, [not production facts]{Only actual database/service data appears in the app. Fixture records are flagged Sample; wireframe examples such as funding amounts and sender addresses must not be copied as real values.}.

## Navigation and layout

Desktop has a [fixed icon rail]{68px wide, left. Reticle at top; Run, Queue, Sponsors, Events; profile/settings/sign-out at bottom. Icons stroke 1.5, active currentColor in Astra Amber, queue badge in Phosphor. Tooltips and visible short labels make the destinations intelligible.} and a fluid content region. There is no marketing header or breadcrumb trail. Page headers, run controls and approval actions stay anchored; lists and content panes scroll within the available viewport.

~~~
Routes: `/` Run; `/runs/:runId` a selected saved run; `/queue` with optional draft selection; `/sponsors` with optional inspector selection; `/events` with selected run; `/settings` via profile menu; `/login` for the branded gate. All data routes require auth. Preserve deep-link destination through sign-in. Use router basename `platform.basePath || '/'` and Vite base from MS_ASSET_BASE_URL; no root-hardcoded asset URLs.

Desktop grid: rail 68px, minmax(0, 1fr) content. App height 100dvh with min-height:0 on nested scroll regions. Content spacing follows 4/8/12/16/24/32/48/64. Typical page insets 24px desktop, 16px mobile; gaps 16px. Above 1024px Run uses the designer's wider activity pane and compact THIS RUN companion, approximately 62/38. The companion is a short result list, not stacks of nested cards. At smaller sizes the stream takes the full width.

Below 768px switch rail to a bottom bar. At 900px and below stack the approval case and draft; wide screens show them side by side. Default editor preview remains desktop. Respect safe-area-inset-bottom and keyboard space on phones. Set the required viewport meta to width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no.
~~~

## The front door

The welcome shows the reticle/logo, a short description of the tool, and operator sign-in. This private internal tool may gate at the root, but the screen feels like a welcome, not a permission error.

![Operator Sign-In](src/.wireframes/operator-login.html)

Email entry and code entry occupy the same stable composition. After sending, show Check your email and the actual address with an Edit action. [The six code boxes]{46×56px at desktop, 9px gaps and 9px corners; shrink their width/gap within the available mobile width rather than overflowing. Numeric input, one-time-code autocomplete, auto-advance, backspace navigation, complete-paste auto-submit, and explicit accessible labels.} keep feedback inside a reserved status area. Resend has a visible cooldown, and expired or incorrect codes get specific messages.

~~~
Use the platform auth SDK flow, never custom verification. Crossfade between email/code states over 200ms without a height snap. Error tint uses Flare; optional error motion is translateX ±4px, 3 cycles in 300ms, with a reduced-motion no-shake path. Success tint is Phosphor. Use a spinner replacing button content without resizing. Do not copy the wireframe's invented expiration countdown; show expiry only if actually known, otherwise handle the platform's expired-code response. A UI resend cooldown can be 30s and does not replace platform rate limits.

After login render the console shell plus subtle pulse skeletons matching rows and panels until the bootstrap bundle arrives. Never a blank screen or lone spinner. Returning sessions skip sign-in. Logout clears sensitive state and subscriptions.
~~~

## First-use preflight and settings

The first visit includes a compact explanation: Astra researches, Elly reviews, nothing sends without approval. It then shows [preflight checks]{Astra configured/not yet checked/available/failed; CoHost missing/connected/failed; sender incomplete/ready. A configured model constant or present secret is not a successful live connectivity test.} and the relevant next action.

![First-Use Preflight](src/.wireframes/preflight-setup.html)

Connection instructions refer to the platform secret store, never ask Elly to paste keys into an app database form. Settings hold display name, Reply-To, managed-sender verification, and Test or Live delivery preference. The selector clearly describes the actual destination of each mode. Elly enters the app-owned sending address after configuring its domain in the platform, then explicitly requests a verification message to her signed-in inbox. Only a matching service receipt enables that sender. Neither a configured address nor a green client label bypasses this check.

[Scouting and dispatch have independent readiness]{This corrects the preflight wireframe: email setup is not required to research or create drafts. Disable live scouting only for unmet Astra/CoHost prerequisites. Disable live send for an incomplete managed sender, Reply-To, contact, invalid draft or stale events. Show the exact missing step next to its disabled action.}. The library, historical runs and sample review remain usable without live credentials.

## Run view

The idle screen has the reticle, a clear Start scout action, a short status line, optional scope controls and recent runs. The controls include city, vertical, date range, and a [new-company target]{Integer 0–5, default five. Scope displays the number of active non-sample maintained companies as well. Snapshot these settings when the run starts; changing the library during the run affects only future runs.}.

On Start, reserve the run header immediately, show the real event-fetch stage, and transition to the persisted run as soon as the backend confirms. Repeated clicks cannot create another active run. A historical run selector allows inspection without launching or replaying model work.

### Readout

![Run Status Readout](src/.wireframes/run-status-header.html)

The readout shows run status, short ID, GPT-6 Astra, scope, elapsed time, source mode and four metrics. Labels are Researched, Qualified, Matched, Drafts. Their [definitions]{Researched counts saved completed assessments; Qualified counts qualified companies; Matched counts companies with at least one accepted event match, not individual pairs; Drafts counts new persisted drafts. A secondary line can show exact matched-event pair count. Failed/unresolved attempts do not inflate researched totals.} are available in tooltips.

Elapsed time stops on completion. A green status dot means a live run, amber means waiting or attention, Flare means failure, and quiet text means idle/history. [Stop]{Label the action Stop accepting results and explain that in-flight research may continue. Never promise provider cancellation. Confirmation uses a styled sheet and preserves saved work.} is available only for a running process. Completed/partial/failed/stopped states show concise outcomes and next actions in the same reserved header area.

### Activity and findings

![Live Run — Activity & Findings](src/.wireframes/live-run-stream.html)

The activity pane has timestamps, a connecting spine, colored nodes and legible one-line labels. Actual research actions are amber; decisions and gaps use positive or neutral status labels. A finding includes its concise explanation and [citation chips]{Real retrievable source URLs for live research. Domain labels with an external-link icon; hover/focus reveals source title and retrieval/publication metadata. Sample citations say Sample source and open fixture evidence rather than imply real research.}.

Native-web internals might not expose individual search queries. In that case the line says Astra web research started, then shows the completed evidence. Do not insert imagined searches to fill quiet periods. Long-running calls retain a stable labelled working state rather than fabricated percentage progress. No raw JSON, secret, provider stack trace or private thinking is displayed.

~~~
Follow the exact streaming craft from visual.md: drain only available public text with requestAnimationFrame at ~18% buffered chars per frame, 3-char floor; caret solid while revealing, blinking only after ~400ms stall; complete findings and citations appear together. Structure never assembles token by token. Text is fully readable after reveal. A genuinely complete finding can appear immediately without artificial typing. No hidden model reasoning is used as animation content.

Transcript grows downward in its own scroll area. Auto-follow only while near bottom; scrolling up releases it and exposes Jump to latest. Preserve current scroll position while newer entries arrive. Resolve a tool entry in place by its stable ID. Tabular counters can animate to their actual new number; reserve widths. Reduce motion to immediate updates. An optional replay animates saved activity only and is labelled Recorded run or Sample replay; it makes no API/model calls and never displays a live status.
~~~

### This run

The companion pane is a compact list of completed sponsor results. Each row shows company, qualification, accepted match count, and draft status. Selecting Draft ready opens that exact packet in the queue. Three useful findings should look purposeful, not like an incomplete dashboard waiting for dozens of cards. If nothing has qualified yet, show a factual placeholder and the number currently assessed.

## Approval queue

The queue opens as a dense list of pending sponsor packets with score, fit count, recipient readiness, source run and source mode. Filters distinguish All pending, Ready, and Needs recipient. A History view includes approved, rejected, simulated and delivery-problem records. Queue counts include pending drafts that still need a recipient.

Selecting a packet opens [the case and the letter]{Two panes on desktop: sponsor evidence, matches, contact and envelope on the left; editable email preview on the right. At narrower widths they stack in a full-height detail view. Back to queue retains prior filters and scroll. Selection can be deep-linked.} rather than a long stack of giant email cards.

![Approval — Case + Draft](src/.wireframes/approval-email-card.html)

The packet contains:

- Sponsor identity and a Qualification pill, with a tooltip explaining that the score is a ranking, not a probability.
- Why qualified: concise cited rationale, four visible rating rows, known gaps and source age.
- One to three matched events. Each shows date/city/audience, a quoted ask, a separate match-fit value and Why it fits. Expand for region, audience and vertical breakdown plus host and capacity.
- Researched contact: name, role, evidence, source and an editable To field. Operator-entered contacts are labelled Your contact rather than research-verified.
- Envelope: actual app-owned From labelled Managed, Reply-To labelled Your inbox, and clearly labelled sample/test/live mode.
- The letter: subject and plain-text body on the flat light Switzer surface. The recipient mirrors the To field. Editing does not imply sending.

Actions are Review recipient, Edit draft, and Reject. Save/cancel edit preserves the existing draft until a save succeeds. Unsaved edits get an in-app discard confirmation on exit. Rejection offers optional reason chips in a popover/sheet rather than expanding a row and shifting the whole layout.

### Confirm recipient

![Confirm Recipient Gate](src/.wireframes/confirm-recipient.html)

The sheet restates the actual recipient and envelope, the subject and a compact letter preview. A required checkbox says I've checked the recipient and approve this exact email. [Dispatch stays disabled]{Use a real disabled button with distinct 0.32 opacity; do not rely on CSS pointer-events as authorization. The backend checks the version/fingerprint, confirmation and send readiness again.} until the review is complete.

Cancel and Escape return to the packet without changes. During sending, keep the sheet stable with a fixed-size button spinner and a visible working state. Do not optimistically say Sent or remove the packet before the service result is known. On acceptance the card exits with the brand's 260ms slide/fade and a toast says Accepted for sending. Delivery not yet confirmed.

Sample packets replace dispatch with Simulate review and an always-visible no-email notice. Their completion toast says Review simulated. No email was sent. Test delivery prominently shows Elly's actual test destination and leaves the sponsor draft pending. Unknown send outcomes remain in view with a blocked-retry explanation and a user-triggered Refresh delivery action.

~~~
Confirm sheet: centered desktop, bottom sheet mobile; 220ms ease-out; backdrop approximately 55% dim with static 4px blur. Focus trap, labelled dialog, focus return, Escape/outside close when safe. Optional mobile drag dismissal threshold 40% of sheet height; always retain an ordinary Close/Cancel control. Do not dismiss mid-submission in a way that hides its status. Reduced motion removes transforms.
~~~

## Sponsors

The library uses open-divider rows, not cards: company, maintained/discovered origin, sector, funding stage if sourced, last qualification score/date, status, and matched-event count. Search and filters run against the loaded working set. A row opens a side inspector with full evidence, past runs, notes and contacts.

Add sponsor and Edit sponsor use two grouped sections, Company and Contact, plus notes. Only company name and website are required. Optional fields have clear labels; inline validation reserves its space. Controls include Include in runs, Archive, and Do not contact. [Agent research never overwrites these edits]{Optimistic updates are rolled back on backend failure while preserving the user's form text. A maintained/discovered filter and source flag make ownership of the data clear.}.

## Events

Events are read-only snapshots from CoHost Club, selectable by run. Show fetched time, source mode and active scope filters. Columns include title, city, vertical, date, capacity/bucket, sponsorship-ask excerpt and matched-sponsor count. An inspector shows full description, audience, verbatim ask, host name/company, the provider's verified flag and events hosted, plus matched sponsor rows.

[Open in CoHost Club]{Use the supplied event HTTP(S) URL in a new tab with noopener/noreferrer. Do not construct URLs from the secret API base or create fake public links for samples.} gives Elly the manual handoff path. There is no funding-progress meter, secured total, sponsorship price, event-edit control, or interest write-back.

## Mobile

![Mobile — Run View](src/.wireframes/mobile-run.html)

The four main destinations become a fixed bottom bar. Run metrics become a two-by-two grid with compact LIVE/elapsed information above the full-width stream. This run results are reachable through Queue rather than a squeezed second pane. Sponsor and event tables become condensed rows with name, status and one metadata line; inspectors and approval packets become full-height sheets.

~~~
Support 360px phones through wide desktop. 44px minimum practical hit targets even when glyphs and mono labels are small. Keep actions above the mobile keyboard and bottom safe area. Never stretch a phone bottom bar across a desktop viewport. Long recipient addresses, URLs and asks wrap safely; no whole-page horizontal overflow. Light draft inputs can use >=16px on narrow touch screens for legibility without changing the font family.
~~~

## State, accessibility and failure handling

The app loads its current working [bundle]{Operator profile/readiness, sponsors, pending drafts with assessments, recent runs and selected event snapshot, batched on the backend and stored in Zustand. Historical run detail loads once when selected; do not refetch each panel independently.} after login. Navigation between loaded destinations is immediate. Private realtime events update saved records, and reconnect or detected gaps reconcile from durable state.

Visible errors explain what failed and what remains safe. A failed event fetch does not wipe the library. An Astra failure preserves saved research. A failed edit preserves form input. A send with unknown outcome never masquerades as a safe retry.

All dialogs, toasts and confirmations are custom styled components; never native alert, prompt or confirm. Navigation uses keyboard focus and accessible labels; color is paired with text/glyph status. Citation links and reasoning are selectable. Navigation chrome alone can disable text selection. Use semantic form labels, tabular numbers, adequate contrast, a polite activity-summary live region that does not announce every token, and reduced-motion alternatives throughout.

Initial loading uses subtle fixed-shape skeletons. Optimistic updates apply to reversible local work only, not external sends or claims of completed research. Unexpected failures render a branded error boundary, never a blank page.
