# VirtuPass — Smart College Fest Ticketing Platform

> **Tagline:** One Identity. One Verified Pass. One Seamless Entry.  
> **Phase 5:** Admin Portal, Organizer Portal, Event Approval Workflow, Turnstile Gate QR Scanner, Entry Validation & Attendance Management

VirtuPass is an end-to-end collegiate fest ticketing platform engineered to unify student academic verification, dynamic anti-counterfeit ticket issuance, high-speed gate admission, and centralized event administration into a single seamless experience.

---

## 1. Project Overview & Architecture

VirtuPass operates as two completely independent applications:
1. **`/frontend`** — Built with React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, and React Router v6. Configured for instant deployment on **Vercel** with full client-side SPA routing (`vercel.json`).
2. **`/backend`** — High-performance REST API powered by Node.js 20+, Fastify v4, TypeScript, and Zod validation. Configured for deployment on **Render** (`render.yaml`).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        VirtuPass Architecture                          │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   PUBLIC PORTAL             STUDENT PORTAL        ORGANIZER PORTAL     │
│   Event Discovery & Quotes  Passes & Pass Vault   Event Creation & Tier│
│            │                      │               Gate Optical Scanner │
│            └──────────┬───────────┴──────────┬────Live Attendance CSV──┘
│                       │                      │                         │
│                       ▼                      ▼                         │
│                ADMIN PORTAL          REACT CLIENT (Vercel)             │
│                Event Moderation      Centralized apiClient Layer       │
│                User & Club Suspend   Bearer JWT Token Auto-Attach      │
│                Audit Trail & Revoke          │                         │
│                       │                      │                         │
│                       └──────────────────────┐                         │
│                                              ▼                         │
│                                REST API (HTTP / JSON)                  │
│                                              │                         │
│                                              ▼                         │
│                                     FASTIFY API (Render)               │
│                                     CORS • Helmet • Rate-Limit         │
│                                     Auth & RBAC Middleware             │
│                                              │                         │
│         ┌──────────────────┬─────────────────┼──────────────────┐      │
│         ▼                  ▼                 ▼                  ▼      │
│   IN-MEMORY STORE    PAYMENT GATEWAY   TICKET ENGINE     ATTENDANCE    │
│   Users • Events     Mock Provider     Cryptographic QR  Atomic Turnstile│
│   * Zero Database *  Idempotency       No PII in QR      Single-Use    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Gate QR Scanner & Atomic Entry Validation

### High-Speed Turnstile Entry Engine (`POST /api/v1/attendance/scan`)
VirtuPass provides an event gate scanner designed for mobile screens and turnstiles:
- **Optical Laser Camera Scanner:** Real-time visual targeting reticle with simulated webcam beam and instant barcode scanning.
- **Manual Input Fallback:** Supports manual alphanumeric entry for cracked screens or high-glare environments.
- **Audio Chime Synthesizer:** Real-time Web Audio API synthesized feedback (crisp high-pitched chime for admission, low double-buzz for rejections).

### Security & Entry Validation Pipeline
1. **Cryptographic Signature Verification:** Evaluates the opaque payload (`VP:<ticketId>:<signature>`) using HMAC-SHA256 with the backend JWT secret. Tampered or counterfeit QR codes are rejected (`INVALID`).
2. **Event Matching Enforcement:** Prevents cross-event fraud. If an attendee presents a valid ticket for Event A at the turnstile for Event B, the scanner rejects the scan (`WRONG_EVENT`).
3. **Atomic Duplicate Entry Prevention:** Prevents double-entry/passback. The moment a ticket is scanned, the backend synchronously flags `status = 'USED'`, records `usedAt`, and logs the gate checkpoint in a single event loop tick. Subsequent scan attempts return HTTP 409 `DUPLICATE` along with the exact previous scan timestamp and gate name.
4. **Administrative Revocation Lockout:** If an administrator revokes a ticket, the scanner rejects the pass at the turnstile (`REVOKED`).
5. **Ownership Scoping:** Organizers can only scan tickets for events they own.

---

## 3. Administrative Portal & Moderation Workflows

### Event Moderation Lifecycle
Events follow a strict state machine:  
`DRAFT` ➔ `PENDING_APPROVAL` ➔ `APPROVED` ➔ `PUBLISHED` (or `REJECTED` / `CANCELLED`).
- **Submission:** Organizers create events in `DRAFT` and submit for review.
- **Approval:** Administrators review event logistics, ticket categories, and capacities. Approving transitions the event to `PUBLISHED` in the public catalog.
- **Rejection:** Administrators can reject submissions with mandatory documented reasons.
- **Emergency Cancellation:** Administrators can cancel active events with broadcast reasons.

### User & Organizer Management
- **User Directory:** Administrators can inspect all registered students, view academic verification and CGPA records, and suspend accounts.
- **Suspension Enforcement:** Suspended users have all active refresh tokens revoked and are blocked from initiating bookings or purchasing passes.
- **Organizer Moderation:** Review pending organizer applications, approve or reject with justification, or suspend unverified student bodies.

### Ticket Revocation & Platform Audit Trail
- **Ticket Revocation:** Administrators can revoke issued passes with justification (e.g. chargeback dispute, academic disciplinary action). Revocation permanently marks the pass as `REVOKED` and bars gate admission.
- **Immutable Audit Trail:** All administrative actions (user suspension, organizer approval, event publication, ticket revocation, gate scan rejections) are logged to the in-memory audit store and viewable at `/admin/audit`.

---

## 4. Attendance Telemetry & Analytics

### Real-Time Turnstile Telemetry
- **Organizer Attendance Roster:** View all admitted passes, gate checkpoints, scan timestamps, and attendee academic tiers.
- **Attendance Statistics:** Live admission percentage, duplicate attempts thwarted, and invalid passes rejected.
- **RFC 4180 CSV Export:** Instant download of check-in records (`GET /api/v1/attendance/export?eventId=...`).
- **Scoped Performance Analytics:**
  - **Admin Analytics:** Gross revenue (INR and paise), total tickets sold, platform check-in rate, and pending queues.
  - **Organizer Analytics:** Scoped strictly to the authenticated organizer's events.

---

## 5. Non-Negotiable Technical Restrictions Audited

1. **Strictly No Database:**
   - Zero MongoDB, PostgreSQL, MySQL, SQLite, Firebase, Supabase, Prisma, or Drizzle.
   - All users, events, bookings, payments, tickets, attendance records, and audit logs live in structured in-memory Maps (`backend/src/data/inMemoryStore.ts`).
   - **Data Reset Limitation:** All records reset upon backend restart.
2. **Strictly No Blockchain:** Zero Web3, Solidity, or smart contracts.
3. **Application Separation:** Distinct `/frontend` (Vercel) and `/backend` (Render) communicating via standard HTTP REST APIs.
4. **Zero Client Trust:** Pricing, CGPA discounts, payment verification, and ticket admission decisions are strictly executed on the server.

---

## 6. Pre-Seeded Demo Accounts

| Role | Email | Password | Details |
|---|---|---|---|
| **Student (User)** | `student@virtupass.demo` | `Demo@123` | Verified 9.72 CGPA (20% Merit Discount) |
| **Admin** | `admin@virtupass.demo` | `Demo@123` | Full Super Admin Platform Oversight |
| **Approved Organizer** | `organizer@virtupass.demo` | `Demo@123` | Spider Tech Club, NIT Trichy |
| **Pending Organizer** | `pending.organizer@virtupass.demo` | `Demo@123` | ACM Chapter, BITS Pilani (For Moderation Queue) |
| **Suspended Organizer** | `suspended.organizer@virtupass.demo` | `Demo@123` | Apex Society (Demonstrates Suspended State) |
| **Second Student** | `rohan.verma@vit.ac.in` | `Demo@123` | Verified 8.92 CGPA (10% Merit Discount) |

---

## 7. Verification & Automated Test Suite (62 Scenarios Passed)

```powershell
# Run the complete test suite
cd backend
npm test
```

### Comprehensive Test Groups:
- **Test Groups 1–5:** System health, login, role-escalation defenses, RBAC boundaries, multi-step university verification.
- **Test Groups 6–11:** CGPA discount boundaries, event catalog, two-step booking hold, inventory reservation.
- **Test Groups 12–18:** Payment creation, idempotency, gateway checkout simulation, server-to-server verification, anti-PII QR security, inventory restoration on failure.
- **Test Group 19:** Admin user directory, suspension lifecycle, and token invalidation.
- **Test Group 20:** Admin organizer moderation (approval, rejection with reason, suspension).
- **Test Group 21:** Admin event workflow (moderation queue, publication, rejection, cancellation).
- **Test Group 22:** Gate scanner optical verification, single-use atomic admission, duplicate entry prevention, wrong-event rejection, counterfeit QR defense.
- **Test Group 23:** Ticket revocation by administrator & gate turnstile lockout.
- **Test Group 24:** Attendance tracking, statistics telemetry, CSV export, and scoped analytics.
- **Test Group 25:** Platform audit trail journaling.

### Production Build Verification
```powershell
# Backend build
cd backend
npm run build   # tsc compiles cleanly with 0 errors

# Frontend build
cd frontend
npm run build   # tsc && vite build bundles for Vercel with 0 errors
```
