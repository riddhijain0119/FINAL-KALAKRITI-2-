'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, Quote } from 'lucide-react';
import KalakritiNav from '@/components/KalakritiNav';

interface PublicReview {
  review_id: string;
  customer_name: string;
  rating: number;
  text: string;
  medium?: string;
  created_at: string;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    fetch(`${base}/api/reviews?limit=200`)
      .then((r) => r.json())
      .then((d) => setReviews(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const avg = reviews.length ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length : 0;
  const counts = [5, 4, 3, 2, 1].map((n) => reviews.filter((r) => r.rating === n).length);

  return (
    <main className="min-h-screen bg-[#FAF6F0]">
      <KalakritiNav />

      <div className="pt-16">
        {/* Header */}
        <section className="max-w-screen-2xl mx-auto px-6 lg:px-10 pt-12 pb-10">
          <p className="section-label mb-3">What our customers say</p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-500 text-[#2C1810] leading-tight">
            Loved by <em className="italic text-[#C9A84C]">families</em><br />
            across India.
          </h1>

          {!loading && reviews.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center gap-8" data-testid="reviews-summary">
              <div>
                <p className="font-display text-5xl font-600 text-[#2C1810] tabular-nums">{avg.toFixed(1)}</p>
                <div className="flex gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={18} className={n <= Math.round(avg) ? 'fill-[#C9A84C] text-[#C9A84C]' : 'text-[#E0D5C8]'} />
                  ))}
                </div>
                <p className="font-body text-xs text-[#9C8878] mt-1">{reviews.length} verified review{reviews.length === 1 ? '' : 's'}</p>
              </div>
              <div className="flex-1 min-w-[200px] max-w-md space-y-1">
                {[5, 4, 3, 2, 1].map((n, i) => {
                  const pct = reviews.length ? (counts[i] / reviews.length) * 100 : 0;
                  return (
                    <div key={n} className="flex items-center gap-2 text-xs">
                      <span className="font-body text-[#9C8878] w-3">{n}</span>
                      <Star size={11} className="fill-[#C9A84C] text-[#C9A84C] flex-shrink-0" />
                      <div className="flex-1 h-1.5 bg-[#E0D5C8] rounded-full overflow-hidden">
                        <div className="h-full bg-[#C9A84C] transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-body text-[#9C8878] w-6 text-right tabular-nums">{counts[i]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Reviews grid */}
        <section className="max-w-screen-2xl mx-auto px-6 lg:px-10 pb-20">
          {loading ? (
            <p className="text-[#9C8878] text-sm">Loading reviews…</p>
          ) : reviews.length === 0 ? (
            <div className="bg-[#FFFDF9] border border-[#E0D5C8] rounded-2xl p-10 text-center" data-testid="reviews-empty">
              <Star size={32} className="mx-auto mb-3 text-[#C9A84C]" />
              <p className="font-display text-xl text-[#2C1810]">No reviews yet</p>
              <p className="font-body text-sm text-[#9C8878] mt-2">Be the first to commission a portrait and share your experience.</p>
              <Link href="/portrait-configurator" className="inline-block mt-4 px-5 py-2 rounded-sm bg-[#C9A84C] text-[#2C1810] font-body text-sm hover:bg-[#E8C96A]">
                Start your portrait
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="reviews-grid">
              {reviews.map((r) => (
                <article
                  key={r.review_id}
                  data-testid={`review-card-${r.review_id}`}
                  className="bg-[#FFFDF9] border border-[#E0D5C8] rounded-sm p-6 shadow-luxury hover:shadow-luxury-lg transition-shadow"
                >
                  <Quote size={22} className="text-[#C9A84C]/50 mb-2" />
                  <div className="flex gap-0.5 mb-3">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} size={14} className={n <= r.rating ? 'fill-[#C9A84C] text-[#C9A84C]' : 'text-[#E0D5C8]'} />
                    ))}
                  </div>
                  {r.text && (
                    <p className="font-body text-sm text-[#3D3530] leading-relaxed mb-4 line-clamp-6">
                      {r.text}
                    </p>
                  )}
                  <div className="border-t border-[#E0D5C8] pt-3 mt-auto">
                    <p className="font-display text-base text-[#2C1810]">{r.customer_name}</p>
                    <p className="font-body text-xs text-[#9C8878]">
                      {r.medium ? `${r.medium.charAt(0).toUpperCase() + r.medium.slice(1)} portrait · ` : ''}
                      {new Date(r.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="bg-[#2C1810] py-16 px-6">
          <div className="max-w-3xl mx-auto text-center text-[#FAF6F0]">
            <p className="font-body text-xs text-[#C9A84C] uppercase tracking-widest mb-3">Your turn</p>
            <h2 className="font-display text-3xl md:text-4xl text-[#FAF6F0] leading-tight">
              Ready to commission <em className="italic text-[#C9A84C]">your masterpiece</em>?
            </h2>
            <Link
              href="/portrait-configurator"
              data-testid="reviews-cta"
              className="inline-block mt-6 px-8 py-3 rounded-sm bg-[#C9A84C] text-[#2C1810] font-body font-600 text-sm hover:bg-[#E8C96A] transition-colors"
            >
              Start your portrait →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
