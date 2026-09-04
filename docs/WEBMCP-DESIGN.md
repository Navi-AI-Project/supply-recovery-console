# WebMCP Design Notes

This document explains the reusable WebMCP patterns demonstrated by Supply Recovery Console.

## Shared Visible State

WebMCP is most useful when the agent and human operate on the same page state. Each tool in [hooks/use-recovery-webmcp.ts](../hooks/use-recovery-webmcp.ts) dispatches the same actions used by visible controls. The agent does not maintain a hidden recovery model beside the operator interface.

After a mutation, the tool waits for the visible React update before returning. This keeps the tool response and screen state aligned for the next human or agent step.

## Bounded Semantic Tools

Tools represent domain operations instead of mouse or DOM instructions. For example, draft_recovery_plan accepts a constrained strategy enum instead of asking an agent to locate and click a particular card.

Each tool has:

- A narrow purpose.
- A strict JSON schema.
- Bounded collection sizes and numeric ranges.
- Actionable validation errors.
- A concise structured result.

## Tool Annotations

Read operations use readOnlyHint. Order data uses untrustedContentHint because values could come from external customer or operational systems in a real implementation.

Annotations are useful signals, but application and server code must still enforce every safety property.

## Human Approval Boundary

The agent can call request_human_approval, which stages a plan and opens the visible review. The approval checkbox and button remain human UI actions. Approval does not execute the plan.

The commit tool is dynamically registered only after the selected plan reaches the approved phase. This produces three separate decisions:

1. Agent proposes.
2. Human approves.
3. An authorized actor commits.

This separation makes the authority boundary visible and auditable.

## Dynamic Capability Registration

The page uses AbortController to tie registered tools to React lifecycle and workflow state. Base capabilities remain registered while the page is active. Commit and undo capabilities are registered conditionally:

| Phase | Dynamic capability |
| --- | --- |
| Incident or planned | None |
| Awaiting approval | None |
| Approved | commit_approved_plan |
| Committed | undo_last_commit |

Dynamic registration is a usability and least-capability technique. A production backend must still validate identity, approval evidence, plan freshness, and permissions for every invocation.

## Audit Attribution

Tool calls, human actions, and system events are written into the same visible timeline. The current demo keeps that log in browser state; production systems should store an append-only record with durable identities and source evidence.

## Reusing The Pattern

The same pattern applies beyond logistics:

- Finance: agent prepares a transfer; human approves; system executes with an undo or compensating workflow.
- Security: agent proposes containment; analyst approves; endpoint action becomes available.
- Healthcare operations: agent assembles a scheduling change; coordinator reviews; approved updates are committed.
- Infrastructure: agent drafts a deployment or rollback; operator approves; the gated capability is registered.

The domain changes, but the contract remains: inspect, stage, review, authorize, commit, and audit.

## Current Limitations

- WebMCP is an early-preview proposal and APIs may change.
- The demo relies on browser-local state.
- It does not authenticate operators or agents.
- The deterministic simulator is illustrative, not an optimizer.
- Browser-level contract tests are currently manual.

These limitations are explicit so adopters can evaluate the project as a reference implementation rather than a production system.
