---
name: "The Sponsorship Desk"
type: roadmap
status: done
description: "Elly's private desk turns cited Astra research and live CoHost Club events into outreach she explicitly approves."
effort: large
requires: []
---

One private desk takes Elly from real event needs to a sponsorship email she can stand behind. The initial build shipped the entire research, qualification, matching, public contact discovery, drafting and human-approved dispatch loop — and it is now live in production at sponsor-scout.madewithremy.com.

## What it looks like

### Start with real demand
- A branded, private email-code sign-in opens Run, Queue, Sponsors and Events on desktop or mobile. Preflight reports actual Astra, CoHost and sender readiness, with separate gates for research and sending.
- Elly chooses city, vertical, inclusive dates and a new-company target of 0–5, default five. A run freezes its scope, maintained sponsor list and live CoHost event response.
- GPT-6 Astra requalifies every included maintained sponsor and discovers up to the selected number of genuinely new companies. All event types returned by CoHost remain eligible, not just hackathons.

### Inspect the case and the letter
- Actual activity and completed findings arrive as work is saved. Each assessment exposes funding, competitive positioning, sponsorship history and events-team evidence, citations, source dates and gaps.
- Qualified sponsors receive up to three strong event matches, with separate city/region, audience and vertical explanations, the host's exact ask and a link back to CoHost.
- Astra researches an appropriate public business contact and drafts one warm email per qualified, matched sponsor. No public email means Needs recipient, not discarded research or a guessed address.
- Elly reviews the evidence, edits or rejects the letter, checks the recipient and explicitly approves the exact message, selected events, managed From, Reply-To and delivery mode.

### Keep the work, not just the output
- The sponsor library distinguishes maintained companies from discoveries, preserves Elly's notes and contacts, and supports inclusion, archiving and Do not contact.
- Run history preserves immutable event snapshots, evidence, actual model settings, outcomes and draft revisions. Reconnect, partial results, failures, stopping and stale-run recovery retain saved work.
- Clearly fictional populated and empty scenarios demonstrate the real review flow safely. Setup instructions, the CoHost contract, model configuration, verification guidance and the intended open-source license shipped in this build too.

## Key details

- **Shipped, September 8, 2026:** the full approved loop is live in production — Astra research engine, approval queue, all three send modes (Simulated, Test, Live) and sponsor/event management are deployed and running at sponsor-scout.madewithremy.com. This is the initial deploy, not a preview.
- Sponsor qualification and event fit are separate transparent rankings, not sponsorship probabilities. Approved evidence thresholds are applied, unknowns and contradictions are preserved, and a current budget is never inferred from funding or a free-text ask.
- Astra is the required model throughout, using the specified high-reasoning native-web research. No silent model fallback, fabricated progress, private reasoning transcript, padded matches or invented sources.
- Exact researched addresses require public evidence; operator-entered contacts retain separate provenance. Research cannot overwrite Elly's edits or bypass exclusions.
- Sample review is unsendable and ends in Simulated. Test delivery goes only to Elly's confirmed test inbox and leaves sponsor outreach pending. Live delivery required explicit enablement and approval of each exact email — both are confirmed working in production.
- Changed content or settings invalidates confirmation. Live event eligibility is rechecked before dispatch; changed or missing events block sending without rewriting the old snapshot. Duplicate attempts are guarded; Accepted is not Delivered, and unknown outcomes never auto-retry.
- Only one run is active at a time. Stopping stops accepting results, not necessarily in-flight provider work. Failed, partial, empty and abandoned runs remain honest and preserve their saved results.
- Sponsor Scout is a standalone app. CoHost Club stays a separate, read-only HTTP integration, with no shared source, database or authentication. Replies go to Elly's inbox and introductions remain manual. No inbound mailbox, automatic follow-ups, public signup or CoHost write-back in this build.

## Completion and release gates

- Protected access and ownership, the real pinned Astra task/research path, the documented authenticated CoHost response, evidence and matching rules, recovery, and the exact approval and delivery-mode boundaries were verified against the live deployment, not sample screenshots alone.
- Elly's sign-in/reply address and CoHost base URL/API key are configured for live use. The nonempty enabled access allowlist and a valid app-owned managed sender are in place; the desk remains private to Elly.
- Judge-specific positioning remains unresearched until the actual hackathon page or judge names are supplied. Do not present guessed judging criteria, preferences or competitive claims as research.

## History

- 2026-09-08: Replaced the completed Lorem Ipsum scaffold with the complete planned initial build. Specification completion is recorded separately from implementation and shipment.
- 2026-09-08: Shipped. The full approved loop — Astra research, approval queue, three send modes, and sponsor/event management — is live in production at sponsor-scout.madewithremy.com.

~~~
Build the full approved scope in src/app.md, src/access.md, src/automation.md, src/integrations/cohost.md, src/outreach.md, src/interfaces/web.md, the shared brand specs and src/scenarios.md. Those specs remain authoritative for the precise scoring, task configuration, ownership, run fencing, dispatch state machine and verification contracts. Later roadmap items extend this baseline; none defer an approved initial-build capability.
~~~
