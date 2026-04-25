'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, Order, Me } from '@/lib/api';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import { LogOut, Search, Package, TrendingUp, CheckCircle2, Truck, Clock, Send, X } from 'lucide-react';

const STATUSES = ['Placed', 'Confirmed', 'In Production', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Order | null>(null);
  const [sending, setSending] = useState<string>('');

  const refresh = async () => {
    const [s, list] = await Promise.all([
      api('/api/admin/stats'),
      // Fetch ALL orders so we can group by status client-side
      api<Order[]>(`/api/orders?limit=500`),
    ]);
    setStats(s); setOrders(list);
  };

  useEffect(() => {
    (async () => {
      try {
        const u = await api<Me>('/api/auth/me');
        if (u.role !== 'admin') { router.replace('/my-orders'); return; }
        setMe(u);
        await refresh();
      } catch {
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (me) refresh(); /* eslint-disable-next-line */ }, []);

  const logout = async () => { await api('/api/auth/logout', { method: 'POST' }).catch(() => {}); router.replace('/home-page'); };

  const sendWA = async (orderId: string) => {
    setSending(orderId);
    try {
      await api(`/api/whatsapp/send-confirmation/${orderId}`, { method: 'POST' });
      alert('WhatsApp sent (or logged if creds missing).');
    } catch (e: any) { alert('Failed: ' + (e?.message || 'unknown')); }
    finally { setSending(''); }
  };

  if (loading) return <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center text-[#2C1810]">Loading…</div>;

  // Group orders by status. Sections shown only when there is at least one order
  // in that status, OR when no filter is set (show all sections in canonical order).
  const visibleStatuses = filter ? [filter] : STATUSES;
  const groups: Record<string, Order[]> = {};
  STATUSES.forEach((s) => { groups[s] = []; });
  orders.forEach((o) => {
    const s = STATUSES.includes(o.status) ? o.status : 'Placed';
    (groups[s] ||= []).push(o);
  });

  return (
    <main className="min-h-screen bg-[#FAF6F0]">
      {/* Header */}
      <header className="bg-[#2C1810] text-[#FAF6F0] px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin" className="flex items-center gap-2">
          <AppLogo size={36} className="bg-[#FAF6F0] rounded-full p-1" />
          <div>
            <p className="font-display text-xl leading-none">Kalakriti</p>
            <p className="text-xs text-[#E8C96A] tracking-widest uppercase">Admin Console</p>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/admin/listings" data-testid="manage-listings-link" className="text-sm flex items-center gap-1.5 text-[#E8C96A] hover:text-[#FAF6F0] border border-[#E8C96A]/30 px-3 py-1.5 rounded-sm">
            Manage Listings
          </Link>
          <span className="text-sm text-[#E0D5C8]" data-testid="admin-user-email">{me?.email}</span>
          <button onClick={logout} data-testid="admin-logout-btn" className="text-sm flex items-center gap-1.5 text-[#E8C96A] hover:text-[#FAF6F0]"><LogOut size={14}/>Logout</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <div className="grid md:grid-cols-5 gap-4 mb-8" data-testid="admin-stats">
          <StatCard icon={<Package size={20}/>} label="Total Orders" value={stats?.total_orders ?? 0} />
          <StatCard icon={<CheckCircle2 size={20}/>} label="Paid" value={stats?.paid_orders ?? 0} />
          <StatCard icon={<Clock size={20}/>} label="Awaiting" value={stats?.pending_orders ?? 0} />
          <StatCard icon={<Truck size={20}/>} label="Shipped" value={stats?.shipped_orders ?? 0} />
          <StatCard icon={<TrendingUp size={20}/>} label="Revenue" value={`₹${(stats?.revenue ?? 0).toLocaleString('en-IN')}`} />
        </div>

        {/* Filter pills */}
        <div className="bg-[#FFFDF9] border border-[#E0D5C8] rounded-2xl shadow-luxury p-4 mb-6 flex flex-wrap items-center gap-2 justify-between">
          <h2 className="font-display text-2xl text-[#2C1810]">Orders by Status</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setFilter('')} data-testid="filter-all-btn" className={`px-3 py-1.5 rounded-sm text-xs font-body ${!filter ? 'bg-[#2C1810] text-[#FAF6F0]' : 'bg-[#FAF6F0] text-[#3D3530] border border-[#E0D5C8]'}`}>
              All ({orders.length})
            </button>
            {STATUSES.map((s) => (
              <button
                key={s}
                data-testid={`filter-${s.toLowerCase().replace(/\s/g,'-')}-btn`}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-sm text-xs font-body ${filter === s ? 'bg-[#2C1810] text-[#FAF6F0]' : 'bg-[#FAF6F0] text-[#3D3530] border border-[#E0D5C8]'}`}
              >
                {s} ({groups[s].length})
              </button>
            ))}
          </div>
        </div>

        {/* Grouped sections */}
        <div className="space-y-6">
          {visibleStatuses.map((s) => (
            <StatusSection
              key={s}
              status={s}
              orders={groups[s] || []}
              onEdit={setEditing}
              onSendWA={sendWA}
              sending={sending}
            />
          ))}
        </div>
      </div>

      {editing && (
        <UpdateModal order={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />
      )}
    </main>
  );
}

function StatusSection({ status, orders, onEdit, onSendWA, sending }: {
  status: string;
  orders: Order[];
  onEdit: (o: Order) => void;
  onSendWA: (id: string) => void;
  sending: string;
}) {
  const [open, setOpen] = useState(orders.length > 0);
  return (
    <section className="bg-[#FFFDF9] border border-[#E0D5C8] rounded-2xl shadow-luxury overflow-hidden" data-testid={`section-${status.toLowerCase().replace(/\s/g,'-')}`}>
      <button
        onClick={() => setOpen(!open)}
        data-testid={`section-toggle-${status.toLowerCase().replace(/\s/g,'-')}`}
        className="w-full px-5 py-4 border-b border-[#E0D5C8] flex items-center justify-between hover:bg-[#FAF6F0]/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Badge text={status} />
          <span className="font-display text-lg text-[#2C1810]">{orders.length} order{orders.length === 1 ? '' : 's'}</span>
        </div>
        <span className="text-sm text-[#9C8878]">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FAF6F0] text-[#9C8878] text-xs uppercase tracking-widest">
              <tr>
                <th className="text-left px-4 py-3">Order</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Payment</th>
                <th className="text-left px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-[#9C8878]">No orders in this stage.</td></tr>
              )}
              {orders.map((o) => (
                <tr key={o.order_id} className="border-t border-[#E0D5C8] hover:bg-[#FAF6F0]/50">
                  <td className="px-4 py-3 font-mono text-xs text-[#2C1810]" data-testid={`order-row-${o.order_id}`}>{o.order_id}</td>
                  <td className="px-4 py-3 text-[#2C1810]">{o.customer_name}<br/><span className="text-xs text-[#9C8878]">{o.customer_email}</span></td>
                  <td className="px-4 py-3 text-[#2C1810]">₹{o.amount}
                    {o.payment_plan === 'advance_25' && (o.balance_due ?? 0) > 0 && (
                      <div className="text-xs text-[#A07830]">Bal ₹{o.balance_due}</div>
                    )}
                  </td>
                  <td className="px-4 py-3"><Badge text={o.payment_status} /></td>
                  <td className="px-4 py-3 text-xs text-[#9C8878]">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => onEdit(o)} data-testid={`edit-${o.order_id}`} className="px-2 py-1 text-xs bg-[#C9A84C] text-[#2C1810] rounded-sm hover:bg-[#E8C96A]">Update</button>
                      <button onClick={() => onSendWA(o.order_id)} disabled={sending === o.order_id} data-testid={`wa-${o.order_id}`} className="p-1.5 text-[#25D366] hover:bg-[#25D366]/10 rounded-sm" title="Send WhatsApp"><Send size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function StatCard({ icon, label, value }: any) {
  return (
    <div className="bg-[#FFFDF9] border border-[#E0D5C8] rounded-sm p-4 shadow-luxury">
      <div className="flex items-center gap-2 text-[#9C8878] text-xs uppercase tracking-widest mb-1">{icon}{label}</div>
      <p className="font-display text-3xl text-[#2C1810]">{value}</p>
    </div>
  );
}
function Badge({ text }: { text: string }) {
  const map: Record<string,string> = {
    SUCCESS: 'bg-green-100 text-green-700', PENDING: 'bg-[#E8C96A]/30 text-[#2C1810]',
    ADVANCE_PAID: 'bg-[#C9A84C]/40 text-[#2C1810]',
    FAILED: 'bg-red-100 text-red-700', EXPIRED: 'bg-gray-200 text-gray-700',
    Placed: 'bg-[#E8DDD0] text-[#2C1810]', Confirmed: 'bg-[#E8C96A]/40 text-[#2C1810]',
    'In Production': 'bg-[#C9A84C] text-[#2C1810]', Shipped: 'bg-[#A07830]/30 text-[#2C1810]',
    'Out for Delivery': 'bg-[#A07830]/60 text-[#FAF6F0]', Delivered: 'bg-green-100 text-green-700',
    Cancelled: 'bg-red-100 text-red-700',
  };
  return <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-body font-medium ${map[text] || 'bg-[#E0D5C8] text-[#2C1810]'}`}>{text}</span>;
}

function UpdateModal({ order, onClose, onSaved }: { order: Order; onClose: () => void; onSaved: () => void; }) {
  const [status, setStatus] = useState(order.status);
  const [note, setNote] = useState('');
  const [courier, setCourier] = useState(order.courier || '');
  const [trackingId, setTrackingId] = useState(order.tracking_id || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api(`/api/orders/${order.order_id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, note, courier, tracking_id: trackingId }),
      });
      onSaved();
    } catch (e: any) {
      alert('Failed: ' + (e?.message || 'unknown'));
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2C1810]/60 backdrop-blur-sm flex items-center justify-center p-4" data-testid="update-modal">
      <div className="bg-[#FFFDF9] border border-[#E0D5C8] rounded-2xl p-6 w-full max-w-md shadow-luxury-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display text-2xl text-[#2C1810]">Update Order</h3>
          <button onClick={onClose}><X size={18}/></button>
        </div>
        <p className="text-xs font-mono text-[#9C8878] mb-4">{order.order_id}</p>
        <label className="block mb-3">
          <span className="text-sm text-[#3D3530]">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} data-testid="modal-status-select"
            className="mt-1 w-full px-3 py-2 rounded-sm bg-[#FAF6F0] border border-[#E0D5C8]">
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="block mb-3">
          <span className="text-sm text-[#3D3530]">Courier</span>
          <input value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="e.g. Delhivery"
            className="mt-1 w-full px-3 py-2 rounded-sm bg-[#FAF6F0] border border-[#E0D5C8]" data-testid="modal-courier-input"/>
        </label>
        <label className="block mb-3">
          <span className="text-sm text-[#3D3530]">Tracking ID</span>
          <input value={trackingId} onChange={(e) => setTrackingId(e.target.value)} placeholder="AWB number"
            className="mt-1 w-full px-3 py-2 rounded-sm bg-[#FAF6F0] border border-[#E0D5C8]" data-testid="modal-tracking-input"/>
        </label>
        <label className="block mb-4">
          <span className="text-sm text-[#3D3530]">Internal note</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
            className="mt-1 w-full px-3 py-2 rounded-sm bg-[#FAF6F0] border border-[#E0D5C8]" data-testid="modal-note-input"/>
        </label>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-sm border border-[#E0D5C8] text-[#3D3530]">Cancel</button>
          <button onClick={save} disabled={saving} data-testid="modal-save-btn" className="px-4 py-2 text-sm rounded-sm bg-[#2C1810] text-[#FAF6F0] hover:bg-[#1A0E09] disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
