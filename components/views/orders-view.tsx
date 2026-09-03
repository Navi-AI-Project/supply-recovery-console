'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, Box, CircleDollarSign, Clock3, MapPin } from 'lucide-react';
import { atRiskOrders, formatCurrency, orderCounts, type AtRiskOrder } from '@/lib/recovery';

interface OrdersViewProps {
  focusedEntityId: string | null;
  onFocus: (id: string) => void;
  onDraftPlan: () => void;
}

type Filter = AtRiskOrder['priority'] | 'all';

const priorityStyle = {
  critical: 'bg-[#fff0ed] text-[#b34633] border-[#efb5aa]',
  priority: 'bg-[#fff7e9] text-[#9a621e] border-[#e9c992]',
  standard: 'bg-[#f0f2ee] text-[#626963] border-[#d9ddd7]',
};

export function OrdersView({ focusedEntityId, onFocus, onDraftPlan }: OrdersViewProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const visible = useMemo(() => filter === 'all' ? atRiskOrders : atRiskOrders.filter((order) => order.priority === filter), [filter]);
  const selected = atRiskOrders.find((order) => order.id === focusedEntityId) ?? visible[0];

  return (
    <section className="min-w-0 p-3 lg:p-4">
      <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div><p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-[#bd4a36]"><AlertTriangle size={12} /> Exception inventory</p><h1 className="mt-1 text-xl font-semibold">At-risk orders</h1></div>
        <p className="max-w-md text-xs leading-5 text-[#656c66]">A representative sample of the 42 orders blocked by Oakland. Critical customer text is treated as untrusted tool content.</p>
      </div>

      <div className="grid grid-cols-2 border border-[#d8dcd6] bg-white sm:grid-cols-4">
        {[['Total at risk', orderCounts.total, 'text-[#d7563e]'], ['Critical', orderCounts.critical, 'text-[#d7563e]'], ['Priority', orderCounts.priority, 'text-[#b26a19]'], ['Standard', orderCounts.standard, 'text-[#4f5750]']].map(([label, value, tone], index) => (
          <div key={String(label)} className={`p-3 ${index > 0 ? 'border-l border-[#e3e6e1]' : ''} ${index > 1 ? 'max-sm:border-t' : ''}`}><p className="text-[10px] text-[#737a74]">{label}</p><p className={`mt-1 text-xl font-semibold ${tone}`}>{value}</p></div>
        ))}
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0 border border-[#d8dcd6] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e3e6e1] px-3 py-2.5">
            <div className="flex items-center gap-2"><Box size={15} /><h2 className="text-xs font-semibold">Delayed order sample</h2></div>
            <div className="flex rounded-md bg-[#edf0eb] p-0.5">
              {(['all', 'critical', 'priority', 'standard'] as Filter[]).map((item) => (
                <button key={item} onClick={() => setFilter(item)} className={`rounded px-2 py-1 text-[9px] font-semibold capitalize ${filter === item ? 'bg-white text-[#202421] shadow-sm' : 'text-[#6f766f]'}`}>{item}</button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead><tr className="border-b border-[#e3e6e1] bg-[#fafbf8] text-[9px] uppercase text-[#777e78]"><th className="px-3 py-2 font-semibold">Order</th><th className="px-3 py-2 font-semibold">Customer</th><th className="px-3 py-2 font-semibold">Priority</th><th className="px-3 py-2 font-semibold">Destination</th><th className="px-3 py-2 font-semibold">Value</th><th className="px-3 py-2 font-semibold">Delay</th><th><span className="sr-only">Inspect order</span></th></tr></thead>
              <tbody>
                {visible.map((order) => (
                  <tr key={order.id} className={`border-b border-[#eceeea] text-[10px] ${selected?.id === order.id ? 'bg-[#edf7f3]' : 'hover:bg-[#fafbf8]'}`}>
                    <td className="px-3 py-2.5"><p className="font-mono font-semibold">{order.id}</p><p className="mt-0.5 text-[9px] text-[#7c837d]">{order.category}</p></td>
                    <td className="px-3 py-2.5 font-medium">{order.customer}</td>
                    <td className="px-3 py-2.5"><span className={`border px-1.5 py-1 text-[8px] font-semibold uppercase ${priorityStyle[order.priority]}`}>{order.priority}</span></td>
                    <td className="px-3 py-2.5">{order.destination}</td>
                    <td className="px-3 py-2.5">{formatCurrency(order.valueUsd)}</td>
                    <td className="px-3 py-2.5 font-semibold text-[#b34633]">{order.delayHours}h</td>
                    <td className="px-3 py-2.5 text-right"><button onClick={() => onFocus(order.id)} className="grid size-7 place-items-center rounded-md border border-[#cfd4ce] hover:bg-white" aria-label={`Inspect ${order.id}`} title={`Inspect ${order.id}`}><ArrowRight size={13} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="border border-[#d8dcd6] bg-white">
          <div className="border-b border-[#e3e6e1] px-3 py-2.5"><p className="text-[10px] font-semibold uppercase text-[#777e78]">Selected order</p><h2 className="mt-1 font-mono text-sm font-semibold">{selected?.id}</h2></div>
          {selected && <div className="space-y-4 p-3">
            <div><p className="text-xs font-semibold">{selected.customer}</p><p className="mt-1 text-[10px] text-[#737a74]">{selected.category} - {selected.units} units</p></div>
            <div className="space-y-2 border-y border-[#e8ebe6] py-3 text-[10px]">
              <p className="flex items-center justify-between"><span className="flex items-center gap-2 text-[#707771]"><MapPin size={13} /> Destination</span><strong>{selected.destination}</strong></p>
              <p className="flex items-center justify-between"><span className="flex items-center gap-2 text-[#707771]"><Clock3 size={13} /> Projected delay</span><strong className="text-[#b34633]">{selected.delayHours} hours</strong></p>
              <p className="flex items-center justify-between"><span className="flex items-center gap-2 text-[#707771]"><CircleDollarSign size={13} /> Order value</span><strong>{formatCurrency(selected.valueUsd)}</strong></p>
            </div>
            <div><p className="text-[9px] font-semibold uppercase text-[#777e78]">Blocked route</p><p className="mt-2 font-mono text-[10px] leading-5 text-[#444b45]">{selected.currentRoute}</p></div>
            <button onClick={onDraftPlan} className="flex w-full items-center justify-center gap-2 rounded-md bg-[#202421] px-3 py-2.5 text-xs font-semibold text-white">Simulate recovery <ArrowRight size={14} /></button>
          </div>}
        </aside>
      </div>
    </section>
  );
}
