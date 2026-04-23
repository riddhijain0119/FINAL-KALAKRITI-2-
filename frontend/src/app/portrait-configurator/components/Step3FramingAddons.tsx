'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Package, Zap, Award, FileImage } from 'lucide-react';
import { useWizardStore } from '@/lib/state/wizardStore';
import { type FrameOption, FRAME_COSTS } from '@/lib/pricing/engine';

const FRAME_OPTIONS: { key: FrameOption; label: string; description: string; image?: string }[] = [
  { key: 'none', label: 'No Frame', description: 'Unframed print delivered in an archival tube — ready to frame locally' },
  { key: 'classic-wood', label: 'Add Frame', description: 'Hand-fitted solid wood frame, ready to hang out of the box' },
];

const ADDONS = [
  {
    id: 'addon-rush',
    key: 'rushDelivery' as const,
    label: 'Rush Delivery',
    description: 'Prioritised queue — 35% surcharge, ~40% faster completion',
    icon: Zap,
    price: '+35% of subtotal',
    tag: 'Reduces wait by 40%',
  },
  {
    id: 'addon-digital',
    key: 'digitalCopy' as const,
    label: 'High-Res Digital File',
    description: 'Full-resolution TIFF file for printing at any size or digital display',
    icon: FileImage,
    price: '+₹299',
    tag: 'Instant delivery',
  },
  {
    id: 'addon-cert',
    key: 'certificateOfAuthenticity' as const,
    label: 'Certificate of Authenticity',
    description: 'Signed COA with artist details, medium, and edition number — ideal for gifting',
    icon: Award,
    price: '+₹499',
    tag: 'Collector grade',
  },
];

export default function Step3FramingAddons() {
  const {
    frameOption,
    rushDelivery,
    digitalCopy,
    certificateOfAuthenticity,
    setFrameOption,
    setRushDelivery,
    setDigitalCopy,
    setCertificateOfAuthenticity,
    nextStep,
    prevStep,
    markStepComplete,
  } = useWizardStore();

  const handleContinue = () => {
    markStepComplete(3);
    nextStep();
  };

  const addonValues = { rushDelivery, digitalCopy, certificateOfAuthenticity };
  const addonSetters = {
    rushDelivery: setRushDelivery,
    digitalCopy: setDigitalCopy,
    certificateOfAuthenticity: setCertificateOfAuthenticity,
  };

  return (
    <div className="space-y-8">
      {/* Framing */}
      <div>
        <h2 className="font-display text-2xl font-500 text-[#2C1810] mb-1">Choose Your Frame</h2>
        <p className="font-body text-sm text-[#9C8878] mb-6">
          All prints are archival-quality on 300gsm cotton rag paper. Frames are hand-fitted.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FRAME_OPTIONS.map(({ key, label, description }) => {
            const isSelected = frameOption === key;
            const cost = FRAME_COSTS[key];

            return (
              <motion.button
                key={`frame-${key}`}
                onClick={() => setFrameOption(key)}
                whileTap={{ scale: 0.98 }}
                className={`relative p-4 rounded-sm border text-left transition-all duration-200 ${
                  isSelected
                    ? 'border-[#C9A84C] bg-[#C9A84C]/5'
                    : 'border-[hsl(var(--border))] bg-white hover:border-[#C9A84C]/50'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#C9A84C] flex items-center justify-center">
                    <Check size={11} className="text-[#2C1810]" />
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <Package size={16} className={isSelected ? 'text-[#C9A84C]' : 'text-[#9C8878]'} />
                  <p className="font-body text-sm font-600 text-[#2C1810]">{label}</p>
                </div>
                <p className="font-body text-xs text-[#9C8878] mb-3">{description}</p>
                <p className="font-body text-sm font-600 text-[#2C1810] tabular-nums">
                  {cost === 0 ? 'Included' : `+₹${cost.toLocaleString('en-IN')}`}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-[hsl(var(--border))]">
        <button onClick={prevStep} className="btn-outline px-6">Back</button>
        <button onClick={handleContinue} className="btn-primary px-8">
          Review My Quote
        </button>
      </div>
    </div>
  );
}