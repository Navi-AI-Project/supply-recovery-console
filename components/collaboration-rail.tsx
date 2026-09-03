'use client';

import {
  Bot,
  Calculator,
  Check,
  LockKeyhole,
  Radio,
  Send,
} from 'lucide-react';
import type { Phase } from '@/lib/recovery-state';

interface CollaborationRailProps {
  phase: Phase;
}

const steps = [
  { label: 'Inspect', owner: 'Agent', icon: Bot },
  { label: 'Simulate', owner: 'Engine', icon: Calculator },
  { label: 'Approve', owner: 'Human only', icon: LockKeyhole },
  { label: 'Commit', owner: 'Gated agent', icon: Send },
];

const phaseIndex: Record<Phase, number> = {
  incident: 0,
  planned: 1,
  awaiting_approval: 2,
  approved: 3,
  committed: 4,
};

const phaseLabel: Record<Phase, string> = {
  incident: 'Agent inspection ready',
  planned: 'Plans under review',
  awaiting_approval: 'Waiting for operator',
  approved: 'Commit capability unlocked',
  committed: 'Recovery plan live',
};

export function CollaborationRail({ phase }: CollaborationRailProps) {
  const currentIndex = phaseIndex[phase];
  const progress = phase === 'committed' ? 100 : (currentIndex / 3) * 100;

  return (
    <section className="mt-3 border border-[#d8dcd6] bg-[#fbfcf9] px-3 py-2.5" aria-label="Human and agent authority path">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Radio size={13} className="text-[#137561]" />
          <p className="text-[9px] font-semibold uppercase text-[#626963]">Decision authority</p>
        </div>
        <p className={`text-[9px] font-semibold ${phase === 'awaiting_approval' ? 'text-[#a7651a]' : 'text-[#1f6659]'}`}>{phaseLabel[phase]}</p>
      </div>

      <div className="relative grid grid-cols-4 gap-1">
        <div className="absolute left-[7%] right-[7%] top-3 h-px bg-[#d8dcd6]" aria-hidden="true">
          <span className="authority-progress block h-px bg-[#1f8a78]" style={{ width: `${progress}%` }} />
          {phase !== 'committed' && <span className="authority-pulse absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-[#d7ff64] ring-2 ring-[#1f8a78]" style={{ left: `calc(${progress}% - 3px)` }} />}
        </div>

        {steps.map(({ label, owner, icon: Icon }, index) => {
          const complete = currentIndex > index;
          const active = currentIndex === index;
          return (
            <div key={label} className="relative z-10 flex min-w-0 flex-col items-center text-center">
              <span className={`grid size-6 place-items-center rounded-full border ${complete ? 'border-[#137561] bg-[#137561] text-white' : active ? 'border-[#202421] bg-[#d7ff64] text-[#202421] shadow-[0_0_0_3px_rgb(215_255_100/28%)]' : 'border-[#cfd4ce] bg-white text-[#858c86]'}`}>
                {complete ? <Check size={12} strokeWidth={2.5} /> : <Icon size={11} />}
              </span>
              <p className={`mt-1 text-[9px] font-semibold ${active || complete ? 'text-[#303631]' : 'text-[#858c86]'}`}>{label}</p>
              <p className={`truncate text-[8px] ${owner === 'Human only' && active ? 'font-semibold text-[#a7651a]' : 'text-[#8a908b]'}`}>{owner}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
