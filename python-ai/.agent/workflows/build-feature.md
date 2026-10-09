# Build Feature Workflow

Use this workflow when implementing a new feature or a substantial enhancement.

1. Read `.agent/guides/PROJECT_WORKFLOW.md` and the relevant frontend, backend, security, UI/UX, AI/RAG, testing, and documentation guides. Do not read unrelated guides unnecessarily.
2. Inspect the repository structure, existing patterns, package versions, tests, current Git diff, and relevant code before editing.
3. Restate the goal, identify assumptions and edge cases, and propose a short implementation plan.
4. Implement in small, coherent steps. Reuse existing architecture and components; avoid unrelated refactors and unnecessary dependencies.
5. Consider accessibility, responsive layouts, validation, authorization, errors, loading/empty/success states, observability, and performance as relevant.
6. Add or update tests and documentation where appropriate.
7. Run available relevant lint, type-check, test, and build commands. Do not claim checks passed unless actually run.
8. Review the final diff for regressions, secrets, accidental changes, and incomplete TODOs.
9. Report files changed, behavior implemented, checks run and outcomes, and remaining limitations or manual setup.
