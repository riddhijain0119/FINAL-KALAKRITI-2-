'use client';
import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api, Order } from '@/lib/api';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import { CheckCircle2, Clock, XCircle, Package } from 'lucide-react';

function PaymentReturnContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const orderId = sp.get('order_id') || '';
  const isMock = sp.get('mock') === '1';
  const [order, setOrder] = useState<Order | null>(null);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    let tries = 0;
    const fetchIt = async () => {
      try {
        const email = encodeURIComponent(sp.get('email') || '');
        const o = await api<Order>(`/api/orders/${orderId}${email ? `?email=${email}` : ''}`);
        setOrder(o);
        if (o.payment_status && o.payment_status !== 'PENDING') {
          setPolling(false);
          return;
        }
      } catch {}
      tries++;
      if (tries > 12) setPolling(false);
    };
    fetchIt();
    const t = setInterval(() => { if (polling) fetchIt(); else clearInterval(t); }, 2500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, polling]);

  const status = order?.payment_status || (isMock ? 'PENDING' : 'PENDING');
  const Icon = status === 'SUCCESS' ? CheckCircle2 : status === 'FAILED' ? XCircle : Clock;
  const color = status === 'SUCCESS' ? 'text-green-600' : status === 'FAILED' ? 'text-red-600' : 'text-[#C9A84C]';

  return (
    <main className="min-h-screen bg-[#FAF6F0] py-10 px-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/home-page" className="flex items-center gap-2 text-[#2C1810] mb-8">
          <AppLogo size={40} /><span className="font-display text-xl">Kalakriti</span>
        </Link>
        <div className="bg-[#FFFDF9] border border-[#E0D5C8] rounded-2xl p-10 shadow-luxury text-center" data-testid="payment-return-card">
          <Icon className={`mx-auto mb-3 ${color}`} size={56} />
          <h1 className="font-display text-3xl text-[#2C1810] mb-2">
            {status === 'SUCCESS' && 'Payment Successful'}
            {status === 'FAILED' && 'Payment Failed'}
            {status === 'PENDING' && (isMock ? 'Order Placed (Dev Mode)' : 'Verifying Payment…')}
          </h1>
          <p className="text-sm text-[#9C8878] mb-6">Order ID: <span className="font-mono text-[#2C1810]" data-testid="return-order-id">{orderId || '—'}</span></p>

          {order && (
            <div className="text-left bg-[#FAF6F0] border border-[#E0D5C8] rounded-sm p-4 mb-6">
              <div className="flex items-center gap-2 mb-2 text-[#2C1810]"><Package size={16}/> <span className="font-body font-medium">Order Summary</span></div>
              <p className="text-sm text-[#3D3530]"><b>Name:</b> {order.customer_name}</p>
              <p className="text-sm text-[#3D3530]"><b>Amount:</b> ₹{order.amount}</p>
              <p className="text-sm text-[#3D3530]"><b>Status:</b> <span className="font-mono">{order.status}</span></p>
              <p className="text-sm text-[#3D3530]"><b>Payment:</b> <span className="font-mono">{order.payment_status}</span></p>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <Link href={`/track-order?order_id=${orderId}`} className="px-5 py-2.5 rounded-sm bg-[#2C1810] text-[#FAF6F0] text-sm font-body font-medium hover:bg-[#1A0E09]" data-testid="return-track-btn">Track Order</Link>
            <Link href="/my-orders" className="px-5 py-2.5 rounded-sm bg-[#C9A84C] text-[#2C1810] text-sm font-body font-medium hover:bg-[#E8C96A]" data-testid="return-my-orders-btn">My Orders</Link>
            <Link href="/home-page" className="px-5 py-2.5 rounded-sm border border-[#E0D5C8] text-[#3D3530] text-sm font-body font-medium hover:bg-[#2C1810]/5">Home</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#FAF6F0] py-10 px-6"><div className="max-w-2xl mx-auto text-center text-[#9C8878]">Loading…</div></main>}>
      <PaymentReturnContent />
    </Suspense>
  );
}
