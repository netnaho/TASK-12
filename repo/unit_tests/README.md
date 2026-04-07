# Unit Tests

The unit tests for LeaseOps are located in the backend project:

```
backend/tests/unit/
```

## Running

From the repository root:

```bash
./run_tests.sh
```

Or run unit tests directly:

```bash
cd backend
npx vitest run --dir tests/unit --reporter=verbose
```

## What is tested

- AES-256-CBC encryption roundtrip
- All 5 metric calculators with edge cases
- Seat allocator (contiguous preference, accessibility)
- Message retry policy escalation
- Pagination utility
- Custom error classes
- Auth, RBAC, validation, and rate-limit middleware
- Auth, notification, and messaging services
