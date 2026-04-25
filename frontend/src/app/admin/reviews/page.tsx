'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Me } from '@/lib/api';
import AppLogo from '@/components/ui/AppLogo';
import { ArrowLeft, CheckCircle2, XCircle, Trash2, Star, Clock } from 'lucide-react';

interface Review {
  review_id: string;
  order_id: string;
  customer_name: string;
  customer_email: string;
  rating: number;
  text: string;
  photo_url?: string;
  medium?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState<string>('');

  const load = async () => {
    setReviews(await api<Review[]>(`/api/admin/reviews${filter ? `?status=${filter}` : ''}`));
  };

  useEffect(() => {
    (async () => {
      try {
        const u = await api<Me>('/api/auth/me');
        if (u.role !== 'admin') { router.replace('/my-orders'); return; }
        setMe(u);
      } catch { router.replace('/login'); }
      finally { setLoading(false); }
    })();
  }, [router]);

  useEffect(() => { if (me) load(); /* eslint-disable-next-line */ }, [filter, me]);

  if (loading) return <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center text-[#2C1810]">Loading…</div>;

  const moderate = async (r: Review, status: 'approved' | 'rejected') => {
    await api(`/api/admin/reviews/${r.review_id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    await load();
  };
  const remove = async (r: Review) => {
    if (!confirm('Delete this review?')) return;
    await api(`/api/admin/reviews/${r.review_id}`, { method: 'DELETE' });
    await load();
  };

  const counts = {
    all: reviews.length,
    pending: reviews.filter((r) => r.status === 'pending').length,
    approved: reviews.filter((r) => r.status === 'approved').length,
    rejected: reviews.filter((r) => r.status === 'rejected').length,
  };

  return (
    <main className="min-h-screen bg-[#FAF6F0]">
      <header className="bg-[#2C1810] text-[#FAF6F0] px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin" className="flex items-center gap-2">
          <ArrowLeft size={16} className="text-[#E8C96A]" />
          <AppLogo size={32} className="bg-[#FAF6F0] rounded-full p-1" />
          <div>
            <p className="font-display text-xl leading-none">Kalakriti</p>
            <p className="text-xs text-[#E8C96A] tracking-widest uppercase">Customer Reviews</p>
          </div>
        </Link>
        <span className="text-sm text-[#E0D5C8]">{me?.email}</span>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="font-display text-3xl text-[#2C1810] mb-2">Reviews</h2>
        <p className="text-sm text-[#9C8878] mb-6">Approve customer reviews to show them publicly on your site. Reject or delete inappropriate ones.</p>

        <div className="flex gap-2 flex-wrap mb-6" data-testid="review-filters">
          <Pill label={`All (${counts.all})`}      active={!filter} onClick={() => setFilter('')} testid="filter-reviews-all"/>
          <Pill label={`Pending (${counts.pending})`}   active={filter === 'pending'}  onClick={() => setFilter('pending')}  testid="filter-reviews-pending"/>
          <Pill label={`Approved (${counts.approved})`} active={filter === 'approved'} onClick={() => setFilter('approved')} testid="filter-reviews-approved"/>
          <Pill label={`Rejected (${counts.rejected})`} active={filter === 'rejected'} onClick={() => setFilter('rejected')} testid="filter-reviews-rejected"/>
        </div>

        <div className="bg-[#FFFDF9] border border-[#E0D5C8] rounded-2xl shadow-luxury overflow-hidden">
          {reviews.length === 0 ? (
            <div className="p-12 text-center text-[#9C8878]" data-testid="reviews-empty">
              <Star size={28} className="mx-auto mb-2 opacity-50" />
              No reviews to show.
            </div>
          ) : (
            <ul className="divide-y divide-[#E0D5C8]">
              {reviews.map((r) => (
                <li key={r.review_id} className="p-5" data-testid={`review-${r.review_id}`}>
                  <div className="flex flex-wrap justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-display text-lg text-[#2C1810]">{r.customer_name}</span>
                        <StatusBadge status={r.status} />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#9C8878] mb-2">
                        <span className="text-[#C9A84C]">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                        {r.medium && <span>· {r.medium}</span>}
                        <span>· Order {r.order_id}</span>
                      </div>
                      {r.text && <p className="font-body text-sm text-[#3D3530] leading-relaxed">{r.text}</p>}
                      <p className="text-xs text-[#9C8878] mt-2">{new Date(r.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex items-start gap-2 flex-shrink-0">
                      {r.status !== 'approved' && (
                        <button onClick={() => moderate(r, 'approved')} data-testid={`approve-${r.review_id}`}
                          className="p-2 rounded-sm text-emerald-700 hover:bg-emerald-50" title="Approve"><CheckCircle2 size={18}/></button>
                      )}
                      {r.status !== 'rejected' && (
                        <button onClick={() => moderate(r, 'rejected')} data-testid={`reject-${r.review_id}`}
                          className="p-2 rounded-sm text-amber-700 hover:bg-amber-50" title="Reject"><XCircle size={18}/></button>
                      )}
                      <button onClick={() => remove(r)} data-testid={`del-review-${r.review_id}`}
                        className="p-2 rounded-sm text-red-600 hover:bg-red-50" title="Delete"><Trash2 size={16}/></button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}

function Pill({ label, active, onClick, testid }: { label: string; active: boolean; onClick: () => void; testid?: string }) {
  return (
    <button onClick={onClick} data-testid={testid}
      className={`px-3 py-1.5 rounded-sm text-xs font-body ${active ? 'bg-[#2C1810] text-[#FAF6F0]' : 'bg-[#FFFDF9] text-[#3D3530] border border-[#E0D5C8]'}`}>
      {label}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: any; label: string }> = {
    pending:  { cls: 'bg-amber-100 text-amber-800', icon: Clock,        label: 'Pending' },
    approved: { cls: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2, label: 'Approved' },
    rejected: { cls: 'bg-red-100 text-red-700', icon: XCircle,       label: 'Rejected' },
  };
  const c = map[status] || map.pending;
  const Icon = c.icon;
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-body font-600 ${c.cls}`}><Icon size={11}/>{c.label}</span>;
}
