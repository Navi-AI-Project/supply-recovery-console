'use client';

import { useEffect, useRef } from 'react';
import {
  atRiskOrders,
  createPlan,
  getNode,
  getPlan,
  incident,
  orderCounts,
  selectOrders,
  type RecoveryConstraints,
  type Strategy,
} from '@/lib/recovery';
import type { ConsoleAction, ConsoleState } from '@/lib/recovery-state';

interface WebMCPOptions {
  state: ConsoleState;
  dispatch: React.Dispatch<ConsoleAction>;
  openApproval: () => void;
  openComparison: () => void;
}

function record(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {} as Record<string, unknown>;
  return input as Record<string, unknown>;
}

function numberInRange(value: unknown, name: string, min: number, max: number) {
  if (value === undefined) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new Error(`INVALID_${name.toUpperCase()}: expected a number from ${min} to ${max}.`);
  }
  return value;
}

function afterVisibleUpdate() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function register(context: WebMCPContext, tool: WebMCPTool, signal: AbortSignal) {
  try {
    void Promise.resolve(context.registerTool(tool, { signal })).catch((error) => {
      console.error(`WebMCP registration failed for ${tool.name}`, error);
    });
  } catch (error) {
    console.error(`WebMCP registration failed for ${tool.name}`, error);
  }
}

export function useRecoveryWebMCP({ state, dispatch, openApproval, openComparison }: WebMCPOptions) {
  const stateRef = useRef(state);
  const approvalRef = useRef(openApproval);
  const comparisonRef = useRef(openComparison);

  useEffect(() => {
    stateRef.current = state;
    approvalRef.current = openApproval;
    comparisonRef.current = openComparison;
  }, [state, openApproval, openComparison]);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) {
      dispatch({ type: 'set_webmcp', supported: false });
      return;
    }

    dispatch({ type: 'set_webmcp', supported: true });
    const lifecycle = new AbortController();
    const common = { signal: lifecycle.signal };

    register(context, {
      name: 'get_scenario_status',
      title: 'Get recovery status',
      description: 'Read the active disruption, constraints, current phase, selected plan, and headline metrics.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: async () => {
        const current = stateRef.current;
        const plan = current.plans.find((item) => item.id === current.selectedPlanId);
        dispatch({ type: 'record_tool', name: 'get_scenario_status', detail: 'Read the current recovery workspace.' });
        await afterVisibleUpdate();
        return {
          incident: { id: incident.id, title: incident.title, durationHours: incident.expectedDurationHours },
          phase: current.phase,
          constraints: current.constraints,
          selectedPlan: plan ? { id: plan.id, name: plan.name, status: plan.status, metrics: plan.metrics, violations: plan.violations } : null,
          orderCounts,
        };
      },
    }, common.signal);

    register(context, {
      name: 'inspect_disruption',
      title: 'Inspect disruption',
      description: 'Inspect the active Oakland disruption, affected routes, duration, cause, and recommended next step.',
      inputSchema: {
        type: 'object',
        properties: { incidentId: { type: 'string', description: 'Incident ID; use INC-OAK-36.' } },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: async (input) => {
        const value = record(input);
        if (value.incidentId && value.incidentId !== incident.id) throw new Error(`INCIDENT_NOT_FOUND: use ${incident.id}.`);
        dispatch({ type: 'record_tool', name: 'inspect_disruption', detail: `Inspected ${incident.id} and focused Oakland.` });
        dispatch({ type: 'focus', entityId: 'OAK', actor: 'agent' });
        await afterVisibleUpdate();
        return { ...incident, affectedRoutes: ['OAK-DEN', 'OAK-DFW'], ordersAtRisk: orderCounts.total, criticalOrders: orderCounts.critical };
      },
    }, common.signal);

    register(context, {
      name: 'list_at_risk_orders',
      title: 'List at-risk orders',
      description: 'List a concise sample of delayed orders, optionally filtered by critical, priority, or standard service level.',
      inputSchema: {
        type: 'object',
        properties: {
          priority: { type: 'string', enum: ['all', 'critical', 'priority', 'standard'], description: 'Service level filter.' },
          limit: { type: 'number', minimum: 1, maximum: 12, description: 'Maximum orders to return.' },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async (input) => {
        const value = record(input);
        const priority = typeof value.priority === 'string' ? value.priority : 'all';
        if (!['all', 'critical', 'priority', 'standard'].includes(priority)) throw new Error('INVALID_PRIORITY: use all, critical, priority, or standard.');
        const limit = numberInRange(value.limit, 'limit', 1, 12) ?? 8;
        const orders = selectOrders(priority as 'all' | typeof atRiskOrders[number]['priority'], limit);
        dispatch({ type: 'record_tool', name: 'list_at_risk_orders', detail: `Listed ${orders.length} ${priority} orders.` });
        await afterVisibleUpdate();
        return { totalAtRisk: orderCounts.total, matchingSample: orders.length, orders };
      },
    }, common.signal);

    register(context, {
      name: 'set_recovery_constraints',
      title: 'Set recovery constraints',
      description: 'Stage budget, priority-delay, hub-capacity, and critical-order constraints. Existing drafts are recalculated.',
      inputSchema: {
        type: 'object',
        properties: {
          maxBudgetUsd: { type: 'number', minimum: 9000, maximum: 40000, description: 'Maximum added recovery spend.' },
          maxPriorityDelayHours: { type: 'number', minimum: 8, maximum: 36, description: 'Maximum priority delay.' },
          maxHubUtilizationPct: { type: 'number', minimum: 70, maximum: 96, description: 'Peak hub utilization limit.' },
          protectCriticalOrders: { type: 'boolean', description: 'Require all critical orders to be protected.' },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async (input) => {
        if (stateRef.current.phase === 'committed') throw new Error('COMMIT_ACTIVE: undo or reset the committed plan before changing constraints.');
        const value = record(input);
        const updates: Partial<RecoveryConstraints> = {};
        const budget = numberInRange(value.maxBudgetUsd, 'maxBudgetUsd', 9000, 40000);
        const delay = numberInRange(value.maxPriorityDelayHours, 'maxPriorityDelayHours', 8, 36);
        const utilization = numberInRange(value.maxHubUtilizationPct, 'maxHubUtilizationPct', 70, 96);
        if (budget !== undefined) updates.maxBudgetUsd = budget;
        if (delay !== undefined) updates.maxPriorityDelayHours = delay;
        if (utilization !== undefined) updates.maxHubUtilizationPct = utilization;
        if (value.protectCriticalOrders !== undefined) {
          if (typeof value.protectCriticalOrders !== 'boolean') throw new Error('INVALID_PROTECTCRITICALORDERS: expected true or false.');
          updates.protectCriticalOrders = value.protectCriticalOrders;
        }
        if (Object.keys(updates).length === 0) throw new Error('NO_CONSTRAINTS: provide at least one constraint to update.');
        const next = { ...stateRef.current.constraints, ...updates };
        dispatch({ type: 'record_tool', name: 'set_recovery_constraints', detail: 'Updated the visible operating guardrails.' });
        dispatch({ type: 'update_constraints', constraints: updates, actor: 'agent' });
        await afterVisibleUpdate();
        return { status: 'updated', constraints: next, draftsRecalculated: stateRef.current.plans.length > 0 };
      },
    }, common.signal);

    register(context, {
      name: 'draft_recovery_plan',
      title: 'Draft recovery plan',
      description: 'Create and display one recovery plan using a balanced, service-first, cost-guarded, or resilience strategy.',
      inputSchema: {
        type: 'object',
        properties: {
          strategy: { type: 'string', enum: ['balanced', 'service_first', 'cost_guarded', 'resilience'], description: 'Planning strategy.' },
          note: { type: 'string', maxLength: 160, description: 'Optional reason for this draft.' },
        },
        required: ['strategy'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async (input) => {
        if (stateRef.current.phase === 'committed') throw new Error('COMMIT_ACTIVE: undo or reset the committed plan before drafting another plan.');
        const value = record(input);
        const strategy = value.strategy;
        if (typeof strategy !== 'string' || !['balanced', 'service_first', 'cost_guarded', 'resilience'].includes(strategy)) {
          throw new Error('INVALID_STRATEGY: use balanced, service_first, cost_guarded, or resilience.');
        }
        const note = typeof value.note === 'string' ? value.note.slice(0, 160) : undefined;
        const plan = createPlan(strategy as Strategy, stateRef.current.constraints);
        dispatch({ type: 'record_tool', name: 'draft_recovery_plan', detail: `Drafted ${plan.id} using ${strategy}.` });
        dispatch({ type: 'draft_plan', strategy: strategy as Strategy, actor: 'agent', note });
        await afterVisibleUpdate();
        return { status: 'drafted', plan: { id: plan.id, name: plan.name, score: plan.score, metrics: plan.metrics, violations: plan.violations, actions: plan.actions.map(({ id, label, effect }) => ({ id, label, effect })) } };
      },
    }, common.signal);

    register(context, {
      name: 'compare_recovery_plans',
      title: 'Compare recovery plans',
      description: 'Compare existing draft plans across service, cost, delay, capacity, emissions, and constraint violations.',
      inputSchema: {
        type: 'object',
        properties: { planIds: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 4, description: 'Plan IDs to compare.' } },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: async (input) => {
        const current = stateRef.current;
        if (current.plans.length < 2) throw new Error('PLANS_REQUIRED: draft at least two plans or use the visible Generate plans action.');
        const value = record(input);
        const requested = Array.isArray(value.planIds) ? value.planIds.filter((id): id is string => typeof id === 'string') : current.plans.map((plan) => plan.id);
        const plans = requested.map((id) => getPlan(current.plans, id)).filter((plan): plan is NonNullable<typeof plan> => Boolean(plan));
        if (plans.length < 2) throw new Error('PLANS_NOT_FOUND: provide at least two existing plan IDs.');
        dispatch({ type: 'record_tool', name: 'compare_recovery_plans', detail: `Compared ${plans.map((plan) => plan.id).join(', ')}.` });
        comparisonRef.current();
        await afterVisibleUpdate();
        return { recommended: [...plans].sort((a, b) => b.score - a.score)[0].id, plans: plans.map(({ id, name, score, metrics, violations, tradeoffs }) => ({ id, name, score, metrics, violations, tradeoffs })) };
      },
    }, common.signal);

    register(context, {
      name: 'focus_network_entity',
      title: 'Focus network entity',
      description: 'Center the visible workspace on a network node or sampled at-risk order so the user can inspect it.',
      inputSchema: {
        type: 'object',
        properties: { entityId: { type: 'string', description: 'Node ID such as OAK or order ID such as MED-1042.' } },
        required: ['entityId'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async (input) => {
        if (stateRef.current.phase === 'committed') throw new Error('COMMIT_ACTIVE: the current plan is already committed. Undo it before requesting another approval.');
        const value = record(input);
        if (typeof value.entityId !== 'string') throw new Error('INVALID_ENTITY_ID: provide a node or order ID.');
        const entityId = value.entityId.toUpperCase();
        const node = getNode(entityId);
        const order = atRiskOrders.find((item) => item.id === entityId);
        if (!node && !order) throw new Error('ENTITY_NOT_FOUND: use a visible node ID or sampled order ID.');
        dispatch({ type: 'record_tool', name: 'focus_network_entity', detail: `Focused ${entityId} for shared inspection.` });
        dispatch({ type: 'focus', entityId, actor: 'agent' });
        await afterVisibleUpdate();
        return { status: 'focused', entity: node ?? order, visibleView: node ? 'network' : 'orders' };
      },
    }, common.signal);

    register(context, {
      name: 'request_human_approval',
      title: 'Request human approval',
      description: 'Stage an existing plan for explicit human review. This never approves or commits the plan.',
      inputSchema: {
        type: 'object',
        properties: { planId: { type: 'string', description: 'Existing plan ID to stage for review.' } },
        required: ['planId'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async (input) => {
        const value = record(input);
        if (typeof value.planId !== 'string') throw new Error('INVALID_PLAN_ID: provide an existing plan ID.');
        const plan = getPlan(stateRef.current.plans, value.planId);
        if (!plan) throw new Error('PLAN_NOT_FOUND: draft the plan before requesting approval.');
        dispatch({ type: 'record_tool', name: 'request_human_approval', detail: `Staged ${plan.id} without approving it.` });
        dispatch({ type: 'request_approval', planId: plan.id, actor: 'agent' });
        approvalRef.current();
        await afterVisibleUpdate();
        return { status: 'awaiting_human_approval', planId: plan.id, violations: plan.violations, nextStep: 'The operator must review and click Approve plan in the visible interface.' };
      },
    }, common.signal);

    return () => lifecycle.abort();
  }, [dispatch]);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();

    if (state.phase === 'approved') {
      register(context, {
        name: 'commit_approved_plan',
        title: 'Commit approved plan',
        description: 'Commit the currently human-approved recovery plan and update the visible network. Fails without approval.',
        inputSchema: {
          type: 'object',
          properties: { planId: { type: 'string', description: 'The human-approved plan ID.' } },
          required: ['planId'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: async (input) => {
          const value = record(input);
          const current = stateRef.current;
          const approved = current.plans.find((plan) => plan.status === 'approved');
          if (!approved) throw new Error('PLAN_NOT_APPROVED: ask the user to approve a staged plan first.');
          if (typeof value.planId !== 'string' || value.planId.toUpperCase() !== approved.id) throw new Error(`PLAN_ID_MISMATCH: the approved plan is ${approved.id}.`);
          dispatch({ type: 'record_tool', name: 'commit_approved_plan', detail: `Committed human-approved ${approved.id}.` });
          dispatch({ type: 'commit_plan', planId: approved.id, actor: 'agent' });
          await afterVisibleUpdate();
          return { status: 'committed', planId: approved.id, metrics: approved.metrics, changedRoutes: approved.actions.filter((action) => action.kind === 'reroute').map((action) => action.label), undoAvailable: true };
        },
      }, lifecycle.signal);
    }

    if (state.phase === 'committed') {
      register(context, {
        name: 'undo_last_commit',
        title: 'Undo last recovery commit',
        description: 'Revert the committed recovery plan and restore the pre-commit network state.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: async () => {
          const current = stateRef.current;
          const committed = current.plans.find((plan) => plan.status === 'committed');
          if (!committed) throw new Error('NO_COMMIT: there is no committed recovery plan to undo.');
          dispatch({ type: 'record_tool', name: 'undo_last_commit', detail: `Reverted ${committed.id}.` });
          dispatch({ type: 'undo_commit', actor: 'agent' });
          await afterVisibleUpdate();
          return { status: 'reverted', planId: committed.id, phase: 'planned' };
        },
      }, lifecycle.signal);
    }

    return () => lifecycle.abort();
  }, [dispatch, state.phase]);
}
