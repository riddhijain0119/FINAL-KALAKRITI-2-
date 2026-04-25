'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, Order, Me } from '@/lib/api';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
// AI chat is mounted globally in layout.tsx
import { Package, LogOut } from 'lucide-react';
import PayBalanceButton from '@/components/PayBalanceButton';

const STATUS_COLORS: Record<string, string> = {
  Placed: 'bg-[#E8DDD0] text-[#2C1810]',
  Confirmed: 'bg-[#E8C96A]/40 text-[#2C1810]',
  'In Production': 'bg-[#C9A84C] text-[#2C1810]',
  Shipped: 'bg-[#A07830]/30 text-[#2C1810]',
  'Out for Delivery': 'bg-[#A07830]/50 text-[#FAF6F0]',
  Delivered: 'bg-green-600/20 text-green-800',
  Cancelled: 'bg-red-100 text-red-700',
};

export default function MyOrdersPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const u = await api<Me>('/api/auth/me');
        setMe(u);
        const list = await api<Order[]>('/api/orders');
        setOrders(list);
      } catch {
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const logout = async () => {
    await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.replace('/home-page');
  };

  if (loading) return <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center text-[#2C1810]">Loading…</div>;

  return (
    <main className="min-h-screen bg-[#FAF6F0] py-10 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <Link href="/home-page" className="flex items-center gap-2 text-[#2C1810]">
            <AppLogo size={40} /><span className="font-display text-xl">Kalakriti</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#3D3530]" data-testid="myorders-user-email">{me?.email}</span>
            <button onClick={logout} data-testid="logout-btn" className="text-sm text-[#3D3530] hover:text-[#2C1810] flex items-center gap-1"><LogOut size={14}/> Logout</button>
          </div>
        </div>

        <h1 className="font-display text-4xl text-[#2C1810] mb-2">My Orders</h1>
        <p className="text-sm text-[#9C8878] mb-6 font-body">Every portrait you've commissioned with us.</p>

        {orders.length === 0 ? (
          <div className="bg-[#FFFDF9] border border-[#E0D5C8] rounded-2xl p-10 text-center shadow-luxury" data-testid="myorders-empty">
            <Package className="mx-auto text-[#C9A84C] mb-3" size={36}/>
            <p className="text-[#2C1810] font-body mb-4">No orders yet.</p>
            <Link href="/checkout" className="inline-block px-5 py-2.5 rounded-sm bg-[#2C1810] text-[#FAF6F0] text-sm font-body font-medium hover:bg-[#1A0E09]">Start Your First Portrait</Link>
          </div>
        ) : (
          <div className="grid gap-4" data-testid="myorders-list">
            {orders.map((o) => (
              <div key={o.order_id} className="bg-[#FFFDF9] border border-[#E0D5C8] rounded-sm p-5 shadow-luxury hover:shadow-luxury-lg transition-shadow">
                <Link href={`/track-order?order_id=${o.order_id}&email=${encodeURIComponent(o.customer_email)}`} className="block">
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <p className="text-xs font-mono text-[#9C8878]">{o.order_id}</p>
                      <p className="font-display text-xl text-[#2C1810]">₹{o.amount}</p>
                      <p className="text-xs text-[#9C8878]">{new Date(o.created_at).toLocaleString()}</p>
                      {o.payment_plan === 'advance_25' && (o.balance_due ?? 0) > 0 && (
                        <p className="text-xs text-[#A07830] mt-1 font-body">
                          Paid ₹{o.paid_amount ?? 0} · Balance due ₹{o.balance_due}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-body font-medium ${STATUS_COLORS[o.status] || 'bg-[#E0D5C8] text-[#2C1810]'}`}>{o.status}</span>
                      <span className="text-xs text-[#9C8878]">Payment: {o.payment_status}</span>
                    </div>
                  </div>
                </Link>
                {(o.balance_due ?? 0) > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#E0D5C8]">
                    <PayBalanceButton order={o} onPaid={() => window.location.reload()} />
                  </div>
                )}
                {(o.status === 'Delivered' || o.status === 'Shipped' || o.status === 'Out for Delivery') && (
                  <ReviewControl orderId={o.order_id} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
    </main>
  );
}

function ReviewControl({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<'submitted'|'already'|null>(null);
  const [err, setErr] = useState('');

  React.useEffect(() => {
    api<any[]>('/api/me/reviews').then((rs) => {
      if (rs.find((r) => r.order_id === orderId)) setDone('already');
    }).catch(() => {});
  }, [orderId]);

  if (done) {
    return (
      <div className="mt-3 pt-3 border-t border-[#E0D5C8] text-xs text-emerald-700 font-body">
        ✓ Review submitted{done === 'submitted' ? ' — pending admin approval' : ''}
      </div>
    );
  }

  if (!open) {
    return (
      <div className="mt-3 pt-3 border-t border-[#E0D5C8]">
        <button
          onClick={() => setOpen(true)}
          data-testid={`leave-review-${orderId}`}
          className="text-xs px-3 py-1.5 rounded-sm bg-[#C9A84C] text-[#2C1810] hover:bg-[#E8C96A] font-body"
        >★ Leave a review</button>
      </div>
    );
  }

  const submit = async () => {
    setBusy(true); setErr('');
    try {
      await api('/api/reviews', { method: 'POST', body: JSON.stringify({ order_id: orderId, rating, text }) });
      setDone('submitted');
    } catch (e: any) { setErr(e?.message || 'Failed to submit'); }
    finally { setBusy(false); }
  };

  return (
    <div className="mt-3 pt-3 border-t border-[#E0D5C8] space-y-2" data-testid={`review-form-${orderId}`}>
      <div className="flex gap-1 text-2xl text-[#C9A84C]">
        {[1,2,3,4,5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} data-testid={`star-${orderId}-${n}`} className={n <= rating ? '' : 'opacity-30'}>★</button>
        ))}
      </div>
      <textarea
        rows={3} value={text} onChange={(e) => setText(e.target.value)}
        placeholder="Tell us what you loved (optional)…"
        className="w-full bg-[#FAF6F0] border border-[#E0D5C8] rounded-sm px-3 py-2 text-sm font-body focus:outline-none focus:border-[#C9A84C]"
        data-testid={`review-text-${orderId}`}
      />
      {err && <p className="text-xs text-red-600">{err}</p>}
      <div className="flex gap-2">
        <button onClick={submit} disabled={busy} data-testid={`submit-review-${orderId}`}
          className="text-xs px-4 py-1.5 bg-[#2C1810] text-[#FAF6F0] rounded-sm hover:bg-[#1A0E09] disabled:opacity-60">
          {busy ? 'Submitting…' : 'Submit review'}
        </button>
        <button onClick={() => setOpen(false)} className="text-xs px-3 py-1.5 border border-[#E0D5C8] rounded-sm">Cancel</button>
      </div>
    </div>
  );
}
