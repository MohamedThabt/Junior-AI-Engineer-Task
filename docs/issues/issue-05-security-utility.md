# Issue #5 — Security / PII utility

**Labels:** `security`
**Depends on:** #1

## Task
Implement `app/utilities/security.py` per `docs/agent-architecture.md` §0.

## Deliverables

### `scan_for_sensitive_data(text: str) -> str | None`
- Returns the **matched pattern type** (string) or `None` if clean.
- Never returns or logs the matched value itself.

### Patterns to detect (regex)
| Type returned | Detects |
|---|---|
| `"api_key"` | `sk-...` style keys, long hex/base64-looking secrets (≥ 32 chars) |
| `"email"` | email addresses |
| `"phone"` | phone numbers |
| `"credit_card"` | 13–16 digit card-like sequences (optionally with separators) |

### Behavior
- First matching pattern wins; return its type immediately.
- Case-insensitive where appropriate.
- Compile patterns once at module load.

## Consumer contract (implemented in #16)
The agent controller calls this before the loop. On a non-`None` result it:
- Rejects with HTTP 400 + generic message (`"request contains data that can't be processed"`) — never echoes the secret.
- Logs a distinct security-event line with the **pattern type only**.

## Tests
- Positive case per pattern type.
- Clean text returns `None`.
- Assert the matched secret value never appears in the return value.
