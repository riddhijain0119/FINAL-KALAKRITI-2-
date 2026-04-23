'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { motion, animate } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

// Before/After slider data — Backend: replace with CMS-driven transformation gallery
const TRANSFORMATIONS = [
{
  id: 'transform-001',
  before: "/assets/images/gallery/art-01.jpeg",
  beforeAlt: 'Original smartphone photo of a woman smiling outdoors, slightly blurred',
  after: "/assets/images/gallery/art-02.jpeg",
  afterAlt: 'Museum-quality watercolour portrait of the same woman with warm tones and fine detail',
  medium: 'Watercolour',
  turnaround: '7 days',
  size: 'A3'
},
{
  id: 'transform-002',
  before: "/assets/images/gallery/art-03.jpeg",
  beforeAlt: 'Casual smartphone photo of a man in natural light',
  after: "/assets/images/gallery/art-04.jpeg",
  afterAlt: 'Fine pencil sketch portrait with detailed shading and artistic depth',
  medium: 'Pencil Sketch',
  turnaround: '5 days',
  size: 'A4'
}];


export default function HeroSection() {
  const [sliderX, setSliderX] = useState(50); // percentage 0–100
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const transformation = TRANSFORMATIONS[activeIndex];

  const handlePointerMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width * 100;
      setSliderX(Math.max(5, Math.min(95, x)));
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) handlePointerMove(e.clientX);
    },
    [isDragging, handlePointerMove]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches[0]) handlePointerMove(e.touches[0].clientX);
    },
    [handlePointerMove]
  );

  // Derive header text from slider position
  const leftLabel = sliderX < 40 ? 'Museum Grade Art' : sliderX > 60 ? 'Your Memories' : 'Your Memories → Museum Grade Art';

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#2C1810] pt-16">
      {/* Ambient texture overlay */}
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/rice-paper.png')]" />

      {/* Gold gradient top edge */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gold-gradient opacity-60" />

      <div className="relative z-10 w-full max-w-screen-2xl mx-auto px-6 lg:px-10 py-16 flex flex-col items-center">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-2 mb-6">
          
          <div className="h-px w-8 bg-[#C9A84C]" />
          <span className="font-body text-xs font-500 tracking-widest uppercase text-[#C9A84C]">
            Handcrafted in India
          </span>
          <div className="h-px w-8 bg-[#C9A84C]" />
        </motion.div>

        {/* Dynamic Heading */}
        <motion.h1
          key={`hero-heading-${leftLabel}`}
          initial={{ opacity: 0.7 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-400 text-[#FAF6F0] text-center mb-4 leading-tight text-balance">
          
          {sliderX > 60 ?
          <>
              Your{' '}
              <em className="italic text-[#C9A84C]">Memories</em>
            </> :
          sliderX < 40 ?
          <>
              Museum{' '}
              <em className="italic text-[#C9A84C]">Grade</em>
              {' '}Art
            </> :

          <>
              From Snapshot to{' '}
              <em className="italic text-[#C9A84C]">Masterpiece</em>
            </>
          }
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-body text-base md:text-lg text-[#FAF6F0]/70 text-center max-w-xl mb-10">
          
          Drag the slider to witness the transformation. Every Kalakriti portrait is handcrafted by a verified artist — no filters, no AI.
        </motion.p>

        {/* Before/After Slider */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-3xl aspect-[4/3] rounded-sm overflow-hidden shadow-luxury-lg cursor-col-resize select-none"
          ref={containerRef}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}>
          
          {/* AFTER (right, full width) */}
          <div className="absolute inset-0">
            <img
              src={transformation.after}
              alt={transformation.afterAlt}
              className="w-full h-full object-cover"
              draggable={false} />
            
            {/* After label */}
            <div className="absolute top-3 right-3 bg-[#C9A84C] text-[#2C1810] text-xs font-body font-600 px-2.5 py-1 rounded-sm tracking-wide">
              KALAKRITI ART
            </div>
          </div>

          {/* BEFORE (left, clipped) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - sliderX}% 0 0)` }}>
            
            <img
              src={transformation.before}
              alt={transformation.beforeAlt}
              className="w-full h-full object-cover"
              draggable={false} />
            
            {/* Before label */}
            <div className="absolute top-3 left-3 bg-[#2C1810]/80 text-[#FAF6F0] text-xs font-body font-500 px-2.5 py-1 rounded-sm tracking-wide backdrop-blur-sm">
              ORIGINAL PHOTO
            </div>
            {/* Blur overlay to simulate low quality */}
            <div className="absolute inset-0 backdrop-blur-[1px] bg-[#2C1810]/10" />
          </div>

          {/* Divider line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10 pointer-events-none"
            style={{ left: `${sliderX}%` }} />
          

          {/* Drag Handle */}
          <motion.div
            className="absolute top-1/2 z-20 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white shadow-luxury flex items-center justify-center cursor-col-resize"
            style={{ left: `${sliderX}%` }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}>
            
            <ChevronLeft size={12} className="text-[#2C1810] -mr-0.5" />
            <ChevronRight size={12} className="text-[#2C1810] -ml-0.5" />
          </motion.div>

          {/* Medium badge */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#2C1810]/70 backdrop-blur-sm px-3 py-1.5 rounded-sm">
            <span className="font-body text-xs text-[#C9A84C] font-500">{transformation.medium}</span>
            <span className="text-white/30">•</span>
            <span className="font-body text-xs text-white/70">{transformation.size}</span>
            <span className="text-white/30">•</span>
            <span className="font-body text-xs text-white/70">{transformation.turnaround}</span>
          </div>
        </motion.div>

        {/* Transformation selector dots */}
        <div className="flex items-center gap-2 mt-4">
          {TRANSFORMATIONS.map((t, i) =>
          <button
            key={`transform-dot-${t.id}`}
            onClick={() => {setActiveIndex(i);setSliderX(50);}}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
            i === activeIndex ? 'bg-[#C9A84C] w-4' : 'bg-white/30 hover:bg-white/60'}`
            }
            aria-label={`View ${t.medium} transformation`} />

          )}
        </div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center gap-4 mt-10">
          
          <Link href="/portrait-configurator" className="btn-gold text-sm px-8 py-3.5 shadow-gold">
            Create My Portrait
            <ArrowRight size={16} />
          </Link>
          <Link href="/gallery" className="font-body text-sm text-[#FAF6F0]/70 hover:text-[#FAF6F0] transition-colors flex items-center gap-1.5">
            Browse Gallery
            <ArrowRight size={14} />
          </Link>
        </motion.div>

        {/* Trust signals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex flex-wrap items-center justify-center gap-6 mt-10 text-[#FAF6F0]/50 text-xs font-body">
          
          {[
          '2,400+ portraits delivered',
          'Direct ship after completion',
          'No WhatsApp chaos — structured review',
          'Artist verified portfolios'].
          map((trust) =>
          <span key={`trust-${trust}`} className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[#C9A84C]" />
              {trust}
            </span>
          )}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#FAF6F0] to-transparent" />
    </section>);

}