'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, Info } from 'lucide-react';
import { useWizardStore } from '@/lib/state/wizardStore';
import { type Medium, type SizeKey, MEDIUM_BASE_PRICES, SIZE_MULTIPLIERS, MEDIUM_DAYS, getMediumLabel, getSizeLabel } from '@/lib/pricing/engine';
import { usePricingVersion } from '@/lib/pricing/usePricingVersion';

const MEDIUMS: { key: Medium; description: string; tag?: string; image: string }[] = [
  { key: 'watercolor', description: 'Soft washes, luminous depth, most expressive', tag: 'Most Popular',
    image: '/assets/images/gallery/art-22.jpeg' },
  { key: 'pencil', description: 'Classic graphite, timeless and precise', tag: 'Best Value',
    image: '/assets/images/gallery/art-23.jpeg' },
  { key: 'oil', description: 'Rich pigment, gallery-grade canvas', tag: 'Premium',
    image: '/assets/images/gallery/art-24.jpeg' },
  { key: 'charcoal', description: 'Dramatic contrast, raw emotion',
    image: '/assets/images/gallery/art-25.jpeg' },
  { key: 'pastel', description: 'Warm, velvety colour with soft edges',
    image: '/assets/images/gallery/art-26.jpeg' },
  { key: 'digital', description: 'High-res digital file, fastest turnaround', tag: 'Fastest',
    image: '/assets/images/gallery/art-27.jpeg' },
];

const SIZES: SizeKey[] = ['A4', 'A3', 'A2'];

export default function Step1MediumSize() {
  const { medium, sizeKey, setMedium, setSizeKey, nextStep, markStepComplete } = useWizardStore();
  usePricingVersion(); // re-render when admin updates CMS pricing

  const handleContinue = () => {
    markStepComplete(1);
    nextStep();
  };

  return (
    <div className="space-y-8">
      {/* Medium Selection */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="font-display text-2xl font-500 text-[#2C1810]">Choose Your Medium</h2>
        </div>
        <p className="font-body text-sm text-[#9C8878] mb-6">
          Each medium creates a distinct artistic result. Hover to preview.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MEDIUMS.map(({ key, description, tag, image }) => {
            const isSelected = medium === key;
            const basePrice = MEDIUM_BASE_PRICES[key];
            const days = MEDIUM_DAYS[key];

            return (
              <motion.button
                key={`medium-option-${key}`}
                onClick={() => setMedium(key)}
                whileTap={{ scale: 0.98 }}
                className={`relative p-4 rounded-sm border text-left transition-all duration-200 overflow-hidden ${
                  isSelected
                    ? 'border-[#C9A84C] bg-[#C9A84C]/5 shadow-gold/20 shadow-sm'
                    : 'border-[hsl(var(--border))] bg-white hover:border-[#C9A84C]/50 hover:bg-[#C9A84C]/3'
                }`}
              >
                {/* Reference image */}
                <div className="w-full h-28 rounded-sm overflow-hidden mb-3 bg-[#FAF6F0]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt={`${getMediumLabel(key)} portrait example reference`}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    data-testid={`medium-image-${key}`}
                  />
                </div>

                {/* Selected check */}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#C9A84C] flex items-center justify-center z-10">
                    <Check size={11} className="text-[#2C1810]" />
                  </div>
                )}

                {/* Tag */}
                {tag && (
                  <span className="inline-block font-body text-xs font-500 text-[#C9A84C] bg-[#C9A84C]/10 px-2 py-0.5 rounded-sm mb-2">
                    {tag}
                  </span>
                )}

                <p className="font-display text-base font-500 text-[#2C1810] mb-1">{getMediumLabel(key)}</p>
                <p className="font-body text-xs text-[#9C8878] mb-3">{description}</p>

                <div className="flex items-center justify-between">
                  <span className="font-body text-sm font-600 text-[#2C1810] tabular-nums">
                    from ₹{basePrice.toLocaleString('en-IN')}
                  </span>
                  <span className="font-body text-xs text-[#9C8878] flex items-center gap-1">
                    <Clock size={10} />
                    {days}d
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Size Selection */}
      <div>
        <h2 className="font-display text-2xl font-500 text-[#2C1810] mb-1">Choose Your Size</h2>
        <p className="font-body text-sm text-[#9C8878] mb-6">
          Larger sizes require more detail work — pricing scales accordingly.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {SIZES.map((size) => {
            const isSelected = sizeKey === size;
            const multiplier = SIZE_MULTIPLIERS[size];

            return (
              <motion.button
                key={`size-option-${size}`}
                onClick={() => setSizeKey(size)}
                whileTap={{ scale: 0.97 }}
                className={`p-3 rounded-sm border text-center transition-all duration-200 ${
                  isSelected
                    ? 'border-[#C9A84C] bg-[#C9A84C]/5'
                    : 'border-[hsl(var(--border))] bg-white hover:border-[#C9A84C]/50'
                }`}
              >
                <p className="font-body text-sm font-600 text-[#2C1810]">{size}</p>
                <p className="font-body text-xs text-[#9C8878] mt-0.5">{getSizeLabel(size).split(' ')[1] || ''}</p>
                {multiplier > 1 && (
                  <p className="font-body text-xs text-[#C9A84C] mt-1 tabular-nums">×{multiplier}</p>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Size info */}
        <div className="flex items-start gap-2 mt-4 p-3 bg-blue-50 rounded-sm border border-blue-100">
          <Info size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="font-body text-xs text-blue-700">
            <strong>Not sure which size?</strong> A4 is ideal for a desk or small wall. A3 is the most popular for gifting. A2 and above are statement pieces for large walls.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-4 border-t border-[hsl(var(--border))]">
        <button onClick={handleContinue} className="btn-primary px-8">
          Continue to Photos
          <Check size={15} />
        </button>
      </div>
    </div>
  );
}