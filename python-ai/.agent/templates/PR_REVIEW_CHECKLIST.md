# Pull Request / Change Review Checklist

## Correctness
- [ ] Acceptance criteria are met.
- [ ] Edge cases and failure paths are handled.
- [ ] No unrelated behavior was changed.

## Design and maintainability
- [ ] Changes follow project conventions.
- [ ] Components/modules have clear responsibilities.
- [ ] No unnecessary dependencies or abstractions were added.
- [ ] Naming and error messages are clear.

## Security and data
- [ ] Inputs are validated at trust boundaries.
- [ ] Authorization is enforced server-side.
- [ ] No secrets or sensitive data are exposed.
- [ ] Database changes and migrations are safe and reviewed.
- [ ] Tenant/ownership boundaries are preserved.

## UX and accessibility (when applicable)
- [ ] Responsive layouts are checked.
- [ ] Loading, empty, error, and success states are handled.
- [ ] Keyboard navigation and focus states work.
- [ ] Text contrast and control labels are adequate.
- [ ] Visual result was inspected, or the limitation is stated.

## Verification
- [ ] Relevant tests were run.
- [ ] Lint/type-check/build were run where available.
- [ ] Failures are understood and reported.
- [ ] Documentation/config examples were updated.
- [ ] Final diff was inspected for debug code and accidental changes.
