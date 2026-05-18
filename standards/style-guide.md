# Team Style Guide

This is the team's internal style guide. It applies across all projects regardless of language or framework. Project-specific CLAUDE.md rules take precedence when they conflict.

## Naming Conventions

### Files
| Context | Convention | Example |
|---------|-----------|---------|
| Components/Classes | PascalCase | `UserProfile.tsx`, `AuthService.dart` |
| Utilities/helpers | kebab-case or camelCase per project | `date-utils.ts`, `dateUtils.ts` |
| Config files | kebab-case | `app-config.yaml` |
| Test files | Match source + `.test`/`.spec`/`_test` | `UserProfile.test.tsx`, `auth_service_test.dart` |
| Constants files | kebab-case or SCREAMING_SNAKE per project | `api-endpoints.ts`, `APP_COLORS.dart` |

### Variables & Functions
| Context | Convention | Example |
|---------|-----------|---------|
| Variables | camelCase (JS/TS/Dart) / snake_case (Python/Go/Rust) | `userName`, `user_name` |
| Functions | camelCase (JS/TS/Dart) / snake_case (Python/Go/Rust) | `getUserById`, `get_user_by_id` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| Classes | PascalCase | `UserRepository`, `AuthController` |
| Interfaces/Types | PascalCase, no `I` prefix | `UserProfile`, `AuthConfig` |
| Enums | PascalCase (type), SCREAMING_SNAKE or camelCase (values) | Per project convention |
| Booleans | `is`/`has`/`should`/`can` prefix | `isLoading`, `hasPermission` |
| Event handlers | `handle`/`on` prefix | `handleClick`, `onSubmit` |

### Naming Quality
- Names should be descriptive without being verbose
- Avoid single-letter names except loop indices (`i`, `j`) and lambda params where type is clear
- Avoid abbreviations — `button` not `btn`, `message` not `msg`, unless universally understood
- Function names should be verbs: `fetchUser`, `validateInput`, `calculateTotal`
- Variable names should be nouns: `userList`, `errorMessage`, `retryCount`
- Collections should be plural: `users`, `items`, `selectedIds`

## Code Structure

### Function Length
- **Target:** under 20 lines
- **Max:** 40 lines — anything longer must be split
- Exception: data-heavy switch statements, configuration objects

### File Length
- **Target:** under 200 lines
- **Max:** 300 lines — anything longer should be split into modules
- Exception: generated files, migration files

### Nesting Depth
- **Max:** 3 levels — use early returns, guard clauses, or extract functions
- Bad: `if → if → if → for → if`
- Good: early returns flatten the happy path

### Parameters
- **Max:** 4 parameters per function
- For more, use an options/config object
- Booleans as parameters are a code smell — use named options or enum

## Import Organization

Order imports in this sequence, with a blank line between groups:
1. Standard library / language built-ins
2. External packages / third-party dependencies
3. Internal shared modules (utils, types, constants)
4. Local/relative imports (sibling files, parent directory)

## Error Handling

- Handle errors explicitly — no empty catch blocks
- Error messages must be specific: what failed, with what input, what to do about it
- Use typed errors where possible (custom exception classes, Result types)
- Log errors with context — request ID, user action, relevant state
- Don't expose internal details to end users

## Comments

- Default to no comments — code should be self-documenting
- Comment the WHY, never the WHAT
- Delete commented-out code — git has history
- TODOs must include a ticket number: `// TODO(HEB-123): migrate to new API`

## Testing

- Test file lives next to source file or in a parallel `test/` directory — match project convention
- Test names describe behavior: `should return empty list when user has no orders`
- One assertion per test (logical assertion — a few related `expect`s are fine)
- Arrange-Act-Assert structure
- Use factories/builders for test data — not inline object literals repeated across tests
- Mock at boundaries (HTTP, database, external services) — not internal modules
