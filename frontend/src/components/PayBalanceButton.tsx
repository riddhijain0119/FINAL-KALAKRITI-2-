'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, Order } from '@/lib/api';
import { CreditCard, Loader2 } from 'lucide-react';

declare global { interface Window { Cashfree?: any; } }

export default function PayBalanceButton({ order, onPaid }: { order: Order; onPaid?: () => void }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const balance = order.balance_due ?? 0;
  if (balance <= 0) return null;

  const loadSDK = () => new Promise<void>((resolve, reject) => {
    if (window.Cashfree) return resolve();
    const s = document.createElement('script');
    s.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('SDK load error'));
    document.head.appendChild(s);
  });

  const pay = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const pay: any = await api(`/api/payments/cashfree/create?order_id=${order.order_id}&installment=balance`, { method: 'POST' });
      if (pay.mock) {
        await api(`/api/payments/cashfree/mock-confirm?order_id=${order.order_id}`, { method: 'POST' });
        if (onPaid) onPaid();
        else router.push(`/payment/return?order_id=${order.order_id}&mock=1`);
        return;
      }
      await loadSDK();
      const mode = (pay.cf_mode === 'PROD') ? 'production' : 'sandbox';
      const cashfree = window.Cashfree({ mode });
      cashfree.checkout({
        paymentSessionId: pay.payment_session_id,
        redirectTarget: '_self',
        returnUrl: `${window.location.origin}/payment/return?order_id=${order.order_id}`,
      });
    } catch (err: any) {
      alert(err?.message || 'Failed to start balance payment');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={pay}
      disabled={loading}
      data-testid={`pay-balance-${order.order_id}`}
      className="inline-flex items-center gap-2 bg-[#C9A84C] text-[#2C1810] font-body font-medium px-4 py-2 rounded-sm hover:bg-[#E8C96A] disabled:opacity-60 text-sm"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
      Pay balance ₹{balance}
    </button>
  );
}
