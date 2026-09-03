'use client';

import { CheckCircle2, CircleDot, Route } from 'lucide-react';
import { networkLinks, networkNodes, type RecoveryPlan } from '@/lib/recovery';
import type { Phase } from '@/lib/recovery-state';

interface NetworkMapProps {
  plan: RecoveryPlan | null;
  phase: Phase;
  focusedEntityId: string | null;
  onFocus: (entityId: string) => void;
}

function proposedPaths(plan: RecoveryPlan | null) {
  if (!plan) return [];
  switch (plan.strategy) {
    case 'service_first':
      return [
        { d: 'M88 174 C70 130, 65 90, 74 58', label: 'OAK-SEA' },
        { d: 'M74 58 L255 130', label: 'SEA-DEN' },
        { d: 'M88 174 C155 255, 245 266, 323 228', label: 'OAK-DFW' },
      ];
    case 'cost_guarded':
      return [{ d: 'M88 174 C155 255, 245 266, 323 228', label: 'OAK-DFW' }];
    case 'resilience':
      return [
        { d: 'M88 174 C70 130, 65 90, 74 58', label: 'OAK-SEA' },
        { d: 'M88 174 C155 255, 245 266, 323 228', label: 'OAK-DFW' },
        { d: 'M323 228 L474 220', label: 'DFW-ATL' },
      ];
    default:
      return [
        { d: 'M88 174 C155 255, 245 266, 323 228', label: 'OAK-DFW' },
        { d: 'M323 228 L474 220', label: 'DFW-ATL' },
      ];
  }
}

export function NetworkMap({ plan, phase, focusedEntityId, onFocus }: NetworkMapProps) {
  const focusedNode = networkNodes.find((node) => node.id === focusedEntityId);
  const paths = proposedPaths(plan);
  const committed = phase === 'committed';

  return (
    <div className="relative min-h-[382px] overflow-hidden bg-[#f8f9f6] p-3">
      <svg viewBox="0 0 660 300" className="h-full min-h-[342px] w-full" aria-label="Interactive supply network from western ports to eastern distribution hubs">
        <title>Interactive supply network from western ports to eastern distribution hubs</title>
        <defs>
          <pattern id="network-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#e6e9e3" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="660" height="300" fill="url(#network-grid)" />
        {networkLinks.map((link) => {
          const from = networkNodes.find((node) => node.id === link.from)!;
          const to = networkNodes.find((node) => node.id === link.to)!;
          const affected = link.status === 'affected';
          return (
            <line
              key={link.id}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={affected ? '#e17b67' : '#b7beb7'}
              strokeWidth={affected ? 4 : 3}
              strokeDasharray={affected ? '7 6' : undefined}
              opacity={affected && committed ? 0.28 : 1}
            />
          );
        })}

        {paths.map((path, index) => (
          <g key={path.label}>
            <path
              d={path.d}
              fill="none"
              stroke={committed ? '#137561' : '#1f8a78'}
              strokeWidth={committed ? 6 : 5}
              strokeDasharray={committed ? undefined : '10 7'}
              className={committed ? 'route-committed' : 'route-draft'}
            />
            {committed && <circle r="4" fill="#d7ff64" className="route-pulse"><animateMotion dur={`${2.5 + index * 0.6}s`} repeatCount="indefinite" path={path.d} /></circle>}
          </g>
        ))}

        {networkNodes.map((node) => {
          const focused = focusedEntityId === node.id;
          const statusColor = node.status === 'closed' ? '#d7563e' : node.status === 'watch' ? '#c9822c' : '#1f8a78';
          return (
            <a key={node.id} href={`#node-${node.id}`} onClick={(event) => { event.preventDefault(); onFocus(node.id); }} aria-label={`Focus ${node.name}`}>
              <g transform={`translate(${node.x}, ${node.y})`} className="cursor-pointer">
                {focused && <circle r="27" fill="none" stroke="#202421" strokeWidth="1.5" strokeDasharray="3 3" />}
                <circle r="19" fill="#fff" stroke={focused ? '#202421' : statusColor} strokeWidth={focused ? 4 : 3} />
                <circle r="5" fill={statusColor} />
                <text y="34" textAnchor="middle" fontSize="11" fontWeight="700" fill="#303530">{node.id}</text>
                <text y="47" textAnchor="middle" fontSize="9" fill="#747b75">{node.name}</text>
              </g>
            </a>
          );
        })}
      </svg>

      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-end justify-between gap-2">
        <div className={`flex items-center gap-2 border px-3 py-2 text-[10px] ${committed ? 'border-[#89c1b4] bg-[#e4f5f0] text-[#155b4e]' : plan ? 'border-[#abd4cb] bg-[#ecf8f5] text-[#1f6659]' : 'border-[#d7dad5] bg-white text-[#626963]'}`}>
          {committed ? <CheckCircle2 size={14} /> : plan ? <Route size={14} /> : <CircleDot size={14} />}
          <strong>{committed ? 'Live recovery:' : plan ? 'Draft recovery:' : 'Awaiting plan:'}</strong>
          <span>{committed ? `${plan?.name} committed` : plan ? `${plan.name} selected` : 'No reroute staged'}</span>
        </div>
        {focusedNode && (
          <div className="border border-[#d7dad5] bg-white px-3 py-2 text-right text-[10px] shadow-sm">
            <strong>{focusedNode.name} {focusedNode.type}</strong>
            <span className="ml-2 text-[#737a74]">{focusedNode.status === 'closed' ? 'Closed' : `${focusedNode.utilization}% utilized`}</span>
          </div>
        )}
      </div>
    </div>
  );
}
