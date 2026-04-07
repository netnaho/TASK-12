# Required Document Description: Business Logic Questions Log

This log records business-logic questions identified while interpreting the LeaseOps prompt, plus the working hypothesis and the solution applied in the current implementation.

---

## 1) Role boundaries for report sharing and exports

**Question:** The prompt says sharing is permission-controlled and exports must not be forwarded to unauthorized roles, but it does not explicitly define object-level access (creator, sharee, admin, unrelated users).

**My Understanding/Hypothesis:**

- System Admin can access all report share records.
- Creator can manage shares for reports they created.
- Explicit sharees can access only shared reports.
- Unrelated users should not be able to discover whether a report exists.

**Solution:**

- Implemented object-level ACL in analytics sharing/listing paths.
- Unrelated users receive not-found style behavior to avoid data leakage.
- Current implementation evidence: analytics sharing APIs and critical-path tests around share ACL behavior.

---

## 2) Quiet hours scope and timezone source

**Question:** Quiet hours are stated as 9:00 PM–7:00 AM local time, but “local” could mean server-local, tenant-local, user-local, or recipient-local timezone.

**My Understanding/Hypothesis:** Quiet hours are tenant/system-configured using an IANA timezone and applied consistently by the messaging queue.

**Solution:**

- Added quiet-hours configuration endpoints and utility logic that evaluate a configured timezone window.
- Default aligned to 21:00–07:00.
- Current implementation evidence: messaging quiet-hours routes/schemas and quiet-hours utility.

---

## 3) Offline outbound package generation behavior

**Question:** Prompt allows in-app only or downloadable “email/SMS/enterprise IM” packages for manual delivery offline, but does not define package schema/versioning.

**My Understanding/Hypothesis:** A normalized outbound message record is generated per channel, with delivery status tracked as queue lifecycle plus manual completion state.

**Solution:**

- Implemented outbound queue with status transitions and delivery updates, including `manually sent` outcome handling.
- Added blacklist filtering before enqueue.
- Current implementation evidence: messaging enqueue/delivery APIs and retry policy tests.

---

## 4) Retry policy semantics

**Question:** Prompt specifies retries at 5, 15, and 60 minutes, but does not define if intervals are absolute schedule offsets or relative from last attempt.

**My Understanding/Hypothesis:** Delays are progressive and relative to the most recent failed attempt (attempt N schedules N+1 after configured delay).

**Solution:**

- Implemented staged retry states and timing escalation to final `FAILED` after retry 3.
- Current implementation evidence: retry-policy tests and message retry job wiring.

---

## 5) Failure alerts visibility

**Question:** Prompt says failure alerts should appear in-app for Administrators only; ambiguity exists for Leasing Ops Managers with broad operational responsibilities.

**My Understanding/Hypothesis:** Only System Administrator receives failure-alert feed; non-admin roles are intentionally excluded.

**Solution:**

- Restricted failure alert endpoint access to admin role.
- Current implementation evidence: messaging failures endpoint authorization.

---

## 6) Session inactivity timeout behavior

**Question:** Prompt specifies 30-minute inactivity expiry, but does not define absolute session TTL vs sliding session TTL.

**My Understanding/Hypothesis:** Sliding expiration is required: active users remain signed in; inactive users are logged out after 30 minutes without activity.

**Solution:**

- Implemented inactivity-based session checks with last-activity refresh on requests.
- Current implementation evidence: auth middleware/session tests.

---

## 7) Accessibility seat reservation default

**Question:** Prompt says accessibility seats are reserved unless explicitly released, but does not define default strictness mode.

**My Understanding/Hypothesis:** Strict reservation should be default-safe (do not auto-assign ADA seats to non-accessibility users unless explicitly configured/released).

**Solution:**

- Implemented strict-default allocator behavior and release path.
- Current implementation evidence: allocator tests and critical-path ADA strict-default test.

---

## 8) Contiguous seating rule details

**Question:** Prompt requests contiguous preference, but does not define tie-breakers (same row vs nearest distance vs lowest seat number).

**My Understanding/Hypothesis:** Prefer contiguous block in same row first; if impossible, fallback to best-available deterministic ordering.

**Solution:**

- Implemented contiguous-first seat allocation strategy with deterministic fallback.
- Current implementation evidence: seat allocator unit tests.

---

## 9) Capacity enforcement boundary condition

**Question:** Prompt forbids overbooking, but does not define whether waitlist behavior exists when capacity is reached.

**My Understanding/Hypothesis:** No implicit waitlist; registration is rejected once capacity is full.

**Solution:**

- Enforced hard capacity checks during registration.
- Current implementation evidence: test-center registration tests (full session rejection).

---

## 10) 10-minute room setup buffer collision logic

**Question:** Prompt requires 10-minute setup buffer between sessions in same room, but does not define inclusivity at exact boundaries.

**My Understanding/Hypothesis:** A new session is valid only when start time is at least 10 minutes after previous session end (and vice versa for adjacent windows).

**Solution:**

- Implemented schedule conflict checks with required minimum gap.
- Current implementation evidence: test-center session conflict tests.

---

## 11) Metric version locking trigger

**Question:** Prompt says metric version is locked once used in a published report, but does not clarify if lock applies at report draft, generated report, or published state only.

**My Understanding/Hypothesis:** Lock should activate at published-report usage to allow draft iteration before publication.

**Solution:**

- Implemented immutability guard for locked versions and prevented mutation of locked predecessor windows.
- Current implementation evidence: metrics critical-path tests for lock behavior.

---

## 12) Effective-date overlap handling for metric versions

**Question:** Prompt mentions effective dates but not conflict resolution when new versions overlap existing date windows.

**My Understanding/Hypothesis:** New version closes the previous active window and prevents overlapping active ranges.

**Solution:**

- Implemented version-window transition logic and lock guard behavior.
- Current implementation evidence: metrics versioning service and tests.

---

## 13) Derived metric nullability rules

**Question:** Some derived metrics can be mathematically undefined (e.g., divide-by-zero cases), but prompt does not specify null vs zero policy.

**My Understanding/Hypothesis:** Use `null` for undefined values (semantic unknown), `0` only when mathematically valid zero.

**Solution:**

- Implemented per-calculator null/zero boundaries (e.g., vacancy/supply-demand special cases).
- Current implementation evidence: calculator unit tests.

---

## 14) Report schedule timezone and DST behavior

**Question:** Prompt defines fixed generation times (daily 6:00, weekly Mon 7:00, monthly 1st 8:00) but does not define timezone and daylight-saving handling.

**My Understanding/Hypothesis:** Scheduling should run in configured business timezone and preserve wall-clock intent across DST changes.

**Solution:**

- Implemented frequency-specific scheduled jobs with explicit cron timings.
- **Open follow-up:** confirm timezone source for cron runtime (server timezone vs tenant-configured timezone) to avoid DST drift in multi-tenant/offline deployments.

---

## 15) Export forwarding prevention interpretation

**Question:** Prompt says exports cannot be forwarded to unauthorized roles, but in offline environments hard prevention after download is impossible technically.

**My Understanding/Hypothesis:** Enforce prevention at system boundary (download authorization + share ACL), and deter misuse post-download via watermarking.

**Solution:**

- Implemented role-checked export access and watermarking with viewer name + timestamp in export outputs.
- Current implementation evidence: analytics export flows and export watermark checks.

---

## 16) Audit log immutability and 7-year retention enforcement

**Question:** Prompt requires immutable audit logs retained 7 years, but does not define archive strategy after 7 years (delete, cold storage, or legal hold).

**My Understanding/Hypothesis:** Within active MySQL store, never mutate/delete audit records; enforce retention compliance checks and alerting.

**Solution:**

- Implemented append-only audit model and non-destructive retention policy checks.
- Current implementation evidence: audit retention policy/job and critical-path test guarding against destructive operations.

---

## 17) Geo-point precision and validation limits

**Question:** Prompt specifies latitude/longitude storage but not precision scale, validation tolerance, or normalization rules.

**My Understanding/Hypothesis:** Validate numeric ranges (`lat: [-90, 90]`, `lng: [-180, 180]`) and store at stable precision suitable for local operations.

**Solution:**

- Implemented geo-point fields in listing/community domain models.
- **Open follow-up:** confirm required decimal precision and rounding policy for interoperability with external GIS exports.

---

## 18) Notification center unread/snooze semantics

**Question:** Prompt requests read/unread counts and snooze controls, but does not define whether snoozed items count as unread.

**My Understanding/Hypothesis:** Snoozed notifications should be excluded from active unread badge until snooze expiry.

**Solution:**

- Implemented notification states (`UNREAD`, `READ`, `SNOOZED`, `DISMISSED`) and unread-count endpoint.
- Current implementation evidence: notifications service/API tests.

---

## 19) Local username uniqueness scope

**Question:** Prompt specifies local username/password login, but does not define whether usernames are globally unique or tenant-scoped.

**My Understanding/Hypothesis:** In this single-system-of-record offline deployment, usernames should be globally unique.

**Solution:**

- Implemented username-based auth with unique user identity model and role mapping.
- Current implementation evidence: auth/users services and API tests.

---

## 20) Allocation/report-sharing audit event granularity

**Question:** Prompt mandates immutable audit logs for allocation changes, metric definition changes, and report sharing, but does not define minimum event payload.

**My Understanding/Hypothesis:** Audit event should include actor, action, entity type/id, timestamp, and before/after deltas where applicable.

**Solution:**

- Implemented append-only audit logging with filterable query APIs and compliance-focused retention checks.
- **Open follow-up:** finalize mandatory field contract for legal/audit export requirements.

---

## Notes on current implementation alignment

- The repository already implements the major prompt domains (RBAC, listings, metrics versioning/recalc, test-center allocation, notifications/messaging, analytics/exports, immutable audit).
- This questions log captures ambiguous business boundaries and records the assumptions used in implementation.
- Items marked **Open follow-up** should be validated with product/legal stakeholders for final production policy.
