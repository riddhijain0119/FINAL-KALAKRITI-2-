'use client';
import React, { useEffect, useState } from 'react';
import KalakritiNav from '@/components/KalakritiNav';
import { Mail, Phone, MapPin, AlertTriangle } from 'lucide-react';

interface SiteText {
  return_policy: string;
  shipping_policy: string;
  privacy_policy: string;
  terms: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  about_title: string;
  about_body: string;
}

export default function PoliciesPage() {
  const [t, setT] = useState<SiteText | null>(null);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    fetch(`${base}/api/content/site_text`)
      .then((r) => r.json())
      .then((d) => setT(d?.data))
      .catch(() => {});
  }, []);

  if (!t) return <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center text-[#2C1810]">Loading…</div>;

  return (
    <main className="min-h-screen bg-[#FAF6F0]">
      <KalakritiNav />

      <div className="pt-16 max-w-3xl mx-auto px-6 py-12 space-y-12">
        {/* About */}
        <section data-testid="policies-about">
          <p className="section-label mb-3">About</p>
          <h1 className="font-display text-4xl md:text-5xl text-[#2C1810] mb-4">{t.about_title}</h1>
          <p className="font-body text-base text-[#3D3530] leading-relaxed whitespace-pre-line">{t.about_body}</p>
        </section>

        {/* Returns */}
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-6" data-testid="policies-returns">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-amber-700" />
            <h2 className="font-display text-2xl text-amber-900">Return &amp; Refund Policy</h2>
          </div>
          <p className="font-body text-sm text-amber-900 leading-relaxed whitespace-pre-line">{t.return_policy}</p>
        </section>

        {/* Shipping */}
        <section data-testid="policies-shipping">
          <h2 className="font-display text-2xl text-[#2C1810] mb-3">Shipping</h2>
          <p className="font-body text-sm text-[#3D3530] leading-relaxed whitespace-pre-line">{t.shipping_policy}</p>
        </section>

        {/* Privacy */}
        <section data-testid="policies-privacy">
          <h2 className="font-display text-2xl text-[#2C1810] mb-3">Privacy</h2>
          <p className="font-body text-sm text-[#3D3530] leading-relaxed whitespace-pre-line">{t.privacy_policy}</p>
        </section>

        {/* Terms */}
        <section data-testid="policies-terms">
          <h2 className="font-display text-2xl text-[#2C1810] mb-3">Terms &amp; Conditions</h2>
          <p className="font-body text-sm text-[#3D3530] leading-relaxed whitespace-pre-line">{t.terms}</p>
        </section>

        {/* Contact */}
        <section className="bg-[#FFFDF9] border border-[#E0D5C8] rounded-2xl p-6 shadow-luxury" data-testid="policies-contact">
          <h2 className="font-display text-2xl text-[#2C1810] mb-4">Contact</h2>
          <div className="space-y-3 text-sm font-body text-[#3D3530]">
            {t.contact_email && (
              <a href={`mailto:${t.contact_email}`} className="flex items-center gap-2 hover:text-[#C9A84C] transition-colors">
                <Mail size={16} className="text-[#9C8878]" /> {t.contact_email}
              </a>
            )}
            {t.contact_phone && (
              <a href={`tel:${t.contact_phone.replace(/\s/g, '')}`} className="flex items-center gap-2 hover:text-[#C9A84C] transition-colors">
                <Phone size={16} className="text-[#9C8878]" /> {t.contact_phone}
              </a>
            )}
            {t.contact_address && (
              <p className="flex items-start gap-2"><MapPin size={16} className="text-[#9C8878] flex-shrink-0 mt-0.5" /> {t.contact_address}</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
