'use client';

import { Bot, CheckCircle2, ClipboardList, MonitorCog, ShieldCheck, UserRound } from 'lucide-react';
import type { AuditEntry, Phase } from '@/lib/recovery-state';

interface AuditViewProps {
  audit: AuditEntry[];
  phase: Phase;
  toolCallCount: number;
  lastToolName: string | null;
}

const actorIcon = {
  agent: Bot,
  operator: UserRound,
  system: MonitorCog,
};

const actorLabel = {
  agent: 'Agent',
  operator: 'Operator',
  system: 'System',
};

export function AuditView({ audit, phase, toolCallCount, lastToolName }: AuditViewProps) {
  const approvalSeen = audit.some((entry) => entry.event === 'Plan approved');
  const commitSeen = audit.some((entry) => entry.event === 'Recovery plan committed');

  return (
    <section className="min-w-0 p-3 lg:p-4">
      <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div><p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-[#1f6659]"><ShieldCheck size={12} /> Traceable collaboration</p><h1 className="mt-1 text-xl font-semibold">Audit log</h1></div>
        <p className="max-w-md text-xs leading-5 text-[#656c66]">Tool calls, human approvals, commits, and reversals remain visibly attributable throughout the recovery workflow.</p>
      </div>

      <div className="grid grid-cols-2 border border-[#d8dcd6] bg-white sm:grid-cols-4">
        {[['Current phase', phase.replace('_', ' ')], ['Agent tool calls', String(toolCallCount)], ['Human approval', approvalSeen ? 'Recorded' : 'Pending'], ['Commit history', commitSeen ? 'Recorded' : 'None']].map(([label, value], index) => (
          <div key={label} className={`p-3 ${index > 0 ? 'border-l border-[#e3e6e1]' : ''} ${index > 1 ? 'max-sm:border-t' : ''}`}><p className="text-[10px] text-[#737a74]">{label}</p><p className={`mt-1 text-sm font-semibold capitalize ${value === 'Pending' ? 'text-[#b26a19]' : 'text-[#202421]'}`}>{value}</p></div>
        ))}
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_310px]">
        <section className="border border-[#d8dcd6] bg-white">
          <div className="flex items-center gap-2 border-b border-[#e3e6e1] px-3 py-2.5"><ClipboardList size={15} /><h2 className="text-xs font-semibold">Activity timeline</h2></div>
          <div className="divide-y divide-[#e9ece7]">
            {audit.map((entry) => {
              const Icon = actorIcon[entry.actor];
              return (
                <div key={entry.id} className="grid grid-cols-[32px_minmax(0,1fr)_48px] gap-3 px-3 py-3">
                  <span className={`grid size-8 place-items-center rounded-md ${entry.actor === 'agent' ? 'bg-[#edf7f3] text-[#137561]' : entry.actor === 'operator' ? 'bg-[#f7f2e8] text-[#846927]' : 'bg-[#eef0ed] text-[#5d655e]'}`}><Icon size={15} /></span>
                  <div><div className="flex flex-wrap items-center gap-2"><p className="text-[11px] font-semibold">{entry.event}</p><span className="border border-[#dde1db] px-1.5 py-0.5 text-[8px] font-semibold uppercase text-[#717872]">{actorLabel[entry.actor]}</span></div><p className="mt-1 text-[10px] leading-4 text-[#737a74]">{entry.detail}</p></div>
                  <span className="pt-0.5 text-right font-mono text-[9px] text-[#8a908b]">{entry.time}</span>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="space-y-3">
          <section className="border border-[#d8dcd6] bg-white p-3">
            <p className="text-[10px] font-semibold uppercase text-[#777e78]">Approval boundary</p>
            <div className="mt-3 space-y-3">
              {[
                ['Agent may analyze', true],
                ['Agent may stage changes', true],
                ['Agent may approve a plan', false],
                ['Commit requires prior approval', true],
                ['Committed plan can be undone', true],
              ].map(([label, allowed]) => (
                <div key={String(label)} className="flex items-center justify-between gap-3 text-[10px]"><span>{label}</span>{allowed ? <CheckCircle2 size={14} className="text-[#137561]" /> : <span className="text-[9px] font-semibold text-[#b24c38]">Blocked</span>}</div>
              ))}
            </div>
          </section>
          <section className="border border-[#d8dcd6] bg-white p-3">
            <p className="text-[10px] font-semibold uppercase text-[#777e78]">Tool telemetry</p>
            <p className="mt-3 text-[10px] text-[#6e756f]">Most recent tool</p><p className="mt-1 break-all font-mono text-[11px] font-semibold">{lastToolName ?? 'No tool calls yet'}</p>
            <div className="mt-3 border-t border-[#e8ebe6] pt-3 text-[9px] leading-4 text-[#7b827c]">Tool execution returns concise structured results only after the visible state update completes.</div>
          </section>
        </aside>
      </div>
    </section>
  );
}
