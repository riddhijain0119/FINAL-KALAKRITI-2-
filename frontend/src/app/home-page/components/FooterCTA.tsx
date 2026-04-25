'use client';
import React from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import { ArrowRight, Camera, Play, Mail } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';
import { useSiteText } from '@/lib/useSiteText';


export default function FooterCTA() {
  const t = useSiteText();
  return (
    <>
      {/* Final CTA Section */}
      <section className="py-24 bg-[#2C1810] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/rice-paper.png')]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gold-gradient opacity-40" />

        <div className="relative z-10 max-w-screen-2xl mx-auto px-6 lg:px-10 text-center">
          <p className="section-label text-[#C9A84C]/70 mb-4">{t('final_cta_eyebrow', 'Ready to Begin?')}</p>
          <h2 className="font-display text-4xl md:text-5xl font-400 text-[#FAF6F0] mb-6 leading-tight">
            {t('final_cta_headline', 'Your memory deserves a')}<br />
            <em className="italic text-[#C9A84C]">{t('final_cta_headline_em', 'permanent form.')}</em>
          </h2>
          <p className="font-body text-sm text-[#FAF6F0]/60 max-w-md mx-auto mb-10">
            {t('final_cta_subtext', 'Configure your portrait in 3 minutes. Live pricing, free India shipping, hand-painted by verified artists.')}
          </p>
          <Link href="/portrait-configurator" className="btn-gold px-10 py-4 text-base shadow-gold">
            {t('final_cta_button', 'Configure My Portrait')}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-[#1A0E09] border-t border-white/5 py-12">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <AppLogo size={32} />
              <span className="font-display text-base font-500 text-[#FAF6F0]/80">Kalakriti</span>
            </div>

            <div className="flex items-center gap-6 text-xs font-body text-[#FAF6F0]/40">
              <Link href="/home-page" className="hover:text-[#C9A84C] transition-colors">Home</Link>
              <Link href="/portrait-configurator" className="hover:text-[#C9A84C] transition-colors">Create</Link>
              <Link href="/reviews" className="hover:text-[#C9A84C] transition-colors">Reviews</Link>
              <Link href="/policies" className="hover:text-[#C9A84C] transition-colors">Policies</Link>
              <Link href="/project-review-portal" className="hover:text-[#C9A84C] transition-colors">My Projects</Link>
            </div>

            <div className="flex items-center gap-3">
              {[
                { id: 'social-instagram', icon: Camera, label: 'Instagram' },
                { id: 'social-youtube', icon: Play, label: 'YouTube' },
                { id: 'social-mail', icon: Mail, label: 'Email' },
              ]?.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  aria-label={label}
                  className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-[#FAF6F0]/40 hover:border-[#C9A84C]/40 hover:text-[#C9A84C] transition-colors"
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-2 text-xs font-body text-[#FAF6F0]/25">
            <span>© 2026 Kalakriti. All rights reserved.</span>
            <span>Handcrafted portraits delivered across India</span>
          </div>
        </div>
      </footer>
    </>
  );
}