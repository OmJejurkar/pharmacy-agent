---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Database Schema and API Endpoints

## Objective
Add the database schema to support pending prescription approvals and expose the admin API endpoints to manage them.

## Context
- .gsd/SPEC.md
- .gsd/ARCHITECTURE.md
- backend/database.py
- backend/app.py

## Tasks

<task type="auto">
  <name>Database Updates</name>
  <files>backend/database.py</files>
  <action>
    - Add `prescription_approvals` table inside `init_db()` with: `id` (INTEGER PRIMARY KEY AUTOINCREMENT), `user_id` (TEXT), `medicine` (TEXT), `prescription_url` (TEXT), `status` (TEXT default 'pending'), `timestamp` (DATETIME).
    - Create function `create_prescription_approval(user_id: str, medicine: str, prescription_url: str)`.
    - Create function `get_pending_approvals()`.
    - Create function `update_approval_status(approval_id: int, status: str)`.
    - Create function `check_approved_prescription(user_id: str, medicine: str) -> bool` that returns true if there is an 'approved' status entry for that user and medicine.
  </action>
  <verify>python -c "import backend.database as db; db.init_db()"</verify>
  <done>Functions exist and database initializes without errors.</done>
</task>

<task type="auto">
  <name>FastAPI Admin Endpoints</name>
  <files>backend/app.py</files>
  <action>
    - Add `GET /admin/approvals` endpoint returning `database.get_pending_approvals()`.
    - Add `POST /admin/approvals/{approval_id}` endpoint accepting `{"status": "approved" | "rejected"}`. This endpoint triggers `database.update_approval_status()` and creates a user notification (`database.create_notification`) informing them of the decision.
  </action>
  <verify>grep -A 5 "/admin/approvals" backend/app.py</verify>
  <done>Endpoints are declared and hooked up to the db functions.</done>
</task>

## Success Criteria
- [ ] `prescription_approvals` table created properly.
- [ ] Express API handles approval retrieval and status changes correctly.
