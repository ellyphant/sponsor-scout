---
name: Voice and Terminology
description: Clear, factual operator language and warm, specific sponsor outreach.
---

# Voice and Terminology

The console speaks like an instrument reporting useful facts: concise, specific and calm. It names what happened, what is missing, and what Elly can do. It is never theatrical about intelligence or casual about sending email.

The email itself is warmer and more conversational, but still direct. Elly offers relevant introductions, not invented familiarity or a sales pitch full of generic praise.

## Vocabulary

Use Run or Scout for one research cycle, Maintained for Elly's included list, Discovered for agent-found companies, Qualification for a company's score, and Match fit for an event pairing. A sourced contact is Researched, not Verified deliverable.

Positive sponsor status is Qualified. Use Not qualified rather than the ambiguous Passed. Draft states include Needs recipient, Ready for review, Rejected, Approved, and Simulated. Delivery states are distinct: Accepted, Delivered, Failed, Suppressed, or Outcome unknown. Sample and Test are always visible when applicable.

Use Review recipient before Dispatch. Do not add unsupported Snooze, Auto-send, or Train Astra actions. Describe saved rejection reasons as feedback, not automatic model training.

~~~
Scores show two decimals (e.g. qualification 0.92, fit 0.84). These are ranking values, not probabilities or percentages. Uppercase labels are a visual treatment, not an excuse for jargon. Do not call a source-backed summary "private thoughts" or a fake replay "live." No emojis, em dashes, exclamation-heavy copy, superlatives, promotional filler or cute vague errors.
~~~

## Reviewed interface copy

These strings have received a copy-editor pass. Substitute only actual values where needed.

| Moment | Copy |
| --- | --- |
| Welcome | Astra researches sponsors, matches them to CoHost Club events, and drafts your outreach. You decide what sends. |
| Sign-in | Private console. Sign in with your operator email. |
| Idle run | No scout running. Start one to research sponsors and match them to open events. |
| Live run | GPT-6 Astra researching live. Every finding cited. |
| Setup | Connect CoHost Club to use live events. Set up a sender before any email can leave the app. |
| Unverified research setup | Astra's research configuration hasn't passed a live check yet. |
| No events | No upcoming events need a sponsor with these filters. Widen the search or check back later. |
| First empty queue | No drafts yet. Start a scout run to build your review queue. |
| Reviewed empty queue | Queue clear. Every draft reviewed. |
| Missing contact | No public email found. Add a recipient you trust before approval. |
| Contact evidence caveat | Found on a public source. Mailbox deliverability not verified. |
| Match explanation | City, audience, and industry fit, backed by the event details. |
| Score tooltip | Ranked from available evidence. Not a probability of sponsorship. |
| Evidence gap | No reliable evidence found. |
| Sender note | Sent from the app's managed address. Replies go to your inbox. |
| Confirmation checkbox | I've checked the recipient and approve this exact email. |
| Send acceptance | Accepted for sending. Delivery not yet confirmed. |
| Sample confirmation | Sample draft. No email will be sent. |
| Sample completion | Review simulated. No email was sent. |
| Test acceptance | Test email accepted for your inbox. The sponsor was not contacted. |
| Suppressed recipient | Not sent. This recipient opted out. |
| CoHost failure | Couldn't load CoHost Club events. Nothing was researched or sent. |
| Event recheck failure | Couldn't check current CoHost Club events. This draft wasn't dispatched. |
| Astra failure | Astra couldn't finish this run. Saved findings and drafts stay available. |
| Unknown send | Send outcome unknown. Check the mail log before retrying, to avoid sending a duplicate. |
| Stop explanation | Stop accepting new results for this run. Research already in progress may continue. Saved drafts stay available. |
| Stale run recovery | This run stopped reporting progress. Its saved work stays available. Abandon it before starting a new one. |
| Rejection | Draft rejected. Nothing was sent. |
| Open-source note | Built from scratch. CoHost Club stays separate. Sponsor Scout only talks to it through its HTTP API. |

## Error honesty

Messages distinguish a confirmed failure from an uncertain external result. A timeout does not prove an email was not sent. Accepted does not mean Delivered. Simulated does not mean Sent. Source unavailable does not mean a fact was disproved.

~~~
Use stage-specific errors: the CoHost failure string above applies to the initial fetch, not to a later dispatch recheck after research has already happened. In that case say that current event eligibility could not be checked and the draft remains unsent by this attempt. Never tell the operator to retry an Unknown send as though it were safe. Log sanitized technical context for debugging, but do not expose credentials, raw provider responses or stack traces in user copy. The exact pinned model name is useful product information and should remain visible.
~~~

## Outreach voice

Write as Elly helping connect CoHost Club hosts with relevant sponsors. Mention the real event count, dates and asks, and one clear question about interest in an introduction. Avoid false familiarity, invented job titles or relationships, guaranteed outcomes, and claims that Elly owns an event's partnerships. The agent should not quote internal scores or its own workflow inside the email.
