# Debugging Playbook

## 1. Reproduce
- Capture the exact error, stack trace, expected behavior, actual behavior, and steps to reproduce.
- Identify whether the issue is consistent, intermittent, environment-specific, or data-dependent.
- Avoid changing multiple unrelated things before reproducing the issue.

## 2. Trace the cause
- Read the relevant code and follow the data/control flow.
- Check recent changes, dependency versions, environment configuration, network requests, and logs.
- Form a small, testable hypothesis before editing.
- Prefer evidence from stack traces, failing tests, logs, and minimal reproductions over guesses.
- Do not assume the first visible error is the root cause.

## 3. Fix narrowly
- Address the root cause rather than hiding the symptom.
- Avoid disabling type checks, lint rules, validation, tests, or security controls as a shortcut.
- Preserve unrelated work and avoid broad rewrites.
- Add a regression test or reproducible verification step when practical.

## 4. Verify
- Re-run the original reproduction.
- Run the relevant test, lint, type-check, and build commands.
- Check adjacent behavior for regressions.
- Inspect the final diff.

## 5. Report
Explain:
- Root cause, if established.
- Exact change made.
- Verification performed and result.
- Any remaining uncertainty or follow-up step.

If the cause is not established, say so. Do not fabricate certainty.
