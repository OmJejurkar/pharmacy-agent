---
phase: 1
plan: 3
wave: 2
---

# Plan 1.3: Admin Dashboard Updates

## Objective
Update the React Admin Dashboard to fetch and display pending prescription approvals, allowing admins to approve or reject them.

## Context
- .gsd/SPEC.md
- frontend/src/Admin.jsx

## Tasks

<task type="auto">
  <name>Admin Dashboard Modfications</name>
  <files>frontend/src/Admin.jsx</files>
  <action>
    - Add real-time polling to fetch pending approvals (`GET http://localhost:8000/admin/approvals`) alongside inventory and alerts.
    - Create a "Pending Prescription Approvals" UI section above the Inventory table.
    - Each pending row should show User ID, Medicine, and standard "Approve" (green) and "Reject" (red) buttons.
    - Handle the "Approve" click by sending `POST /admin/approvals/{id}` with `{"status": "approved"}` and refreshing the list.
    - Handle the "Reject" click by sending `POST /admin/approvals/{id}` with `{"status": "rejected"}` and refreshing the list.
  </action>
  <verify>grep -A 10 "Pending Prescription Approvals" frontend/src/Admin.jsx</verify>
  <done>Admin dashboard renders the approval table and handles actions without errors.</done>
</task>

## Success Criteria
- [ ] Admins see newly created pending approvals.
- [ ] Admins can process them quickly.
