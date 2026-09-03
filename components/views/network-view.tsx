'use client';

import { Activity, AlertTriangle, CheckCircle2, Network, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { NetworkMap } from '@/components/network-map';
import { PlanPanel } from '@/components/plan-panel';
import { formatCurrency, type RecoveryConstraints, type RecoveryPlan } from '@/lib/recovery';
import type { Phase } from '@/lib/recovery-state';

interface NetworkViewProps {
  plan: RecoveryPlan | null;
  phase: Phase;
  constraints: RecoveryConstraints;
  focusedEntityId: string | null;
  toolCallCount: number;
  lastToolName: string | null;
  onFocus: (id: string) => void;
  onDraft: () => void;
  onReview: () => void;
  onCompare: () => void;
  onCommit: () => void;
  onUndo: () => void;
  onOpenPlans: () => void;
}

export function NetworkView(props: NetworkViewProps) {
  const committed = props.phase === 'committed';
  const metrics = [
    { label: 'Orders at risk', value: committed && props.plan ? String(props.plan.metrics.lateOrders) : '42', delta: committed ? 'after recovery' : '+18 since closure', tone: committed ? 'text-[#1f6659]' : 'text-[#d7563e]' },
    { label: committed ? 'On-time delivery' : 'On-time forecast', value: props.plan ? `${props.plan.metrics.onTimePct}%` : '78%', delta: committed ? 'plan is live' : props.plan ? 'if committed' : 'current state', tone: props.plan ? 'text-[#1f6659]' : 'text-[#d7563e]' },
    { label: 'Recovery cost', value: props.plan ? formatCurrency(props.plan.metrics.addedCostUsd) : '$0', delta: props.plan ? (committed ? 'committed' : 'forecast') : `${formatCurrency(props.constraints.maxBudgetUsd)} cap`, tone: props.plan && props.plan.metrics.addedCostUsd > props.constraints.maxBudgetUsd ? 'text-[#d7563e]' : 'text-[#202421]' },
    { label: 'Priority protected', value: props.plan ? `${props.plan.metrics.priorityProtected}/14` : '3/14', delta: props.plan ? (committed ? 'protected' : 'forecast') : '11 need recovery', tone: props.plan && props.plan.metrics.priorityProtected >= 14 ? 'text-[#1f6659]' : 'text-[#b26a19]' },
  ];

  return (
    <section className="min-w-0 p-3 lg:p-4">
      <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase ${committed ? 'text-[#1f6659]' : 'text-[#bd4a36]'}`}>{committed ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />} {committed ? 'Recovery active' : 'Active disruption'}</p>
          <h1 className="mt-1 text-xl font-semibold">{committed ? `${props.plan?.name} is live` : 'Recover the Pacific inbound network'}</h1>
        </div>
        <p className="max-w-md text-xs leading-5 text-[#656c66]">{committed ? 'The approved reroute is active. Monitor the network or undo the commit to restore the prior state.' : 'Oakland is unavailable for 36 hours. Re-route priority orders while balancing service, cost, and hub capacity.'}</p>
      </div>

      <div className="grid grid-cols-2 border border-[#d8dcd6] bg-white md:grid-cols-4">
        {metrics.map((metric, index) => (
          <div key={metric.label} className={`px-3 py-3 ${index > 0 ? 'border-l border-[#e3e6e1]' : ''} ${index > 1 ? 'max-md:border-t' : ''}`}>
            <p className="text-[10px] font-medium text-[#707771]">{metric.label}</p>
            <div className="mt-1 flex items-baseline justify-between gap-2"><span className={`text-xl font-semibold ${metric.tone}`}>{metric.value}</span><span className="text-[9px] text-[#858b86]">{metric.delta}</span></div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border border-[#d8dcd6] bg-white px-3 py-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-[#656c66]">
          <span className="flex items-center gap-1.5 font-semibold text-[#313732]"><SlidersHorizontal size={13} /> Guardrails</span>
          <span>Budget <strong>{formatCurrency(props.constraints.maxBudgetUsd)}</strong></span>
          <span>Priority delay <strong>{props.constraints.maxPriorityDelayHours}h</strong></span>
          <span>Hub cap <strong>{props.constraints.maxHubUtilizationPct}%</strong></span>
          <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-[#1f6659]" /> Critical protected</span>
        </div>
        <button onClick={props.onOpenPlans} className="rounded-md border border-[#cfd4ce] px-2.5 py-1.5 text-[10px] font-semibold hover:bg-[#f0f2ee]">Adjust</button>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="border border-[#d8dcd6] bg-white">
          <div className="flex items-center justify-between border-b border-[#e3e6e1] px-3 py-2.5"><div className="flex items-center gap-2"><Network size={15} /><h2 className="text-xs font-semibold">Network impact</h2></div><div className="flex gap-3 text-[9px] text-[#717872]"><span>Open</span><span className="text-[#b26a19]">Watch</span><span className="text-[#d7563e]">Closed</span></div></div>
          <NetworkMap plan={props.plan} phase={props.phase} focusedEntityId={props.focusedEntityId} onFocus={props.onFocus} />
        </section>
        <PlanPanel plan={props.plan} phase={props.phase} onDraft={props.onDraft} onReview={props.onReview} onCompare={props.onCompare} onCommit={props.onCommit} onUndo={props.onUndo} />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border border-[#d8dcd6] bg-white px-3 py-2 text-[10px] text-[#6d746e]">
        <span className="flex items-center gap-2"><Activity size={13} className="text-[#1f8a78]" /> {props.toolCallCount > 0 ? `${props.toolCallCount} agent tool call${props.toolCallCount > 1 ? 's' : ''} recorded` : 'Scenario ready for analysis'}</span>
        <span>{props.lastToolName ? `Last tool: ${props.lastToolName}` : 'Human approval boundary enabled'}</span>
      </div>
    </section>
  );
}
