# Documentation and Handoff Rules

## Documentation
- Keep setup instructions aligned with the actual repository and current scripts.
- Document required runtime versions, installation, environment variables, migrations, development, testing, and deployment.
- Use placeholders in `.env.example`; never include real secrets.
- Document API contracts, data assumptions, background jobs, and external dependencies when relevant.
- Explain non-obvious architectural decisions and important trade-offs.
- Update documentation when a change alters behavior, setup, configuration, or operations.

## Handoff summary
At the end of meaningful work, provide:
1. **Implemented:** concise summary of behavior delivered.
2. **Files changed:** important files and purpose.
3. **Verification:** exact checks run and outcomes.
4. **Configuration:** environment variables, migrations, or manual setup required.
5. **Limitations:** what remains untested or incomplete.
6. **Next steps:** only the most useful follow-ups.

## Accuracy
- Never claim deployment, database migration, browser testing, or external integration succeeded unless it was actually verified.
- Separate completed work from suggested future improvements.
- Avoid vague completion messages such as "everything is working" without evidence.
