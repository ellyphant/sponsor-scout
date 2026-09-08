---
name: CoHost Club Integration
description: The read-only HTTP boundary, immutable event snapshots, and live-event validation.
---

# CoHost Club Integration

CoHost Club is an independent community platform where event hosts describe needs such as sponsorship, venue, speakers, and audience. Sponsor Scout uses only the supplied HTTP endpoint to obtain events that need sponsors. No CoHost source code or database is available to this project.

## Connection

The [base URL and API key]{Exactly `COHOST_API_BASE_URL` and `COHOST_API_KEY`, stored in the platform secret store with separate development and production values and read only from `process.env` in backend methods. Both are secrets by explicit user request, including the URL.} never appear in committed code, example values, frontend responses, logs, task input, prompts, or stored event records.

The console reports whether the connection is configured and whether the latest check succeeded, with a time and a sanitized error. A green [Connected]{Requires a successful authenticated response with a valid event shape, not simply the presence of two environment variables.} state is not shown before a successful check. Setup instructions name the two secrets without showing their values.

~~~
Read-only outbound HTTP, not an API interface exposed by Sponsor Scout. Use native server-side `fetch` because this is a direct external service not covered by an OAuth connector. Construct a URL from the trusted configured base, remove trailing slashes, preserve any existing base-path prefix, and append `/_/api/sponsorable-events` once. The supplied base is the service base, not the endpoint URL.

Require HTTPS for live use, reject credentials embedded in the URL, and reject unexpected redirects rather than forwarding a Bearer secret to a different host. Use an AbortController with a 10,000ms request timeout, validate status and JSON before use, and bound response size. Never accept a base URL, authorization header, or key from the browser or from model-generated tool arguments. Do not log request options or a raw exception that includes them.
~~~

## Supplied API contract

A request can filter by city, vertical, and date range, with an optional result limit. [Date filtering]{`from` and `to` are ISO calendar-date strings. Validate actual dates and `from <= to`. With no end date, consider all upcoming events the endpoint returns. Display dates in the operator's locale while preserving the original ISO value and unix milliseconds.} is determined by Elly's run controls, not invented query parameters.

~~~
GET {COHOST_API_BASE_URL}/_/api/sponsorable-events
Authorization: Bearer {COHOST_API_KEY}
Accept: application/json

Optional query parameters: city, vertical, from, to, limit.

Response:
{
  count,
  events: [{
    id, title, description, url,
    city, vertical,
    audience: [...],
    size: { capacity, bucket },
    date: { iso, unixMs },
    sponsorshipNeed,
    host: { name, company, verified, eventsHosted }
  }]
}

Do not substitute `/events`, add undocumented pagination/cursor parameters, request the CoHost database, or omit the Authorization header. The API key is never an LLM tool parameter.
~~~

Every returned event is described by the provider as upcoming, open, and explicitly seeking sponsorship. Sponsor Scout preserves the [specific ask]{Free text from `sponsorshipNeed`. Quote it as supplied. Do not infer funding secured, funding gap, pricing tiers, sponsor availability, or guaranteed returns from it. Monetary amounts can appear only when actually stated in the ask.} and the host's context.

## Snapshot rules

The app fetches once at the start of a live run and stores a frozen copy of the accepted event response with its fetched time and filters. This snapshot is the [only event universe]{The task receives event IDs from the validated snapshot. Match validation rejects any ID outside it, duplicate event picks, or picks beyond three. Research may enrich sponsor facts, never replace or invent events.} available to that run.

~~~
Validate IDs, title, HTTP(S) public event URL, city, vertical, audience strings, nested size/date/host fields, and nonempty sponsorshipNeed. A zero capacity is not invented when absent; unknown optional descriptive values display Not provided. Reject invalid/missing required date or event identity and retain a diagnostic count of omitted malformed rows; do not silently pass partial corrupt data as a complete sync. Duplicate identical event IDs collapse; conflicting duplicate records fail the sync. Ignore unknown extra fields safely while preserving all documented values.

Compare `date.unixMs` with parsed `date.iso`; an inconsistent or invalid timestamp must not become an apparently valid upcoming match. Exclude already-ended dates with an explicit count. Treat an empty valid array as a successful zero-event sync, not an error. Keep returned array length and response `count` distinct. Default to no client-imposed limit. If a limit is applied or count suggests a partial response, label the snapshot Limited rather than claiming every event was fetched. There is no documented pagination contract.

Store the snapshot JSON on `scout_runs`, with `fetchedAt`, `filters`, `responseCount`, `eventsReturned`, validation notes and source mode. Once saved, no method edits the event contents. A subsequent run gets its own snapshot. Event matches reference its external `id` in the context of that run.
~~~

If there are no matching events, the run finishes without spending research calls or creating emails. If CoHost fails, the run fails clearly and [does not use cached or sample events instead]{A saved snapshot remains visible as historical demand, with its fetched time. It cannot silently stand in for a fresh live response.}.

## Review-time freshness

Approval shows when the event snapshot was fetched. Before real dispatch the backend rechecks the CoHost list and makes sure each event mentioned is still upcoming and seeking sponsorship. If an event is missing or its outreach-relevant details have changed, the app [blocks dispatch]{Changes to date, title, URL, location, audience, vertical, capacity or sponsorship ask require another human review. Do not silently edit an approved email. Preserve the old snapshot and show the changed/current details separately.} and asks Elly to refresh the match or start a new run.

This recheck narrows the stale-data window; it is not a reservation and cannot guarantee the event remains open after the email is accepted. CoHost's own page is authoritative for the host's current details.

## Manual handoff and future writes

Each match carries the event link, host name and company, and the CoHost event identity. Elly uses those details to broker an interested sponsor's introduction manually. A future write endpoint can use these stored IDs, but v1 has no write-back, no invented endpoint, and no dependency on one being available.

## Open-source boundaries

Public documentation includes the contract, secret names, and steps to configure development and production values. It does not include the real base URL, key, Elly's private email, or exported live event responses. Sample fixtures are fabricated and visibly marked as such. A secrets scan is part of the public-release checks.
