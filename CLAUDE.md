# Project Configuration

## Features

- agentTeams: true — proactively use agent teams for tasks that benefit from parallel work (e.g., multi-file reviews, independent modules, competing approaches) without waiting for explicit request

## Preferences

- preferRootCauseAnalysis: true — always investigate the underlying cause, not just the symptoms
- avoidAssumptions: true — ask or verify rather than guessing about intent, state, or behavior
- askBeforeMajorRefactor: true — propose and get approval before large-scale structural changes
- explainBeforeCode: true — describe what you're going to do and why before writing code
- dryByDefault: true — flag duplicated logic, extract shared patterns, avoid copy-paste code
- noHardcodedValues: true — constants, config, and env vars instead of magic numbers and strings
- securityFirst: true — never commit secrets, always validate inputs at boundaries, follow OWASP top 10
- testBeforeShip: true — verify changes work before declaring them done

## Advisor Rules (Opus plans, Sonnet executes)

The advisor (Opus) must be consulted for all planning and decision-making. Sonnet handles execution only after the plan is validated.

**Always call advisor:**

- Before any planning discussion — feature scoping, architecture decisions, approach selection
- Before running `/opsx:propose` — advisor reviews the proposed scope, tasks, and design before the proposal is created
- Before starting implementation of a new ticket — advisor validates the plan and approach first
- When choosing between multiple technical approaches — advisor decides
- Before writing design docs or specs

**Skip advisor (Sonnet executes directly):**

- Applying an already-approved plan (writing code, editing files)
- Running lint, typecheck, tests, builds
- Git operations, storybook verification, Playwright checks
- Simple file reads, searches, and exploration
- Fixing lint/type errors during implementation

## Code Quality Rules

- **No hardcoded variant logic** — variant differences (visibility, layout, behavior) must be driven by configuration, props, or state — not scattered conditionals
- **Separation of concerns** — presentation logic stays in the view layer, business logic in services/controllers, data access in repositories
- **Guard at the source** — validate inputs and preconditions at the entry point, not in every downstream consumer. Add bounds checks as defense in depth, not as the primary guard.
- **Always bounds-check collection access** before passing values to callbacks or external contracts
- **Proper fixes, not patches** — when fixing bugs or review feedback, always address the root cause with a best-practice solution. No hacks, no workarounds, no downstream band-aids.
- **No magic numbers or strings** — all numeric literals and repeated string literals must be extracted to named constants or config
- **DRY code** — if you see 3+ lines repeated, extract to a shared function. If you see a pattern repeated across files, create a reusable abstraction.

## Propose Workflow (always follow when the user asks to propose anything)

Before creating any proposal:
1. Read the ticket/issue to fully understand the requirement
2. Create a branch for the proposal
3. If there are open questions or decisions needed — bring them up one by one, share your take in simple words, and discuss with the user before proceeding
4. Make sure you have all API endpoints and server data before finalizing the design
5. Write very small, verifiable test cases in the tasks — main happy path only, not edge cases
6. Keep the plan file always in sync with the codebase, spec files, and tasks after every change

After the proposal is created:
- Sync the openspec main spec with all sub-specs
- Update the issue tracker and add a comment summarizing the proposal scope
- Write a handoff prompt to another Claude for implementation (see Apply Handoff Flow)

## Apply Handoff Flow

The implementing Claude acts as a **senior developer team manager** — it orchestrates multiple subagents (via the Agent tool) to execute tasks in parallel where possible, reviews their output, and ensures quality and consistency.

**Role of the implementing Claude (team manager):**
- Read the full plan and break task groups into parallelizable units
- Spawn subagents for independent tasks — each subagent gets a focused, self-contained prompt with all context it needs
- Review subagent output before moving on — verify code quality, consistency with project conventions, and that specs are followed
- Handle dependencies between tasks sequentially — only parallelize truly independent work
- Resolve conflicts if two subagents touch overlapping files
- Own the sync responsibilities (specs, issue tracker, plan file)

**Per task group (mandatory — never skip steps):**
1. Explain in simple words what you're going to do, how, and why — identify which tasks can run in parallel via subagents
2. Spawn subagents for independent tasks within the group, giving each a clear brief (Role, Task, Context, Constraints, Expected Output)
3. Review all subagent results — verify correctness, fix integration issues between parallel outputs
4. **STOP** — present a summary of what was implemented to the user and wait for their questions. Do not continue until the user has no more questions.
5. Once the user has no more questions, write a commit message — **5 lines max, no storytelling, final state of the code only** — and **wait for the user to commit themselves**.
6. After the user confirms they've committed, ask for explicit approval to continue to the next task group.
7. On approval: mark the completed task as done, sync specs and issue tracker, then move to the next task group.

**Subagent guidelines:**
- Each subagent prompt must be self-contained — include relevant file paths, code patterns, API contracts, and constraints
- Use `isolation: "worktree"` for subagents that modify files, to avoid conflicts
- Prefer spawning 2-4 focused subagents over one large one — smaller scope = better results
- For code review of subagent output, the team manager reads the changed files directly rather than trusting the subagent's summary

## Prompt Structure for Handoff to Another Claude

When writing a prompt to be executed by another Claude instance, always structure it with these 7 sections:

1. **Role** — Define who the Claude should be. Think positioning and expertise, not just "be helpful."
2. **Task** — State the specific deliverable clearly and concisely.
3. **Context** — Provide relevant background: current state, constraints, audience, environment details.
4. **Not This** — Explicitly list what to avoid: generic advice, assumptions, shortcuts, or anti-patterns.
5. **Examples** — Show the expected format or structure with a concrete example.
6. **Output** — Define the exact output format, structure, and level of detail expected.
7. **Iteration** — Include a follow-up question or refinement step to improve the result in the next round.
