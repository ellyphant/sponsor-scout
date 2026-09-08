---
name: Sample Scenarios and Verification
description: Safe populated and empty developer scenarios, with evidence and approval paths to verify.
---

# Sample Scenarios and Verification

The initial build includes a realistic sample workspace and an empty workspace. Both use the same real backend and interface as live data. Fixtures explain the product without pretending to be live CoHost demand or recent Astra research.

## Sponsorship desk sample

A completed [sample run]{Scenario `sponsorship-desk`, roles `[]`. Create eight sponsors, eight assessments, six event snapshot entries, two pending drafts, and a modest set of recorded activity entries. All records and derived objects are explicitly `isSample: true` or source mode sample. Run counts: researched 8, qualified 3, matched sponsors 2, drafts 2.} shows three maintained companies and five discoveries. It is useful for browsing evidence, opening event matches, editing a recipient, and testing the review gate.

All company and person details below are fictional fixture content. No example claim is represented as fact about an actual business.

| Company | Origin | Fixture case |
| --- | --- | --- |
| Helio Grid | Discovered | Strong funding and event-history evidence, public sample contact, three accepted Bay Area matches, draft ready for sample review. |
| Relay Foundry | Discovered | Relevant positioning and sponsorship evidence, two New York matches, but no public email; draft needs a recipient. |
| Meridian Stack | Maintained | Qualifies as a company, but no current event clears the audience-fit rule; no draft. |
| Forgepath Cloud | Maintained | Earlier-stage funding and uncertain event budget; not qualified. |
| Cedar Signal | Maintained | Sparse current evidence; unknown team and sponsorship history. |
| Northline Data | Discovered | Relevant vertical but insufficient sourced signals to qualify. |
| Orbitline AI | Discovered | Competitive AI product with no usable sponsorship-history evidence. |
| Mosaic Field | Discovered | A credible company outside the snapshot's main audiences. |

~~~
Helio Grid example ratings [5,4,5,4] -> 0.92; Relay Foundry [4,5,4,2] -> 0.79; Meridian Stack [4,4,2,4] -> 0.70. Other ratings remain below the 0.65 threshold. Compute rather than handwave scores. Use `dana.osei@example.com` only as a sample contact, and leave the Relay email null. Maintain distinction between qualification score and per-event match score.

Each sample company website uses a distinct reserved subdomain such as heliogrid.example.com so domain-based deduplication does not collapse the fixtures; source identifiers use example.com fixture paths or local fixture IDs. Sample email recipients still end in @example.com, not those subdomains. Source chips explicitly say Sample source and display the fixture excerpt, not a made-up live TechCrunch/company citation. No seeded corporate logos or headshots; use icon fallbacks. No fixture personal address except sink-safe @example.com or the platform dev test identity. Do not send any mail when seeding.
~~~

The snapshot contains six [sample events]{Store exactly the documented CoHost shape, including source URL, city, vertical, audience, capacity/bucket, ISO/unix date, ask and full host object. Dates are relative to the scenario's seed-time clock so all fixtures remain upcoming; do not claim those dates are live listings.}:

| Event | City and audience | Sponsorship ask |
| --- | --- | --- |
| Bay Area AI Founders Dinner | San Francisco; founders and operators; 40 capacity | A partner to cover the room and dinner for founders building applied AI companies. |
| AI Infrastructure Roundtable | San Francisco; CTOs, engineering leaders and founders; 80 capacity | Support for the meeting space, coffee and recording of the technical discussion. |
| Enterprise AI Operators Night | San Francisco; operators and IT leaders; 100 capacity | A sponsor for the evening reception and AV support. |
| Founder and Capital Salon | New York; founders and investors; 60 capacity | Help with the venue and refreshments for a founder-investor salon. |
| Brooklyn Builders Breakfast | New York; founders and operators; 30 capacity | A breakfast sponsor for a small group of early-stage software founders. |
| Climate Data Meetup | Austin; climate-tech operators and data practitioners; 60 capacity | Support for a community room and snacks for a climate data discussion. |

The sample activity is labelled [Sample replay]{No live status badge, fabricated search-running state or new AI invocation. Replay only animates the saved sample entries. No private chain-of-thought fixture.}. The review flow ends in Simulated and states explicitly that no email was sent. Editing a fixture recipient does not clear its sample guard.

## Empty workspace

The [empty scenario]{Scenario `empty-workspace`, roles `[]`. The platform truncates the dev database; the seed adds no application business data. Platform-managed test identity may be created afterward by the platform. No hand-authored fake user/email row.} shows the first-use preflight, empty library, no event snapshot, and the not-yet-used approval queue. Its copy differs from an already-reviewed empty queue.

Missing secrets produce a visible connection/setup state. They never trigger an automatic sample response. The operator can still add a company or configure non-secret profile preferences while live scouting remains unavailable.

## Fixture isolation

Scenarios are dev-only database seed scripts. They do not create file-store assets, modify secrets or platform signup settings, send codes/emails, call CoHost, run Astra, or authenticate the browser.

[Live runs exclude sample companies]{Never pass fictional maintained records, sample contacts, or sample event IDs into a real research or send pipeline. All retained source-mode flags propagate into assessments/drafts. Switching to Live in settings does not convert fixtures.}. Use empty-state development or real operator-created rows for a live smoke test.

~~~
Scenarios live under dist/methods/.scenarios with normal SDK database imports. Batch inserts; never write managed user email fields. In this runtime, scenario reset can precede creation of the standing test user's profile. Seed fictional sample rows in the reserved sample-template owner namespace. On first authenticated workspace load, use a unique adoption claim and reassign ONLY rows with that reserved owner AND isSample=true to the caller's real auth.userId. Never adopt live rows or another user's records. Actual email-code sign-in hydrates the users-table row; do not fabricate one in app code. This is fixture provisioning, not an authentication bypass. Do not reset Elly's own test data without confirmation; initial-build verification resets the expressly disposable scenario data.
~~~

## Build verification

The build validates these paths before completion:

- Sign-in succeeds with the platform dev identity and protected methods reject anonymous or wrong-owner reads and writes.
- A real Astra task invokes the explicitly high-reasoning/native-web tools on the required model and returns domain-valid structured results. Model configuration is inspected; a prompt saying high reasoning is not enough.
- The CoHost request uses the documented endpoint/header and stores all documented event fields. Empty, malformed, unauthorized and unavailable responses have clear results without a sample fallback.
- Maintained sponsors are all assessed or visibly unresolved. New-company discovery never exceeds five distinct new domains. Repeated saves do not duplicate a packet or overwrite operator changes.
- An assessment exposes all four qualification factors with sources/gaps. A match exposes city, audience and vertical explanations; only current-snapshot IDs can be accepted, with no forced third match.
- An exact recipient needs a public source or explicit operator entry. A missing address cannot dispatch. Injected instructions in source content never grant tools or bypass approval.
- Saving, editing, rejecting or merely opening a packet never sends. A changed draft/settings revision invalidates an open confirmation. A double-click/two-tab approval has one send claim. Unknown outcomes cannot be bypassed by editing or incrementing a revision.
- A sample packet, even with an edited real email, cannot reach email.send. A test delivery is labelled Test and does not mark the sponsor contacted. Live validation is separately verified without contacting a sponsor as part of automated QA.
- Run progress survives navigation/reconnect from stored activity. Counters remain factual, sources appear with complete findings, and mobile/desktop layouts remain usable without content jumps.
- Empty states and a stopped/failed/partial run remain understandable; saved drafts survive a task error. Late workers cannot release replacement locks or append to abandoned runs.

Use TypeScript checks and targeted method tests for invariants, then one meaningful browser review flow and desktop/mobile visual checks. Static screenshots cannot validate transient streaming; use behavior tests or trace the component code rather than asking a screenshot to capture a passing animation. Do not send real sponsor outreach as a test without Elly's explicit approval.
