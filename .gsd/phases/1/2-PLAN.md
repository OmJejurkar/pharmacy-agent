---
phase: 1
plan: 2
wave: 1
---

# Plan 1.2: SafetyChecker Logic Integration

## Objective
Update the AI agent flow to handle prescription checks by routing them to the new approval system.

## Context
- .gsd/SPEC.md
- backend/agents.py
- backend/database.py

## Tasks

<task type="auto">
  <name>SafetyChecker Logic</name>
  <files>backend/agents.py</files>
  <action>
    - In `SafetyCheckerAgent.run()`, when `row['prescription_required']` is True:
    - First check if the user has an active approval using `database.check_approved_prescription(user_id, med_name)`. If yes, allow the order.
    - If no approval exists, check if `order_data.get("prescription_verified", False)` is True.
    - If True, call `database.create_prescription_approval(user_id, med_name, "mock_url_or_verified")` and return `{"approved": False, "reason": "Pending admin approval. We will notify you once reviewed.", "status": "pending_admin"}`.
    - If False, return `{"approved": False, "reason": "Prescription required for " + med_name + ". Please upload your prescription.", "status": "needs_prescription"}`.
  </action>
  <verify>grep -A 10 "prescription_required" backend/agents.py</verify>
  <done>SafetyChecker agent uses the new db functions to handle the prescription verification gap correctly.</done>
</task>

## Success Criteria
- [ ] Agent allows orders if naturally approved.
- [ ] Agent creates a pending request if prescription was uploaded but not approved yet.
- [ ] Agent blocks firmly if no upload was made.
