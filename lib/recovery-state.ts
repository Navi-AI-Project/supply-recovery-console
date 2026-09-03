import {
  createPlan,
  createPlanSet,
  defaultConstraints,
  type RecoveryConstraints,
  type RecoveryPlan,
  type Strategy,
  type ViewName,
} from './recovery';

export type Actor = 'agent' | 'operator' | 'system';
export type Phase = 'incident' | 'planned' | 'awaiting_approval' | 'approved' | 'committed';

export interface AuditEntry {
  id: string;
  actor: Actor;
  event: string;
  detail: string;
  time: string;
}

export interface ConsoleState {
  view: ViewName;
  phase: Phase;
  constraints: RecoveryConstraints;
  plans: RecoveryPlan[];
  selectedPlanId: string | null;
  focusedEntityId: string | null;
  audit: AuditEntry[];
  toolCallCount: number;
  lastToolName: string | null;
  webmcpSupported: boolean | null;
}

const initialAudit: AuditEntry[] = [
  { id: 'AUD-2', actor: 'system', event: 'Recovery scenario opened', detail: 'SR-204 initialized with current network capacity.', time: '13:22' },
  { id: 'AUD-1', actor: 'system', event: 'Critical disruption detected', detail: 'Oakland terminal operations suspended for 36 hours.', time: '13:20' },
];

export const initialState: ConsoleState = {
  view: 'network',
  phase: 'incident',
  constraints: { ...defaultConstraints },
  plans: [],
  selectedPlanId: null,
  focusedEntityId: 'OAK',
  audit: initialAudit,
  toolCallCount: 0,
  lastToolName: null,
  webmcpSupported: null,
};

function audit(actor: Actor, event: string, detail: string): AuditEntry {
  return {
    id: `AUD-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    actor,
    event,
    detail,
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
  };
}

export type ConsoleAction =
  | { type: 'reset' }
  | { type: 'set_view'; view: ViewName }
  | { type: 'set_webmcp'; supported: boolean }
  | { type: 'focus'; entityId: string; actor: Actor }
  | { type: 'update_constraints'; constraints: Partial<RecoveryConstraints>; actor: Actor }
  | { type: 'draft_plan'; strategy: Strategy; actor: Actor; note?: string }
  | { type: 'generate_plan_set'; actor: Actor }
  | { type: 'select_plan'; planId: string; actor?: Actor }
  | { type: 'request_approval'; planId: string; actor: Actor }
  | { type: 'approve_plan'; planId: string }
  | { type: 'commit_plan'; planId: string; actor: Actor }
  | { type: 'undo_commit'; actor: Actor }
  | { type: 'record_tool'; name: string; detail: string };

function resetStatuses(plans: RecoveryPlan[]) {
  return plans.map((plan) => ({ ...plan, status: 'draft' as const }));
}

export function consoleReducer(state: ConsoleState, action: ConsoleAction): ConsoleState {
  switch (action.type) {
    case 'reset':
      return { ...initialState, constraints: { ...defaultConstraints }, audit: [...initialAudit] };
    case 'set_view':
      return { ...state, view: action.view };
    case 'set_webmcp':
      return { ...state, webmcpSupported: action.supported };
    case 'focus':
      return {
        ...state,
        view: action.entityId.startsWith('MED-') || action.entityId.startsWith('PRI-') || action.entityId.startsWith('STD-') ? 'orders' : 'network',
        focusedEntityId: action.entityId,
        audit: action.actor === 'agent'
          ? [audit('agent', 'Focused visible workspace', `Centered the interface on ${action.entityId}.`), ...state.audit]
          : state.audit,
      };
    case 'update_constraints': {
      if (state.phase === 'committed') return state;
      const constraints = { ...state.constraints, ...action.constraints };
      const plans = state.plans.length > 0 ? createPlanSet(constraints) : [];
      const selectedPlanId = plans.some((plan) => plan.id === state.selectedPlanId)
        ? state.selectedPlanId
        : plans[0]?.id ?? null;
      return {
        ...state,
        constraints,
        plans,
        selectedPlanId,
        phase: plans.length > 0 ? 'planned' : 'incident',
        audit: [
          audit(action.actor, 'Recovery constraints updated', `Budget ${constraints.maxBudgetUsd}; delay ${constraints.maxPriorityDelayHours}h; hub cap ${constraints.maxHubUtilizationPct}%.`),
          ...state.audit,
        ],
      };
    }
    case 'draft_plan': {
      if (state.phase === 'committed') return state;
      const next = createPlan(action.strategy, state.constraints);
      const plans = [next, ...state.plans.filter((plan) => plan.id !== next.id)];
      return {
        ...state,
        view: 'network',
        phase: 'planned',
        plans,
        selectedPlanId: next.id,
        audit: [
          audit(action.actor, `${next.name} drafted`, action.note || `${next.metrics.onTimePct}% on-time at ${next.metrics.addedCostUsd} added cost.`),
          ...state.audit,
        ],
      };
    }
    case 'generate_plan_set': {
      if (state.phase === 'committed') return state;
      const plans = createPlanSet(state.constraints);
      return {
        ...state,
        view: 'plans',
        phase: 'planned',
        plans,
        selectedPlanId: plans[0]?.id ?? null,
        audit: [audit(action.actor, 'Four recovery plans simulated', `Best fit is ${plans[0]?.name} with score ${plans[0]?.score}.`), ...state.audit],
      };
    }
    case 'select_plan': {
      if (state.phase === 'committed') return state;
      const approvalInvalidated = action.planId !== state.selectedPlanId && (state.phase === 'approved' || state.phase === 'awaiting_approval');
      return {
        ...state,
        selectedPlanId: action.planId,
        phase: approvalInvalidated ? 'planned' : state.phase,
        plans: approvalInvalidated ? resetStatuses(state.plans) : state.plans,
        audit: action.actor
          ? [audit(action.actor, 'Recovery plan selected', `${action.planId} is now active in the workspace.${approvalInvalidated ? ' Prior approval was cleared.' : ''}`), ...state.audit]
          : state.audit,
      };
    }
    case 'request_approval':
      if (state.phase === 'committed') return state;
      return {
        ...state,
        selectedPlanId: action.planId,
        phase: 'awaiting_approval',
        plans: resetStatuses(state.plans),
        audit: [audit(action.actor, 'Human approval requested', `${action.planId} is staged for operator review.`), ...state.audit],
      };
    case 'approve_plan':
      return {
        ...state,
        phase: 'approved',
        plans: state.plans.map((plan) => ({ ...plan, status: plan.id === action.planId ? 'approved' : 'draft' })),
        selectedPlanId: action.planId,
        audit: [audit('operator', 'Plan approved', `${action.planId} may now be committed by the operator or agent.`), ...state.audit],
      };
    case 'commit_plan':
      return {
        ...state,
        view: 'network',
        phase: 'committed',
        plans: state.plans.map((plan) => ({ ...plan, status: plan.id === action.planId ? 'committed' : 'draft' })),
        selectedPlanId: action.planId,
        audit: [audit(action.actor, 'Recovery plan committed', `${action.planId} changed the visible network and protected orders.`), ...state.audit],
      };
    case 'undo_commit':
      return {
        ...state,
        phase: 'planned',
        plans: resetStatuses(state.plans),
        audit: [audit(action.actor, 'Commit reverted', 'Network returned to the pre-commit recovery state.'), ...state.audit],
      };
    case 'record_tool':
      return {
        ...state,
        toolCallCount: state.toolCallCount + 1,
        lastToolName: action.name,
        audit: [audit('agent', `Tool called: ${action.name}`, action.detail), ...state.audit],
      };
    default:
      return state;
  }
}
