'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Me } from '@/lib/api';
import AppLogo from '@/components/ui/AppLogo';
import { ArrowLeft, Plus, Trash2, Save, Tag, X, CheckCircle2, Pause, Clock } from 'lucide-react';

interface Coupon {
  code: string;
  type: 'percent' | 'flat';
  value: number;
  min_order: number;
  max_uses: number;
  used_count?: number;
  starts_at: string;
  ends_at: string;
  medium_filter: string;
  enabled: boolean;
  status?: 'active' | 'disabled' | 'scheduled' | 'expired' | 'exhausted';
  created_at?: string;
}

const EMPTY: Coupon = {
  code: '', type: 'percent', value: 10, min_order: 0, max_uses: 0,
  starts_at: '', ends_at: '', medium_filter: '', enabled: true,
};

const STATUS_BADGE: Record<string, { label: string; cls: string; icon: any }> = {
  active:    { label: 'Active',    cls: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
  scheduled: { label: 'Scheduled', cls: 'bg-blue-100 text-blue-800',       icon: Clock },
  expired:   { label: 'Expired',   cls: 'bg-stone-200 text-stone-600',     icon: X },
  exhausted: { label: 'Exhausted', cls: 'bg-amber-100 text-amber-800',     icon: X },
  disabled:  { label: 'Disabled',  cls: 'bg-red-100 text-red-700',         icon: Pause },
};

export default function AdminCouponsPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => setCoupons(await api<Coupon[]>('/api/admin/coupons'));

  useEffect(() => {
    (async () => {
      try {
        const u = await api<Me>('/api/auth/me');
        if (u.role !== 'admin') { router.replace('/my-orders'); return; }
        setMe(u);
        await load();
      } catch { router.replace('/login'); }
      finally { setLoading(false); }
    })();
  }, [router]);

  if (loading) return <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center text-[#2C1810]">Loading…</div>;

  return (
    <main className="min-h-screen bg-[#FAF6F0]">
      <header className="bg-[#2C1810] text-[#FAF6F0] px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin" className="flex items-center gap-2" data-testid="back-to-admin-link">
          <ArrowLeft size={16} className="text-[#E8C96A]" />
          <AppLogo size={32} className="bg-[#FAF6F0] rounded-full p-1" />
          <div>
            <p className="font-display text-xl leading-none">Kalakriti</p>
            <p className="text-xs text-[#E8C96A] tracking-widest uppercase">Coupons &amp; Campaigns</p>
          </div>
        </Link>
        <span className="text-sm text-[#E0D5C8]">{me?.email}</span>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
          <div>
            <h2 className="font-display text-3xl text-[#2C1810]">Coupons</h2>
            <p className="text-sm text-[#9C8878] mt-1">Create discount codes for promos and campaigns. Customers enter the code at checkout.</p>
          </div>
          <button
            onClick={() => { setEditing({ ...EMPTY }); setCreating(true); }}
            data-testid="new-coupon-btn"
            className="px-5 py-2.5 rounded-sm bg-[#C9A84C] text-[#2C1810] hover:bg-[#E8C96A] inline-flex items-center gap-1.5 text-sm font-body">
            <Plus size={14}/> New Coupon
          </button>
        </div>

        <div className="bg-[#FFFDF9] border border-[#E0D5C8] rounded-2xl shadow-luxury overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="coupons-table">
              <thead className="bg-[#FAF6F0] text-[#9C8878] text-xs uppercase tracking-widest">
                <tr>
                  <th className="text-left px-4 py-3">Code</th>
                  <th className="text-left px-4 py-3">Discount</th>
                  <th className="text-left px-4 py-3">Min Order</th>
                  <th className="text-left px-4 py-3">Used</th>
                  <th className="text-left px-4 py-3">Validity</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-12 text-[#9C8878]">
                    <Tag size={28} className="mx-auto mb-2 opacity-50" />
                    No coupons yet. Click <strong>New Coupon</strong> to create your first promo.
                  </td></tr>
                )}
                {coupons.map((c) => {
                  const cfg = STATUS_BADGE[c.status || (c.enabled ? 'active' : 'disabled')];
                  const Icon = cfg.icon;
                  return (
                    <tr key={c.code} className="border-t border-[#E0D5C8] hover:bg-[#FAF6F0]/50">
                      <td className="px-4 py-3 font-mono text-[#2C1810] font-bold" data-testid={`coupon-row-${c.code}`}>{c.code}</td>
                      <td className="px-4 py-3 text-[#2C1810]">
                        {c.type === 'percent' ? `${c.value}% off` : `₹${c.value} off`}
                        {c.medium_filter && <div className="text-xs text-[#9C8878]">{c.medium_filter} only</div>}
                      </td>
                      <td className="px-4 py-3 text-[#2C1810]">{c.min_order > 0 ? `₹${c.min_order}` : '—'}</td>
                      <td className="px-4 py-3 text-[#3D3530]">{c.used_count || 0}{c.max_uses > 0 ? ` / ${c.max_uses}` : ''}</td>
                      <td className="px-4 py-3 text-xs text-[#9C8878]">
                        {c.starts_at && <div>From: {c.starts_at.slice(0,10)}</div>}
                        {c.ends_at && <div>Till: {c.ends_at.slice(0,10)}</div>}
                        {!c.starts_at && !c.ends_at && '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-body font-600 ${cfg.cls}`}>
                          <Icon size={11}/>{cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setEditing(c); setCreating(false); }} data-testid={`edit-coupon-${c.code}`}
                            className="px-2 py-1 text-xs bg-[#C9A84C] text-[#2C1810] rounded-sm hover:bg-[#E8C96A]">Edit</button>
                          <button onClick={async () => {
                            if (!confirm(`Delete coupon ${c.code}?`)) return;
                            await api(`/api/admin/coupons/${c.code}`, { method: 'DELETE' });
                            await load();
                          }} data-testid={`del-coupon-${c.code}`}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-sm"><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editing && (
        <CouponModal
          initial={editing}
          isNew={creating}
          onClose={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await load(); }}
        />
      )}
    </main>
  );
}

function CouponModal({ initial, isNew, onClose, onSaved }:
  { initial: Coupon; isNew: boolean; onClose: () => void; onSaved: () => Promise<void> }) {
  const [c, setC] = useState<Coupon>(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const u = (k: keyof Coupon, v: any) => setC({ ...c, [k]: v });

  const save = async () => {
    setErr(''); setBusy(true);
    try {
      const body = { ...c, code: c.code.toUpperCase().trim() };
      if (isNew) {
        await api('/api/admin/coupons', { method: 'POST', body: JSON.stringify(body) });
      } else {
        await api(`/api/admin/coupons/${initial.code}`, { method: 'PATCH', body: JSON.stringify(body) });
      }
      await onSaved();
    } catch (e: any) { setErr(e?.message || 'Failed'); }
    finally { setBusy(false); }
  };

  const cls = 'w-full px-3 py-2 text-sm rounded-sm border border-[#E0D5C8] bg-white';
  const lbl = 'block text-xs font-body text-[#9C8878] uppercase tracking-widest mb-1.5';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" data-testid="coupon-modal">
      <div className="bg-[#FFFDF9] rounded-2xl shadow-luxury max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-2xl text-[#2C1810]">{isNew ? 'New Coupon' : 'Edit Coupon'}</h3>
          <button onClick={onClose} className="p-1 text-[#9C8878] hover:bg-[#FAF6F0] rounded-sm"><X size={18}/></button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={lbl}>Code (uppercase, no spaces)</label>
            <input className={`${cls} font-mono uppercase`} value={c.code} onChange={(e) => u('code', e.target.value.toUpperCase())} placeholder="DIWALI20" data-testid="coupon-code" disabled={!isNew}/>
          </div>
          <div>
            <label className={lbl}>Type</label>
            <select className={cls} value={c.type} onChange={(e) => u('type', e.target.value)} data-testid="coupon-type">
              <option value="percent">Percent off (%)</option>
              <option value="flat">Flat amount (₹)</option>
            </select>
          </div>
          <div>
            <label className={lbl}>{c.type === 'percent' ? 'Percent (e.g. 20)' : 'Amount in ₹ (e.g. 500)'}</label>
            <input type="number" className={cls} value={c.value} onChange={(e) => u('value', Number(e.target.value))} data-testid="coupon-value"/>
          </div>
          <div>
            <label className={lbl}>Minimum order (₹) — 0 = none</label>
            <input type="number" className={cls} value={c.min_order} onChange={(e) => u('min_order', Number(e.target.value))} data-testid="coupon-min-order"/>
          </div>
          <div>
            <label className={lbl}>Max uses — 0 = unlimited</label>
            <input type="number" className={cls} value={c.max_uses} onChange={(e) => u('max_uses', Number(e.target.value))} data-testid="coupon-max-uses"/>
          </div>
          <div>
            <label className={lbl}>Starts at (optional)</label>
            <input type="datetime-local" className={cls} value={(c.starts_at || '').slice(0,16)} onChange={(e) => u('starts_at', e.target.value ? new Date(e.target.value).toISOString() : '')} data-testid="coupon-starts"/>
          </div>
          <div>
            <label className={lbl}>Expires at (optional)</label>
            <input type="datetime-local" className={cls} value={(c.ends_at || '').slice(0,16)} onChange={(e) => u('ends_at', e.target.value ? new Date(e.target.value).toISOString() : '')} data-testid="coupon-ends"/>
          </div>
          <div className="md:col-span-2">
            <label className={lbl}>Medium filter (leave blank for any)</label>
            <select className={cls} value={c.medium_filter} onChange={(e) => u('medium_filter', e.target.value)} data-testid="coupon-medium">
              <option value="">All mediums</option>
              <option value="watercolor">Watercolour only</option>
              <option value="pencil">Pencil only</option>
              <option value="oil">Oil only</option>
              <option value="charcoal">Charcoal only</option>
              <option value="digital">Digital only</option>
              <option value="pastel">Pastel only</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm text-[#3D3530]">
              <input type="checkbox" checked={c.enabled} onChange={(e) => u('enabled', e.target.checked)} data-testid="coupon-enabled"/>
              Enabled
            </label>
          </div>
        </div>

        {err && <p className="mt-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-sm" data-testid="coupon-error">{err}</p>}

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-sm border border-[#E0D5C8] text-[#3D3530] hover:bg-[#FAF6F0]">Cancel</button>
          <button onClick={save} disabled={busy} data-testid="coupon-save-btn"
            className="px-5 py-2 text-sm rounded-sm bg-[#C9A84C] text-[#2C1810] hover:bg-[#E8C96A] inline-flex items-center gap-1.5 disabled:opacity-60">
            <Save size={14}/> {busy ? 'Saving…' : 'Save coupon'}
          </button>
        </div>
      </div>
    </div>
  );
}
