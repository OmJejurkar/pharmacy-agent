# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision
Add an admin/doctor approval workflow to securely handle prescription medicines, blocking direct orders until an uploaded prescription is verified.

## Goals
1. Block direct ordering of prescription medicines if no approval exists.
2. Allow users to upload a prescription and create a pending approval request.
3. Provide an admin UI to manage (Approve/Reject) prescription requests.
4. Allow approved users to seamlessly order prescription medicines.

## Non-Goals (Out of Scope)
- OCR extraction of prescriptions.
- Fine-grained dosage validation (simple time-based active approval is sufficient).

## Users
- **Patients/Customers**: Upload prescriptions via Chat Interface and order medicines.
- **Admins/Doctors**: Review pending prescriptions via the Admin Dashboard.

## Constraints
- Must integrate cleanly with the existing FastAPI backend and SQLite.
- Existing general medicine order flow should remain unaffected.

## Success Criteria
- [ ] Users cannot order Rx medicines without verification.
- [ ] Pending approvals show up in the React Admin Dashboard.
- [ ] Admins can approve or reject these pending requests.
- [ ] Approved users can complete an order for the prescribed medicine.
