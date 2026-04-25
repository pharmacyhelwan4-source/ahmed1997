# Security Specification - Pharmacy Notebook Tracking System

## Data Invariants
1. A notebook must belong to a specific month and year.
2. Only admins can assign notebooks to employees.
3. Employees can only update notebooks assigned to them (except admins who can update any).
4. Stage progression must be logical: a stage cannot be marked as completed if the previous one isn't (optional but good).
5. Identity: `assignedTo` must be a valid employee UID.
6. Immutability: `createdAt` and `type` cannot change after creation.

## The Dirty Dozen Payloads

1. **Identity Spoofing**: Attempt to create a notebook with `assignedBy` as someone else.
2. **Privilege Escalation**: A staff member attempts to change their role to `admin` in `/employees`.
3. **Ghost Field**: Adding `isEmergency: true` to a notebook update.
4. **ID Poisoning**: Creating a notebook with a 1MB string as the document ID.
5. **Orphaned Write**: Creating a notebook for a non-existent employee.
6. **State Shortcutting**: Marking 'delivery' as completed without 'writing'.
7. **Resource Exhaustion**: Sending a 2MB string for the `details` field in /logs.
8. **PII Leak**: A staff member trying to read all employee details including private emails.
9. **Unauthorized Assignment**: A staff member trying to assign a notebook to themselves.
10. **Terminal State Bypass**: Updating a notebook marked as `completed`.
11. **Timestamp Forgery**: Providing a client-side `updatedAt` instead of `request.time`.
12. **Recursive Cost Attack**: A recursive query on a deeply nested path (though not applicable here due to structure).

## Test Runner
(I will implement `firestore.rules.test.ts` if needed, but for now I will focus on the draft rules).
