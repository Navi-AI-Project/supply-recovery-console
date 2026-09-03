'use client';

import { AlertTriangle, ArrowRight, Check, GitCompareArrows, ShieldCheck, SlidersHorizontal, Sparkles } from 'lucide-react';
import { formatCurrency, type RecoveryConstraints, type RecoveryPlan } from '@/lib/recovery';

interface PlansViewProps {
  constraints: RecoveryConstraints;
  plans: RecoveryPlan[];
  selectedPlanId: string | null;
  locked: boolean;
  onUpdateConstraints: (constraints: Partial<RecoveryConstraints>) => void;
  onGenerate: () => void;
  onSelect: (planId: string) => void;
  onCompare: () => void;
  onReview: () => void;
}

export function PlansView(props: PlansViewProps) {
  const selected = props.plans.find((plan) => plan.id === props.selectedPlanId) ?? null;
  const submitConstraints = (event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    props.onUpdateConstraints({
      maxBudgetUsd: Number(data.get('maxBudgetUsd')),
      maxPriorityDelayHours: Number(data.get('maxPriorityDelayHours')),
      maxHubUtilizationPct: Number(data.get('maxHubUtilizationPct')),
      protectCriticalOrders: data.get('protectCriticalOrders') === 'on',
    });
  };

  return (
    <section className="min-w-0 p-3 lg:p-4">
      <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div><p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-[#1f6659]"><Sparkles size={12} /> Decision workspace</p><h1 className="mt-1 text-xl font-semibold">Recovery plans</h1></div>
        <p className="max-w-md text-xs leading-5 text-[#656c66]">Change the operating guardrails, then compare deterministic simulations before requesting human approval.</p>
      </div>

      <div className="grid gap-3 xl:grid-cols-[300px_minmax(0,1fr)]">
        <form key={JSON.stringify(props.constraints)} onSubmit={submitConstraints} className="border border-[#d8dcd6] bg-white">
          <div className="flex items-center gap-2 border-b border-[#e3e6e1] px-3 py-2.5"><SlidersHorizontal size={15} /><h2 className="text-xs font-semibold">Operating guardrails</h2></div>
          <div className="space-y-5 p-4">
            <label htmlFor="max-budget" aria-label="Recovery budget" className="block">
              <span className="flex items-center justify-between text-[10px]"><span className="font-semibold">Recovery budget</span><strong>{formatCurrency(props.constraints.maxBudgetUsd)}</strong></span>
              <input disabled={props.locked} id="max-budget" name="maxBudgetUsd" type="range" min="9000" max="40000" step="1000" defaultValue={props.constraints.maxBudgetUsd} className="mt-3 w-full accent-[#137561] disabled:opacity-40" />
              <span className="mt-1 flex justify-between text-[8px] text-[#8a908b]"><span>$9k</span><span>$40k</span></span>
            </label>
            <label htmlFor="priority-delay" aria-label="Priority delay limit" className="block">
              <span className="flex items-center justify-between text-[10px]"><span className="font-semibold">Priority delay limit</span><strong>{props.constraints.maxPriorityDelayHours}h</strong></span>
              <input disabled={props.locked} id="priority-delay" name="maxPriorityDelayHours" type="range" min="8" max="36" step="2" defaultValue={props.constraints.maxPriorityDelayHours} className="mt-3 w-full accent-[#137561] disabled:opacity-40" />
              <span className="mt-1 flex justify-between text-[8px] text-[#8a908b]"><span>8h</span><span>36h</span></span>
            </label>
            <label htmlFor="hub-utilization" aria-label="Peak hub capacity" className="block">
              <span className="flex items-center justify-between text-[10px]"><span className="font-semibold">Peak hub capacity</span><strong>{props.constraints.maxHubUtilizationPct}%</strong></span>
              <input disabled={props.locked} id="hub-utilization" name="maxHubUtilizationPct" type="range" min="70" max="96" step="1" defaultValue={props.constraints.maxHubUtilizationPct} className="mt-3 w-full accent-[#137561] disabled:opacity-40" />
              <span className="mt-1 flex justify-between text-[8px] text-[#8a908b]"><span>70%</span><span>96%</span></span>
            </label>
            <label htmlFor="protect-critical" aria-label="Protect all critical orders" className="flex cursor-pointer items-start gap-3 border-y border-[#e8ebe6] py-3">
              <input disabled={props.locked} id="protect-critical" name="protectCriticalOrders" type="checkbox" defaultChecked={props.constraints.protectCriticalOrders} className="mt-0.5 size-4 accent-[#137561] disabled:opacity-40" />
              <span><span className="block text-[10px] font-semibold">Protect all critical orders</span><span className="mt-1 block text-[9px] leading-4 text-[#737a74]">Reserve capacity before optimizing cost.</span></span>
            </label>
            {props.locked && <p className="border border-[#cfe0da] bg-[#f2faf7] p-2 text-[9px] leading-4 text-[#385f55]">A plan is committed. Undo it before changing guardrails or drafting a replacement.</p>}
            <button disabled={props.locked} type="submit" className="w-full rounded-md bg-[#202421] px-3 py-2 text-[10px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-35">Apply and recalculate</button>
          </div>
        </form>

        <section className="min-w-0 border border-[#d8dcd6] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e3e6e1] px-3 py-2.5">
            <div><p className="text-[10px] font-semibold uppercase text-[#777e78]">Candidate simulations</p><p className="mt-1 text-[10px] text-[#777e78]">{props.plans.length > 0 ? `${props.plans.length} plans scored against current guardrails` : 'No simulations generated'}</p></div>
            <div className="flex gap-2">
              {props.plans.length >= 2 && <button onClick={props.onCompare} className="flex items-center gap-1.5 rounded-md border border-[#cfd4ce] px-2.5 py-1.5 text-[10px] font-semibold hover:bg-[#f0f2ee]"><GitCompareArrows size={13} /> Compare</button>}
              <button disabled={props.locked} onClick={props.onGenerate} className="flex items-center gap-1.5 rounded-md bg-[#202421] px-2.5 py-1.5 text-[10px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-35"><Sparkles size={13} /> {props.plans.length > 0 ? 'Re-run' : 'Generate plans'}</button>
            </div>
          </div>

          {props.plans.length === 0 ? (
            <div className="grid min-h-[430px] place-items-center p-8 text-center"><div><Sparkles className="mx-auto text-[#7d867e]" size={26} /><p className="mt-3 text-sm font-semibold">Ready to simulate four strategies</p><p className="mt-2 max-w-sm text-[11px] leading-5 text-[#737a74]">Balanced, service-first, cost-guarded, and resilience plans use the same deterministic recovery engine.</p><button onClick={props.onGenerate} className="mt-4 rounded-md bg-[#202421] px-4 py-2.5 text-xs font-semibold text-white">Generate plans</button></div></div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[720px] divide-y divide-[#e8ebe6]">
              {props.plans.map((plan, index) => {
                const active = plan.id === props.selectedPlanId;
                return (
                  <button disabled={props.locked} key={plan.id} onClick={() => props.onSelect(plan.id)} className={`grid w-full grid-cols-[28px_minmax(150px,1.4fr)_repeat(5,minmax(62px,.65fr))_28px] items-center gap-2 px-3 py-3 text-left text-[10px] transition-colors disabled:cursor-not-allowed ${active ? 'bg-[#edf7f3]' : 'hover:bg-[#fafbf8]'}`}>
                    <span className={`grid size-5 place-items-center rounded-full border ${active ? 'border-[#137561] bg-[#137561] text-white' : 'border-[#cbd0ca] bg-white'}`}>{active && <Check size={11} />}</span>
                    <span><span className="block font-semibold">{plan.name}</span><span className="mt-1 block text-[9px] text-[#7b827c]">{plan.id}{index === 0 ? ' - best fit' : ''}</span></span>
                    <span><span className="block text-[8px] text-[#858b86]">Fit</span><strong className="text-[#1f6659]">{plan.score}</strong></span>
                    <span><span className="block text-[8px] text-[#858b86]">On time</span><strong>{plan.metrics.onTimePct}%</strong></span>
                    <span><span className="block text-[8px] text-[#858b86]">Cost</span><strong>{formatCurrency(plan.metrics.addedCostUsd)}</strong></span>
                    <span><span className="block text-[8px] text-[#858b86]">Late</span><strong>{plan.metrics.lateOrders}</strong></span>
                    <span><span className="block text-[8px] text-[#858b86]">Peak</span><strong>{plan.metrics.maxHubUtilizationPct}%</strong></span>
                    <span>{plan.violations.length > 0 ? <AlertTriangle size={14} className="text-[#c6503c]" /> : <ShieldCheck size={14} className="text-[#137561]" />}</span>
                  </button>
                );
              })}
              </div>
            </div>
          )}

          {selected && <div className="border-t border-[#dfe3dd] bg-[#fafbf8] p-3"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-[10px] font-semibold">{selected.summary}</p><p className="mt-1 text-[9px] text-[#747b75]">{selected.violations.length === 0 ? 'All guardrails satisfied.' : selected.violations.join(' - ')}</p></div><button disabled={props.locked} onClick={props.onReview} className="flex shrink-0 items-center justify-center gap-2 rounded-md bg-[#202421] px-3 py-2 text-[10px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-35">Review selected plan <ArrowRight size={13} /></button></div></div>}
        </section>
      </div>
    </section>
  );
}
