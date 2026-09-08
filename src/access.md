---
name: Operator Access and Setup
description: Minimal private access, non-secret profile preferences, and launch prerequisites.
---

# Operator Access and Setup

Sponsor Scout is Elly's private operator console. The public app URL opens a branded welcome with a passwordless sign-in, not a public dashboard. Sponsor data, contact research, event snapshots, notes, emails, and run activity are protected.

## Sign-in

Elly receives a [six-digit email code]{Use platform `email-code` authentication. The frontend calls `auth.sendEmailCode` and `auth.verifyEmailCode`; verification and sessions are platform-managed. Do not send codes yourself.} at her operator email. The interface shows the address, lets her correct it, accepts a pasted complete code, supports resend, and reports wrong or expired codes inline without moving the form.

The app is restricted to [Elly's supplied address]{Enforced with `remy-admin settings allowlist add <supplied-address>` and `allowlist enable`. The list must be nonempty; an enabled empty allowlist does not restrict access. Do not build a frontend or backend email-domain check as a substitute. Verify the platform setting before publication.} at the platform's code-send boundary. There is no password, public signup marketing, team management, or extra operator role.

~~~
Manifest auth: enabled true; methods ["email-code"]; auth table `users`, email mapped to its platform-managed email column. `roles: []` in the manifest. Do not require a role for ordinary app use because verified users start with no roles. Every app method requires non-null `auth.userId` and validates ownership of addressed rows; no method assumes frontend auth is trustworthy.

Use `auth.onAuthStateChanged` and clear all private store/cache data and event subscriptions on logout. Custom profile fields such as display name, reply address, configured sender metadata, intro-dismissed flag and delivery mode are optional until saved. The auth email is read-only from app code. No separate profiles table.

No delegated Remy sign-in is configured because this project's context does not declare it available. Do not offer Gmail OAuth as a login or send dependency.
~~~

The sign-in restriction is a [publication prerequisite]{Elly's actual address is not supplied yet. Do not invent one or deploy with a permissive signup policy while saying the app is locked. Local development uses the platform's test identity, not a production backdoor.}. The product's private methods remain gated during development too.

## Setup checks

After first sign-in, a compact preflight explains what the tool does and checks:

- **GPT-6 Astra:** the pinned research configuration is present and the latest actual model check/run is reported honestly. Configured, not checked, available, and failed are distinct states.
- **CoHost Club:** both secrets are configured and the latest authenticated connection test is shown.
- **Sending identity:** an app-owned managed address and a valid Reply-To are in place, with the selected delivery mode visible.

[Research and sending have separate gates]{A missing sender must not prevent sponsor research or draft editing. Astra and CoHost are required for live scouting. A confirmed recipient, valid current draft, app-owned sender, and Reply-To are required for live dispatch. Preflight shows the two readiness states rather than presenting email as necessary to find sponsors.}.

The operator avatar menu opens settings and sign-out. Settings let Elly edit her display name, reply inbox, and test/live delivery choice. To configure the managed sender, she enters the sending address from her app-owned platform subdomain or verified domain and explicitly requests a [sender check]{The SDK has no pre-send sender-identity read. Send one requested verification message only to the authenticated operator email, using the explicit app-owned From. The mail service enforces domain authorization. Mark senderVerified only if the resolved receipt From exactly matches the requested address and the operator is an accepted recipient. A mismatch or failure keeps live delivery disabled. This check email is transactional; sponsor outreach remains marketing.}. The verified address then appears in every outreach envelope. Arbitrary personal From addresses are not treated as approved senders. Secret values are [configured outside app forms]{Use the platform encrypted secret store through the dashboard or agent-assisted CLI setup. Return only configured flags and sanitized check results to the console.}.

## Safe delivery defaults

New profiles start in [Test delivery]{An app-owned setting, not an assumed SDK feature or a hardcoded environment test. A test action sends only to Elly's authenticated email or explicitly confirmed test inbox and is labelled as a test throughout. Never overwrite the sponsor recipient with the test inbox inside the saved draft.}. Real outreach requires Elly to enable live delivery explicitly and approve each email. The app does not infer that enabling a sender authorizes all future drafts.

Reply-To defaults to Elly's verified sign-in email and is shown at every confirmation. If she changes it, previously opened confirmations become stale. Actual sender setup uses a verified app-owned custom domain or available platform subdomain; the shared fallback sender is not treated as an approved cold-outreach identity.

## Development

The platform's [dev account]{Email `remy@mindstudio.ai`, fixed code `123456`, only in development. It bypasses the platform signup allowlist in dev; never add it to the production allowlist or implement it in frontend code.} is used for verification. Scenario role arrays are empty. Scenarios seed app records but never create a signed-in browser session or write platform-managed email fields.

An authenticated user's records and private realtime channel never become accessible to a different user, even if platform signup settings are misconfigured. Returning sessions skip the welcome and open the last selected run with the console shell intact.
