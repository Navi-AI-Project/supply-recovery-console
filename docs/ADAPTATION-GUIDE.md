# Adaptation Guide

Supply Recovery Console is intentionally small enough to understand in one sitting. The safest way to reuse it is to preserve its authority model while replacing the synthetic data and deterministic planning rules in stages.

## 1. Choose A Bounded Decision

Start with one disruption class and one operator decision. Good pilots have:

- A clear trigger, such as a port closure, supplier outage, or capacity loss.
- A small set of measurable objectives and hard constraints.
- A reversible or staged recommendation before any operational write.
- A named human role responsible for approval.
- Evidence that can be shown in the same interface as the proposed action.

Avoid beginning with unrestricted planning across every facility, order, and downstream system.

## 2. Replace The Scenario Data

The current synthetic incident, network, orders, and plan templates are in [lib/recovery.ts](../lib/recovery.ts).

Replace these exports first:

- incident
- networkNodes
- networkLinks
- atRiskOrders
- orderCounts
- defaultConstraints

Keep identifiers stable and non-sensitive. Validate imported values before exposing them to an agent or rendering them in the interface.

## 3. Replace The Planning Engine

The createPlan and createPlanSet functions currently provide deterministic, testable behavior. A production integration can replace them with:

- A rules engine.
- An operations-research solver.
- A digital-twin simulation.
- An internal planning API.
- A hybrid process that ranks externally generated candidates.

Preserve the RecoveryPlan shape at the UI boundary. Every recommendation should include explicit metrics, actions, tradeoffs, violations, and provenance.

Never let a language model invent operational metrics. Use an authoritative calculation or solver, and use the agent only to select, explain, compare, or orchestrate bounded operations.

## 4. Preserve One Action Path

Human actions and WebMCP tools currently dispatch through the reducer in [lib/recovery-state.ts](../lib/recovery-state.ts). Keep one shared application service or command layer when introducing a backend.

The browser tool should not bypass:

- Input validation.
- Authorization.
- Business invariants.
- Approval checks.
- Idempotency controls.
- Audit recording.

The UI and tool can have different presentation layers, but they should call the same validated operation.

## 5. Define Capability Lifecycles

Tool registration is implemented in [hooks/use-recovery-webmcp.ts](../hooks/use-recovery-webmcp.ts).

Use always-available tools for safe inspection and staging. Register high-impact tools only when application state makes them valid. In this project:

1. The agent stages a plan and requests review.
2. A human approves the exact visible plan.
3. The page registers commit_approved_plan.
4. Commit removes that capability and registers undo_last_commit.

For a production system, the server must independently enforce the same lifecycle. Browser registration improves discoverability and reduces accidental calls, but it is not an authorization boundary by itself.

## 6. Add Real Integrations Behind Adapters

Keep external systems outside React components. A practical adapter set usually includes:

| Adapter | Typical responsibility |
| --- | --- |
| Event adapter | Disruption, weather, supplier, and facility events. |
| Order adapter | At-risk order facts and service commitments. |
| Capacity adapter | Facility, lane, inventory, and carrier capacity. |
| Cost adapter | Rates, surcharges, penalties, and budget consumption. |
| Planning adapter | Candidate generation and constraint evaluation. |
| Execution adapter | Approved writes to TMS, WMS, ERP, or carrier systems. |
| Audit adapter | Durable evidence, attribution, retention, and export. |

Use synthetic data until contracts, redaction, retention, and authorization have been reviewed.

## 7. Make Approval Evidence Durable

A production approval record should include:

- Plan ID and immutable plan digest.
- Scenario and source-data versions.
- Constraint set and solver version.
- Human identity, role, timestamp, and decision.
- Agent identity and tool-call trace.
- Exact downstream commands to be executed.
- Commit result, partial failures, and compensating action.

The server should reject a commit if any approved input has changed.

## 8. Validate Before A Pilot

At minimum, test:

- Schema rejection and boundary values.
- Stale plan and concurrent update handling.
- Approval invalidation when a plan changes.
- Duplicate commit idempotency.
- Partial downstream failure and retry behavior.
- Permission denial and separation of duties.
- Untrusted text and prompt-injection handling.
- Audit completeness and sensitive-data redaction.
- Keyboard, screen-reader, and reduced-motion paths.

Use the existing test suite and GitHub Actions workflow as the starting point, then add browser-level WebMCP contract tests for the supported clients.
