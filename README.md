# Sponsor Scout

A standalone sponsorship desk built from scratch for the GPT-6 Astra hackathon. Astra researches companies, qualifies their sponsorship potential, matches them to CoHost Club events, and drafts outreach for Elly to review. **Research cannot send email. Every live send requires explicit human approval.**

CoHost Club is a separate app. This repository contains none of its source code and does not access its database.

## What is included

- Private email-code sign-in, with per-user backend ownership checks.
- A maintained sponsor library, agent discoveries, exclusions and archived companies.
- An Astra task orchestrating high-reasoning native-web discovery and evaluation.
- Frozen CoHost event snapshots, four-factor qualification, three-factor matching and cited evidence.
- A live activity view backed by persisted events and authenticated realtime notifications.
- Editable drafts, recipient confirmation, sample simulation, test delivery and live dispatch.
- Persistent send claims, revision fingerprints, suppression handling and Unknown-outcome retry protection.
- Desktop and mobile operator interfaces, plus populated and empty development scenarios.

## Model architecture

The task orchestrator uses `gpt-6-astra`. SDK 0.1.121 accepts a model ID, not reasoning settings, at the task level. The task's discovery and evaluation tools therefore call Astra explicitly with:

```json
{
  "model": "gpt-6-astra",
  "temperature": 1,
  "maxResponseTokens": 32000,
  "config": { "reasoning_effort": "high", "tools": ["web_search"] }
}
```

Native web research is primary. Request JSON in the prompt and validate the returned text with JSON.parse and Zod; a forced provider JSON response format was incompatible with native web in the tested runtime. The outer task still uses a validated outputSchema. Managed page retrieval checks cited excerpts and exact public contact addresses. Model-authored URLs are not treated as verified native citation metadata. Unknown evidence remains visible, guessed emails are rejected, and events must exist in the run snapshot. The visible stream contains activity and concise findings, not private chain of thought. No fallback model is used.

## Platform and dependencies

This app runs on Remy/MindStudio's managed method, database, authentication and email runtime. Open source does not mean it is a standalone Node server: running it requires a compatible platform workspace and access to the specified model. AI/provider keys are handled by the platform.

- Backend: TypeScript, `@mindstudio-ai/agent`, Zod.
- Frontend: React, Vite, Zustand, wouter, Radix Dialog, Motion, Tabler icons.
- Eight managed tables; one web interface. Specs are authored in `src/`, generated code in `dist/`.

## Setup

1. Create/import the project into a compatible Remy workspace and use that app's identifier in `mindstudio.json`.
2. Install dependencies in `dist/methods` and `dist/interfaces/web`.
3. Configure the following in the **platform secret store**, independently for development and production:
   - `COHOST_API_BASE_URL`: the separate CoHost app's HTTPS service base URL.
   - `COHOST_API_KEY`: its Bearer API key.
4. Restrict platform email-code signups to the operator's actual address. Add a **non-empty** allowlist and enable it. Do not implement an imitation allowlist in client code. The development test account bypasses the platform allowlist only in dev.
5. Assign an app-owned sending domain or platform subdomain. In Settings, enter the managed sending address and explicitly request a verification email to your operator inbox. The service enforces From-domain authorization and its receipt is checked against the requested address.
6. Set your display name and Reply-To. Test delivery is the default. Enable Live delivery separately, then approve each draft individually.
7. Use Settings to check CoHost and the Astra task/high-reasoning/native-web path. A configured model is not shown as a tested connection until a live check succeeds.

The API URL and key never go into frontend code, browser storage, prompts, fixture files or this README. No real operator email, API credential or sender address is included in the repository. No Gmail or Hunter OAuth connection is required.

### CoHost contract

```text
GET {COHOST_API_BASE_URL}/_/api/sponsorable-events
Authorization: Bearer {COHOST_API_KEY}
Optional query: city, vertical, from, to, limit
```

Response: `{ count, events }`. Each event retains `id`, `title`, `description`, `url`, `city`, `vertical`, `audience`, `size.capacity`, `size.bucket`, `date.iso`, `date.unixMs`, `sponsorshipNeed`, and `host.{name,company,verified,eventsHosted}`. There is no undocumented pagination or write endpoint. Full contract: [CoHost spec](src/integrations/cohost.md).

## Safe demos and testing

- **Sponsorship Desk** seeds eight fictional companies, six events, eight assessments, two sample drafts and fourteen recorded activity entries. Every fixture is visibly sample-only. Simulation does not call email services.
- **Empty Workspace** clears development business data and exposes first-use states. Scenarios never modify secrets, file stores or production data.
- The platform dev sign-in helper uses `remy@mindstudio.ai` and code `123456`. This is a platform dev mechanism, not a shipped authentication backdoor. Other addresses receive real codes.
- Live scouting never consumes fictional maintained companies. Editing a sample recipient does not make the draft sendable.
- Run `npm run typecheck` in both package directories, and `npm run build` in the web package.

## Delivery and recovery boundaries

Typed `email.send` sends marketing outreach with unsubscribe protection. Accepted is not Delivered, and Delivered only means the receiving server accepted the message. A `batchId` correlates logs; it is **not** an idempotency key. The app acquires a durable unique attempt claim before submission and does not automatically retry ambiguous outcomes. Missing mail logs do not prove nothing sent.

Stopping a run stops acceptance of new results. It does not guarantee cancellation of in-flight model work. The worker has a bounded work window and saved checkpoints, not automatic crash resumption. A stale run can be explicitly abandoned without deleting saved work; late workers are fenced out.

Host introductions and interested-sponsor responses are handled manually through Elly's inbox and the linked CoHost event. No automatic mailbox processing or interest write-back is included.

## Publication

Publishing the app or repository is a separate release decision. Before publication, verify the real operator allowlist, CoHost connection, Astra availability and managed sender. Scan commits for credentials and private data. Build-time brand artwork is referenced by hosted URL rather than committed image binaries.

## License

MIT for the original app code; third-party dependencies keep their respective licenses. The model and runtime are provided by their operators, and no provider sponsorship or endorsement is implied.
