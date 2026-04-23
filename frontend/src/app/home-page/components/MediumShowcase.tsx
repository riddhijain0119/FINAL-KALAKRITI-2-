'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Clock } from 'lucide-react';

// Backend: fetch from /api/mediums with portfolio samples
const MEDIUMS = [
{
  id: 'medium-watercolor',
  name: 'Watercolour',
  tagline: 'Luminous washes, soft depth',
  description: 'Our most popular medium. Transparent layers build depth and emotion — ideal for portraits, landscapes, and sentimental gifts.',
  image: "/assets/images/gallery/art-05.jpeg",
  imageAlt: 'Detailed watercolour portrait showing soft colour washes and fine facial detail',
  startingPrice: 2800,
  turnaround: '7–10 days',
  tag: 'Most Popular',
  tagColor: 'bg-[#C9A84C] text-[#2C1810]',
  samples: 3
},
{
  id: 'medium-pencil',
  name: 'Pencil Sketch',
  tagline: 'Timeless graphite precision',
  description: 'Classic fine-art technique with rich tonal range. The most affordable medium — perfect for minimalist home decor or first portraits.',
  image: "/assets/images/gallery/art-06.jpeg",
  imageAlt: 'Fine pencil sketch portrait with detailed shading and hatching technique',
  startingPrice: 1800,
  turnaround: '5–7 days',
  tag: 'Best Value',
  tagColor: 'bg-[#2C1810] text-[#FAF6F0]',
  samples: 5
},
{
  id: 'medium-oil',
  name: 'Oil on Canvas',
  tagline: 'Heirloom-grade richness',
  description: 'The pinnacle of portrait art. Rich pigment, gallery-quality canvas, and a finish that lasts generations. A true heirloom.',
  image: "/assets/images/gallery/art-07.jpeg",
  imageAlt: 'Rich oil painting portrait with deep colour saturation and textured brushwork',
  startingPrice: 4500,
  turnaround: '14–18 days',
  tag: 'Premium',
  tagColor: 'bg-amber-100 text-amber-800',
  samples: 4
},
{
  id: 'medium-charcoal',
  name: 'Charcoal',
  tagline: 'Dramatic contrast, raw emotion',
  description: 'Bold shadows and striking highlights create portraits with cinematic drama. Ideal for black-and-white lovers and dramatic compositions.',
  image: "/assets/images/gallery/art-08.jpeg",
  imageAlt: 'Expressive charcoal portrait with strong contrast and gestural mark-making',
  startingPrice: 2200,
  turnaround: '5–8 days',
  tag: null,
  tagColor: '',
  samples: 3
}];


export default function MediumShowcase() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section className="py-20 bg-[#FAF6F0]">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <p className="section-label mb-3">Choose Your Medium</p>
            <h2 className="font-display text-3xl md:text-4xl font-500 text-[#2C1810] leading-tight">
              Four mediums.<br />
              <em className="italic text-[#C9A84C]">One standard of excellence.</em>
            </h2>
          </div>
          <p className="font-body text-sm text-[#9C8878] max-w-xs text-right">
            Each portrait is handcrafted by artists with 5+ years of commission experience — never AI-generated.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MEDIUMS?.map((medium) =>
          <motion.div
            key={medium?.id}
            className="group relative bg-white rounded-sm overflow-hidden shadow-luxury hover:shadow-luxury-lg transition-shadow duration-300 cursor-pointer"
            onHoverStart={() => setHoveredId(medium?.id)}
            onHoverEnd={() => setHoveredId(null)}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
            
              {/* Image */}
              <div className="relative aspect-[3/4] overflow-hidden">
                <img
                src={medium?.image}
                alt={medium?.imageAlt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#2C1810]/80 via-transparent to-transparent" />

                {/* Tag */}
                {medium?.tag &&
              <div className={`absolute top-3 left-3 text-xs font-body font-600 px-2 py-0.5 rounded-sm ${medium?.tagColor}`}>
                    {medium?.tag}
                  </div>
              }

                {/* Bottom info on image */}
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="font-display text-lg font-500 text-white mb-0.5">{medium?.name}</p>
                  <p className="font-body text-xs text-white/70">{medium?.tagline}</p>
                </div>
              </div>

              {/* Card body */}
              <div className="p-4">
                <p className="font-body text-xs text-[#9C8878] leading-relaxed mb-4 line-clamp-3">
                  {medium?.description}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-body text-xs text-[#9C8878]">Starting from</p>
                    <p className="font-display text-lg font-600 text-[#2C1810] tabular-nums">
                      ₹{medium?.startingPrice?.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-body text-xs text-[#9C8878]">Turnaround</p>
                    <p className="font-body text-xs font-500 text-[#3D3530] flex items-center gap-1 justify-end">
                      <Clock size={11} />
                      {medium?.turnaround}
                    </p>
                  </div>
                </div>

                <Link
                href="/portrait-configurator"
                className="flex items-center justify-between w-full text-xs font-body font-500 text-[#C9A84C] hover:text-[#A07830] transition-colors group/link">
                
                  <span>Configure in {medium?.name}</span>
                  <ArrowRight size={13} className="transition-transform group-hover/link:translate-x-1" />
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>);


}