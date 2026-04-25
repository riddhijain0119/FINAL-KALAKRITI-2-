'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Filter } from 'lucide-react';
import Link from 'next/link';
import KalakritiNav from '@/components/KalakritiNav';
import { fetchContent, CmsGalleryItem } from '@/lib/api';
import { useSiteText } from '@/lib/useSiteText';

const FALLBACK: CmsGalleryItem[] = [
  { id: 'g1', title: 'Family Portrait', medium: 'Watercolour', size: '12×16 in',
    image: '/assets/images/gallery/art-13.jpeg', alt: 'Watercolour family portrait', tag: 'Most Popular' },
  { id: 'g2', title: 'Pet Portrait', medium: 'Pencil Sketch', size: '8×10 in',
    image: '/assets/images/gallery/art-14.jpeg', alt: 'Pencil sketch of a pet', tag: '' },
  { id: 'g3', title: 'Couple Portrait', medium: 'Oil on Canvas', size: '16×20 in',
    image: '/assets/images/gallery/art-15.jpeg', alt: 'Oil painting of a couple', tag: 'Premium' },
];

const MEDIUMS = ['All', 'Watercolour', 'Pencil Sketch', 'Oil on Canvas', 'Charcoal'];

export default function GalleryPage() {
  const t = useSiteText();
  const [items, setItems] = useState<CmsGalleryItem[]>(FALLBACK);
  const [activeFilter, setActiveFilter] = useState('All');
  const [lightboxItem, setLightboxItem] = useState<CmsGalleryItem | null>(null);

  useEffect(() => {
    fetchContent<{ items: CmsGalleryItem[] }>('gallery')
      .then((d) => { if (d?.items?.length) setItems(d.items); })
      .catch(() => {});
  }, []);

  const filtered =
  activeFilter === 'All' ?
  items :
  items.filter((item) => item.medium === activeFilter);

  return (
    <>
      <KalakritiNav />
      <main className="min-h-screen bg-[#FAF6F0] pt-24 pb-20">
        {/* Header */}
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 mb-12">
          <p className="section-label mb-3">{t('gallery_eyebrow', 'Our Portfolio')}</p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-500 text-[#2C1810] leading-tight">
                {t('gallery_headline', 'Gallery of')}<br />
                <em className="italic text-[#C9A84C]">{t('gallery_headline_em', 'Handcrafted Portraits')}</em>
              </h1>
              <p className="font-body text-sm text-[#9C8878] mt-3 max-w-md">
                {t('gallery_subtext', 'Every portrait is handcrafted by our verified artists — never AI-generated. Browse our work across four mediums.')}
              </p>
            </div>
            <Link href="/portrait-configurator" className="btn-gold text-sm px-8 py-3.5 shadow-gold self-start md:self-auto">
              Create My Portrait
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 mb-10">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-[#9C8878] mr-1" />
            {MEDIUMS.map((medium) =>
            <button
              key={`filter-${medium}`}
              onClick={() => setActiveFilter(medium)}
              className={`px-4 py-1.5 text-xs font-body font-500 rounded-sm border transition-all duration-150 ${
              activeFilter === medium ?
              'bg-[#2C1810] text-[#FAF6F0] border-[#2C1810]' :
              'bg-white text-[#3D3530] border-warm-border hover:border-[#2C1810]/30'}`
              }>
              
                {medium}
              </button>
            )}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item, index) =>
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="group relative bg-white rounded-sm overflow-hidden shadow-luxury hover:shadow-luxury-lg transition-shadow duration-300 cursor-pointer"
              onClick={() => setLightboxItem(item)}>
              
                <div className="relative overflow-hidden aspect-[4/5]">
                  <img
                  src={item.image}
                  alt={item.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2C1810]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {item.tag &&
                <div className="absolute top-3 left-3 bg-[#C9A84C] text-[#2C1810] text-xs font-body font-600 px-2 py-0.5 rounded-sm">
                      {item.tag}
                    </div>
                }
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <p className="font-display text-base font-500 text-white">{item.title}</p>
                    <p className="font-body text-xs text-white/70 mt-0.5">
                      {item.medium} · {item.size}
                    </p>
                  </div>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-body text-sm font-500 text-[#2C1810]">{item.title}</p>
                    <p className="font-body text-xs text-[#9C8878]">{item.medium}</p>
                  </div>
                  <span className="font-body text-xs text-[#9C8878]">{item.size}</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 mt-16 text-center">
          <p className="font-display text-2xl md:text-3xl font-500 text-[#2C1810] mb-4">
            Ready to commission your portrait?
          </p>
          <p className="font-body text-sm text-[#9C8878] mb-8 max-w-md mx-auto">
            Choose your medium, upload your photo, and our artists will bring it to life in 5–18 days.
          </p>
          <Link href="/portrait-configurator" className="btn-gold text-sm px-10 py-3.5 shadow-gold">
            Start Your Portrait
            <ArrowRight size={16} />
          </Link>
        </div>
      </main>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxItem &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-[#2C1810]/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxItem(null)}>
          
            <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative bg-white rounded-sm shadow-luxury-lg max-w-2xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            
              <button
              onClick={() => setLightboxItem(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 bg-[#2C1810]/80 text-white rounded-full flex items-center justify-center hover:bg-[#2C1810] transition-colors">
              
                <X size={14} />
              </button>
              <img
              src={lightboxItem.image}
              alt={lightboxItem.alt}
              className="w-full object-cover max-h-[70vh]" />
            
              <div className="p-5 flex items-center justify-between">
                <div>
                  <p className="font-display text-lg font-500 text-[#2C1810]">{lightboxItem.title}</p>
                  <p className="font-body text-sm text-[#9C8878] mt-0.5">
                    {lightboxItem.medium} · {lightboxItem.size}
                  </p>
                </div>
                <Link
                href="/portrait-configurator"
                className="btn-gold text-xs px-5 py-2.5"
                onClick={() => setLightboxItem(null)}>
                
                  Order Similar
                  <ArrowRight size={13} />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        }
      </AnimatePresence>
    </>);

}