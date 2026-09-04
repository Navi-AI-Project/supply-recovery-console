# Contributing

Contributions that make the reference implementation easier to understand, verify, or adapt are welcome.

## Before You Start

For a large feature, open an issue first. Describe the user workflow, authority boundary, data source, and expected tests. Do not include customer data, credentials, internal URLs, or other sensitive material.

Good contribution areas include:

- Synthetic supply-chain scenarios.
- ERP, TMS, WMS, event, or solver adapter interfaces.
- WebMCP lifecycle and compatibility tests.
- Accessibility and responsive-layout improvements.
- Approval, audit, idempotency, and recovery patterns.
- Documentation based on a real but anonymized workflow.

## Development Setup

Requirements: Node.js 22.13 or newer.

    git clone https://github.com/Navi-AI-Project/supply-recovery-console.git
    cd supply-recovery-console
    npm ci
    npm run dev

## Quality Gate

Before opening a pull request, run:

    npm run check

Add focused tests for behavioral changes. Keep tool schemas, visible controls, and documentation synchronized when changing a workflow.

## Pull Requests

- Keep the change focused and explain the operational use case.
- State whether any WebMCP schema or lifecycle changed.
- Include screenshots for user-interface changes.
- Document new configuration, data, or integration points.
- Preserve the human-only approval boundary unless the proposal explicitly discusses a replacement safety model.
- Confirm that no secrets or sensitive operational data are included.

## Reporting Security Issues

Do not open public issues containing exploitable details. Follow [SECURITY.md](SECURITY.md).

By participating, you agree to follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
