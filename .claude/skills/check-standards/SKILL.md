---
name: check-standards
description: Audit code against the team's internal style guide — naming, structure (function/file length, nesting, params), DRY, hardcoded values, error handling, security, testing, and import organization — with a severity-ranked report and a standards score. Use this ONLY when the user explicitly asks to check/audit/enforce coding standards, the style guide, or team conventions (e.g. "check standards", "does this follow our style guide?", "audit this against our conventions"). Do NOT trigger on general code review requests (that's the pr-deep-review skill) or incidental mentions of "standards".
---

# TeamAI Standards Check

You are a standards enforcer auditing code against the team's internal style guide and best practices. Your job is to find deviations, not to be lenient.

## Target

If the user named a path or scope, audit that. Otherwise audit all files changed in the current branch vs. its base.

## Standards to Enforce

### 1. Naming Conventions
- Files: `kebab-case` for most languages, `PascalCase` for components/classes, `snake_case` for Python
- Variables/functions: `camelCase` (JS/TS/Dart), `snake_case` (Python/Rust/Go)
- Constants: `SCREAMING_SNAKE_CASE` or project convention
- Components/classes: `PascalCase`
- Boolean variables: prefix with `is`, `has`, `should`, `can`
- Event handlers: prefix with `handle` or `on`
- Check consistency with existing codebase patterns — match what's already there

### 2. Code Structure
- **Max function length:** 40 lines (flag anything longer)
- **Max file length:** 300 lines (flag anything longer)
- **Max parameters:** 4 per function (use options object/config pattern for more)
- **Max nesting depth:** 3 levels (use early returns, extract functions)
- **Single responsibility:** each function does one thing, each file owns one concern
- **No barrel files** unless project convention uses them

### 3. DRY Violations
- Flag 3+ lines of duplicated logic across files
- Flag repeated patterns that should be abstracted
- Flag copy-pasted code with minor variations — should be parameterized

### 4. Hardcoded Values
- No magic numbers (extract to named constants)
- No hardcoded strings for display text (use i18n/constants)
- No hardcoded URLs, IPs, ports (use config/env)
- No hardcoded colors, sizes in component code (use design tokens/theme)
- No hardcoded feature flags (use config)

### 5. Error Handling
- No empty catch blocks
- No generic `catch(e)` without specific handling
- No swallowed errors (catch without logging or re-throwing)
- Proper error messages — specific, actionable, no stack traces to users
- Async operations must have error handling

### 6. Security Standards
- Input validation at system boundaries
- No innerHTML/dangerouslySetInnerHTML without sanitization
- No eval() or Function() constructor
- Parameterized queries for database access
- No secrets in code

### 7. Testing Standards
- New features have corresponding tests
- Test names describe the behavior, not the implementation
- No test code in production files
- No skipped tests without a TODO comment explaining why

### 8. Import Organization
- Standard library first, then external packages, then internal imports
- No circular imports
- No unused imports
- Consistent import style (named vs. default, relative vs. absolute)

## Audit Process

1. Detect the project's language and framework from file extensions and config files
2. Read the project's CLAUDE.md and any existing style guide for project-specific rules
3. Adjust the standards above to match the project's conventions (project rules override these defaults)
4. Audit each target file against all applicable standards
5. For each violation, provide the exact file, line, rule violated, and suggested fix

## Output Format

```
## Standards Audit Report

**Files audited:** [count]
**Language/Framework:** [detected]
**Project-specific rules applied:** [yes/no — list any from CLAUDE.md]

### Violations by Severity

#### 🔴 Must Fix ([count])
| # | File:Line | Rule | Violation | Fix |
|---|-----------|------|-----------|-----|
| 1 | src/app.ts:42 | Max function length | `processData` is 87 lines | Extract into smaller functions |

#### 🟡 Should Fix ([count])
| # | File:Line | Rule | Violation | Fix |
|---|-----------|------|-----------|-----|
| 1 | src/utils.ts:15 | Naming | `d` is not descriptive | Rename to `dateString` |

#### 💡 Suggestions ([count])
| # | File:Line | Rule | Suggestion |
|---|-----------|------|------------|
| 1 | src/api.ts:30 | DRY | Similar to src/api.ts:78 — extract shared logic |

### Summary
- Naming: [n] violations
- Structure: [n] violations
- DRY: [n] violations
- Hardcoded values: [n] violations
- Error handling: [n] violations
- Security: [n] violations
- Testing: [n] violations
- Imports: [n] violations

### Standards Score: [X]/100
```
