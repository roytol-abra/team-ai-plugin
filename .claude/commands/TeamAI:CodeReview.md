# TeamAI Code Review

Two-layer review system: Claude reviews locally before you push, CodeRabbit reviews the PR after you push.

## How It Works

1. **Local review (this command)** — Claude runs a 4-agent parallel review on your working changes. Catch issues before they reach the PR.
2. **PR review (CodeRabbit)** — once you push and open a PR, CodeRabbit automatically reviews it on GitHub/GitLab with its own AI analysis, inline comments, and auto-generated walkthrough.

Together they form a safety net: local review catches issues early and fast, CodeRabbit catches anything that slips through and provides a persistent review trail on the PR itself.

## CodeRabbit Setup

If CodeRabbit is not yet installed on your repo:
1. Go to https://coderabbit.ai and sign in with your GitHub/GitLab account
2. Install the CodeRabbit app on your org/repo
3. Add a `.coderabbit.yaml` in your repo root to customize:

```yaml
reviews:
  profile: "assertive"        # thorough reviews, not lenient
  high_level_summary: true    # walkthrough at top of every review
  poem: false                 # no poems, we're serious people
  review_status: true         # show review progress
  path_instructions:
    - path: "src/**"
      instructions: "Check for DRY violations, hardcoded values, and separation of concerns"
    - path: "**/*.test.*"
      instructions: "Verify test coverage for edge cases, not just happy path"
  auto_review:
    enabled: true
    drafts: false             # don't review draft PRs
early_access: true
chat:
  auto_reply: true            # respond to follow-up questions on comments
```

4. CodeRabbit will now auto-review every PR. You can also tag `@coderabbitai` in PR comments to ask it questions.

## Local Review (Claude Agents)

Adopt CodeRabbit's review philosophy for the local pass: be thorough, opinionated, and actionable. Every finding includes a concrete fix — not just a complaint.

### Review Principles

1. **Walkthrough first** — high-level summary of what the changes do before line-by-line comments
2. **Sequence diagrams** — for changes that affect control flow or multi-component interactions, generate a Mermaid diagram
3. **Line-by-line precision** — every comment references an exact file and line range with a concrete code suggestion
4. **Categorized feedback** — separate critical blockers from suggestions and nitpicks
5. **Praise good patterns** — call out well-written code and smart abstractions
6. **Cross-file awareness** — check how changes in one file affect others, look for broken contracts
7. **Learnable comments** — explain WHY behind each suggestion so the author learns

## Target

Review: $ARGUMENTS

If no target is specified, review all staged changes (`git diff --cached`). If nothing is staged, review all uncommitted changes (`git diff`).

## Review Process

Use agent teams to parallelize the review. Spawn the following review agents in parallel:

### Agent 1: Architecture & DRY Review
- Identify duplicated logic (3+ similar lines = extract)
- Check separation of concerns — business logic in views? Data fetching in components?
- Verify single responsibility — each function/class does one thing
- Check for proper abstraction levels — no leaky abstractions, no premature ones
- Flag God classes/functions (>200 lines)
- Verify consistent patterns across similar files
- Check for broken contracts between changed files and their dependents
- Verify that new abstractions follow existing codebase patterns

### Agent 2: Security & Hardcoded Values Review
- Scan for hardcoded secrets, API keys, tokens, passwords, connection strings
- Check for hardcoded URLs, IPs, ports — these should be config/env vars
- Flag magic numbers and strings — extract to named constants
- Check for SQL injection, XSS, command injection vulnerabilities
- Verify input validation at system boundaries
- Check for sensitive data in logs or error messages
- Verify proper error handling — no swallowed exceptions, no stack traces exposed to users
- Check for new attack surface introduced by the changes

### Agent 3: Best Practices & Code Quality Review
- Check naming conventions — clear, descriptive, consistent with codebase
- Verify proper error handling and edge cases
- Check for potential null/undefined issues
- Review async/await patterns — proper error handling, no floating promises
- Check for memory leaks (unclosed streams, missing cleanup, event listener leaks)
- Verify proper typing — no `any`, no type assertions without justification
- Check for unused imports, variables, dead code
- Review test coverage for changed code — are new paths tested?
- Check for race conditions in concurrent/async code

### Agent 4: Performance & Efficiency Review
- Check for N+1 queries, unnecessary re-renders, redundant computations
- Verify proper use of caching, memoization where appropriate
- Check for unnecessary network calls or database queries
- Review bundle size impact for frontend changes
- Flag O(n²) or worse algorithms on potentially large datasets
- Check for unnecessary object allocations in hot paths

## Output Format

After all agents complete, compile a unified CodeRabbit-style review report:

```
## Walkthrough

[2-4 sentence summary of what these changes accomplish and how they fit into the codebase. Written for someone who hasn't seen the PR yet.]

## Sequence Diagram (if applicable)

[Mermaid diagram showing the flow of the changed code — API calls, component interactions, data flow. Only include if the changes affect control flow or multi-component interactions.]

## Changes

| File | Change Summary |
|------|---------------|
| `path/to/file` | Brief description of what changed and why |

## Review

### 🔴 Critical Issues (must fix before merge)

**`file/path.ts` (lines 42-58)**
> [quote the problematic code]

**Issue:** [What's wrong]
**Why it matters:** [Impact — security risk, data loss, runtime error, etc.]
**Suggestion:**
```
[concrete replacement code]
```

---

### 🟡 Suggestions (should fix)

**`file/path.ts` (line 15)**
> [quote the code]

**Suggestion:** [What to improve and why]
```
[concrete replacement code]
```

---

### 💡 Nitpicks (optional improvements)

**`file/path.ts` (line 88)**
[Brief suggestion — naming, style, minor optimization]

---

### ✅ Notable Good Patterns

- **`file/path.ts`**: [What was done well and why it's a good pattern]

---

## Scores

| Category | Score | Notes |
|----------|-------|-------|
| DRY | X/10 | [one-line justification] |
| Security | X/10 | [one-line justification] |
| Architecture | X/10 | [one-line justification] |
| Performance | X/10 | [one-line justification] |
| Code Quality | X/10 | [one-line justification] |
| **Overall** | **X/10** | |

## Verdict: ✅ Approve | 🟡 Approve with suggestions | 🔴 Request changes
[One sentence — what blocks or what was great]
```

## Rules

- Every finding must include: exact file path, line range, quoted code, explanation, and a concrete code suggestion
- No vague feedback — "consider improving readability" is banned; "rename `d` to `dateString` for clarity" is correct
- Cross-reference findings — if a DRY violation in file A relates to duplicated code in file B, link them
- When suggesting a fix, make sure the suggestion actually compiles/works — don't suggest broken code
- If the change is clean and well-written, say so — don't manufacture issues to justify the review
