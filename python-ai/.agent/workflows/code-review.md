# Code Review Workflow

Review the requested changes for correctness and regressions, prioritizing findings by severity.

1. Read `.agent/guides/SECURITY_RULES.md`, `.agent/guides/TESTING_AND_QA.md`, and any relevant domain guide.
2. Inspect the diff and surrounding code. Do not assume changed code is correct just because it compiles.
3. Look for functional bugs, missing edge cases, auth/access-control flaws, input-validation gaps, data-loss risks, race conditions, accessibility issues, performance problems, and inadequate tests.
4. Report actionable findings with severity, file/line references where available, impact, and a suggested fix.
5. Distinguish confirmed defects from questions or potential risks. If no issues are found, state the scope and checks performed rather than guaranteeing the code is bug-free.
