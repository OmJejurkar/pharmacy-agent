---
phase: 1
plan: 4
wave: 2
---

# Plan 1.4: Chat Interface Updates

## Objective
Update the React ChatInterface to properly parse and display the new `pending_admin` and `needs_prescription` status codes returned by the SafetyChecker.

## Context
- .gsd/SPEC.md
- frontend/src/components/ChatInterface.jsx

## Tasks

<task type="auto">
  <name>Chat Interface Handlers</name>
  <files>frontend/src/components/ChatInterface.jsx</files>
  <action>
    - Add handling for `status === 'pending_admin'` in the frontend returned messages. If pending admin approval, the bot should say something like "Your uploaded prescription for [Medicine] is pending admin approval."
    - Currently, `ChatInterface.jsx` maps rejected to 'error' style. This is fine, but `needs_prescription` or `pending_admin` could be 'info' or 'warning' styled bubbles giving a smoother UX. Let's make sure the bubble looks like a normal assistant response but warns the user.
    - Confirm the mock upload flow logic: when `rxVerified` is true, the `SafetyChecker` creates the pending request and returns the pending message cleanly.
  </action>
  <verify>grep -A 5 "pending_admin" frontend/src/components/ChatInterface.jsx</verify>
  <done>UX gracefully guides user through prescription workflow constraints.</done>
</task>

## Success Criteria
- [ ] Good UX is preserved when an order is blocked for prescription.
- [ ] Feedback is clear when pending admin action.
