'use client';
import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, Order } from '@/lib/api';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
// AI chat is mounted globally in layout.tsx
import { Search, CheckCircle2, Truck, Package, Paintbrush, Clock } from 'lucide-react';
import PayBalanceButton from '@/components/PayBalanceButton';

const STATUS_STEPS = ['Placed', 'Confirmed', 'In Production', 'Shipped', 'Out for Delivery', 'Delivered'];
const ICONS: Record<string, any> = {
  Placed: Clock, Confirmed: CheckCircle2, 'In Production': Paintbrush, Shipped: Truck, 'Out for Delivery': Truck, Delivered: Package,
};

function TrackOrderContent() {
  const sp = useSearchParams();
  const [orderId, setOrderId] = useState(sp.get('order_id') || '');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const params = email ? `?email=${encodeURIComponent(email)}` : '';
      const o = await api<Order>(`/api/orders/${orderId}${params}`);
      setOrder(o);
    } catch (ex: any) {
      setErr(ex?.message?.includes('403') ? 'Enter the email used to place this order.' : 'Order not found');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const currentIdx = order ? STATUS_STEPS.indexOf(order.status) : -1;

  return (
    <main className="min-h-screen bg-[#FAF6F0] py-10 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/home-page" className="flex items-center gap-2 text-[#2C1810] mb-8">
          <AppLogo size={40} /><span className="font-display text-xl">Kalakriti</span>
        </Link>

        <div className="bg-[#FFFDF9] border border-[#E0D5C8] rounded-2xl p-8 shadow-luxury mb-6">
          <h1 className="font-display text-3xl text-[#2C1810] mb-2">Track Your Order</h1>
          <p className="text-sm text-[#9C8878] mb-5 font-body">Enter your Order ID (e.g. KLK-YYYYMMDD-XXXXXX) and registered email.</p>
          <form onSubmit={fetchOrder} className="grid md:grid-cols-3 gap-3">
            <input data-testid="track-order-id" placeholder="Order ID" value={orderId} onChange={(e) => setOrderId(e.target.value)} className="md:col-span-1 px-3 py-2.5 rounded-sm bg-[#FAF6F0] border border-[#E0D5C8] text-[#2C1810] focus:outline-none focus:border-[#C9A84C]" />
            <input data-testid="track-email" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="md:col-span-1 px-3 py-2.5 rounded-sm bg-[#FAF6F0] border border-[#E0D5C8] text-[#2C1810] focus:outline-none focus:border-[#C9A84C]" />
            <button data-testid="track-submit-btn" disabled={loading || !orderId} className="flex items-center justify-center gap-2 bg-[#2C1810] text-[#FAF6F0] font-body font-medium rounded-sm hover:bg-[#1A0E09] disabled:opacity-60">
              <Search size={16} /> {loading ? 'Searching…' : 'Track'}
            </button>
          </form>
          {err && <p className="text-sm text-red-600 mt-3" data-testid="track-error">{err}</p>}
        </div>

        {order && (
          <div className="bg-[#FFFDF9] border border-[#E0D5C8] rounded-2xl p-8 shadow-luxury" data-testid="track-result">
            <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
              <div>
                <p className="text-xs text-[#9C8878] font-mono">{order.order_id}</p>
                <h2 className="font-display text-2xl text-[#2C1810]">{order.customer_name}'s Portrait</h2>
                <p className="text-sm text-[#3D3530]">₹{order.amount} • {order.payment_status}</p>
              </div>
              {order.tracking_id && (
                <div className="bg-[#FAF6F0] border border-[#E0D5C8] rounded-sm px-3 py-2 text-sm">
                  <span className="text-[#9C8878]">{order.courier || 'Courier'}:</span> <span className="font-mono text-[#2C1810]">{order.tracking_id}</span>
                </div>
              )}
            </div>

            {/* Balance due banner */}
            {(order.balance_due ?? 0) > 0 && (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-[#E8C96A]/20 border border-[#C9A84C]/40 rounded-sm px-4 py-3" data-testid="balance-banner">
                <div>
                  <p className="font-body font-medium text-[#2C1810]">Balance due: ₹{order.balance_due}</p>
                  <p className="text-xs text-[#9C8878]">Paid ₹{order.paid_amount ?? 0} of ₹{order.amount} — settle when your portrait is ready to ship.</p>
                </div>
                <PayBalanceButton order={order} onPaid={() => fetchOrder()} />
              </div>
            )}

            {/* Stepper */}
            <div className="space-y-0">
              {STATUS_STEPS.map((s, i) => {
                const Ic = ICONS[s] || Clock;
                const reached = currentIdx >= i || order.status === 'Delivered';
                const isCurrent = i === currentIdx;
                return (
                  <div key={s} className="flex items-start gap-4 relative pb-6">
                    {i < STATUS_STEPS.length - 1 && (
                      <span className={`absolute left-[19px] top-10 bottom-0 w-px ${reached ? 'bg-[#C9A84C]' : 'bg-[#E0D5C8]'}`} />
                    )}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0 ${reached ? 'bg-[#C9A84C] border-[#C9A84C] text-[#2C1810]' : 'bg-[#FAF6F0] border-[#E0D5C8] text-[#9C8878]'} ${isCurrent ? 'ring-4 ring-[#E8C96A]/40' : ''}`}>
                      <Ic size={18} />
                    </div>
                    <div className="pt-1.5">
                      <p className={`font-body font-medium ${reached ? 'text-[#2C1810]' : 'text-[#9C8878]'}`}>{s}</p>
                      {order.timeline.filter(t => t.status === s).map((t, ti) => (
                        <p key={ti} className="text-xs text-[#9C8878] mt-1">{new Date(t.at).toLocaleString()} {t.note ? `• ${t.note}` : ''}</p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-6 border-t border-[#E0D5C8]">
              <p className="text-xs font-mono uppercase tracking-widest text-[#9C8878] mb-2">Shipping Address</p>
              <p className="text-sm text-[#3D3530] whitespace-pre-line">{order.shipping_address}</p>
            </div>
          </div>
        )}
      </div>
      
    </main>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#FAF6F0] py-10 px-6"><div className="max-w-3xl mx-auto text-center text-[#9C8878]">Loading…</div></main>}>
      <TrackOrderContent />
    </Suspense>
  );
}
