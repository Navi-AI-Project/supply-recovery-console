'use client';

import { useCallback, useMemo, useReducer, useState } from 'react';
import {
  AlertTriangle,
  Box,
  Code2,
  Network,
  RefreshCcw,
  Route,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { AuditView } from '@/components/views/audit-view';
import { NetworkView } from '@/components/views/network-view';
import { OrdersView } from '@/components/views/orders-view';
import { PlansView } from '@/components/views/plans-view';
import { RecoveryDialogs } from '@/components/recovery-dialogs';
import { useRecoveryWebMCP } from '@/hooks/use-recovery-webmcp';
import { type RecoveryConstraints, type ViewName } from '@/lib/recovery';
import { consoleReducer, initialState } from '@/lib/recovery-state';

const navItems = [
  { icon: Network, label: 'Network', view: 'network' as const },
  { icon: AlertTriangle, label: 'Exceptions', view: 'orders' as const },
  { icon: Box, label: 'Orders', view: 'orders' as const },
  { icon: Sparkles, label: 'Recovery plans', view: 'plans' as const },
  { icon: ShieldCheck, label: 'Audit log', view: 'audit' as const },
];

const incidents = [
  { label: 'Oakland port closure', meta: 'Critical - 42 orders', active: true },
  { label: 'Denver capacity alert', meta: 'Watch - 81% utilized', active: false },
  { label: 'Dallas carrier delay', meta: 'Stable - 3 hours', active: false },
];

export function RecoveryConsole() {
  const [state, dispatch] = useReducer(consoleReducer, initialState);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  const selectedPlan = useMemo(
    () => state.plans.find((plan) => plan.id === state.selectedPlanId) ?? null,
    [state.plans, state.selectedPlanId],
  );

  const openApproval = useCallback(() => setApprovalOpen(true), []);
  const openComparison = useCallback(() => setComparisonOpen(true), []);

  useRecoveryWebMCP({ state, dispatch, openApproval, openComparison });

  const setView = (view: ViewName) => dispatch({ type: 'set_view', view });
  const focus = (entityId: string) => dispatch({ type: 'focus', entityId, actor: 'operator' });
  const generatePlans = () => dispatch({ type: 'generate_plan_set', actor: 'operator' });
  const draftBalanced = () => dispatch({ type: 'draft_plan', strategy: 'balanced', actor: 'operator' });
  const updateConstraints = (constraints: Partial<RecoveryConstraints>) => dispatch({ type: 'update_constraints', constraints, actor: 'operator' });
  const selectPlan = (planId: string) => dispatch({ type: 'select_plan', planId, actor: 'operator' });
  const reviewPlan = () => {
    if (!selectedPlan || state.phase === 'committed') return;
    if (state.phase !== 'awaiting_approval') dispatch({ type: 'request_approval', planId: selectedPlan.id, actor: 'operator' });
    setApprovalOpen(true);
  };
  const approvePlan = (planId: string) => dispatch({ type: 'approve_plan', planId });
  const commitPlan = () => {
    if (selectedPlan?.status !== 'approved') return;
    dispatch({ type: 'commit_plan', planId: selectedPlan.id, actor: 'operator' });
  };
  const undoCommit = () => dispatch({ type: 'undo_commit', actor: 'operator' });

  const toolStatus = state.webmcpSupported === true ? 'Agent tools live' : 'WebMCP-ready';

  return (
    <main className="min-h-screen bg-[#f3f4f1] text-[#202421]">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#2f3430] bg-[#202421] px-4 text-white lg:px-6">
        <div className="flex items-center gap-3">
          <div className="grid size-8 place-items-center rounded-md bg-[#d7ff64] text-[#202421]"><Route size={18} strokeWidth={2.2} /></div>
          <div><p className="text-sm font-semibold leading-none">Supply Recovery Console</p><p className="mt-1 text-[10px] text-[#aeb5af]">Scenario SR-204 - Pacific closure</p></div>
        </div>
        <div className="flex items-center gap-2">
          <a href="https://github.com/Navi-AI-Project/supply-recovery-console" target="_blank" rel="noreferrer" className="grid size-8 place-items-center rounded-md border border-[#444a45] text-[#d7dbd7] hover:bg-[#2c312d]" aria-label="View source on GitHub" title="View source on GitHub"><Code2 size={15} /></a>
          <button onClick={() => setToolsOpen(true)} className="flex items-center gap-2 rounded-md border border-[#444a45] px-2.5 py-1.5 text-[11px] text-[#d7dbd7] hover:bg-[#2c312d]">
            <span className={`size-1.5 rounded-full ${state.webmcpSupported === false ? 'bg-[#e1a749]' : 'bg-[#d7ff64]'}`} />
            <span className="hidden sm:inline">{toolStatus}</span>
            <span className="text-[#939a94]">{state.phase === 'approved' || state.phase === 'committed' ? '9' : '8'}</span>
          </button>
          <button onClick={() => dispatch({ type: 'reset' })} className="grid size-8 place-items-center rounded-md border border-[#444a45] text-[#d7dbd7] hover:bg-[#2c312d]" aria-label="Reset scenario" title="Reset scenario"><RefreshCcw size={15} /></button>
        </div>
      </header>

      <div className="border-b border-[#d9ddd7] bg-[#fafbf8] px-2 py-1.5 lg:hidden">
        <div className="flex gap-1 overflow-x-auto">
          {navItems.filter((item, index) => index !== 1).map(({ icon: Icon, label, view }) => (
            <button key={label} onClick={() => setView(view)} className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-semibold ${state.view === view ? 'bg-[#e5e9e3]' : 'text-[#6c736d]'}`}><Icon size={13} /> {label}</button>
          ))}
        </div>
      </div>

      <div className="grid min-h-[calc(100vh-56px)] grid-cols-1 lg:grid-cols-[208px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[#d9ddd7] bg-[#fafbf8] p-3 lg:block">
          <p className="px-2 py-2 text-[10px] font-semibold uppercase text-[#838a84]">Operations</p>
          {navItems.map(({ icon: Icon, label, view }) => (
            <button key={label} onClick={() => setView(view)} className={`mb-1 flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium ${state.view === view ? 'bg-[#e8ebe5] text-[#202421]' : 'text-[#626963] hover:bg-[#f0f2ee]'}`}><Icon size={15} /> {label}</button>
          ))}
          <div className="mt-5 border-t border-[#e2e5df] pt-4">
            <p className="px-2 text-[10px] font-semibold uppercase text-[#838a84]">Active incidents</p>
            <div className="mt-2 space-y-1">
              {incidents.map((incident) => (
                <button key={incident.label} onClick={() => { setView('network'); focus(incident.active ? 'OAK' : incident.label.startsWith('Denver') ? 'DEN' : 'DFW'); }} className={`w-full rounded-md border p-2.5 text-left ${incident.active ? 'border-[#efb5aa] bg-[#fff2ef]' : 'border-transparent hover:bg-[#f0f2ee]'}`}>
                  <span className="block text-[11px] font-semibold">{incident.label}</span><span className={`mt-1 block text-[10px] ${incident.active ? 'text-[#bd4a36]' : 'text-[#7b827c]'}`}>{incident.meta}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5 border-t border-[#e2e5df] px-2 pt-4 text-[9px] leading-4 text-[#858c86]"><span className="font-semibold text-[#5e665f]">Synthetic scenario</span><br />No customer systems or external APIs.</div>
        </aside>

        <div className="min-w-0">
          {state.view === 'network' && <NetworkView plan={selectedPlan} phase={state.phase} constraints={state.constraints} focusedEntityId={state.focusedEntityId} toolCallCount={state.toolCallCount} lastToolName={state.lastToolName} onFocus={focus} onDraft={generatePlans} onReview={reviewPlan} onCompare={openComparison} onCommit={commitPlan} onUndo={undoCommit} onOpenPlans={() => setView('plans')} />}
          {state.view === 'orders' && <OrdersView focusedEntityId={state.focusedEntityId} onFocus={focus} onDraftPlan={draftBalanced} />}
          {state.view === 'plans' && <PlansView constraints={state.constraints} plans={state.plans} selectedPlanId={state.selectedPlanId} locked={state.phase === 'committed'} onUpdateConstraints={updateConstraints} onGenerate={generatePlans} onSelect={selectPlan} onCompare={openComparison} onReview={reviewPlan} />}
          {state.view === 'audit' && <AuditView audit={state.audit} phase={state.phase} toolCallCount={state.toolCallCount} lastToolName={state.lastToolName} />}
        </div>
      </div>

      <RecoveryDialogs plan={selectedPlan} plans={state.plans} constraints={state.constraints} phase={state.phase} approvalOpen={approvalOpen} comparisonOpen={comparisonOpen} toolsOpen={toolsOpen} onApprovalOpenChange={setApprovalOpen} onComparisonOpenChange={setComparisonOpen} onToolsOpenChange={setToolsOpen} onApprove={approvePlan} onSelectPlan={selectPlan} />
    </main>
  );
}
