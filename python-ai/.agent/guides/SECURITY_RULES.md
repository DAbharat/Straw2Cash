# Security Rules

Treat security as a design requirement, not a final patch.

## Secrets and configuration
- Never commit API keys, passwords, access tokens, private keys, or production connection strings.
- Use environment variables or an approved secret manager.
- Keep `.env` files out of version control; maintain a safe `.env.example` with placeholders only.
- Never print secrets in logs, screenshots, error messages, or documentation.

## Input and data
- Validate all untrusted input on the server.
- Use parameterized queries or safe ORM APIs; do not concatenate untrusted strings into SQL or database commands.
- Encode output appropriately and prevent injection vulnerabilities.
- Limit upload file types, sizes, and storage permissions; do not trust file extensions alone.
- Avoid collecting or retaining data that the feature does not need.

## Access control
- Check authorization on every protected operation, not only in the UI.
- Enforce ownership and tenant isolation in database queries and service logic.
- Apply least privilege to application credentials and integrations.
- Use safe session/token expiration, storage, rotation, and revocation practices appropriate to the system.
- Avoid leaking whether sensitive accounts or resources exist when that creates enumeration risk.

## Web application protections
- Configure CORS narrowly for known origins when credentials are involved.
- Use CSRF protections where the authentication model requires them.
- Apply rate limits to login, password reset, expensive endpoints, and public APIs as appropriate.
- Use secure headers and HTTPS in deployment.
- Avoid unsafe HTML injection and validate redirect destinations.
- Keep dependencies updated through a reviewed process.

## AI and RAG
- Treat user prompts, retrieved documents, and model output as untrusted input.
- Do not let retrieved content override system or developer instructions.
- Enforce authorization before retrieval and before returning generated answers.
- Do not send sensitive data to external model providers without an approved reason.
- Make tool permissions explicit; require confirmation for destructive or externally visible actions.
- Defend against prompt injection, data exfiltration, and unsafe tool calls.

## Changes and verification
- Do not weaken authentication, authorization, validation, or security tests to make a feature work.
- Do not run destructive commands or change production permissions without explicit authorization.
- Add regression tests for security bugs where feasible.
- Report security-relevant assumptions and any unverified protections honestly.
