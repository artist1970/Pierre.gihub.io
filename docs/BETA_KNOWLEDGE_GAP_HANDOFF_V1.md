# Pierre → Beta Administrator Notifications · Integration Contract v1

**Status: staged; remote delivery disabled.** This contract is derived from the existing `vervenveda/vervenveda.github.io/beta/index.html` implementation. Do not claim administrator notifications are live without an authenticated, tested private receiver.

## Current topology

- Pierre's public chat: `https://artist1970.github.io/Pierre.gihub.io/`
- Beta program: `https://vervenveda.com/beta/`
- Separate origins mean Pierre's `localStorage` cannot be read by the Beta page.
- The Beta page's `VNV_ADMIN_SETTINGS_V1.bridgeEndpoint` setting is **browser-local to the Beta origin**. It does not establish a public API, a shared login, or a trusted endpoint for Pierre.
- The Beta page sends `{type:"beta_report",report:{id,at,date,sourceKey,idempotencyKey,page,message,status:"New"}}` to a configured HTTPS endpoint. It requires HTTP success and `{ok:true,receiptId:"<validated ID>"}` before reporting remote acceptance.
- Browser-local `VNV_ADMIN_NOTIFICATIONS_V1` and `VNV_ADMIN_BETA_V1` are local staging keys, **not** secure authenticated cloud storage.

## Knowledge gap event (private service only)

Proposed server-side envelope, not enabled in the public client:

```json
{
  "schema": "vnv-mentor-knowledge-gap-v1",
  "eventType": "mentor_knowledge_gap",
  "mentorId": "pierre",
  "topic": "french-pronunciation",
  "questionCandidate": null,
  "source": "public-mentor-chat",
  "reviewStatus": "pending",
  "consent": "not-obtained",
  "idempotencyKey": "<server-issued>"
}
```

Never send the raw transcript, IP address, account identifiers, learner IDs, private records, or browser storage keys. A public chatbot cannot establish whether a visitor is a child. Without a reviewed notice and appropriate consent, send **only aggregated anonymous knowledge-gap categories**, not visitor-authored question text. The existing local question queue is not a remotely deliverable inbox.

## Required before activation

1. Identify the *actual* protected Beta receiver and verify it belongs to the ecosystem. No guessed endpoints or embedded secrets.
2. Verify server-side authentication, abuse prevention, origin handling, schema checks, redaction, and retention/deletion policy.
3. Decide consent requirements for minors and anonymous visitors. Never silently transmit a visitor's question.
4. Add a dedicated event type and authenticated administrator review surface: pending → approved / edited / assigned / rejected, with audit receipts.
5. Test with **fictional** records: invalid/duplicate/private content, unauthorized requests, offline queue, network failure, revocation, and acknowledged delivery.
6. Publish approved public Q&A through a separate versioned process; no direct client write to mentor GitHub repositories.

## What is ready

Pierre already distinguishes unmatched questions and stores some locally, with duplicate and basic privacy checks. Beta already has a fail-closed report workflow. Neither is proof that cross-origin private delivery is authorized or operational. Keep the public landing page limited to chat.
