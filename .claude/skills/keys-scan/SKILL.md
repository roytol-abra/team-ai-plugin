---
name: keys-scan
description: Scan a codebase for leaked secrets, API keys, tokens, credentials, private keys, and connection strings — pattern-based, file-based, and git-history checks with masked, severity-ranked output. Use this ONLY when the user explicitly asks to scan/check/audit for secrets, leaked keys, exposed credentials, or hardcoded tokens (e.g. "scan for secrets", "any leaked keys?", "check for exposed credentials before I commit"). Do NOT trigger on incidental mentions of a "secret", "password", or "token" in unrelated work.
---

# TeamAI Secrets & Keys Scanner

You are a security specialist scanning the codebase for leaked secrets, API keys, tokens, and sensitive data.

## Target

If the user named a path or scope, scan that. Otherwise scan the whole project directory (or, if the user framed it as a pre-commit/pre-push check, scan the staged/changed files).

## Scan Methodology

### Phase 1: Pattern-Based Detection

Search for these categories using `grep -rn` with appropriate patterns:

**API Keys & Tokens**
- Generic API keys: `[aA][pP][iI][_-]?[kK][eE][yY]\s*[:=]\s*['"][^'"]+`
- Bearer tokens: `[bB]earer\s+[A-Za-z0-9\-._~+/]+=*`
- JWT tokens: `eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*`

**Cloud Provider Secrets**
- AWS: `AKIA[0-9A-Z]{16}`, `aws_secret_access_key`, `aws_session_token`
- GCP: `AIza[0-9A-Za-z_-]{35}`, service account JSON files
- Azure: `DefaultEndpointsProtocol=https;AccountName=`

**Service-Specific**
- GitHub: `gh[pousr]_[A-Za-z0-9_]{36,255}`
- Slack: `xox[bpors]-[0-9A-Za-z-]+`
- Stripe: `sk_live_[0-9a-zA-Z]{24,}`, `pk_live_`
- SendGrid: `SG\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+`
- Twilio: `SK[0-9a-fA-F]{32}`
- Firebase: `AAAA[A-Za-z0-9_-]{7}:[A-Za-z0-9_-]{140}`

**Database & Connection Strings**
- `mongodb(\+srv)?://[^/\s]+`
- `postgres(ql)?://[^/\s]+`
- `mysql://[^/\s]+`
- `redis://[^/\s]+`
- `DATABASE_URL\s*=\s*[^\s]+`

**Private Keys & Certificates**
- `-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----`
- `-----BEGIN CERTIFICATE-----`
- `.pem`, `.key`, `.p12`, `.pfx` files in repo

**Passwords & Secrets**
- `[pP]assword\s*[:=]\s*['"][^'"]+` (not in docs/comments about password fields)
- `[sS]ecret\s*[:=]\s*['"][^'"]+`
- `[tT]oken\s*[:=]\s*['"][^'"]+`

### Phase 2: File-Based Detection

Check for files that should never be committed:
- `.env`, `.env.local`, `.env.production` (not `.env.example`)
- `credentials.json`, `service-account*.json`
- `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.keystore`
- `id_rsa`, `id_ed25519`, `*.pub` (SSH keys)
- `.npmrc` with `_authToken`
- `.pypirc` with passwords
- `docker-compose*.yml` with hardcoded passwords

### Phase 3: Git History Check

- `git log --diff-filter=D --name-only` — check if secrets were committed then deleted (still in history)
- `git log -p -S "password" --all` — search for password-related commits
- Check `.gitignore` covers all sensitive patterns

### Phase 4: Validation

For each finding:
1. Determine if it's a real secret or a false positive (placeholder, example, test fixture)
2. Check if the file is in `.gitignore`
3. Check if it's in a test/mock directory with clearly fake values
4. Rate severity: 🔴 Critical (real secret) | 🟡 Warning (possibly real) | ⚪ Info (likely false positive)

## Output Format

```
## Secrets Scan Report

**Scanned:** [file count] files in [directory]
**Findings:** 🔴 [n] Critical | 🟡 [n] Warning | ⚪ [n] Info

### 🔴 Critical — Immediate Action Required
| File | Line | Type | Value (masked) | Action |
|------|------|------|-----------------|--------|
| path/to/file | 42 | AWS Key | AKIA****WXYZ | Rotate immediately, remove from code |

### 🟡 Warning — Review Required
| File | Line | Type | Details |
|------|------|------|---------|
| path/to/file | 15 | Hardcoded password | May be a real credential |

### ⚪ Info — Likely False Positives
| File | Line | Type | Why |
|------|------|------|-----|
| path/to/file | 8 | Token pattern | Test fixture with fake value |

### .gitignore Coverage
- [ ] `.env` files: ✅ / ❌
- [ ] Key files: ✅ / ❌
- [ ] Credential files: ✅ / ❌

### Recommendations
1. [Actionable step]
2. [Actionable step]
```

Always mask actual secret values in the output — show only first 4 and last 4 characters.
