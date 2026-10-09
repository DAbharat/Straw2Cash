# Backend Architecture Playbook

## Understand the system
- Inspect routes/controllers, services, models, validation, authentication, error handling, config, and tests before changing backend behavior.
- Trace the request from entry point through business logic to persistence and response.
- Follow the existing architecture unless there is a concrete reason to change it.
- Avoid introducing microservices, queues, caches, or complex patterns without a demonstrated requirement.

## API design
- Keep controllers/handlers thin; place reusable business rules in appropriate service/domain modules.
- Validate and normalize untrusted input at the boundary.
- Use consistent response and error formats already established by the project.
- Choose appropriate HTTP methods and status codes.
- Add pagination, filtering, sorting, and limits for potentially large collections.
- Document behavior and breaking changes.

## Data and persistence
- Inspect the current schema, indexes, relations, constraints, and migration workflow before editing models.
- Use transactions when multiple writes must succeed or fail together.
- Design indexes around real query patterns; avoid speculative indexes.
- Prevent N+1 queries and unbounded reads where relevant.
- Treat schema changes as compatibility-sensitive; explain migration and rollback considerations.
- Never run destructive migrations or production data changes without explicit authorization.

## Authentication and authorization
- Authenticate identity and separately authorize each protected action.
- Enforce ownership and tenant boundaries server-side.
- Never trust role, user ID, tenant ID, or permissions supplied only by the client.
- Store secrets in environment/secret management systems, not source control.
- Use secure cookie/token practices appropriate to the existing architecture.
- Avoid logging credentials, tokens, or sensitive payloads.

## Reliability
- Handle expected failures explicitly and return safe, useful error messages.
- Use timeouts and bounded retries for external calls; avoid retrying non-idempotent operations blindly.
- Add idempotency where duplicate operations would cause harm and the system requires it.
- Use structured logs with useful request/correlation IDs, excluding sensitive data.
- Consider rate limits and resource limits for public or expensive endpoints.

## Maintainability
- Use clear module boundaries and dependency injection patterns where appropriate.
- Avoid circular dependencies and business logic inside database hooks unless justified.
- Keep configuration validated and environment-specific.
- Add tests for business rules, authorization, validation, and failure cases.
- Do not claim scalability based only on framework choice; identify bottlenecks and measure.
