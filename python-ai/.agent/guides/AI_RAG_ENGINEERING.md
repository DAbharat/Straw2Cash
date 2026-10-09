# AI, LLM, and RAG Engineering Playbook

## Start with the use case
- Define the user problem, expected output, latency target, quality criteria, budget, privacy constraints, and failure behavior.
- Prefer the simplest approach that meets requirements; do not add RAG or agents merely because the project uses AI.
- Establish an evaluation set before optimizing prompts or retrieval when feasible.

## Provider and cost management
- Keep provider/model selection behind a small adapter when multiple providers are needed.
- Store API keys server-side and use environment variables or secret management.
- Set timeouts, bounded retries, rate limits, and usage limits.
- Track latency, token usage, failure rate, and approximate cost where practical.
- Make provider-specific capabilities and limitations explicit; do not assume every model supports the same parameters or tools.
- Use free tiers only within their published limits and verify current terms before depending on them.

## RAG pipeline
- Inspect document formats, permissions, freshness, and data sensitivity before ingestion.
- Preserve useful metadata such as source, tenant, owner, timestamp, and document type.
- Chunk documents by semantic structure where practical; avoid arbitrary chunk sizes without evaluation.
- Choose embeddings and vector storage based on language, data scale, latency, deployment, and cost requirements.
- Apply authorization filters before retrieval and re-check access before returning sources.
- Return citations or source references when the application requires grounded answers.
- Handle no-results and low-confidence retrieval honestly; do not invent evidence.
- Plan for document updates, deletion, re-indexing, duplicates, and stale embeddings.

## Prompt injection and tool use
- Treat retrieved text, files, webpages, and model outputs as untrusted data.
- Retrieved instructions must never override the application's trusted instructions.
- Give tools narrow permissions and validate every tool argument.
- Require human confirmation for destructive, financial, external communication, or irreversible actions.
- Do not expose hidden prompts, credentials, internal context, or unauthorized records in model output.

## Evaluation and observability
- Measure retrieval relevance, answer correctness, groundedness, latency, failure rate, and cost.
- Test adversarial prompts, irrelevant documents, conflicting sources, empty retrieval, and permission boundaries.
- Log metadata and outcomes safely; avoid storing sensitive prompts or documents unless approved.
- Compare model or prompt changes against a fixed evaluation set rather than relying only on subjective impressions.

## Reliability
- Provide graceful fallbacks for provider outages, timeouts, quota errors, and malformed outputs.
- Validate structured model output against a schema before using it.
- Never treat model output as trusted code, SQL, or authorization logic.
- Document model/provider assumptions and how to configure or disable the AI feature.
