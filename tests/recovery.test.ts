import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPlan,
  createPlanSet,
  defaultConstraints,
  getNode,
  getPlan,
  selectOrders,
} from '../lib/recovery.ts';

test('balanced plan is deterministic', () => {
  assert.deepEqual(createPlan('balanced', defaultConstraints), createPlan('balanced', defaultConstraints));
});

test('plan set contains four distinct strategies', () => {
  const plans = createPlanSet(defaultConstraints);
  assert.equal(plans.length, 4);
  assert.equal(new Set(plans.map((plan) => plan.strategy)).size, 4);
});

test('plan set is sorted by fit score', () => {
  const plans = createPlanSet(defaultConstraints);
  assert.deepEqual(plans.map((plan) => plan.score), [...plans].map((plan) => plan.score).sort((a, b) => b - a));
});

test('balanced strategy is the default best fit', () => {
  assert.equal(createPlanSet(defaultConstraints)[0].strategy, 'balanced');
});

test('cost-guarded strategy wins under a strict budget', () => {
  const plans = createPlanSet({ ...defaultConstraints, maxBudgetUsd: 12000 });
  assert.equal(plans[0].strategy, 'cost_guarded');
});

test('service-first strategy wins under a twelve-hour delay target', () => {
  const plans = createPlanSet({ ...defaultConstraints, maxBudgetUsd: 40000, maxPriorityDelayHours: 12 });
  assert.equal(plans[0].strategy, 'service_first');
});

test('resilience strategy wins under a tight capacity limit', () => {
  const plans = createPlanSet({ ...defaultConstraints, maxBudgetUsd: 40000, maxHubUtilizationPct: 78 });
  assert.equal(plans[0].strategy, 'resilience');
});

test('critical protection adds explicit recovery action', () => {
  const protectedPlan = createPlan('cost_guarded', { ...defaultConstraints, protectCriticalOrders: true });
  const unprotectedPlan = createPlan('cost_guarded', { ...defaultConstraints, protectCriticalOrders: false });
  assert.ok(protectedPlan.actions.some((action) => action.id.includes('CRITICAL')));
  assert.ok(protectedPlan.metrics.priorityProtected > unprotectedPlan.metrics.priorityProtected);
});

test('tight delay target adds express transfer', () => {
  const plan = createPlan('balanced', { ...defaultConstraints, maxPriorityDelayHours: 12 });
  assert.ok(plan.actions.some((action) => action.id.includes('EXPRESS')));
  assert.ok(plan.metrics.averageDelayHours <= 12);
});

test('tight hub capacity adds split routing', () => {
  const plan = createPlan('service_first', { ...defaultConstraints, maxHubUtilizationPct: 82, maxBudgetUsd: 40000 });
  assert.ok(plan.actions.some((action) => action.id.includes('SPLIT')));
  assert.ok(plan.metrics.maxHubUtilizationPct < 82);
});

test('budget violation reports exact constraint failure', () => {
  const plan = createPlan('service_first', { ...defaultConstraints, maxBudgetUsd: 15000 });
  assert.ok(plan.violations.some((violation) => violation.startsWith('Cost exceeds budget')));
});

test('cost-guarded plan spends less than service-first plan', () => {
  const costPlan = createPlan('cost_guarded', defaultConstraints);
  const servicePlan = createPlan('service_first', defaultConstraints);
  assert.ok(costPlan.metrics.addedCostUsd < servicePlan.metrics.addedCostUsd);
});

test('service-first plan protects at least as many orders as balanced', () => {
  const servicePlan = createPlan('service_first', defaultConstraints);
  const balancedPlan = createPlan('balanced', defaultConstraints);
  assert.ok(servicePlan.metrics.priorityProtected >= balancedPlan.metrics.priorityProtected);
});

test('order filtering returns only requested priority', () => {
  const orders = selectOrders('critical', 12);
  assert.ok(orders.length > 0);
  assert.ok(orders.every((order) => order.priority === 'critical'));
});

test('order limit is bounded', () => {
  assert.equal(selectOrders('all', 2).length, 2);
  assert.ok(selectOrders('all', 999).length <= 12);
});

test('node and plan lookup are case insensitive', () => {
  const plans = createPlanSet(defaultConstraints);
  assert.equal(getNode('oak')?.id, 'OAK');
  assert.equal(getPlan(plans, 'plan-a')?.id, 'PLAN-A');
});
