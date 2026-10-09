# Fix Bug Workflow

1. Read `.agent/guides/DEBUGGING_PLAYBOOK.md` and relevant testing/security/architecture guides.
2. Reproduce the issue or inspect logs, stack traces, relevant code, configuration, and existing tests. Clearly separate evidence from hypotheses.
3. Identify the root cause before changing code. Avoid speculative multi-file rewrites.
4. Make the smallest safe fix that addresses the cause and preserves existing behavior.
5. Add a regression test when practical.
6. Run the most relevant tests and checks; report any that could not run and why.
7. Inspect the final diff and summarize root cause, fix, verification, and remaining risks.
