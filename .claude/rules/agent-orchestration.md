# Agent Orchestration Rules

When working on tasks that benefit from parallel execution, use agent teams. These rules govern how agents are spawned and coordinated.

## Available Agents

Agent definitions are in `.claude/agents/`. Each agent has a specific role:

| Agent | Use For |
|-------|---------|
| Backend | Server-side code, APIs, database, auth |
| Frontend | UI components, styling, state management, accessibility |
| Planning | Architecture, task decomposition, risk assessment |
| Security | Vulnerability scanning, security review, secrets detection |
| PR Review | Pull request review, change assessment |
| Standards Enforcer | Style guide compliance, naming, code structure |

## When to Use Agent Teams

**Use parallel agents when:**
- Reviewing code (security + standards + quality can run simultaneously)
- Implementing independent modules (backend API + frontend component)
- Running multiple types of analysis (performance + security + standards)
- Building features with clear separation (data layer + UI layer + tests)

**Use sequential agents when:**
- Planning must complete before implementation
- Backend API must exist before frontend integration
- Tests must be written before code (TDD)
- One agent's output feeds another's input

## Spawning Rules

1. **Self-contained prompts** — each subagent gets ALL context it needs: file paths, code patterns, constraints, specs. It cannot see the parent conversation.
2. **Use worktrees for writes** — if a subagent modifies files, use `isolation: "worktree"` to prevent conflicts between parallel agents.
3. **2-4 agents per batch** — don't spawn more than 4 parallel agents. More than that produces diminishing returns and higher conflict risk.
4. **Trust but verify** — always read the actual files changed by subagents. Don't trust their summary alone.
5. **Include agent definition** — reference the agent's role file content in the prompt for consistent behavior.

## Coordination Pattern

```
1. Plan (sequential) → Planning Agent breaks down the work
2. Execute (parallel) → Backend + Frontend + Tests agents work simultaneously  
3. Review (parallel) → Security + Standards + PR Review agents audit the result
4. Integrate (sequential) → Team manager resolves conflicts and verifies
5. Present (sequential) → Show user the result, wait for approval
```

## Prompt Template for Subagents

When spawning a subagent, include:
- **Role:** reference the agent definition from `.claude/agents/`
- **Task:** specific deliverable
- **Context:** file paths, specs, existing patterns to match
- **Constraints:** what NOT to do, scope boundaries
- **Expected output:** what files to create/modify, what to report back
