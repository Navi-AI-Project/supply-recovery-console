'use client';

import { useState } from 'react';
import { AlertTriangle, Bot, CheckCircle2, LockKeyhole, ShieldCheck, X } from 'lucide-react';
import { formatCurrency, type RecoveryConstraints, type RecoveryPlan } from '@/lib/recovery';
import type { Phase } from '@/lib/recovery-state';

interface RecoveryDialogsProps {
  plan: RecoveryPlan | null;
  plans: RecoveryPlan[];
  constraints: RecoveryConstraints;
  phase: Phase;
  approvalOpen: boolean;
  comparisonOpen: boolean;
  toolsOpen: boolean;
  onApprovalOpenChange: (open: boolean) => void;
  onComparisonOpenChange: (open: boolean) => void;
  onToolsOpenChange: (open: boolean) => void;
  onApprove: (planId: string) => void;
  onSelectPlan: (planId: string) => void;
}

const baseTools = [
  ['get_scenario_status', 'Read', 'Current workspace state'],
  ['inspect_disruption', 'Read', 'Incident evidence and impact'],
  ['list_at_risk_orders', 'Read', 'Filtered order sample'],
  ['set_recovery_constraints', 'Stage', 'Operating guardrails'],
  ['draft_recovery_plan', 'Stage', 'One strategy simulation'],
  ['compare_recovery_plans', 'Read', 'Visible plan comparison'],
  ['focus_network_entity', 'Navigate', 'Shared visual focus'],
  ['request_human_approval', 'Stage', 'Approval request only'],
];

function Modal({ open, onClose, maxWidth, children, label }: { open: boolean; onClose: () => void; maxWidth: string; children: React.ReactNode; label: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button type="button" onClick={onClose} className="absolute inset-0 cursor-default bg-black/25 backdrop-blur-[2px]" aria-label="Close dialog backdrop" />
      <dialog open aria-label={label} className={`relative m-0 max-h-[92vh] w-full overflow-x-hidden overflow-y-auto rounded-md bg-white p-0 text-[#202421] shadow-2xl ${maxWidth}`}>
        <button onClick={onClose} className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-md border border-[#d7dbd5] bg-white text-[#555d56] hover:bg-[#f0f2ee]" aria-label="Close dialog" title="Close"><X size={15} /></button>
        {children}
      </dialog>
    </div>
  );
}

export function RecoveryDialogs(props: RecoveryDialogsProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const { plan } = props;
  const closeApproval = () => {
    setAcknowledged(false);
    props.onApprovalOpenChange(false);
  };

  return (
    <>
      <Modal open={props.approvalOpen} onClose={closeApproval} maxWidth="max-w-[680px]" label="Review recovery plan">
          <div className="border-b border-[#e1e5df] px-5 py-4 pr-14">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase text-[#a84b38]"><LockKeyhole size={13} /> Human approval boundary</div>
            <h2 className="mt-2 text-lg font-semibold">Review {plan?.id ?? 'recovery plan'}</h2>
            <p className="mt-1 text-xs text-[#6f766f]">Confirm the exact operational changes before the commit tool becomes available.</p>
          </div>

          {plan && (
            <div className="space-y-4 px-5 py-4">
              <div className="flex items-start justify-between gap-4 border-b border-[#e8ebe6] pb-4">
                <div><p className="text-sm font-semibold">{plan.name}</p><p className="mt-1 max-w-lg text-xs leading-5 text-[#666d67]">{plan.rationale}</p></div>
                <div className="border border-[#cfd4ce] bg-[#f6f7f4] px-3 py-2 text-center"><p className="text-[9px] uppercase text-[#777e78]">Fit score</p><p className="text-xl font-semibold text-[#1f6659]">{plan.score}</p></div>
              </div>

              <div className="grid grid-cols-2 border border-[#dde1db] sm:grid-cols-4">
                {[
                  ['On-time', `${plan.metrics.onTimePct}%`, '78% current'],
                  ['Added cost', formatCurrency(plan.metrics.addedCostUsd), `${formatCurrency(props.constraints.maxBudgetUsd)} cap`],
                  ['Late orders', String(plan.metrics.lateOrders), '42 at risk'],
                  ['Peak hub', `${plan.metrics.maxHubUtilizationPct}%`, `${props.constraints.maxHubUtilizationPct}% limit`],
                ].map(([label, value, meta], index) => (
                  <div key={label} className={`p-3 ${index > 0 ? 'border-l border-[#e4e7e2]' : ''} ${index > 1 ? 'max-sm:border-t' : ''}`}>
                    <p className="text-[9px] text-[#757c76]">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p><p className="mt-1 text-[9px] text-[#8a908b]">{meta}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase text-[#757c76]">Commit will apply</p>
                <div className="divide-y divide-[#e8ebe6] border-y border-[#e8ebe6]">
                  {plan.actions.map((action) => (
                    <div key={action.id} className="grid grid-cols-[26px_1fr_auto] items-start gap-2 py-2.5">
                      <span className="grid size-6 place-items-center rounded-md bg-[#edf2ed] text-[9px] font-semibold">{action.id.includes('CRITICAL') ? 'C' : action.id.includes('EXPRESS') ? 'E' : action.id.split('-').at(-1)}</span>
                      <div><p className="text-[11px] font-medium">{action.label}</p><p className="mt-0.5 text-[10px] leading-4 text-[#737a74]">{action.detail}</p></div>
                      <span className="hidden text-[9px] text-[#1f6659] sm:block">{action.effect}</span>
                    </div>
                  ))}
                </div>
              </div>

              {plan.violations.length > 0 && (
                <div className="border border-[#efb5aa] bg-[#fff3f0] p-3">
                  <div className="flex gap-2"><AlertTriangle size={15} className="mt-0.5 shrink-0 text-[#c6503c]" /><div><p className="text-[11px] font-semibold text-[#a33f2e]">Exceptions remain</p>{plan.violations.map((violation) => <p key={violation} className="mt-1 text-[10px] text-[#76534c]">{violation}</p>)}</div></div>
                </div>
              )}

              <label htmlFor="approval-acknowledgement" aria-label="Acknowledge recovery plan impact" className="flex cursor-pointer items-start gap-3 border border-[#d8dcd6] bg-[#f8f9f6] p-3">
                <input id="approval-acknowledgement" type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} className="mt-0.5 size-4 accent-[#137561]" />
                <span><span className="block text-[11px] font-semibold">I reviewed the service, cost, and capacity impact.</span><span className="mt-1 block text-[10px] leading-4 text-[#6e756f]">Approval enables a separate commit action. It does not execute the plan automatically.</span></span>
              </label>

              <div className="flex justify-end gap-2 border-t border-[#e1e5df] pt-4">
                <button onClick={closeApproval} className="rounded-md border border-[#cfd4ce] px-4 py-2 text-xs font-semibold hover:bg-[#f0f2ee]">Cancel</button>
                <button disabled={!acknowledged} onClick={() => { props.onApprove(plan.id); closeApproval(); }} className="flex items-center gap-2 rounded-md bg-[#137561] px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"><CheckCircle2 size={14} /> Approve plan</button>
              </div>
            </div>
          )}
      </Modal>

      <Modal open={props.comparisonOpen} onClose={() => props.onComparisonOpenChange(false)} maxWidth="max-w-[920px]" label="Compare recovery plans">
          <div className="border-b border-[#e1e5df] px-5 py-4 pr-14">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase text-[#1f6659]"><Bot size={13} /> Simulation comparison</div>
            <h2 className="mt-2 text-lg font-semibold">Recovery plans</h2>
            <p className="mt-1 text-xs text-[#6f766f]">Every option uses the same disruption state and operating constraints.</p>
          </div>
          <div className="overflow-x-auto px-5 py-4">
            {props.plans.length < 2 ? (
              <div className="py-12 text-center text-sm text-[#6f766f]">Generate at least two plans to compare them.</div>
            ) : (
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#dfe3dd] text-[9px] uppercase text-[#777e78]">
                    <th className="px-2 py-2 font-semibold">Plan</th><th className="px-2 py-2 font-semibold">Fit</th><th className="px-2 py-2 font-semibold">On time</th><th className="px-2 py-2 font-semibold">Cost</th><th className="px-2 py-2 font-semibold">Late</th><th className="px-2 py-2 font-semibold">Peak hub</th><th className="px-2 py-2 font-semibold">Emissions</th><th className="px-2 py-2 font-semibold">Constraints</th><th><span className="sr-only">Select plan</span></th>
                  </tr>
                </thead>
                <tbody>
                  {props.plans.map((item, index) => (
                    <tr key={item.id} className={`border-b border-[#e7eae5] text-[11px] ${item.id === props.plan?.id ? 'bg-[#edf7f3]' : ''}`}>
                      <td className="px-2 py-3"><p className="font-semibold">{item.name}</p><p className="mt-1 text-[9px] text-[#7b827c]">{item.id}{index === 0 ? ' - best fit' : ''}</p></td>
                      <td className="px-2 py-3 font-semibold text-[#1f6659]">{item.score}</td>
                      <td className="px-2 py-3">{item.metrics.onTimePct}%</td>
                      <td className="px-2 py-3">{formatCurrency(item.metrics.addedCostUsd)}</td>
                      <td className="px-2 py-3">{item.metrics.lateOrders}</td>
                      <td className="px-2 py-3">{item.metrics.maxHubUtilizationPct}%</td>
                      <td className={`px-2 py-3 ${item.metrics.emissionsDeltaPct > 15 ? 'text-[#b24c38]' : 'text-[#586059]'}`}>{item.metrics.emissionsDeltaPct > 0 ? '+' : ''}{item.metrics.emissionsDeltaPct}%</td>
                      <td className="px-2 py-3">{item.violations.length === 0 ? <span className="text-[#1f6659]">Pass</span> : <span className="text-[#b24c38]">{item.violations.length} issue{item.violations.length > 1 ? 's' : ''}</span>}</td>
                      <td className="px-2 py-3 text-right"><button onClick={() => { props.onSelectPlan(item.id); props.onComparisonOpenChange(false); }} className="rounded-md border border-[#cbd1ca] px-2.5 py-1.5 text-[10px] font-semibold hover:bg-white">Select</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
      </Modal>

      <Modal open={props.toolsOpen} onClose={() => props.onToolsOpenChange(false)} maxWidth="max-w-[720px]" label="WebMCP tools">
          <div className="border-b border-[#e1e5df] px-5 py-4 pr-14">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase text-[#1f6659]"><ShieldCheck size={13} /> WebMCP capability surface</div>
            <h2 className="mt-2 text-lg font-semibold">Semantic tools</h2>
            <p className="mt-1 text-xs text-[#6f766f]">The visible UI and every tool call share the same recovery state and audited actions.</p>
          </div>
          <div className="px-5 py-4">
            <div className="mb-4 grid grid-cols-3 border border-[#dde1db] bg-[#fafbf8]">
              <div className="p-3"><p className="text-[9px] text-[#777e78]">Registered now</p><p className="mt-1 text-sm font-semibold text-[#1f6659]">{props.phase === 'approved' || props.phase === 'committed' ? '9 tools' : '8 tools'}</p></div>
              <div className="border-l border-[#e3e6e1] p-3"><p className="text-[9px] text-[#777e78]">Engine tests</p><p className="mt-1 text-sm font-semibold text-[#1f6659]">16 / 16</p></div>
              <div className="border-l border-[#e3e6e1] p-3"><p className="text-[9px] text-[#777e78]">Mutation model</p><p className="mt-1 text-sm font-semibold">Staged</p></div>
            </div>
            <div className="mb-3 grid grid-cols-[1fr_80px_1.1fr] gap-2 border-b border-[#dfe3dd] pb-2 text-[9px] font-semibold uppercase text-[#777e78]"><span>Tool</span><span>Mode</span><span>Purpose</span></div>
            <div className="divide-y divide-[#e8ebe6]">
              {baseTools.map(([name, mode, purpose]) => (
                <div key={name} className="grid grid-cols-[1fr_80px_1.1fr] items-center gap-2 py-2.5 text-[10px]"><code className="truncate font-mono text-[#29302b]">{name}</code><span className={`w-fit px-1.5 py-1 text-[9px] font-semibold ${mode === 'Read' ? 'bg-[#edf2ed] text-[#546057]' : mode === 'Navigate' ? 'bg-[#f0eee5] text-[#786b37]' : 'bg-[#ecf8f5] text-[#1f6659]'}`}>{mode}</span><span className="text-[#717872]">{purpose}</span></div>
              ))}
              <div className={`grid grid-cols-[1fr_80px_1.1fr] items-center gap-2 py-2.5 text-[10px] ${props.phase === 'approved' ? 'bg-[#ecf8f5] -mx-2 px-2' : 'opacity-45'}`}>
                <code className="truncate font-mono">commit_approved_plan</code><span className="w-fit bg-[#e7f5ef] px-1.5 py-1 text-[9px] font-semibold text-[#176453]">Commit</span><span className="text-[#717872]">{props.phase === 'approved' ? 'Available after human approval' : 'Dynamically unavailable'}</span>
              </div>
              <div className={`grid grid-cols-[1fr_80px_1.1fr] items-center gap-2 py-2.5 text-[10px] ${props.phase === 'committed' ? 'bg-[#ecf8f5] -mx-2 px-2' : 'opacity-45'}`}>
                <code className="truncate font-mono">undo_last_commit</code><span className="w-fit bg-[#f2eee6] px-1.5 py-1 text-[9px] font-semibold text-[#76633d]">Undo</span><span className="text-[#717872]">{props.phase === 'committed' ? 'Available after commit' : 'Dynamically unavailable'}</span>
              </div>
            </div>
            <div className="mt-4 flex gap-2 border border-[#cfe0da] bg-[#f2faf7] p-3 text-[10px] leading-4 text-[#385f55]"><ShieldCheck size={15} className="mt-0.5 shrink-0" /><p>Read tools are annotated read-only. External order content is marked untrusted. Approval is a human-only UI action, and the commit capability is registered only after approval.</p></div>
          </div>
      </Modal>
    </>
  );
}
