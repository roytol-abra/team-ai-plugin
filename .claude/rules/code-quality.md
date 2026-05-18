# Code Quality Rules

These rules apply to ALL code written or modified in this project. They are non-negotiable.

## DRY (Don't Repeat Yourself)
- If 3+ lines of logic are duplicated, extract to a shared function
- If a pattern appears in 3+ files, create a reusable abstraction
- Copy-pasted code with minor variations must be parameterized
- Exception: test setup code may repeat for clarity

## No Hardcoded Values
- Extract all numeric literals to named constants
- Extract all string literals used for display/config to constants or i18n
- URLs, IPs, ports, and connection strings go in environment variables
- Colors, sizes, and spacing go in design tokens or theme config
- Feature flags go in configuration, not code

## Guard at the Source
- Validate inputs at the system boundary (API endpoint, form handler, CLI parser)
- Downstream code can trust validated data — don't re-validate everywhere
- Bounds-check array/list access before using the value
- Add defense-in-depth checks only where the consequence of failure is severe

## Single Responsibility
- One function does one thing — if you need "and" to describe it, split it
- One file owns one concern — if it has unrelated exports, split it
- One class/module has one reason to change

## Proper Fixes, Not Patches
- Fix the root cause, not the symptom
- No `!important` in CSS unless overriding third-party styles
- No `// @ts-ignore` or `# type: ignore` without a comment explaining why
- No `catch(e) {}` — either handle the error or let it propagate
- No "temporary" workarounds that become permanent — if it's temporary, add a TODO with a ticket number

## Error Handling
- Never swallow exceptions silently
- Error messages must be specific and actionable
- Don't expose stack traces or internal details to users
- Log errors with context (what was being attempted, with what inputs)
- Use typed errors/exceptions where the language supports it

## Code Clarity
- Names describe what, not how — `getUserById` not `queryDatabaseForUser`
- Boolean names are questions — `isValid`, `hasPermission`, `shouldRetry`
- Avoid abbreviations except universally understood ones (ID, URL, HTTP)
- Functions under 40 lines, files under 300 lines, nesting under 3 levels
- Prefer early returns over deep nesting
