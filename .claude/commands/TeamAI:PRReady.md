# TeamAI PR Readiness Check

You are a senior developer performing a final pre-PR audit. Your job is to verify that this branch is ready to open a pull request — nothing missing, nothing broken, nothing embarrassing.

This is a **3-phase flow**: automated gates → full code review → PR summary.

## Target

Branch/changes to check: $ARGUMENTS

If no target is specified, check the current branch against its base (usually `main` or `dev`).

## Phase 1: Automated Gates

Run these checks using agent teams in parallel. These are hard gates — if any fail, stop and report. No point running a code review on code that doesn't build.

### Agent 1: Code Quality Gate
1. Run the project's linter — collect all errors and warnings
2. Run the project's type checker (if applicable) — must pass clean
3. Run prettier/formatter check — are all files formatted?
4. Run the project's test suite — must pass
5. Check build succeeds — `npm run build`, `flutter build`, `cargo build`, etc.
6. If any of these fail, report the exact errors

### Agent 2: Change Audit
1. `git diff [base]...HEAD --stat` — list all changed files
2. For each changed file, verify:
   - No debug code left behind (`console.log`, `print`, `debugger`, `TODO`, `FIXME`, `HACK`)
   - No commented-out code blocks
   - No hardcoded secrets or API keys
   - No `.env` files or credentials staged
   - No unintended file changes (lock files, generated files, IDE config)
3. Check commit history:
   - Are commit messages clear and descriptive?
   - Any fixup/squash commits that should be combined?
   - Any WIP commits?

### Agent 3: Security Quick Scan
1. Run secrets scan (grep for patterns: API keys, tokens, passwords, connection strings)
2. Check for new dependencies — any known vulnerabilities?
3. Verify no sensitive data in test fixtures or mocks
4. Check file permissions on any new scripts

### Gate Decision

If any **critical** gate fails (lint errors, type errors, build failure, secrets found):
- Report the failures with exact errors
- Set verdict to ❌ NOT READY
- **Skip Phase 2** — fix the gates first, then re-run

If all gates pass (or only warnings remain): proceed to Phase 2.

## Phase 2: Full Code Review

Run `/project:TeamAI:CodeReview` on the branch changes. This triggers the full 4-agent parallel CodeRabbit-style review:
- Architecture & DRY
- Security & Hardcoded Values
- Best Practices & Code Quality
- Performance & Efficiency

Wait for the code review to complete. Incorporate its findings into the final report:
- Code review 🔴 Critical issues become PR blockers
- Code review 🟡 Suggestions become PR warnings
- Code review scores are included in the final report

## Phase 3: PR Summary & Final Report

After Phase 1 gates and Phase 2 code review are complete, compile the final report.

### Agent 4: PR Content Preparation
1. Summarize what this PR does (2-3 sentences)
2. List all meaningful changes grouped by area (frontend, backend, config, tests)
3. Identify breaking changes
4. Identify what needs manual testing
5. List any migrations or environment changes required
6. Check if README or docs need updating for these changes

## Output Format

```
## PR Readiness Report

**Branch:** [branch-name] → [base-branch]
**Files changed:** [count] | **Additions:** +[n] | **Deletions:** -[n]

---

### Phase 1: Gate Results

| Check | Status | Details |
|-------|--------|---------|
| Lint | ✅ / ❌ | [n] errors |
| Types | ✅ / ❌ | [n] errors |
| Format | ✅ / ❌ | [n] files unformatted |
| Tests | ✅ / ❌ | [n] failures |
| Build | ✅ / ❌ | |
| Secrets | ✅ / ❌ | [n] findings |
| Debug code | ✅ / ❌ | [n] findings |
| Commit history | ✅ / ❌ | [WIP commits, unclear messages] |

---

### Phase 2: Code Review Results

[Include the full CodeRabbit-style review output from /project:TeamAI:CodeReview]

**Review Scores:**
| Category | Score |
|----------|-------|
| DRY | X/10 |
| Security | X/10 |
| Architecture | X/10 |
| Performance | X/10 |
| Code Quality | X/10 |
| **Overall** | **X/10** |

**Review verdict:** ✅ Approve / 🟡 Approve with suggestions / 🔴 Request changes

---

### Phase 3: PR Summary

### 🔴 Blockers (fix before PR)
- [gate failures + code review critical issues]

### 🟡 Warnings (review before PR)
- [code review suggestions + audit warnings]

### PR Content (copy-paste ready)

**Title:** [suggested title]

**Description:**
[2-3 sentence summary]

**Changes:**
- [grouped list]

**Testing:**
- [what to test manually]

---

### Final Verdict: ✅ READY / ❌ NOT READY — [reason]

Gates: [pass/fail] | Code Review: [X/10] | Blockers: [count]
```
