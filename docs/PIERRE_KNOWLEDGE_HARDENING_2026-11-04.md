# Pierre public knowledge — forensic hardening receipt (2026-11-04)

## Scope and preservation
- Baseline source commit: `5eefcf52f12d8dbb2c9b8fa13b1464dae6531346`.
- Immutable rollback branch: `safety/pierre-before-knowledge-hardening-20261104`.
- The approved question bank `knowledge/public-qa.v1.json` was NOT edited.
- Code Capsule `creative-spark.github.io/Pierre-language-data.html`, its browser `cloudFS` records, mentor identities, navigation, audio controls and remote administrative surfaces were NOT edited.
- No remote submissions, publication automation, or private-source imports activated.

## Verified source inventory
- 530 approved-public-seed records; 530 unique IDs; all required Q&A fields present.
- 527 unique normalized question texts; 3 surplus repeated question records, retained in JSON.
  - What is code-switching? IDs `pierre-public-025`, `pierre-public-127`, `pierre-public-394`.
  - What is language revitalization? IDs `pierre-public-128`, `pierre-public-388`.
- 67 raw topic labels normalize to 61 label spellings by case, punctuation between words, and whitespace; this normalization does not edit the source records.
- Existing publication status is `editorial-seed` at bank level and `approved-public-seed` at record level.

## Implemented code-only hardening
- Exact question matches are evaluated before greetings, generic heuristics and specialist referrals, after the existing credential safety guard.
- Question comparison accepts minor terminal punctuation differences, while answers and publication records remain unchanged.
- Similarity answers require greater overlap confidence; weak matches fall through to explanatory guidance.
- Topic lookup normalizes letter case, hyphens and whitespace.
- Loading requires matching schema and Pierre mentor identity; bank size bounded to 5000 records.
- Locally queued unknown questions reject `www.` URLs; no remote queue delivery.

## Regression evidence
- In an isolated simulated browser, the actual conversation script loaded 527 unique questions and returned the expected approved answer for 527/527.
- The local queue test confirmed ordinary unknown questions may be saved on the device while child-related and `www.` URL questions are excluded.
- `tests/pierre-knowledge.test.mjs` contains six Node built-in test cases. Run `node --test tests/pierre-knowledge.test.mjs`.
- Full Node CI / live browser and voice tests are NOT claimed by this receipt.

## Boundaries requiring later review
- The same-origin approved dictionary export has no configured live URL. Do not point the adapter at private AIPCore records or bypass provenance checks.
- The Creative Spark Code Capsule uses the browser-local `cloudFS` key, shared with several other mentor Code Capsule files when hosted on the same origin. No migration or silent namespace change is authorized.
- Unanswered-question review is browser-local and only best-effort filtered. Treat it as potentially personal data; do not automatically upload learner questions.
- Three repeated questions have divergent approved answers; human editorial review is needed to choose canonical wording.
- Validate browser, mobile, offline, language scripts, audio controls, and deployment independently before assigning production readiness.

## Reversal
The preserved branch contains the complete pre-hardening repository snapshot. Only `pierre-conversation-v1.js`, new regression tests and this receipt are intended hardening changes. Revert the script selectively rather than resetting the whole repository if unrelated commits follow.
