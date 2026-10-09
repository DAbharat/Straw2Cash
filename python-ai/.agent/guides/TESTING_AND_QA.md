# Testing and Quality Assurance

## Testing strategy
- Inspect existing test tools and conventions before adding another framework.
- Test behavior and acceptance criteria, not implementation details unnecessarily.
- Prioritize high-risk business rules, permissions, data integrity, and user-critical paths.
- Use unit tests for isolated logic, integration tests for boundaries, and end-to-end tests for critical workflows.
- Keep tests deterministic; avoid reliance on real production services or unstable external APIs.

## Test cases
For a feature, consider:
- Normal successful flow.
- Invalid, missing, and boundary inputs.
- Empty data and first-time user states.
- Unauthorized and forbidden access.
- External service timeout or failure.
- Duplicate submission and retry behavior.
- Large datasets or pagination boundaries where relevant.
- Mobile layout, keyboard use, and accessibility for UI work.

## Frontend QA
- Verify visible labels, navigation, forms, loading states, empty states, errors, and success feedback.
- Check keyboard focus and accessible names for controls.
- Inspect narrow, medium, and wide viewports.
- Confirm images and icons load and no unintended overflow occurs.
- Use browser automation or preview tools when available; report when unavailable.

## Backend QA
- Test request validation, authorization, response codes, error formats, and persistence behavior.
- Verify tenant/ownership boundaries.
- Test transaction rollback and duplicate requests where relevant.
- Mock external services for deterministic failure-path tests.

## Commands and reporting
- Read `package.json`, project docs, or equivalent before choosing commands.
- Run the narrowest useful tests first, then lint/type-check/build as appropriate.
- Do not say tests passed unless they were actually executed and passed.
- Distinguish between "not run", "failed", and "passed".
- If a test fails, diagnose whether the change caused it before modifying code or tests.
