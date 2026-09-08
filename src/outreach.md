---
name: Approval and Email Dispatch
description: Exact human approval, safe sender identity, sample/test distinctions, and recorded delivery outcomes.
---

# Approval and Email Dispatch

Astra proposes outreach. Elly decides whether it leaves the app. The approval queue must make it easy to understand the company, its evidence, the event fit, the recipient, and the email without making sending accidental.

## The review packet

One packet contains the sponsor's per-run qualification, its sources and gaps, up to three matched events with their fit reasons and exact asks, a proposed contact with provenance, and an editable subject and plain-text body. It also shows the actual managed From address and Elly's Reply-To.

Elly can [save changes]{Draft content is versioned. Validate recipient format and subject/body length server-side. Saves never dispatch; new research cannot overwrite an edited or reviewed draft.} or reject the draft. Optional rejection reasons are Off target, Bad timing, Wrong contact, and a free note. These remain human feedback in history; the app does not claim automatic model training from them.

A missing or unsupported contact keeps the packet visible as [Needs recipient]{Publicly cited proposed emails and operator-supplied emails have distinct provenance. Syntactically valid does not mean mailbox-verified. The operator may provide an address she already knows. Do not pattern-guess a fallback address.}. Saving a valid recipient moves it to Ready for review, not Approved.

## Final confirmation

Review recipient opens a separate confirmation sheet showing the exact recipient, subject, matched events, From, Reply-To, delivery mode, and a compact final-body preview. Elly must affirm [this exact email]{The confirmation is bound to a stored draft revision and a hash covering recipient, subject, body, event IDs, sender, reply address and delivery mode. Changed content or settings makes confirmation stale and requires another review.} before the final action is enabled.

Cancel leaves the draft intact. Entering text, saving, rejecting, starting a run, viewing a preview, and enabling live delivery never constitute permission to send.

~~~
Use distinct backend operations for saving edits, rejecting, preparing a dispatch review, and confirming dispatch. prepare returns a short-lived review fingerprint over the current server-stored revision and envelope after validating ownership and readiness. confirm takes the draft ID, expected revision/fingerprint and an explicit confirmation flag, rereads the current persisted packet/settings and rejects a mismatch. Do not accept a free-form recipient/body payload as the source of truth for dispatch.

At confirmation, validate login, ownership, source mode, review status, unarchived/non-excluded sponsor, current eligible matched events, recipient, subject, body, sender/Reply-To and the explicit human confirmation. Source validation runs before a send claim, and no send is attempted for a rejected, sample-only, stale, in-flight or accepted draft.
~~~

## Sender identity

Emails identify Elly but use the app's [managed sending address]{A verified app-owned custom domain or platform subdomain, configured through the platform. Use a From value such as a display name plus the actual authorized address; never commit or invent a real personal address, pretend a shared Remy fallback belongs to Elly, or spoof her Gmail.}. Replies go to her chosen inbox. Both addresses are shown before every send, and the resolved sender returned by the service is recorded afterward.

The current managed email service may restrict external recipients when it uses a shared fallback sender. Therefore sender setup is checked before live outreach, not papered over with a label that claims the mail comes from Elly's personal inbox.

~~~
Use the installed SDK's typed `email.send` from @mindstudio-ai/agent. This is the same built-in service as `mindstudio.sendEmail`, with a typed receipt. Send one recipient, plain text (`bodyType: 'text'`), an explicit `category: 'marketing'`, the configured authorized From display identity, Reply-To, and an app-generated batch ID for correlation. Cold sponsorship outreach is not reclassified as transactional to bypass unsubscribe protections. No CC/BCC campaign blasting, mailbox OAuth, external provider key, scheduling, or automated follow-up in v1.

The result contains recipients, suppressed, from and batchId. A batchId groups messages; it is not a send idempotency key. Preserve platform unsubscribe/suppression handling and do not silently re-enable unsubscribed recipients. Check current quota where supported; a sending-paused failure is not automatically retried.
~~~

## Three separate delivery modes

**Sample simulation** is for clearly labelled fixtures. The confirmation says Sample draft. No email will be sent. Its final action is Simulate review and its result is [Simulated]{Persist a distinct simulated review state. The backend refuses any attempt to route a sample draft through the real email function, even if its recipient was edited to a real address. All sample-derived packets retain the flag.}. The toast says Review simulated. No email was sent.

**Test delivery** sends a preview to Elly's confirmed test inbox only. It shows [both addresses]{The proposed sponsor recipient remains on the draft as research data; the actual test destination is prominently displayed in confirmation. Prefix the subject with Test and record delivery mode test. Do not say the sponsor was contacted.} and leaves the outreach draft awaiting real approval. Test delivery is the default for a new operator profile.

**Live delivery** sends the exact approved draft to the sponsor. It requires explicit live-mode enablement and a separate approval for every draft. Switching delivery mode invalidates an open confirmation.

No environment detection or rerouting is assumed from the SDK. Mode is a persisted operator preference enforced server-side. Safe fixtures remain unsendable regardless of that preference.

## States and audit trail

A draft's [review state]{`pending`, `rejected`, `approved`, or `simulated`. Pending can display Needs recipient or Ready for review based on current validation. Approval metadata includes operator ID, time, revision, fingerprint and envelope snapshot.} is separate from the send attempt's state.

~~~
Send lifecycle: claimed/preparing -> sending -> accepted, suppressed, failed or unknown. Provider-message inspection may later report sent, delivered, delayed, bounced, blocked, complained or rejected. Display those as delivery detail, not approval. Accepted means the platform queued/accepted the send, not that the recipient received it. Delivered means the receiving mail server accepted it, not proof of inbox placement or reading.

Create a durable unique dispatch claim for (draftId, revision, mode) BEFORE invoking email.send. Acquire by INSERT; never upsert over a competing claim. Serialize save/reject/confirmation with a persistent per-draft operation claim so that, after CoHost validation, checking and freezing the current revision/readiness and acquiring the send claim cannot race an edit or rejection. Store the exact approved envelope/body and planned batch ID on the send claim. Double-clicks or simultaneous tabs that lose this claim cannot invoke the provider. Every mutation respects the freeze. Do not use a process-local mutex or a check-then-send alone. The operation-claim table can hold both run and draft resource keys; do not require unsupported raw SQL writes to implement it.

An in-flight or Unknown attempt is checked across all revisions before sending or creating a retry revision; incrementing a revision cannot bypass it. Test claims include mode so a completed test does not consume live approval. Only a definitive no-send failure permits a new explicitly reviewed dispatch revision, preserving the old occupied claim and audit history. Never reinsert the same unique key or delete an uncertain claim to retry.

No automatic retries after a network timeout, worker interruption, or ambiguous receipt. Leave the claim Unknown, retain the attempted revision, and require an operator mail-log check. Read email.batch/email.messages by the planned batch ID to reconcile on explicit Refresh delivery or when opening the attempt detail. This is a user-driven read, not frontend polling. An absent batch/message lookup does not establish that nothing sent. If the service outcome cannot be established, explain the duplicate risk and do not auto-retry. Use typed email.send specifically: the installed SDK's legacy sendEmail action can retry HTTP submission on some transport errors and is not interchangeable for submission retry safety.

Recheck database duplicates across earlier accepted drafts for the same sponsor and selected events. Surface an already-contacted warning rather than silently producing/sending another copy. Preserve rejection and event-pair context for the operator. This is duplicate-attempt protection, not a claim of exactly-once external delivery: the email service has no documented idempotency key.
~~~

Opening the queue never retries failed emails. Editing a failed draft returns it to pending review and requires new approval. A failed send leaves the letter and research visible, with a specific explanation and permitted next action. Sample/test attempts never mark a sponsor as actually contacted.

## Fresh events at dispatch

Before live sending, fetch current sponsorable events through the same CoHost API and check every selected event is still open and upcoming. If its relevant details changed or it vanished from the current list, [stop before sending]{Require a revised packet and new confirmation. No invented fallback event, no silent removal of an event mentioned in the body. The original run snapshot is unchanged.}. If CoHost is unavailable, keep the draft awaiting review and show why dispatch cannot proceed.

## Manual responses

Replies arrive in Elly's inbox through Reply-To. Elly opens the linked CoHost event to broker the introduction with its host. Sponsor Scout does not parse inbound mail or claim a sponsor is interested based on opens, delivery, or a successful send. No reply handler or CoHost write endpoint is in the initial build.
