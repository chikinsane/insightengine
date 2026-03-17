---
phase: 01-foundation
plan: 02
subsystem: security
tags: [python, fastapi, cryptography, aesgcm, aes-256-gcm, sqlglot, ast, dml-validation, pytest, tdd]

# Dependency graph
requires: []
provides:
  - AES-256-GCM envelope encryption (encrypt_credential/decrypt_credential) in backend/app/security/encryption.py
  - AST-level DML validation gate (validate_query/ValidationResult) in backend/app/security/query_validator.py
  - FastAPI backend skeleton with /health endpoint
  - Full pytest test suite with 24 passing tests
affects:
  - Phase 2 (NLQ pipeline uses validate_query before any query execution)
  - Phase 4 (live DB connections use encrypt_credential/decrypt_credential for credential storage)

# Tech tracking
tech-stack:
  added:
    - cryptography==46.0.5 (AESGCM, AES-256-GCM authenticated encryption)
    - sqlglot==30.0.1 (SQL AST parser and full AST walker)
    - fastapi>=0.115.0 (backend HTTP framework)
    - uvicorn>=0.34.0 (ASGI server)
    - python-dotenv>=1.0.0 (env var loading)
    - pytest>=8.0.0 (test framework)
    - pytest-asyncio>=0.24.0 (async test support)
    - httpx>=0.28.0 (async HTTP client for tests)
  patterns:
    - TDD: write failing tests first (RED), implement until green (GREEN)
    - AES-256-GCM envelope encryption: os.urandom(12) nonce + ciphertext stored as base64(nonce+ct)
    - Key from CREDENTIAL_ENCRYPTION_KEY env var — RuntimeError if unset
    - sqlglot AST walk for DML detection — rejects non-SELECT at top level, walks CTEs for nested DML
    - ValidationResult dataclass with valid:bool and reason:str pattern

key-files:
  created:
    - backend/requirements.txt
    - backend/app/__init__.py
    - backend/app/main.py
    - backend/app/security/__init__.py
    - backend/app/security/encryption.py
    - backend/app/security/query_validator.py
    - backend/tests/__init__.py
    - backend/tests/unit/__init__.py
    - backend/tests/conftest.py
    - backend/tests/unit/test_encryption.py
    - backend/tests/unit/test_query_validator.py
    - backend/pytest.ini
  modified: []

key-decisions:
  - "cryptography>=42.0.0 used (not 47.0.0 as researched) — system Python 3.9 limited to max 46.0.5; AESGCM API identical"
  - "exp.Truncate does not exist in sqlglot 30.x — exp.TruncateTable exists but TRUNCATE is rejected by the top-level non-SELECT check anyway; no special handling needed"
  - "query_validator.py created in Task 1 to unblock security/__init__.py import (both modules imported there)"

patterns-established:
  - "Pattern: AES-256-GCM nonce always generated with os.urandom(12) inside encrypt function, never stored or reused"
  - "Pattern: Validate query via sqlglot.parse() + isinstance(statement, exp.Select) + AST walk for FORBIDDEN_NODE_TYPES"
  - "Pattern: conftest.py autouse fixture provides CREDENTIAL_ENCRYPTION_KEY for all encryption tests"

requirements-completed: [DS-03, NLQ-03]

# Metrics
duration: 4min
completed: 2026-03-17
---

# Phase 1 Plan 02: Backend Security Primitives Summary

**AES-256-GCM envelope encryption and sqlglot AST-level DML validation gate built TDD with 24 passing tests**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-17T06:30:30Z
- **Completed:** 2026-03-17T06:33:57Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments

- `encrypt_credential` / `decrypt_credential` using AESGCM with fresh 12-byte nonce per call — credentials never stored as plaintext
- `validate_query` using sqlglot full AST walker — SELECT passes, all DML/DDL rejected including CTE-nested INSERT
- FastAPI backend skeleton with `/health` endpoint and complete project structure
- 24 passing unit tests (6 encryption + 18 query validator) with autouse encryption key fixture

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Failing encryption tests** - `45e5885` (test)
2. **Task 1 (GREEN): Encryption module implementation** - `9057834` (feat)
3. **Task 2 (GREEN): Query validator tests + validation** - `13dae72` (feat)

_Note: TDD tasks have RED + GREEN commits. query_validator.py was implemented in the Task 1 GREEN commit to unblock the security/__init__.py import._

## Files Created/Modified

- `backend/requirements.txt` - Python dependencies (cryptography, sqlglot, fastapi, pytest)
- `backend/app/main.py` - FastAPI app with /health endpoint
- `backend/app/security/encryption.py` - AES-256-GCM encrypt/decrypt with env-var key
- `backend/app/security/query_validator.py` - sqlglot AST validator returning ValidationResult
- `backend/app/security/__init__.py` - Re-exports both security primitives
- `backend/tests/conftest.py` - Autouse fixture providing CREDENTIAL_ENCRYPTION_KEY for tests
- `backend/tests/unit/test_encryption.py` - 6 tests: round-trip, nonce uniqueness, wrong key, missing key
- `backend/tests/unit/test_query_validator.py` - 18 tests: SELECT variants, DML/DDL rejections, CTE-DML, multi-stmt, parse error

## Decisions Made

- Used `cryptography>=42.0.0` rather than `>=47.0.0` from research — system Python 3.9 limits max version to 46.0.5. AESGCM API is identical across all versions; no functional difference.
- `exp.Truncate` does not exist in sqlglot 30.x (it's `exp.TruncateTable`), but TRUNCATE is already rejected because it is not an `exp.Select` — no special case needed.
- Created `query_validator.py` in Task 1 to satisfy the `security/__init__.py` import chain before Task 2's formal TDD cycle. This meant Task 2 started with tests confirming the existing implementation, not a pure RED phase.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated cryptography version constraint from >=47.0.0 to >=42.0.0**
- **Found during:** Task 1 (dependency installation)
- **Issue:** System Python 3.9.6 with pip 21.2.4 could not satisfy `cryptography>=47.0.0` — latest available is 46.0.5. The research document cited 47.0.0 as current but that version does not yet exist on PyPI.
- **Fix:** Changed requirements.txt to `cryptography>=42.0.0`. Installed version is 46.0.5.
- **Files modified:** `backend/requirements.txt`
- **Verification:** `pip show cryptography` shows 46.0.5; all 6 encryption tests pass with AESGCM
- **Committed in:** `9057834` (Task 1 GREEN commit)

**2. [Rule 3 - Blocking] Created query_validator.py stub during Task 1 to unblock __init__.py import**
- **Found during:** Task 1 (GREEN phase — running tests)
- **Issue:** `app/security/__init__.py` imports from both `encryption` and `query_validator`. With only `encryption.py` present, the import chain failed with ModuleNotFoundError, blocking Task 1 tests from running.
- **Fix:** Created full `query_validator.py` implementation during Task 1 GREEN (not a stub — full implementation with all required logic). This made Task 2's TDD cycle start from GREEN state rather than pure RED.
- **Files modified:** `backend/app/security/query_validator.py`
- **Verification:** All 24 tests pass in full suite
- **Committed in:** `9057834` (Task 1 GREEN commit)

---

**Total deviations:** 2 auto-fixed (1 version fix, 1 blocking import)
**Impact on plan:** Both fixes were necessary for correctness. The cryptography version change is functionally equivalent. The query_validator early creation unblocked Task 1 without any quality compromise — the implementation is complete and correct.

## Issues Encountered

- sqlglot 30.x replaced `exp.Truncate` with `exp.TruncateTable`. The TRUNCATE test still passes because TRUNCATE is not an `exp.Select` at the top level — no special node type needed in FORBIDDEN_NODE_TYPES.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `encrypt_credential` / `decrypt_credential` ready for use in Phase 4 data source credential storage
- `validate_query` / `ValidationResult` ready for use in Phase 2 NLQ-to-SQL pipeline
- Backend structure (`backend/app/`, `backend/tests/`) established for Phase 2 additions
- No blockers for Phase 2

---
*Phase: 01-foundation*
*Completed: 2026-03-17*
