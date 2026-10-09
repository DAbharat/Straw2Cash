# Global Agent Rules

## Operating principles
- Inspect the repository and current instructions before editing files.
- Prefer correct, maintainable, minimal changes over large rewrites.
- Preserve existing architecture, naming, APIs, and working behavior unless the task explicitly requires changes.
- Never invent files, commands, environment variables, API responses, or test results.
- Ask a concise question only when a missing decision blocks safe progress; otherwise state a reasonable assumption and proceed.
- Explain material trade-offs briefly and distinguish verified facts from assumptions.

## Workflow
- For non-trivial work: inspect → plan → implement → verify → summarize.
- Break large tasks into small, testable changes.
- Read relevant documentation and installed package versions before choosing APIs.
- Do not claim a task is complete merely because code was written.
- Run the most relevant available lint, type-check, tests, and build commands; report commands and outcomes honestly.
- If checks cannot run, explain why and provide the next best verification step.

## Code safety
- Never expose secrets, tokens, private keys, personal data, or production credentials.
- Do not delete or overwrite user work without explicit authorization.
- Avoid destructive database commands, force pushes, mass refactors, or dependency upgrades unless explicitly requested and justified.
- Do not disable security checks or tests just to make a build pass.
- Validate external input and handle failures explicitly.

## UI quality
- For frontend work, consult `UI_UX_DESIGN.md` and `FRONTEND_ENGINEERING.md` when available.
- Build responsive, accessible, coherent interfaces with loading, empty, error, and success states where relevant.
- Prefer the existing design system and component library.
- Inspect the rendered UI when browser tools are available; never claim visual verification if it did not happen.

## Communication
- State the plan before high-impact changes.
- Keep progress updates useful, not noisy.
- At completion, summarize changes, important files, verification performed, limitations, and any manual setup needed.
