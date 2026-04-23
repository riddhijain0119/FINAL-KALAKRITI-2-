'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
// AI chat is mounted globally in layout.tsx
import AppLogo from '@/components/ui/AppLogo';
import { ArrowLeft, Loader2, Lock, Package } from 'lucide-react';

declare global {
  interface Window { Cashfree?: any; }
}

export default function CheckoutPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_address: '',
    medium: 'watercolor',
    size: 'A4',
    frame: 'classic-wood',
    faces: 1,
    notes: '',
    amount: 4999,
    payment_plan: 'full' as 'full' | 'advance_25',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadCashfreeSDK = () =>
    new Promise<void>((resolve, reject) => {
      if (window.Cashfree) return resolve();
      const s = document.createElement('script');
      s.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
      document.head.appendChild(s);
    });

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const order: any = await api('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          customer_name: form.customer_name,
          customer_email: form.customer_email,
          customer_phone: form.customer_phone,
          shipping_address: form.shipping_address,
          items: [{
            medium: form.medium, size: form.size, frame: form.frame,
            faces: Number(form.faces), notes: form.notes,
          }],
          amount: Number(form.amount),
          payment_plan: form.payment_plan,
          notes: form.notes,
        }),
      });

      const pay: any = await api(`/api/payments/cashfree/create?order_id=${order.order_id}&installment=advance`, {
        method: 'POST',
      });

      if (pay.mock) {
        // Dev mode: skip real Cashfree, go straight to return page
        router.push(`/payment/return?order_id=${order.order_id}&mock=1`);
        return;
      }

      await loadCashfreeSDK();
      const mode = (pay.cf_mode === 'PROD') ? 'production' : 'sandbox';
      const cashfree = window.Cashfree({ mode });
      cashfree.checkout({
        paymentSessionId: pay.payment_session_id,
        redirectTarget: '_self',
        returnUrl: `${window.location.origin}/payment/return?order_id=${order.order_id}`,
      });
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF6F0] py-10 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link href="/home-page" className="flex items-center gap-2 text-[#2C1810]">
            <AppLogo size={40} /><span className="font-display text-xl">Kalakriti</span>
          </Link>
          <button onClick={() => router.back()} className="text-sm text-[#3D3530] hover:text-[#2C1810] flex items-center gap-1">
            <ArrowLeft size={16} /> Back
          </button>
        </div>

        <div className="bg-[#FFFDF9] border border-[#E0D5C8] rounded-2xl p-8 shadow-luxury">
          <div className="flex items-center gap-3 mb-2">
            <Package className="text-[#C9A84C]" size={22} />
            <h1 className="font-display text-3xl text-[#2C1810]">Secure Checkout</h1>
          </div>
          <p className="text-sm text-[#9C8878] mb-6 font-body">Pay with Cashfree — UPI, cards, netbanking, wallets.</p>

          <form onSubmit={placeOrder} className="space-y-4" data-testid="checkout-form">
            <div className="grid md:grid-cols-2 gap-4">
              <Input label="Full Name" required value={form.customer_name} onChange={(v) => setForm({ ...form, customer_name: v })} testId="input-name" />
              <Input label="Email" type="email" required value={form.customer_email} onChange={(v) => setForm({ ...form, customer_email: v })} testId="input-email" />
              <Input label="WhatsApp Phone (digits only, with country code)" required placeholder="919812345678" value={form.customer_phone} onChange={(v) => setForm({ ...form, customer_phone: v })} testId="input-phone" />
              <Input label="Amount (INR)" type="number" required value={String(form.amount)} onChange={(v) => setForm({ ...form, amount: Number(v) })} testId="input-amount" />
            </div>
            <TextArea label="Shipping Address" required value={form.shipping_address} onChange={(v) => setForm({ ...form, shipping_address: v })} testId="input-address" />
            <div className="grid md:grid-cols-3 gap-4">
              <Select label="Medium" value={form.medium} onChange={(v) => setForm({ ...form, medium: v })} options={['watercolor','pencil','oil','acrylic','digital']} testId="select-medium" />
              <Select label="Size" value={form.size} onChange={(v) => setForm({ ...form, size: v })} options={['A4','A3','A2','A1']} testId="select-size" />
              <Select label="Frame" value={form.frame} onChange={(v) => setForm({ ...form, frame: v })} options={['no-frame','classic-wood','walnut','gold-leaf']} testId="select-frame" />
            </div>
            <Input label="Number of Faces" type="number" value={String(form.faces)} onChange={(v) => setForm({ ...form, faces: Number(v) })} testId="input-faces" />
            <TextArea label="Special Instructions (optional)" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} testId="input-notes" />

            {/* Payment plan selector */}
            <div className="pt-2">
              <p className="text-sm font-body font-medium text-[#3D3530] mb-2">Payment plan</p>
              <div className="grid md:grid-cols-2 gap-3">
                <PlanCard
                  active={form.payment_plan === 'full'}
                  onClick={() => setForm({ ...form, payment_plan: 'full' })}
                  title="Pay in full"
                  subtitle="One-time payment today"
                  priceLine={`Pay now ₹${form.amount}`}
                  testId="plan-full"
                />
                <PlanCard
                  active={form.payment_plan === 'advance_25'}
                  onClick={() => setForm({ ...form, payment_plan: 'advance_25' })}
                  title="Pay 25% advance"
                  subtitle="Lock your artist · balance on completion"
                  priceLine={`Pay now ₹${Math.round(form.amount * 0.25)} · Balance ₹${form.amount - Math.round(form.amount * 0.25)}`}
                  testId="plan-advance"
                  highlight="Most popular"
                />
              </div>
            </div>

            {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-sm px-3 py-2" data-testid="checkout-error">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              data-testid="checkout-pay-btn"
              className="w-full flex items-center justify-center gap-2 bg-[#2C1810] text-[#FAF6F0] font-body font-medium py-3 rounded-sm hover:bg-[#1A0E09] transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Lock size={16} />}
              {loading ? 'Processing…' : form.payment_plan === 'advance_25'
                ? `Pay 25% advance · ₹${Math.round(form.amount * 0.25)}`
                : `Pay ₹${form.amount} with Cashfree`}
            </button>
            <p className="text-xs text-[#9C8878] text-center">You'll receive a WhatsApp confirmation after payment.</p>
          </form>
        </div>
      </div>
      
    </main>
  );
}

function Input({ label, value, onChange, required, type='text', placeholder, testId }: any) {
  return (
    <label className="block">
      <span className="block text-sm font-body font-medium text-[#3D3530] mb-1.5">{label}{required && <span className="text-[#A07830]"> *</span>}</span>
      <input
        type={type} required={required} placeholder={placeholder}
        value={value} onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
        className="w-full px-3 py-2.5 rounded-sm bg-[#FAF6F0] border border-[#E0D5C8] text-[#2C1810] focus:outline-none focus:border-[#C9A84C]"
      />
    </label>
  );
}
function TextArea({ label, value, onChange, required, testId }: any) {
  return (
    <label className="block">
      <span className="block text-sm font-body font-medium text-[#3D3530] mb-1.5">{label}{required && <span className="text-[#A07830]"> *</span>}</span>
      <textarea
        required={required} value={value} rows={3}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
        className="w-full px-3 py-2.5 rounded-sm bg-[#FAF6F0] border border-[#E0D5C8] text-[#2C1810] focus:outline-none focus:border-[#C9A84C]"
      />
    </label>
  );
}
function Select({ label, value, onChange, options, testId }: any) {
  return (
    <label className="block">
      <span className="block text-sm font-body font-medium text-[#3D3530] mb-1.5">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} data-testid={testId}
        className="w-full px-3 py-2.5 rounded-sm bg-[#FAF6F0] border border-[#E0D5C8] text-[#2C1810] focus:outline-none focus:border-[#C9A84C]">
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function PlanCard({ active, onClick, title, subtitle, priceLine, testId, highlight }: any) {
  return (
    <button type="button" onClick={onClick} data-testid={testId}
      className={`relative text-left p-4 rounded-sm border-2 transition-all ${active ? 'border-[#C9A84C] bg-[#E8C96A]/10 shadow-gold' : 'border-[#E0D5C8] bg-[#FAF6F0] hover:border-[#C9A84C]/60'}`}>
      {highlight && (
        <span className="absolute -top-2.5 right-3 bg-[#C9A84C] text-[#2C1810] text-[10px] font-body font-medium px-2 py-0.5 rounded-full uppercase tracking-widest">{highlight}</span>
      )}
      <p className={`font-display text-lg ${active ? 'text-[#2C1810]' : 'text-[#3D3530]'}`}>{title}</p>
      <p className="text-xs text-[#9C8878] mb-2">{subtitle}</p>
      <p className={`text-sm font-body font-medium ${active ? 'text-[#A07830]' : 'text-[#3D3530]'}`}>{priceLine}</p>
    </button>
  );
}
