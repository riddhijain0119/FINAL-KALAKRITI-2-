'use client';
import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, API_BASE } from '@/lib/api';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import { ArrowLeft, Loader2, Lock, Sparkles } from 'lucide-react';

declare global {
  interface Window {
    Cashfree?: any;
  }
}

const loadCashfreeSDK = () =>
  new Promise<void>((resolve, reject) => {
    if (window.Cashfree) return resolve();
    const s = document.createElement('script');
    s.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
    document.head.appendChild(s);
  });

function AIPayContent() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get('order_id') || '';
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-load order if this order was placed via Kalakriti Sakhi
  useEffect(() => {
    if (typeof window === 'undefined' || !orderId) return;
    const sid = window.localStorage.getItem('kalakriti_chat_session');
    if (!sid) return;
    fetch(`${API_BASE}/api/chat/prefill?session_id=${encodeURIComponent(sid)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((pref) => {
        if (!pref?.found || !pref.phone) return;
        return fetch(
          `${API_BASE}/api/orders/by-chat/${encodeURIComponent(orderId)}?phone=${encodeURIComponent(pref.phone)}`,
        ).then((r) => (r.ok ? r.json() : null));
      })
      .then((o) => {
        if (o && o.order_id) setOrder(o);
      })
      .catch(() => {});
  }, [orderId]);

  const lookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/orders/by-chat/${encodeURIComponent(orderId)}?phone=${encodeURIComponent(phone)}`,
      );
      if (!res.ok) throw new Error((await res.json())?.detail || 'Order not found');
      const o = await res.json();
      setOrder(o);
    } catch (err: any) {
      setError(err.message || 'Failed to find order');
    } finally {
      setLoading(false);
    }
  };

  const payNow = async () => {
    setError('');
    setLoading(true);
    try {
      const pay: any = await api(
        `/api/payments/cashfree/create?order_id=${orderId}&installment=full`,
        { method: 'POST' },
      );
      if (pay.mock) {
        router.push(`/payment/return?order_id=${orderId}&mock=1`);
        return;
      }
      await loadCashfreeSDK();
      const mode = pay.cf_mode === 'PROD' ? 'production' : 'sandbox';
      const cashfree = window.Cashfree({ mode });
      cashfree.checkout({
        paymentSessionId: pay.payment_session_id,
        redirectTarget: '_self',
        returnUrl: `${window.location.origin}/payment/return?order_id=${orderId}`,
      });
    } catch (err: any) {
      setError(err.message || 'Could not start payment');
      setLoading(false);
    }
  };

  if (!orderId) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="font-display text-2xl text-[#2C1810]">Missing order ID</p>
          <p className="font-body text-sm text-[#3D3530] mt-2">
            Open this page from the chat Pay Now button.
          </p>
          <Link href="/home-page" className="inline-block mt-4 font-body text-[#C9A84C] underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <header className="bg-[#2C1810] px-6 py-4 flex items-center justify-between">
        <AppLogo variant="dark" />
        <Link
          href="/home-page"
          data-testid="pay-back-home"
          className="text-[#FAF6F0] font-body text-xs inline-flex items-center gap-1 hover:text-[#C9A84C]"
        >
          <ArrowLeft size={14} /> Home
        </Link>
      </header>

      <main className="max-w-xl mx-auto px-6 py-12">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles size={18} className="text-[#C9A84C]" />
          <p className="font-body text-xs text-[#9C8878] uppercase tracking-wider">
            Placed by Kalakriti Sakhi
          </p>
        </div>
        <h1 className="font-display text-3xl text-[#2C1810]">Complete your payment</h1>
        <p className="font-body text-sm text-[#3D3530] mt-2">
          Order <span className="font-500 text-[#2C1810]">{orderId}</span>
        </p>

        {!order ? (
          <form
            onSubmit={lookup}
            className="mt-8 bg-white border border-[#E0D5C8] rounded-2xl p-6"
            data-testid="pay-email-form"
          >
            <label className="font-body text-xs text-[#3D3530]">
              Enter your phone number to confirm
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile"
              maxLength={14}
              data-testid="pay-phone-input"
              className="mt-2 w-full bg-[#FAF6F0] border border-[#E0D5C8] rounded-sm px-3 py-2 font-body text-sm text-[#2C1810] focus:outline-none focus:border-[#C9A84C]"
            />
            {error && (
              <p data-testid="pay-error" className="mt-3 text-sm text-red-600 font-body">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              data-testid="pay-lookup-btn"
              className="mt-4 w-full bg-[#2C1810] text-[#FAF6F0] font-body text-sm py-3 rounded-sm hover:bg-[#3D3530] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              Continue
            </button>
          </form>
        ) : (
          <div className="mt-8 space-y-4">
            <div
              className="bg-white border border-[#E0D5C8] rounded-2xl p-6"
              data-testid="pay-order-summary"
            >
              <p className="font-body text-xs text-[#9C8878] uppercase tracking-wider">
                Order summary
              </p>
              <p className="font-display text-xl text-[#2C1810] mt-2">
                {order.customer_name}
              </p>
              <p className="font-body text-xs text-[#3D3530]">
                {order.customer_email} · {order.customer_phone}
              </p>
              <div className="mt-4 space-y-1 text-sm font-body text-[#3D3530]">
                {(order.items || []).map((it: any, i: number) => (
                  <p key={i}>
                    • {it.medium} · {it.size} · {it.faces} face(s)
                  </p>
                ))}
              </div>

              {/* Coupon block */}
              <CouponBlock order={order} onApplied={(o) => setOrder(o)} />

              <div className="mt-3 pt-3 border-t border-[#E0D5C8] space-y-1">
                {order.coupon_code && order.coupon_discount > 0 && (
                  <>
                    <div className="flex justify-between text-xs font-body text-[#9C8878]">
                      <span>Subtotal</span>
                      <span>₹{order.original_amount}</span>
                    </div>
                    <div className="flex justify-between text-xs font-body text-emerald-700">
                      <span>{order.coupon_code} discount</span>
                      <span>−₹{order.coupon_discount}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between pt-1">
                  <span className="font-body text-sm text-[#3D3530]">Total</span>
                  <span className="font-display text-xl text-[#2C1810]">₹{order.amount}</span>
                </div>
              </div>
            </div>
            {error && (
              <p data-testid="pay-error" className="text-sm text-red-600 font-body">
                {error}
              </p>
            )}
            <button
              onClick={payNow}
              disabled={loading}
              data-testid="pay-now-btn"
              className="w-full bg-[#C9A84C] text-[#2C1810] font-body font-500 text-sm py-3.5 rounded-sm hover:bg-[#A07830] hover:text-white disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Lock size={14} />
              )}
              Pay Securely with Cashfree
            </button>
            <p className="text-center font-body text-[11px] text-[#9C8878]">
              UPI · Cards · Netbanking · Wallets
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AIPayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center text-[#9C8878] font-body text-sm">Loading…</div>}>
      <AIPayContent />
    </Suspense>
  );
}

function CouponBlock({ order, onApplied }: { order: any; onApplied: (o: any) => void }) {
  const [code, setCode] = useState(order?.coupon_code || '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  const apply = async () => {
    if (!code.trim()) return;
    setErr(''); setMsg(''); setBusy(true);
    try {
      const r: any = await fetch(`${API_BASE}/api/orders/${order.order_id}/apply-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.detail || 'Invalid code');
      onApplied({ ...order, ...data, coupon_code: data.coupon_code, coupon_discount: data.discount });
      setMsg(data.message || 'Applied');
    } catch (e: any) { setErr(e?.message || 'Failed'); }
    finally { setBusy(false); }
  };

  return (
    <div className="mt-4 pt-4 border-t border-[#E0D5C8]">
      <p className="font-body text-xs text-[#9C8878] uppercase tracking-wider mb-2">Have a coupon code?</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="DIWALI20"
          disabled={busy || !!order.coupon_code}
          data-testid="coupon-input"
          className="flex-1 bg-[#FAF6F0] border border-[#E0D5C8] rounded-sm px-3 py-2 font-mono text-sm text-[#2C1810] uppercase focus:outline-none focus:border-[#C9A84C] disabled:opacity-60"
        />
        <button
          onClick={apply}
          disabled={busy || !!order.coupon_code || !code.trim()}
          data-testid="coupon-apply-btn"
          className="px-4 py-2 bg-[#2C1810] text-[#FAF6F0] font-body text-xs rounded-sm hover:bg-[#1A0E09] disabled:opacity-50"
        >
          {busy ? '…' : order.coupon_code ? 'Applied' : 'Apply'}
        </button>
      </div>
      {err && <p className="mt-2 text-xs text-red-600 font-body" data-testid="coupon-error">{err}</p>}
      {msg && <p className="mt-2 text-xs text-emerald-700 font-body" data-testid="coupon-msg">{msg}</p>}
    </div>
  );
}
