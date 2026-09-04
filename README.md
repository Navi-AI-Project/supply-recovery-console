<div align="center">

# Supply Recovery Console

**A production-shaped WebMCP reference app for auditable, human-approved supply-chain recovery.**

[Live demo](https://supply-recovery-console.kkrr555666.chatgpt.site) | [90-second walkthrough](#try-the-complete-flow) | [Adaptation guide](docs/ADAPTATION-GUIDE.md) | [Roadmap](ROADMAP.md)

[![CI](https://github.com/Navi-AI-Project/supply-recovery-console/actions/workflows/ci.yml/badge.svg)](https://github.com/Navi-AI-Project/supply-recovery-console/actions/workflows/ci.yml)
[![MIT license](https://img.shields.io/badge/license-MIT-137561.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6.svg)](https://www.typescriptlang.org/)
[![WebMCP](https://img.shields.io/badge/WebMCP-early%20preview-d7ff64.svg)](https://github.com/webmachinelearning/webmcp)

</div>

![Supply Recovery Console network workspace](public/og.png)

Supply Recovery Console is an open-source demonstration of a browser agent and a human operator working in the same operational interface. The agent can inspect a disruption, simulate alternatives, compare tradeoffs, and stage a recommendation. Only a human can approve the exact change set, and only then does the page register the commit capability.

The included scenario is synthetic and deterministic. It needs no account, API key, backend service, or sample-data import.

## Why This Repository Exists

Most agent demos optimize for autonomous task completion. Operational systems need a different contract: shared state, visible evidence, bounded mutations, approval gates, and an audit trail.

This repository is useful to two groups:

| Audience | What to take from it |
| --- | --- |
| WebMCP and agent developers | A complete imperative-tool lifecycle with schemas, annotations, visible updates, dynamic registration, approval, commit, and undo. |
| Supply-chain and operations teams | A concrete prototype for testing where agents can assist without silently taking operational authority. |

## Try The Complete Flow

Open the [live application](https://supply-recovery-console.kkrr555666.chatgpt.site) in a WebMCP-capable browser context. The manual interface also works in a regular browser.

Give the browser agent this prompt:

> Inspect the active disruption, list the three critical orders, draft balanced and service-first plans, compare them, and request approval for the better fit. Do not approve or commit anything.

Then:

1. Review the exact plan in the visible approval dialog.
2. Check the acknowledgement and select **Approve plan**.
3. Ask the agent to commit the approved plan.
4. Inspect the network, metrics, and audit trail.
5. Ask the agent to undo the commit.

The intended path takes about 90 seconds. Reset restores the deterministic starting state.

## What Makes It Different

- **One state model:** human UI actions and WebMCP tools dispatch through the same reducer.
- **Human-only approval:** the agent can request review but cannot approve a plan.
- **Dynamic authority:** <code>commit_approved_plan</code> does not exist until approval; <code>undo_last_commit</code> replaces it after commit.
- **Visible execution:** tool calls update the same interface the operator is watching.
- **Audited actions:** agent, operator, and system events share one timeline.
- **Bounded inputs:** schemas, identifiers, limits, workflow state, and constraints are validated.
- **Safe sample data:** all organizations, orders, metrics, and events are synthetic.

## WebMCP Capability Model

| Tool | Mode | Purpose |
| --- | --- | --- |
| <code>get_scenario_status</code> | Read | Return incident, constraints, phase, selected plan, and headline metrics. |
| <code>inspect_disruption</code> | Read | Return cause, duration, affected routes, and impact. |
| <code>list_at_risk_orders</code> | Read | Return a bounded order sample marked as untrusted content. |
| <code>set_recovery_constraints</code> | Stage | Update guardrails and recalculate drafts. |
| <code>draft_recovery_plan</code> | Stage | Simulate one bounded strategy. |
| <code>compare_recovery_plans</code> | Read | Compare metrics and open the visible comparison. |
| <code>focus_network_entity</code> | Navigate | Focus a node or order in the shared workspace. |
| <code>request_human_approval</code> | Stage | Open review without approving or committing. |
| <code>commit_approved_plan</code> | Commit | Register only after explicit human approval. |
| <code>undo_last_commit</code> | Undo | Register only while a committed plan exists. |

The tool implementation is in [hooks/use-recovery-webmcp.ts](hooks/use-recovery-webmcp.ts). The design decisions behind the capability boundaries are documented in [docs/WEBMCP-DESIGN.md](docs/WEBMCP-DESIGN.md).

## Run Locally

Requirements: Node.js 22.13 or newer.

    git clone https://github.com/Navi-AI-Project/supply-recovery-console.git
    cd supply-recovery-console
    npm ci
    npm run dev

Open the local URL printed by the development server.

Run every project check with:

    npm run check

WebMCP is an early-preview web platform proposal. Browser and agent support changes over time, so use the official [implementation status](https://github.com/webmachinelearning/webmcp/blob/main/implementation-status.md) and [Chrome early-preview documentation](https://developer.chrome.com/docs/ai/webmcp) for current setup instructions.

## Adapt It To Another Workflow

The fastest way to reuse this project is to preserve the authority model and replace the synthetic domain model.

| Change | Main location |
| --- | --- |
| Incident, network, orders, and plan templates | [lib/recovery.ts](lib/recovery.ts) |
| Simulation and scoring rules | [lib/recovery.ts](lib/recovery.ts) |
| Workflow phases, audit events, and shared actions | [lib/recovery-state.ts](lib/recovery-state.ts) |
| WebMCP schemas and capability lifecycle | [hooks/use-recovery-webmcp.ts](hooks/use-recovery-webmcp.ts) |
| Operator workspaces | [components/views](components/views) |
| Approval and comparison dialogs | [components/recovery-dialogs.tsx](components/recovery-dialogs.tsx) |

See the [adaptation guide](docs/ADAPTATION-GUIDE.md) for a staged path from demo data to a real ERP, TMS, WMS, digital twin, or optimization service.

## Production Blueprint

This repository is a reference application, not a production control system. A real deployment should add:

- Authenticated identities and role-based approval policies.
- Server-side authorization for every operational mutation.
- Durable scenario, plan, approval, and audit storage.
- Idempotency keys and optimistic concurrency controls.
- Signed evidence for the exact plan a human approved.
- Connectors for ERP, TMS, WMS, carrier, inventory, and event feeds.
- A pluggable optimization provider such as an operations-research solver.
- Observability, retention policies, redaction, and incident recovery.

The detailed sequence is in [ROADMAP.md](ROADMAP.md).

## Architecture

~~~mermaid
flowchart LR
  Human[Human operator] --> UI[Visible recovery workspace]
  Agent[Browser agent] --> MCP[WebMCP semantic tools]
  MCP --> Actions[Shared state actions]
  UI --> Actions
  Actions --> Engine[Deterministic recovery engine]
  Actions --> Audit[Visible audit log]
  Human --> Approval[Human-only approval]
  Approval --> Dynamic[Dynamic commit capability]
  Dynamic --> Actions
~~~

The architecture intentionally follows WebMCP's collaborative, human-in-the-loop model rather than a fully autonomous background agent.

## Validation

    npm test
    npm run lint
    npm run typecheck
    npm run build

The test suite covers deterministic output, strategy ranking, critical-order protection, delay tightening, capacity splitting, budget violations, service and cost tradeoffs, bounded order filtering, and case-insensitive lookup. GitHub Actions runs the same checks for pushes and pull requests.

## Project Status

- Experimental reference implementation built for the 2026 WebMCP Challenge.
- WebMCP APIs and browser support may change while the proposal evolves.
- The recovery engine is deterministic and inspectable; no LLM generates metrics at runtime.
- The current scenario must not be used for real operational decisions.

## Contributing

Practical contributions are welcome, especially new scenarios, integration adapters, optimization providers, accessibility improvements, and cross-browser WebMCP validation. Read [CONTRIBUTING.md](CONTRIBUTING.md), then open an issue describing the workflow or implementation you want to add.

Organizations evaluating a pilot can use the **Industry use case** issue template to describe their workflow without sharing sensitive operational data.

## AI Assistance Disclosure

The entrant directed the product scope and submission. OpenAI Codex was used as the coding agent for implementation, testing, documentation, and deployment preparation. The application does not use an LLM backend or generate simulated metrics at runtime.

## License

MIT. See [LICENSE](LICENSE).
