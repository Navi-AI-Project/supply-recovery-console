# Security Policy

## Supported Version

The current main branch is the supported reference version. This project is experimental and must not be used as a production control system without independent security, authorization, and operational review.

## Reporting A Vulnerability

Use the repository's **Security** tab and the private vulnerability-reporting flow when available. Include affected files, reproduction steps, impact, and a proposed mitigation. Do not include live credentials, customer data, or internal system details.

If private reporting is unavailable, open a public issue requesting a private maintainer contact without disclosing the vulnerability itself.

## Security Model

The demo provides client-side workflow guardrails, including bounded schemas, a human-only approval step, dynamic commit registration, and visible audit attribution. These controls demonstrate an interaction design; they are not a substitute for server-side authorization.

A production implementation must independently enforce:

- Authentication and role-based authorization.
- Immutable approval evidence and plan freshness.
- Idempotency and concurrency controls.
- Input validation and output redaction.
- Durable audit storage and retention.
- Downstream write permissions and compensating actions.

Never place API keys or operational credentials in browser code, repository files, screenshots, issues, or tool responses.
