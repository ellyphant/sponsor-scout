---
name: Sponsor Scout
description: Elly's private sponsorship desk, powered by GPT-6 Astra and connected to CoHost Club by HTTP.
---

# Sponsor Scout

Sponsor Scout finds companies that could sponsor tech-community events, explains why they qualify, connects them with suitable CoHost Club events, and drafts outreach for Elly to review. It is a new, standalone, open-source app built for the GPT-6 Astra hackathon. CoHost Club remains a [separate product]{No CoHost Club source code, database access, embedded backend, or shared authentication. The only integration is its documented outbound HTTP API.}.

Elly starts a run. GPT-6 Astra researches companies, evaluates the evidence, selects relevant events, and writes an email. Elly sees the evidence and the proposed recipient before deciding what sends. [Nothing sends automatically]{The research task has no email, approval, sender-settings, or CoHost write tools. Only an authenticated, explicitly confirmed operator action can invoke dispatch.}.

The hackathon is the setting in which Sponsor Scout is built, not a restriction on which events it serves. Founder dinners, investor salons, operator meetups, conferences, hackathons, and other event types returned by CoHost Club are all eligible.

## Who uses it

This is a private console for Elly, not a sponsor marketplace or a host-facing site. Access uses a [one-time email code]{Platform email-code authentication and a non-empty, enabled platform signup allowlist containing Elly's supplied address. No business roles are required. See `src/access.md`.}. All sponsor records, runs, drafts, and settings require sign-in. A branded welcome and sign-in are the only public screens.

## A scout run

Elly chooses optional [event filters]{City and vertical strings; inclusive calendar-date `from` and `to`. Default is upcoming events from today with no end-date restriction. The new-company target defaults to five and is limited to 0–5. A live run never silently switches to sample data.} and starts a run. Its scope is frozen at the start, including the maintained sponsor list and the event response.

The run:

- Fetches the current CoHost Club events that explicitly need sponsorship. It saves their full details as an [immutable snapshot]{Stored with the run, including external IDs, URLs, host metadata, fetched time, filters, returned count and available response count. See `src/integrations/cohost.md`.}.
- Requalifies every [active maintained sponsor]{Sponsors explicitly included by Elly. Inclusion is not a positive verdict and does not bypass evidence checks. Archived or do-not-contact sponsors are excluded. Prior agent discoveries enter later runs only if Elly adds them to the maintained list.} and discovers up to five genuinely new companies through Astra's native web research.
- Evaluates funding, competitive positioning, prior event sponsorship, and an events or field-marketing team. Each conclusion has a concise [explanation]{User-facing evidence summary and sources, not a private chain-of-thought transcript. Unknown facts stay unknown.}, score, and gaps.
- Selects [up to three events]{Only IDs in this run's live event snapshot, ranked by city/region, audience, and vertical. Do not pad weak matches to reach three.} per qualified sponsor and explains each fit.
- Researches a public business contact and drafts one email covering that sponsor's matched events. A missing email [does not discard useful research]{Keep the draft in Needs recipient. Exact addresses require public citation or operator entry; no guessed email patterns.}.
- Saves each completed sponsor assessment and draft as it goes. Elly can open the queue before the entire run finishes.

The live view shows real activity and saved findings. Counts describe [actual work]{Researched = completed sponsor assessments; Qualified = qualified assessments; Matched = distinct sponsors with at least one accepted match; Drafts = new review drafts created in this run. Small counts are intentional.}. It never animates fictitious searches, sources, decisions, or emails to make the agent look busy.

~~~
Use `mindstudio.runTask({ model: 'gpt-6-astra', ... })` as the autonomous orchestrator. Installed SDK 0.1.121 accepts only a string model for the task, not model configuration. High-reasoning native-web work therefore runs inside task-private tools using `mindstudio.generateText` with explicitly pinned Astra configuration on every call. The task chooses discovery, evaluation, evidence follow-ups, and persistence; this is not a fixed chain of scrapers. See `src/automation.md` for the exact model config and contracts. No conversational Agent interface, jewels, cron, voice, or MCP is needed for v1.

Start returns a persisted run identifier promptly. Keep the entire asynchronous pipeline alive with `mindstudio.waitUntil`, including event fetch, task execution, final persistence and failure handling. Publish safe progress through authenticated realtime events. Do not poll the app's own backend. `stream()` may additionally narrate the start invocation, but is not the durable live-run transport.
~~~

## Sponsor library

Elly can add and edit a company, its website, sector, target regions and audiences, notes, and an optional business contact. The company name and [website]{Required HTTP(S) company URL, normalized to a canonical lower-case hostname with an optional leading `www.` removed. Do not use a company name alone as the deduplication key.} identify a maintained sponsor. The library distinguishes maintained companies from agent discoveries and shows the latest assessment with its date.

Elly can add an agent discovery to the maintained list, remove it from future runs without losing its history, archive it, or mark it [Do not contact]{A hard dispatch gate, not just a visual filter. Recheck at send time. No automatic outreach to archived or do-not-contact companies.}. Operator-entered notes and contacts are never overwritten by agent research. When an operator contact differs from a researched contact, show the difference and preserve both provenances.

## Qualification and matching

Each sponsor is scored against all four heuristics rather than given a mysterious overall number. A [qualification score]{Normalized 0–1 ranking, displayed to two decimal places. Deterministic weighted total of sourced 0–5 ratings: funding 35%, competitive/AI positioning 25%, sponsorship history 25%, events team 15%. A score is not a probability of sponsorship.} summarizes the case. Evidence gaps remain visible even on a strong sponsor.

An event has its own [match score]{Separate from sponsor qualification. Normalized 0–1 weighted total: city/region 30%, audience 40%, vertical 30%. Retain a rationale for each dimension and overall fit.}. The app never treats a large sponsorship ask as proof that a company has a budget to meet it. CoHost supplies a free-text ask, not committed funding, price packages, or sponsor budgets.

## Review and outreach

The approval queue presents the entire case: company, qualification evidence, matched events, why they fit, recipient evidence, sending identity, and editable subject and body. Elly can save edits, reject a draft with an optional reason, or open recipient review.

Final approval confirms [the exact email]{Recipient, subject, body, matched-event selection, sender, Reply-To and draft revision. Changing any of these invalidates prior confirmation.} and dispatches it through the managed email service. The visible sender identifies Elly using an app-owned address; replies go to her chosen inbox. The app does not impersonate her personal mailbox or silently route a sponsor email to a test inbox.

[Sends have a recorded lifecycle]{Review status and delivery status are distinct. Queued/accepted is not delivered. Unknown outcomes remain blocked from automatic retries. `src/outreach.md` defines the state machine and duplicate-attempt guard.}. Editing or rejecting never sends. Approved messages, rejected drafts, and simulated sample reviews remain available in history.

When a sponsor expresses interest, Elly handles the response in her inbox and brokers the introduction manually. Each matched event links back to CoHost Club and shows its host. No inbound mailbox, automatic interest detection, or CoHost write-back is included in v1.

## Run history, failures, and stop

Run history preserves the event snapshot, assessed companies, sources, decisions, drafts, scope and actual model configuration. A new run never changes an older review packet.

Only [one scout run]{A persistent per-operator unique execution claim prevents two tabs or repeated clicks from launching duplicate work. Preserve the claim until the worker settles or is explicitly abandoned; never rely on a disabled button or process-local flag alone.} is active at a time. Starting again after a failed run creates a new run and fetches a new event snapshot. Existing drafts and sent history remain untouched; an existing open draft or prior outreach for the same sponsor and events is surfaced rather than duplicated silently.

Stopping [stops accepting further results]{The SDK has no documented hard cancellation API. Show Stop accepting results with explanatory confirmation; mark stopping immediately, gate every later save, and mark stopped when the worker settles. In-flight provider research may still complete and incur usage. Do not promise immediate compute cancellation.} while keeping saved work available. If the page disconnects, the work continues and the app catches up from stored state when reconnected.

An empty event response is a valid completed run with no research or drafts. A failed CoHost fetch creates a failed run without research. A candidate-level research failure is retained as a failure/gap, other candidates continue, and the overall run is partial when work remains unresolved. Infrastructure failures never erase already saved drafts or pretend a run completed.

Runs checkpoint their results within a [bounded execution window]{`waitUntil` keeps work alive but does not provide infinite lifetime or automatic crash resumption. Check the wall-clock budget before starting more research and retain the unresolved sponsor list. See `src/automation.md`.}. If a worker is interrupted, Elly can explicitly abandon the stale run and start afresh. Abandoning preserves saved records and permanently fences the old worker out of further results, finalization and lock release.

## What the app remembers

The app keeps:

- Elly's verified identity and non-secret operator preferences, including Reply-To and test/live delivery mode.
- The maintained company list, discovered companies, contact provenance, exclusions, and archive state.
- Runs, their event snapshots, recorded model settings, scope, counters, and outcomes.
- Timestamped activity and cited findings for replay and reconnect recovery.
- Per-run sponsor assessments, sources, qualification ratings, contact research, and ranked event matches.
- Draft revisions, recipient confirmation, approval or rejection, and associated send attempts and results.

~~~
Prefer JSON for bounded data that always loads together. Suggested eight-table contract: `users`; `sponsors`; `scout_runs` (including immutable `events` JSON array); `run_activity`; `sponsor_assessments` (including bounded evidence/contact JSON and <=3 matches); `outreach_drafts`; `dispatch_attempts`; `operation_claims`. No separate table per scoring dimension, contact field, or matched-event line.

All private rows carry an owner ID and ownership is checked in every method. `users` is the auth profile; custom fields are optional until configured. Do not add automatic system columns to table interfaces. Unique keys include owner+normalized company domain, run+sponsor assessment, run+sponsor draft, and draft+revision+mode send claim. `operation_claims` provides unique resource keys for one active run per operator and serializing a draft's edits/rejection/approval freeze. Claims have original holder tokens and row IDs; release only the original claim, never a replacement. Match entries retain run-local snapshot event ID and CoHost external ID for future manual or API handoff.

Load the current working bundle in batched reads into a Zustand store. Page run/activity history as it grows; load a selected historical run once. Use SQL aggregates for totals, bindings with inline explanatory comments for scoped predicates, and `db.batch` for independent operations. No localStorage database or mock frontend truth.
~~~

## Demo and open source

The build includes a populated [sample scenario]{Fictional companies and events, clearly flagged Sample at every level. No live CoHost fetch, AI invocation, or real email dispatch when merely loading or reviewing fixtures.} and an empty scenario. Sample reviews have a separate simulated result, not a fake Sent status. The console supports real Astra runs once CoHost credentials are configured; live findings are never fabricated when external services are unavailable.

Source includes setup instructions, the CoHost contract, model configuration, testing guidance, and an open-source [license]{Assume MIT for code authored from scratch, subject to Elly's confirmation before public release. Third-party packages retain their licenses.}. Credentials and private operator data are not source files. The repository is not pushed publicly or deployed until Elly asks to publish.

## Decisions and setup still to supply

These choices make the first version concrete: five new sponsors per run, all active maintained sponsors requalified, up to three strong matches per company, explicit recipient approval, and manual introductions back into CoHost Club.

Before a live launch, Elly supplies her sign-in/reply address and the CoHost base URL and API key. Access restriction and a valid managed sender must be checked before publication. Astra is the required model throughout, with no silent fallback. Judge-specific research awaits the actual hackathon page or judge names; no guessed judging criteria are represented as researched facts.
