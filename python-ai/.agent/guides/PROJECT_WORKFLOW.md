# Project Workflow

Use this workflow for features, refactors, and multi-file changes.

## 1. Understand before changing
- Read the README, package manifest, lockfile, relevant config, and nearby source files.
- Identify framework/runtime versions, scripts, architecture, naming conventions, and existing patterns.
- Trace the current user flow and related API/database behavior.
- Check git status before editing; preserve unrelated user changes.
- Identify constraints: compatibility, performance, accessibility, security, cost, and deadlines.

## 2. Make a small plan
For a meaningful task, state:
1. Goal and acceptance criteria.
2. Files/modules likely to change.
3. Data flow and edge cases.
4. Tests and checks to run.
5. Risks, assumptions, and dependencies.

Avoid planning ceremony for tiny, obvious changes.

## 3. Implement incrementally
- Prefer the smallest complete change that solves the actual problem.
- Follow local patterns unless they are clearly unsafe or broken.
- Keep business logic separate from presentation where appropriate.
- Reuse components and utilities; avoid premature abstractions.
- Update types, validation, tests, and documentation together.
- Avoid unrelated formatting changes and opportunistic rewrites.

## 4. Verify
- Run focused tests first, then broader relevant checks.
- Run lint, type-check, and build scripts when available.
- Test happy paths, validation failures, empty data, loading, and error paths.
- For UI changes, check responsive layouts and keyboard interactions; use browser preview if available.
- Inspect the final diff for accidental changes, secrets, debug code, and unfinished TODOs.

## 5. Finish clearly
Report:
- What changed and why.
- Important files changed.
- Commands run and actual outcomes.
- What was not verified and why.
- Required environment variables, migrations, or manual steps.
- Any known limitations or follow-up work.

## Definition of done
A task is done when acceptance criteria are met, relevant checks have been run or limitations disclosed, existing behavior is preserved, and the implementation is documented enough for another developer to maintain.
