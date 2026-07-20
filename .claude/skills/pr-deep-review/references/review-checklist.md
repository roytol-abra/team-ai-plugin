# Manual Review Checklist

Work through each category against the diff. Skip categories that clearly don't apply (e.g., no UI → skip accessibility), but skip consciously, not by omission.

## Correctness
- Off-by-one, null/undefined/None paths, empty-collection handling
- Error paths: are exceptions caught at the right level? Swallowed errors? Missing rollback/cleanup on failure?
- Concurrency: shared mutable state, race conditions, missing locks/transactions, async functions called without await
- Edge inputs: empty string, 0, negative numbers, very large inputs, unicode, timezone/DST for any date math

## DRY & duplication
- Logic duplicated between files in this diff
- New code that reimplements an existing repo utility/helper — grep the repo for similar function names and patterns before concluding it's new
- Copy-pasted blocks with one variable changed (candidate for extraction)
- Duplicated validation/constants between client and server, or between code and tests, without a shared source of truth
- BUT: don't push premature abstraction. Two similar-looking blocks with different reasons to change are fine (rule of three). Flag duplication when the copies must stay in sync to be correct.

## Hard-coded values
- Secrets, tokens, API keys, passwords — even in test files (🔴 always)
- URLs, hostnames, ports, file paths → config/env
- Magic numbers: timeouts, retry counts, limits, sizes → named constants with a comment on why that value
- User-facing strings when the repo has an i18n/localization system
- Environment assumptions: hard-coded `prod`/`staging` strings, region names, account IDs
- Dates/versions that will silently go stale

## Conventions & best practices
- Repo-first: infer conventions from the surrounding code — naming style, error-handling pattern, import ordering, file/folder layout, test naming. New code that ignores the local dialect is a finding even if it follows generic style guides.
- Language idioms: e.g., Python — mutable default args, bare `except`; JS/TS — `any` leakage, floating promises, `==`; Go — ignored errors; C# — async void, IDisposable not disposed
- Framework idioms: check current official guidance if unsure (web-search rather than guess)
- API design of new public surface: consistent naming, sensible defaults, hard to misuse
- Commit hygiene: unrelated changes bundled in, generated files or debug prints committed, commented-out code left behind

## Security
- Injection: SQL/NoSQL built by string concat, shell commands with user input, unsanitized HTML (XSS), path traversal from user-supplied paths
- AuthN/AuthZ: new endpoints without auth checks, authorization checked client-side only, IDOR (fetching by id without ownership check)
- Secrets & PII: logged tokens/passwords/PII, sensitive data in error messages or URLs
- Unsafe deserialization, `eval`, dynamic imports of user input
- Dependency changes: new packages — are they well-known? Version pins loosened?
- Crypto: home-rolled crypto, weak hashes for passwords, non-constant-time comparisons of secrets

## Architecture
- Logic in the wrong layer (business rules in controllers/UI, DB queries in views)
- New coupling: module A now imports module B's internals; circular imports
- Leaky abstractions: implementation details escaping through interfaces (e.g., DB rows returned raw to callers)
- Growth patterns: a class/file that was already big getting bigger instead of being split; switch/if-else chains on type that should be polymorphism or a map
- Consistency with existing architecture: if the repo uses repository pattern / DI / event bus, does the new code follow, or bypass it?
- Backward compatibility: changed public APIs, DB schema changes without migration, message/contract changes affecting other consumers

## Performance
- N+1 queries (query inside a loop); missing eager-loading/joins
- Work hoistable out of loops: compilation, regex construction, allocations, repeated lookups
- Unbounded: reading whole files/tables into memory, missing pagination, caches without eviction
- Blocking calls in async/event-loop contexts
- Missing indexes for new query patterns (flag as a question if schema isn't in the diff)
- Only flag performance issues on paths where it plausibly matters — a one-time startup loop over 10 items is not a finding.

## Tests
- New logic without tests; changed logic whose tests weren't updated (tests may now pass vacuously)
- Tests asserting implementation details instead of behavior (brittle)
- Missing negative/edge-case tests for the risky parts of the diff
- Flakiness risk: real time/sleep, real network, order-dependent tests

## Docs & naming
- Names that lie or under-describe (`data`, `handle`, `temp`, `flag2`)
- Public functions/APIs missing docstrings when the repo has that convention
- Comments explaining *what* instead of *why*; stale comments contradicting the code
- README/config docs not updated for new env vars, flags, or setup steps introduced by the diff
