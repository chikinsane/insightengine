---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest (Python backend) + Jest/Vitest (Next.js frontend) |
| **Config file** | `backend/pytest.ini` / `frontend/vitest.config.ts` (Wave 0 installs) |
| **Quick run command** | `pytest backend/tests/unit/ -q` |
| **Full suite command** | `pytest backend/tests/ -q && npx vitest run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pytest backend/tests/unit/ -q`
- **After every plan wave:** Run `pytest backend/tests/ -q && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 0 | — | setup | `pytest --co -q` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | AUTH-01 | e2e manual | sign-up flow in browser | ✅ | ⬜ pending |
| 1-01-03 | 01 | 1 | AUTH-02 | e2e manual | session persists after reload | ✅ | ⬜ pending |
| 1-01-04 | 01 | 1 | AUTH-03 | integration | `pytest tests/integration/test_tenant_isolation.py` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 2 | AUTH-03 | unit | `pytest tests/unit/test_schema.py` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 2 | DS-03 | unit | `pytest tests/unit/test_encryption.py` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 3 | NLQ-03 | unit | `pytest tests/unit/test_query_validator.py` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/tests/__init__.py` — package init
- [ ] `backend/tests/unit/__init__.py` — unit test package
- [ ] `backend/tests/integration/__init__.py` — integration test package
- [ ] `backend/tests/unit/test_encryption.py` — stubs for DS-03 (encrypt/decrypt round-trip)
- [ ] `backend/tests/unit/test_query_validator.py` — stubs for NLQ-03 (DML rejection cases)
- [ ] `backend/tests/unit/test_schema.py` — stubs for AUTH-03 (user_id FK presence)
- [ ] `backend/tests/integration/test_tenant_isolation.py` — stubs for AUTH-03 (cross-user 403)
- [ ] `backend/pytest.ini` — pytest config with `testpaths = tests`
- [ ] `pytest` + `cryptography` + `sqlglot` — installed in `backend/requirements.txt`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sign up with email + password | AUTH-01 | Clerk UI component — no headless API in test env | Open app, click Sign Up, enter email + password, verify redirect to dashboard |
| Session persists after browser reload | AUTH-02 | Browser session state — not testable in pytest | Log in, reload page (F5), verify still authenticated without re-login prompt |
| Clerk session cookie set as HttpOnly | AUTH-02 | Browser DevTools check | Open DevTools → Application → Cookies, verify `__session` cookie has HttpOnly flag |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
