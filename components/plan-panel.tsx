'use client';

import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  GitCompareArrows,
  PackageCheck,
  RotateCcw,
  Sparkles,
  Truck,
} from 'lucide-react';
import { formatCurrency, type PlanAction, type RecoveryPlan } from '@/lib/recovery';
import type { Phase } from '@/lib/recovery-state';

interface PlanPanelProps {
  plan: RecoveryPlan | null;
  phase: Phase;
  onDraft: () => void;
  onReview: () => void;
  onCompare: () => void;
  onCommit: () => void;
  onUndo: () => void;
}

const actionIcons: Record<PlanAction['kind'], typeof Truck> = {
  reroute: Truck,
  reserve: PackageCheck,
  expedite: Clock3,
  hold: Clock3,
};

export function PlanPanel({ plan, phase, onDraft, onReview, onCompare, onCommit, onUndo }: PlanPanelProps) {
  if (!plan) {
    return (
      <aside className="flex min-h-[430px] flex-col border border-[#d8dcd6] bg-white">
        <div className="border-b border-[#e3e6e1] px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase text-[#777e78]">Recovery workspace</p>
          <h2 className="mt-1 text-sm font-semibold">No plan drafted</h2>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="grid size-10 place-items-center rounded-md bg-[#edf2ed] text-[#394039]"><Sparkles size={18} /></div>
          <h3 className="mt-4 text-sm font-semibold">Turn the disruption into options</h3>
          <p className="mt-2 max-w-[250px] text-[11px] leading-5 text-[#717872]">Simulate service, cost, and resilience strategies against the current constraints.</p>
          <button onClick={onDraft} className="mt-5 flex items-center gap-2 rounded-md bg-[#202421] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#303530]">
            Generate recovery plans <ArrowRight size={14} />
          </button>
        </div>
      </aside>
    );
  }

  const statusLabel = phase === 'committed' ? 'Committed' : phase === 'approved' ? 'Human approved' : phase === 'awaiting_approval' ? 'Review requested' : 'Agent proposal';

  return (
    <aside className="border border-[#d8dcd6] bg-white">
      <div className="flex items-start justify-between border-b border-[#e3e6e1] px-3 py-2.5">
        <div>
          <p className={`text-[10px] font-semibold uppercase ${phase === 'committed' || phase === 'approved' ? 'text-[#1f6659]' : 'text-[#777e78]'}`}>{statusLabel}</p>
          <h2 className="mt-1 text-sm font-semibold">{plan.name} - {plan.id}</h2>
        </div>
        <div className="min-w-10 border border-[#d8dcd6] bg-[#f6f7f4] px-2 py-1 text-center">
          <p className="text-[8px] uppercase text-[#7a817b]">Fit</p>
          <p className="text-sm font-semibold text-[#1f6659]">{plan.score}</p>
        </div>
      </div>

      <div className="space-y-3 p-3">
        <p className="text-[10px] leading-4 text-[#666d67]">{plan.summary}</p>
        <div className="grid grid-cols-3 border border-[#e2e5df]">
          <div className="p-2"><p className="text-[9px] text-[#777e78]">On time</p><p className="mt-1 text-sm font-semibold text-[#1f6659]">{plan.metrics.onTimePct}%</p></div>
          <div className="border-l border-[#e2e5df] p-2"><p className="text-[9px] text-[#777e78]">Added cost</p><p className="mt-1 text-sm font-semibold">{formatCurrency(plan.metrics.addedCostUsd)}</p></div>
          <div className="border-l border-[#e2e5df] p-2"><p className="text-[9px] text-[#777e78]">Late orders</p><p className="mt-1 text-sm font-semibold text-[#b26a19]">{plan.metrics.lateOrders}</p></div>
        </div>

        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase text-[#777e78]">Recommended actions</p>
          {plan.actions.slice(0, 4).map((action) => {
            const Icon = actionIcons[action.kind];
            return (
              <div key={action.id} className="flex gap-2 border-t border-[#edf0eb] py-2 first:border-t-0">
                <div className="grid size-7 shrink-0 place-items-center rounded-md bg-[#edf2ed] text-[#394039]"><Icon size={14} /></div>
                <div className="min-w-0"><p className="text-[10px] font-medium leading-4">{action.label}</p><p className="text-[9px] text-[#7b827c]">{action.effect}</p></div>
              </div>
            );
          })}
        </div>

        {plan.violations.length > 0 ? (
          <div className="border border-[#f0c1b8] bg-[#fff5f2] p-2.5">
            <div className="flex gap-2"><AlertTriangle className="mt-0.5 shrink-0 text-[#c7503b]" size={14} /><div><p className="text-[10px] font-semibold text-[#a43d2c]">{plan.violations.length} constraint issue{plan.violations.length > 1 ? 's' : ''}</p><p className="mt-1 text-[10px] leading-4 text-[#76534c]">{plan.violations[0]}</p></div></div>
          </div>
        ) : (
          <div className="flex gap-2 border border-[#abd4cb] bg-[#ecf8f5] p-2.5 text-[#1f6659]"><Check size={14} /><p className="text-[10px] font-medium">All current operating constraints are satisfied.</p></div>
        )}

        <div className="grid grid-cols-[1fr_auto] gap-2">
          {phase === 'committed' ? (
            <button onClick={onUndo} className="flex items-center justify-center gap-2 rounded-md bg-[#202421] px-3 py-2.5 text-xs font-semibold text-white hover:bg-[#303530]"><RotateCcw size={14} /> Undo commit</button>
          ) : phase === 'approved' ? (
            <button onClick={onCommit} className="flex items-center justify-center gap-2 rounded-md bg-[#137561] px-3 py-2.5 text-xs font-semibold text-white hover:bg-[#0d6654]"><CheckCircle2 size={14} /> Commit approved plan</button>
          ) : (
            <button onClick={onReview} className="flex items-center justify-center gap-2 rounded-md bg-[#202421] px-3 py-2.5 text-xs font-semibold text-white hover:bg-[#303530]">{phase === 'awaiting_approval' ? 'Open approval review' : 'Review plan'} <ArrowRight size={14} /></button>
          )}
          <button onClick={onCompare} className="grid size-9 place-items-center rounded-md border border-[#cfd4ce] text-[#4b524c] hover:bg-[#f0f2ee]" aria-label="Compare plans" title="Compare plans"><GitCompareArrows size={15} /></button>
        </div>
      </div>
    </aside>
  );
}
