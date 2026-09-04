# Roadmap

This roadmap turns the deterministic WebMCP reference application into a reusable recovery operations toolkit. Priorities are ordered by adoption value rather than promised release dates.

## 0.2 - Configurable Scenarios

- Define a versioned JSON schema for incidents, nodes, lanes, orders, constraints, and strategy templates.
- Add validated scenario import and export.
- Ship additional examples for supplier failure, weather disruption, and capacity shortage.
- Separate the scenario catalog from the simulation engine.

## 0.3 - Integration Boundary

- Introduce adapters for event feeds, order systems, inventory, capacity, and carrier rates.
- Add a documented mock adapter and contract tests.
- Persist plans, approvals, commits, and audit records outside the browser.
- Add idempotency and concurrency controls to every mutation.

## 0.4 - Optimization Providers

- Define a provider interface for deterministic heuristics and external solvers.
- Add an operations-research example with explainable objectives and constraints.
- Record input evidence, solver version, infeasibility reasons, and output provenance.
- Compare provider results without changing the approval contract.

## 0.5 - Enterprise Controls

- Add authenticated identities and role-based approval policies.
- Sign the exact plan payload that the human approves.
- Add configurable separation-of-duties and escalation rules.
- Export audit records to JSON and common observability pipelines.

## 1.0 - Pilot-Ready Reference Stack

- Publish a stable scenario and adapter API.
- Maintain a browser compatibility matrix for WebMCP implementations.
- Add end-to-end tests for discovery, invocation, approval, commit, and undo.
- Provide deployment and threat-model documentation for controlled pilots.

## Contribution Priorities

The highest-value contributions are:

1. Realistic but synthetic scenario packs.
2. Adapter interfaces and mock connectors for ERP, TMS, and WMS systems.
3. Optimization-provider examples with explainable tradeoffs.
4. Accessibility and keyboard-flow improvements.
5. WebMCP interoperability and lifecycle tests.

Open an issue before starting a large change so the data model and authority boundaries can be agreed first.
