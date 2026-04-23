'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

// Backend: fetch from /api/testimonials
const TESTIMONIALS = [
{
  id: 'review-001',
  name: 'Priya Krishnamurthy',
  location: 'Bengaluru',
  avatar: "/assets/images/gallery/art-09.jpeg",
  avatarAlt: 'Smiling Indian woman with dark hair in professional setting',
  rating: 5,
  medium: 'Watercolour',
  text: 'I ordered a watercolour portrait of my parents for their anniversary. The review portal was a revelation — I could pinpoint exactly what I wanted changed and see it corrected in the next draft. No WhatsApp threads, no miscommunication. The final piece made my mother cry.',
  deliveredIn: '8 days',
  orderValue: '₹4,800'
},
{
  id: 'review-002',
  name: 'Arjun Mehta',
  location: 'Mumbai',
  avatar: "/assets/images/gallery/art-10.jpeg",
  avatarAlt: 'Young Indian man smiling in casual setting',
  rating: 5,
  medium: 'Pencil Sketch',
  text: 'Ordered a pencil sketch of my dog for my partner. The live pricing tool was brilliant — I could see exactly how adding a second subject changed the cost. No hidden charges. The annotation feature let me request a specific background change without any confusion.',
  deliveredIn: '6 days',
  orderValue: '₹2,400'
},
{
  id: 'review-003',
  name: 'Divya Rangan',
  location: 'Chennai',
  avatar: "/assets/images/gallery/art-11.jpeg",
  avatarAlt: 'Indian woman with warm smile in outdoor setting',
  rating: 5,
  medium: 'Oil on Canvas',
  text: "Commissioned an oil portrait for my husband\'s 40th birthday. The quality rivals galleries I\'ve visited in Delhi. The artist uploaded drafts with progress updates directly in the portal. I knew exactly where my painting was at every stage.",
  deliveredIn: '16 days',
  orderValue: '₹9,200'
},
{
  id: 'review-004',
  name: 'Rahul Desai',
  location: 'Pune',
  avatar: "/assets/images/gallery/art-12.jpeg",
  avatarAlt: 'Indian man with glasses in professional attire',
  rating: 5,
  medium: 'Charcoal',
  text: "The resolution validator caught my first photo was too blurry before I even submitted. Uploaded a better one and the charcoal result was stunning. The whole process took 2 minutes to configure and 7 days to deliver. This is what custom art should feel like.",
  deliveredIn: '7 days',
  orderValue: '₹3,100'
}];


export default function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  const prev = () => setActiveIndex((i) => (i - 1 + TESTIMONIALS?.length) % TESTIMONIALS?.length);
  const next = () => setActiveIndex((i) => (i + 1) % TESTIMONIALS?.length);

  const testimonial = TESTIMONIALS?.[activeIndex];

  return (
    <section className="py-20 bg-[#FAF6F0]">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-12">
          <p className="section-label mb-3">Client Stories</p>
          <h2 className="font-display text-3xl md:text-4xl font-500 text-[#2C1810]">
            Art that made them{' '}
            <em className="italic text-[#C9A84C]">speechless</em>
          </h2>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Star rating row */}
          <div className="flex justify-center mb-8">
            {Array.from({ length: 5 })?.map((_, i) =>
            <Star key={`star-${i}`} size={18} className="text-[#C9A84C] fill-[#C9A84C]" />
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`testimonial-${testimonial?.id}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-sm p-8 shadow-luxury relative">
              
              <Quote size={32} className="absolute top-6 right-6 text-[#C9A84C]/20" />

              <p className="font-body text-base text-[#3D3530] leading-relaxed mb-8 italic">
                &ldquo;{testimonial?.text}&rdquo;
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={testimonial?.avatar}
                    alt={testimonial?.avatarAlt}
                    className="w-10 h-10 rounded-full object-cover" />
                  
                  <div>
                    <p className="font-body text-sm font-600 text-[#2C1810]">{testimonial?.name}</p>
                    <p className="font-body text-xs text-[#9C8878]">{testimonial?.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <p className="font-body text-xs text-[#9C8878]">Medium</p>
                    <p className="font-body text-xs font-500 text-[#C9A84C]">{testimonial?.medium}</p>
                  </div>
                  <div>
                    <p className="font-body text-xs text-[#9C8878]">Delivered</p>
                    <p className="font-body text-xs font-500 text-[#3D3530]">{testimonial?.deliveredIn}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={prev}
              className="w-9 h-9 rounded-full border border-[hsl(var(--border))] flex items-center justify-center text-[#3D3530] hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors">
              
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-1.5">
              {TESTIMONIALS?.map((t, i) =>
              <button
                key={`dot-${t?.id}`}
                onClick={() => setActiveIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                i === activeIndex ? 'w-5 bg-[#C9A84C]' : 'w-1.5 bg-[hsl(var(--border))] hover:bg-[#C9A84C]/50'}`
                } />

              )}
            </div>

            <button
              onClick={next}
              className="w-9 h-9 rounded-full border border-[hsl(var(--border))] flex items-center justify-center text-[#3D3530] hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors">
              
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Bottom trust strip */}
        <div className="flex flex-wrap justify-center gap-8 mt-14 pt-10 border-t border-[hsl(var(--border))]">
          {[
          { id: 'proof-rating', value: '4.9★', label: 'on Google Reviews' },
          { id: 'proof-repeat', value: '68%', label: 'repeat customers' },
          { id: 'proof-refund', value: '0.4%', label: 'refund rate' },
          { id: 'proof-nps', value: '82 NPS', label: 'customer satisfaction' }]?.
          map((proof) =>
          <div key={proof?.id} className="text-center">
              <p className="font-display text-2xl font-600 text-[#2C1810] tabular-nums">{proof?.value}</p>
              <p className="font-body text-xs text-[#9C8878]">{proof?.label}</p>
            </div>
          )}
        </div>
      </div>
    </section>);


}