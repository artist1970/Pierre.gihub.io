# Pierre dictionary and grammar integration — controlled hardening receipt
Date: 2026-11-04
Status: grammar guidance implemented; dictionary export NOT commissioned.

## Source ownership
- AIPCore (`artist1970/AIPCore`) privately owns the canonical vocabulary. Its generated catalog reported 2,468 unique words on 2026-08-08; no public approval or export entitlement is implied.
- Creative Spark owns creative language templates and optional style refinements, not canonical word definitions.
- Pierre's public mentor page only accepts separately approved same-site `knowledge/*.json` dictionary exports.
- `Pierre-language-data.html` remains a browser-local Code Capsule; its `cloudFS` and encrypted vault are untouched.

## Implemented
1. Added `pierre-grammar-guide-v1.js` as a bounded opt-in English grammar explainer. Only input beginning with `grammar check:` or `check my grammar:` enters it.
2. Connected the guide before the existing conversation engine. It does not rewrite student input, invoke remote AI, touch local storage, or silently change published answers.
3. Added positive English article-sound examples and basic capitalization/spacing/punctuation guidance; explicitly warns that no detected issue is not a full grammar certification.
4. Strengthened the existing dictionary adapter's URL restriction: same origin AND relative to the current Pierre project's `knowledge/` directory AND `.json` extension. Existing provenance, public approval, duplicate, schema and size checks remain.
5. Added `tests/pierre-grammar-dictionary.test.mjs`, six regression cases using synthetic vocabulary data only. No canonical AIPCore words were copied.
6. Kept the dictionary disabled by default: `window.PIERRE_PUBLIC_DICTIONARY_URL` remains unset, and no public dictionary export was created.

## Verified
- Isolated runtime: Pierre's current conversation script returned approved answers for 527/527 normalized unique questions from the preserved 530-record JSON bank after grammar routing.
- Isolated runtime: explicit grammar examples for `a apple`, `an university`, `a hour` and a correct sentence returned bounded guidance.
- Isolated adapter: empty configuration disabled, cross-origin private AIPCore URL blocked, same-origin sibling project blocked, synthetic same-site approved export accepted and looked up correctly.
- GitHub file SHA for `knowledge/public-qa.v1.json` remains `26439e221d72bbfacb880e56d2d0b7052965d202`.

## Remaining verification before production claims
- Run both Node test files with `node --test tests/*.test.mjs`; the combined Node test suite has not been run in this audit.
- Test real browser deployment, mobile, offline, voice, and RTL scripts separately.
- AIPCore owner must explicitly review the lexical entries and approve a versioned PUBLIC projection. Require independent provenance and editorial verification; do not expose private repository URLs or data.
- Do not activate cross-repository publishing, automatic Code Capsule sync, or private administrator submissions.
- Existing approved dictionary caching may warrant a revocation/version policy before enabling a public export.

## Recovery
- Pre-hardening branch: `safety/pierre-before-knowledge-hardening-20261104`.
- For a targeted rollback, restore `index.html`, `pierre-conversation-v1.js`, and `pierre-dictionary-adapter-v1.js` from that branch, and remove the new grammar guide and regression test only if intentionally reverting these features. Avoid resetting unrelated repository work.
