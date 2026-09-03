export type Strategy = 'balanced' | 'service_first' | 'cost_guarded' | 'resilience';
export type ViewName = 'network' | 'orders' | 'plans' | 'audit';
export type PlanStatus = 'draft' | 'approved' | 'committed';

export interface RecoveryConstraints {
  maxBudgetUsd: number;
  maxPriorityDelayHours: number;
  maxHubUtilizationPct: number;
  protectCriticalOrders: boolean;
}

export interface NetworkNode {
  id: string;
  name: string;
  type: 'port' | 'hub';
  x: number;
  y: number;
  status: 'open' | 'watch' | 'closed';
  utilization: number;
  capacity: number;
}

export interface NetworkLink {
  id: string;
  from: string;
  to: string;
  mode: 'rail' | 'truck';
  status: 'open' | 'affected' | 'proposed';
}

export interface AtRiskOrder {
  id: string;
  customer: string;
  destination: string;
  category: string;
  priority: 'critical' | 'priority' | 'standard';
  units: number;
  valueUsd: number;
  delayHours: number;
  currentRoute: string;
}

export interface PlanAction {
  id: string;
  label: string;
  detail: string;
  effect: string;
  kind: 'reroute' | 'reserve' | 'expedite' | 'hold';
}

export interface PlanMetrics {
  onTimePct: number;
  addedCostUsd: number;
  lateOrders: number;
  priorityProtected: number;
  maxHubUtilizationPct: number;
  averageDelayHours: number;
  emissionsDeltaPct: number;
}

export interface RecoveryPlan {
  id: string;
  strategy: Strategy;
  name: string;
  summary: string;
  rationale: string;
  metrics: PlanMetrics;
  actions: PlanAction[];
  violations: string[];
  tradeoffs: string[];
  status: PlanStatus;
  score: number;
}

export const incident = {
  id: 'INC-OAK-36',
  title: 'Oakland port closure',
  severity: 'critical',
  startedAt: '2026-09-03T11:20:00-07:00',
  expectedDurationHours: 36,
  cause: 'Terminal power failure and temporary gate suspension',
  impact: '42 inbound orders cannot continue on their planned route.',
  recommendation: 'Protect critical orders, then rebalance hub capacity before committing a reroute.',
};

export const networkNodes: NetworkNode[] = [
  { id: 'SEA', name: 'Seattle', type: 'port', x: 74, y: 58, status: 'open', utilization: 68, capacity: 64 },
  { id: 'OAK', name: 'Oakland', type: 'port', x: 88, y: 174, status: 'closed', utilization: 0, capacity: 72 },
  { id: 'DEN', name: 'Denver', type: 'hub', x: 255, y: 130, status: 'watch', utilization: 81, capacity: 48 },
  { id: 'DFW', name: 'Dallas', type: 'hub', x: 323, y: 228, status: 'open', utilization: 67, capacity: 58 },
  { id: 'CHI', name: 'Chicago', type: 'hub', x: 438, y: 104, status: 'open', utilization: 73, capacity: 61 },
  { id: 'ATL', name: 'Atlanta', type: 'hub', x: 474, y: 220, status: 'open', utilization: 62, capacity: 55 },
  { id: 'EWR', name: 'Newark', type: 'port', x: 585, y: 112, status: 'open', utilization: 71, capacity: 68 },
];

export const networkLinks: NetworkLink[] = [
  { id: 'SEA-DEN', from: 'SEA', to: 'DEN', mode: 'rail', status: 'open' },
  { id: 'OAK-DEN', from: 'OAK', to: 'DEN', mode: 'rail', status: 'affected' },
  { id: 'OAK-DFW', from: 'OAK', to: 'DFW', mode: 'truck', status: 'affected' },
  { id: 'DEN-CHI', from: 'DEN', to: 'CHI', mode: 'rail', status: 'open' },
  { id: 'DEN-DFW', from: 'DEN', to: 'DFW', mode: 'truck', status: 'open' },
  { id: 'DFW-ATL', from: 'DFW', to: 'ATL', mode: 'truck', status: 'open' },
  { id: 'CHI-EWR', from: 'CHI', to: 'EWR', mode: 'rail', status: 'open' },
  { id: 'ATL-EWR', from: 'ATL', to: 'EWR', mode: 'truck', status: 'open' },
];

export const defaultConstraints: RecoveryConstraints = {
  maxBudgetUsd: 24000,
  maxPriorityDelayHours: 24,
  maxHubUtilizationPct: 90,
  protectCriticalOrders: true,
};

export const atRiskOrders: AtRiskOrder[] = [
  { id: 'MED-1042', customer: 'Regional Care Network', destination: 'Newark', category: 'Diagnostic kits', priority: 'critical', units: 8, valueUsd: 18200, delayHours: 31, currentRoute: 'OAK-DEN-CHI-EWR' },
  { id: 'MED-1078', customer: 'North County Clinics', destination: 'Chicago', category: 'Clinic consumables', priority: 'critical', units: 6, valueUsd: 12600, delayHours: 29, currentRoute: 'OAK-DEN-CHI' },
  { id: 'MED-1091', customer: 'Civic Health Supply', destination: 'Atlanta', category: 'Sterile packaging', priority: 'critical', units: 5, valueUsd: 9100, delayHours: 27, currentRoute: 'OAK-DFW-ATL' },
  { id: 'PRI-2214', customer: 'Arbor Market', destination: 'Newark', category: 'Launch inventory', priority: 'priority', units: 12, valueUsd: 22800, delayHours: 26, currentRoute: 'OAK-DEN-CHI-EWR' },
  { id: 'PRI-2239', customer: 'Field & Foundry', destination: 'Chicago', category: 'Seasonal goods', priority: 'priority', units: 9, valueUsd: 14800, delayHours: 24, currentRoute: 'OAK-DEN-CHI' },
  { id: 'PRI-2281', customer: 'Common Thread', destination: 'Atlanta', category: 'Member orders', priority: 'priority', units: 11, valueUsd: 13700, delayHours: 22, currentRoute: 'OAK-DFW-ATL' },
  { id: 'PRI-2295', customer: 'Copperline', destination: 'Dallas', category: 'Retail replenishment', priority: 'priority', units: 7, valueUsd: 11400, delayHours: 21, currentRoute: 'OAK-DFW' },
  { id: 'STD-3340', customer: 'Juniper House', destination: 'Denver', category: 'Home goods', priority: 'standard', units: 13, valueUsd: 8900, delayHours: 25, currentRoute: 'OAK-DEN' },
  { id: 'STD-3372', customer: 'Meridian Outfitters', destination: 'Chicago', category: 'Core inventory', priority: 'standard', units: 16, valueUsd: 17100, delayHours: 23, currentRoute: 'OAK-DEN-CHI' },
  { id: 'STD-3404', customer: 'Morrow Goods', destination: 'Newark', category: 'Home goods', priority: 'standard', units: 10, valueUsd: 7600, delayHours: 20, currentRoute: 'OAK-DEN-CHI-EWR' },
  { id: 'STD-3421', customer: 'Basin & Pine', destination: 'Atlanta', category: 'Core inventory', priority: 'standard', units: 14, valueUsd: 9600, delayHours: 19, currentRoute: 'OAK-DFW-ATL' },
  { id: 'STD-3438', customer: 'Eastward Retail', destination: 'Dallas', category: 'Retail replenishment', priority: 'standard', units: 12, valueUsd: 10300, delayHours: 18, currentRoute: 'OAK-DFW' },
];

export const orderCounts = {
  total: 42,
  critical: 3,
  priority: 11,
  standard: 28,
  visibleSample: atRiskOrders.length,
};

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

const templates: Record<Strategy, {
  id: string;
  name: string;
  summary: string;
  rationale: string;
  metrics: PlanMetrics;
  tradeoffs: string[];
  actions: PlanAction[];
}> = {
  balanced: {
    id: 'PLAN-A',
    name: 'Balanced recovery',
    summary: 'Split volume between Dallas and Denver while protecting critical orders.',
    rationale: 'Balances service recovery against cost and available hub capacity.',
    metrics: { onTimePct: 92, addedCostUsd: 18400, lateOrders: 6, priorityProtected: 11, maxHubUtilizationPct: 87, averageDelayHours: 9, emissionsDeltaPct: 8 },
    tradeoffs: ['Six standard orders remain late', 'Uses 87% of Dallas capacity', 'Adds two premium carrier moves'],
    actions: [
      { id: 'A1', label: 'Move 18 priority orders to Dallas', detail: 'Direct truck transfer through the southern corridor.', effect: '+$9.8k - saves 22h', kind: 'reroute' },
      { id: 'A2', label: 'Release 12 units from Denver reserve', detail: 'Allocate protected reserve to four priority orders.', effect: '+$3.1k - protects 4 orders', kind: 'reserve' },
      { id: 'A3', label: 'Hold 8 standard orders for Oakland', detail: 'Avoid premium freight for low-urgency demand.', effect: '$0 - 18 to 26h late', kind: 'hold' },
    ],
  },
  service_first: {
    id: 'PLAN-B',
    name: 'Service first',
    summary: 'Expedite all critical and priority orders through Seattle and Dallas.',
    rationale: 'Maximizes customer service and protects every critical order.',
    metrics: { onTimePct: 97, addedCostUsd: 26800, lateOrders: 2, priorityProtected: 14, maxHubUtilizationPct: 93, averageDelayHours: 4, emissionsDeltaPct: 22 },
    tradeoffs: ['Exceeds the current budget cap', 'Dallas reaches 93% utilization', 'Premium freight raises emissions'],
    actions: [
      { id: 'B1', label: 'Charter Oakland-to-Seattle transfer', detail: 'Recover critical containers through the open northern port.', effect: '+$12.6k - saves 27h', kind: 'expedite' },
      { id: 'B2', label: 'Cross-dock 22 orders in Dallas', detail: 'Use the evening priority sort and direct dispatch.', effect: '+$9.4k - protects 8 orders', kind: 'reroute' },
      { id: 'B3', label: 'Release full Denver reserve', detail: 'Use all available buffer stock for eastern demand.', effect: '+$4.8k - protects 6 orders', kind: 'reserve' },
    ],
  },
  cost_guarded: {
    id: 'PLAN-C',
    name: 'Cost guarded',
    summary: 'Protect only critical demand and defer standard freight until Oakland reopens.',
    rationale: 'Keeps recovery spend low while preventing the highest-impact failures.',
    metrics: { onTimePct: 84, addedCostUsd: 9200, lateOrders: 13, priorityProtected: 8, maxHubUtilizationPct: 82, averageDelayHours: 18, emissionsDeltaPct: -4 },
    tradeoffs: ['Six priority orders miss target', 'Thirteen orders arrive late', 'Higher customer communication burden'],
    actions: [
      { id: 'C1', label: 'Expedite three critical orders', detail: 'Send critical goods through Dallas with protected capacity.', effect: '+$6.4k - protects all critical', kind: 'expedite' },
      { id: 'C2', label: 'Hold standard orders at origin', detail: 'Resume planned movement after terminal reopening.', effect: '$0 - avoids premium freight', kind: 'hold' },
      { id: 'C3', label: 'Use Denver reserve selectively', detail: 'Release stock only for contractual priority demand.', effect: '+$2.1k - protects 5 orders', kind: 'reserve' },
    ],
  },
  resilience: {
    id: 'PLAN-D',
    name: 'Resilience split',
    summary: 'Distribute volume across three hubs to preserve recovery options.',
    rationale: 'Reduces concentration risk and protects capacity if disruption spreads.',
    metrics: { onTimePct: 90, addedCostUsd: 22100, lateOrders: 7, priorityProtected: 12, maxHubUtilizationPct: 78, averageDelayHours: 10, emissionsDeltaPct: 12 },
    tradeoffs: ['More transfer handoffs', 'Slightly lower on-time rate', 'Operationally complex to coordinate'],
    actions: [
      { id: 'D1', label: 'Split volume across three hubs', detail: 'Allocate freight to Denver, Dallas, and Atlanta.', effect: '+$11.2k - caps utilization at 78%', kind: 'reroute' },
      { id: 'D2', label: 'Pre-position Atlanta reserve', detail: 'Create an eastern buffer for follow-on disruption.', effect: '+$5.7k - adds 16 units buffer', kind: 'reserve' },
      { id: 'D3', label: 'Expedite critical orders only', detail: 'Reserve premium carrier capacity for three orders.', effect: '+$4.1k - protects all critical', kind: 'expedite' },
    ],
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function createPlan(strategy: Strategy, constraints: RecoveryConstraints): RecoveryPlan {
  const template = templates[strategy];
  const metrics = { ...template.metrics };
  const actions = template.actions.map((action) => ({ ...action }));
  const tradeoffs = [...template.tradeoffs];

  if (constraints.protectCriticalOrders && metrics.priorityProtected < 14) {
    metrics.priorityProtected = clamp(metrics.priorityProtected + 3, 0, 14);
    metrics.addedCostUsd += 1800;
    metrics.onTimePct = clamp(metrics.onTimePct + 1, 0, 100);
    metrics.lateOrders = clamp(metrics.lateOrders - 1, 0, 42);
    actions.unshift({
      id: `${template.id}-CRITICAL`,
      label: 'Protect all critical orders',
      detail: 'Reserve premium capacity for the three highest-impact shipments.',
      effect: '+$1.8k - 3 critical protected',
      kind: 'expedite',
    });
  }

  if (constraints.maxPriorityDelayHours <= 16 && strategy !== 'service_first') {
    metrics.addedCostUsd += 3200;
    metrics.onTimePct = clamp(metrics.onTimePct + 2, 0, 100);
    metrics.lateOrders = clamp(metrics.lateOrders - 2, 0, 42);
    metrics.averageDelayHours = Math.min(metrics.averageDelayHours, constraints.maxPriorityDelayHours);
    actions.unshift({
      id: `${template.id}-EXPRESS`,
      label: 'Add priority express transfer',
      detail: `Cap priority delay at ${constraints.maxPriorityDelayHours} hours.`,
      effect: '+$3.2k - saves 2 priority orders',
      kind: 'expedite',
    });
  }

  if (constraints.maxHubUtilizationPct < metrics.maxHubUtilizationPct) {
    const reduction = metrics.maxHubUtilizationPct - constraints.maxHubUtilizationPct + 1;
    metrics.maxHubUtilizationPct = Math.max(65, constraints.maxHubUtilizationPct - 1);
    metrics.addedCostUsd += 1600;
    metrics.onTimePct = clamp(metrics.onTimePct - 1, 0, 100);
    metrics.emissionsDeltaPct += 4;
    tradeoffs.unshift(`Additional split routing reduces peak utilization by ${reduction} points`);
    actions.push({
      id: `${template.id}-SPLIT`,
      label: 'Split overflow through Atlanta',
      detail: 'Move excess Dallas and Denver volume onto the southern corridor.',
      effect: '+$1.6k - capacity constraint met',
      kind: 'reroute',
    });
  }

  const violations: string[] = [];
  if (metrics.addedCostUsd > constraints.maxBudgetUsd) {
    violations.push(`Cost exceeds budget by ${formatCurrency(metrics.addedCostUsd - constraints.maxBudgetUsd)}`);
  }
  if (metrics.averageDelayHours > constraints.maxPriorityDelayHours) {
    violations.push(`Average priority delay exceeds target by ${metrics.averageDelayHours - constraints.maxPriorityDelayHours}h`);
  }
  if (metrics.maxHubUtilizationPct > constraints.maxHubUtilizationPct) {
    violations.push(`Peak hub utilization exceeds limit by ${metrics.maxHubUtilizationPct - constraints.maxHubUtilizationPct} points`);
  }
  if (constraints.protectCriticalOrders && metrics.priorityProtected < 14) {
    violations.push(`${14 - metrics.priorityProtected} protected orders remain outside target`);
  }

  const serviceScore = metrics.onTimePct * 0.45 + metrics.priorityProtected * 2.1;
  const costScore = Math.max(0, 28 - metrics.addedCostUsd / 1500);
  const resilienceScore = Math.max(0, 18 - Math.max(0, metrics.maxHubUtilizationPct - 75));
  let objectiveFit = strategy === 'balanced' ? 8 : strategy === 'resilience' ? -8 : 0;
  if (constraints.maxBudgetUsd <= 15000) objectiveFit += strategy === 'cost_guarded' ? 18 : -8;
  if (constraints.maxPriorityDelayHours <= 12) objectiveFit += strategy === 'service_first' ? 15 : -4;
  if (constraints.maxHubUtilizationPct <= 80) objectiveFit += strategy === 'resilience' ? 18 : -20;
  const score = Math.round(clamp(serviceScore + costScore + resilienceScore + objectiveFit - violations.length * 9, 0, 100));

  return {
    id: template.id,
    strategy,
    name: template.name,
    summary: template.summary,
    rationale: template.rationale,
    metrics,
    actions,
    violations,
    tradeoffs,
    status: 'draft',
    score,
  };
}

export function createPlanSet(constraints: RecoveryConstraints) {
  return (['balanced', 'service_first', 'cost_guarded', 'resilience'] as Strategy[])
    .map((strategy) => createPlan(strategy, constraints))
    .sort((a, b) => b.score - a.score);
}

export function selectOrders(priority: AtRiskOrder['priority'] | 'all' = 'all', limit = 8) {
  const filtered = priority === 'all'
    ? atRiskOrders
    : atRiskOrders.filter((order) => order.priority === priority);
  return filtered.slice(0, clamp(limit, 1, atRiskOrders.length));
}

export function getNode(nodeId: string) {
  return networkNodes.find((node) => node.id === nodeId.toUpperCase());
}

export function getPlan(plans: RecoveryPlan[], planId: string) {
  return plans.find((plan) => plan.id === planId.toUpperCase());
}
