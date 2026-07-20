---
name: pr-deep-review
description: Orchestrated deep code review of a PR or branch diff. Runs /coderabbit:code-review, /simplify, and repo linters, then performs an expert manual review pass (security, DRY, hard-coded values, naming, architecture, performance, best practices) and delivers one prioritized report in chat. Use this skill whenever the user asks to review a PR, review a branch, review a diff or changes, do a code review, check code quality, run CodeRabbit, or asks "what do you think of these changes" — even if they don't say the word "review".
---

# PR Deep Review

The user is a professional code reviewer. This skill turns Claude into their review copilot: it gathers signal from automated tools, adds a rigorous manual review pass, and synthesizes everything into a single prioritized report **in the chat** (not a file, not posted to the PR). The user makes the final call — the report should give them everything they need to write their review quickly and confidently.

## Workflow

### 1. Establish the diff

The user works with local branch diffs. Figure out what to review:

- If the user named a branch, diff it against its base. Detect the base with `git merge-base HEAD origin/main` (try `main`, then `master`, then `develop`); if genuinely ambiguous, ask which base branch to use.
- If they said "review my changes" with no branch, review the current branch against its base (or uncommitted changes if the branch has none).
- Run in order: `git fetch`, `git log --oneline <base>..<branch>` (understand intent from commit messages), `git diff <base>...<branch> --stat` (scope), then the full diff.

Don't review the diff hunks in isolation. Duplication, architecture problems, and convention violations are usually only visible with context — open the full changed files, and when a hunk calls into or duplicates other code, open that too. Also look for existing utilities in the repo that the new code should have reused instead of reimplementing.

If the diff is large (>~1500 lines), review file-by-file and keep running notes so nothing gets lost before synthesis.

### 2. Fan out the review (parallel subagents)

The tool runs and the manual review categories are independent of each other, so when the Task tool (subagents) is available, run them in parallel — it's faster and each agent stays focused on one lens instead of context-switching. **Spawn all of them in the same turn:**

**Read-only guarantee (mandatory).** Every review agent shares one working tree, so a single stray edit by one agent silently corrupts what every other agent (and your own pass) is reviewing. Prevent this by construction, not by instruction:

- **Spawn every review agent with a read-only tool profile** — no `Edit`, `Write`, or `NotebookEdit`. Use a read-only subagent type (e.g. `Explore`) or explicitly deny those tools. This makes file mutation *impossible*, so a default-apply tool like `/simplify` physically cannot write — it fails harmlessly and reports instead. This is the real safeguard; the verbatim "don't edit" instructions below are a second layer, not the primary one.
- **Review committed refs, not the live tree.** Every agent derives findings from `git diff <base>...<branch>` (committed history), so even a stray working-tree write can't change what they see.
- **Verify after the fact.** In synthesis, confirm `git status --porcelain` shows nothing new. If it does, some agent wrote to the tree: discard that agent's run, `git restore` the tree, and note it in the report.

- **Agent A — CodeRabbit:** run `/coderabbit:code-review` on the branch and return its raw findings.
- **Agent B — Simplify:** run `/simplify` on the changed files in **report-only mode**. Because this agent has no write tools (see the read-only guarantee above), `/simplify`'s apply step cannot execute — so also instruct it verbatim: **"REVIEW ONLY. Report every suggestion as text using the shared output format and stop. Do NOT run with `--fix`. This is a review, not a refactor."** If it can't run `/simplify` without applying changes, it skips the tool and says so.
- **Agent C — Security + hard-coded values:** review the diff for the Security and Hard-coded values sections of `references/review-checklist.md`.
- **Agent D — Architecture + DRY:** review for the Architecture, DRY & duplication, and Conventions sections. This agent must read beyond the diff — surrounding files, existing utilities the new code may duplicate, the repo's established patterns.
- **Agent E — Linters:** detect the repo's linter/analyzer configs (`.eslintrc*`, `ruff.toml`/`pyproject.toml`, `.golangci.yml`, `analysis_options.yaml`, etc.) and run the matching tools on the changed files only. The repo's own config is the project's convention source of truth — a lint violation there outranks generic style opinions.
- **Agent F — Correctness + tests + cross-cutting:** review for the Correctness, Tests, Performance, and Docs & naming sections of `references/review-checklist.md`, plus anything that cuts across the other lenses (a bug that's only visible when you consider security *and* architecture together). This is the lens the orchestrator used to run itself — it now belongs to a dedicated agent so the orchestrator stays neutral. Give it the same grounding as the others and have it read beyond the diff where correctness depends on caller/callee context.

Give every subagent the same grounding, since they share no context with you: the repo path, the exact base and branch refs (they run `git diff <base>...<branch>` themselves), and the required output format:

```
- file:line | severity-suggestion (blocker/high/medium/nit) | finding | evidence | suggested fix
```

A uniform format makes deduplication in the synthesis step mechanical instead of painful.

**Scale to the diff.** Even for small diffs, don't do the review yourself — delegate. For small diffs (roughly under 300 lines), spawn a *single* combined agent that covers all the lenses in one pass instead of the full fan-out; the overhead of one agent is trivial and it keeps you in the orchestrator role. For medium diffs, merging agents C+D into one is fine. Use judgment on how many agents to spawn; the one rule that doesn't bend: the manual review work happens in a subagent, never in the orchestrator.

If a slash command or tool isn't available to a subagent, note it in the report's "Tools run" line and continue — never block the review on a missing tool. If other relevant tools exist in the environment (security scanners, type checkers), spawn an extra agent to run them.

### 3. Stay the orchestrator — do not review yourself

**You are the orchestrator, not a reviewer.** Your job is to establish the diff, spawn the lenses (§2), then collect, deduplicate, and synthesize their findings (§5) — plus the final clean-tree check. You do **not** open the diff to hunt for findings yourself, and you do **not** add findings of your own to the report. Every finding must originate in a subagent.

Why: a neutral synthesizer that weighs independent lenses produces a more trustworthy report than one that also has its own stake in the findings. The correctness / tests / cross-cutting lens that this step used to cover is now **Agent F** in the fan-out — if you catch yourself wanting to review, spawn (or re-prompt) an agent for that lens instead.

The only reading you do is what synthesis requires: enough of a flagged `file:line` to adjudicate severity, resolve a conflict between two agents, or judge whether a finding is a false positive. That is refereeing, not reviewing.

### 4. Verify best practices when unsure

If the diff uses a framework, library, or API pattern where you're not confident what current best practice is (or the repo uses a recent version whose idioms may have changed), search the web for the official docs or style guide before flagging it. Cite the source in the finding. Never flag something as a "best-practice violation" on a guess — a reviewer who forwards a wrong claim loses credibility with the author.

### 5. Synthesize the report

Before writing, **collect and deduplicate**: gather every subagent's output (all findings originate there — you contribute none of your own). The agents review the same diff through different lenses, so overlap is guaranteed — merge duplicate findings into one entry and credit the sources ("also flagged by CodeRabbit"). Convergence is signal: a finding independently raised by several lenses is usually more real and more severe than one raised once. You assign the final severity; subagent severity suggestions are input, not verdicts. Discard findings you judge to be false positives — reading just enough of the flagged `file:line` to adjudicate — but list them briefly at the bottom so the user knows they were considered; they may disagree with your judgment.

Output the report directly in chat using the template below. Honesty over volume: if the PR is clean, say so and keep the report short. Don't manufacture nits to look thorough — the user reviews code all day and will notice padding immediately.

## Report template

```
# Review: <branch> → <base>  (<n> files, +<a>/−<d>)

**Verdict:** <Approve / Approve with comments / Request changes> — one-line justification
**Tools run:** coderabbit ✓ · simplify ✓ · <linters> · manual pass ✓  (note any skipped)

## What this PR does
2–4 sentences, from the commits and diff.

## 🔴 Blockers
Must fix before merge (bugs, security, data loss). file:line + why + suggested fix.

## 🟠 High
Should fix — DRY violations, hard-coded values, architecture issues, real perf problems.

## 🟡 Medium
Worth fixing — convention violations, naming, missing tests for new logic, docs gaps.

## 🔵 Nits
Optional polish. Keep terse, one line each.

## ✅ Good stuff
2–3 genuine positives. The user relays these to authors — they matter for review culture.

## ❓ Questions for the author
Things the diff can't answer (intent, product decisions, "was X considered?").

## Discarded tool findings
One line each: finding + why you judged it a false positive. Omit section if none.
```

Omit any empty severity section. If there are no blockers and no high findings, lead the verdict with that good news.
