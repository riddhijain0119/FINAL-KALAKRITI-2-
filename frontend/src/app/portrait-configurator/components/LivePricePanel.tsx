'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useWizardStore } from '@/lib/state/wizardStore';
import { formatINR, getMediumLabel, getSizeLabel } from '@/lib/pricing/engine';

export default function LivePricePanel() {
  const { priceBreakdown, medium, sizeKey, faces, frameOption, rushDelivery } = useWizardStore();
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const prevTotal = useRef<number>(0);

  // Trigger pulse animation when price changes
  useEffect(() => {
    if (priceBreakdown && priceBreakdown?.total !== prevTotal?.current) {
      setIsPulsing(true);
      prevTotal.current = priceBreakdown?.total;
      const t = setTimeout(() => setIsPulsing(false), 400);
      return () => clearTimeout(t);
    }
  }, [priceBreakdown]);

  if (!priceBreakdown) {
    return (
      <div className="bg-white rounded-sm border border-[hsl(var(--border))] p-5 animate-pulse">
        <div className="h-4 bg-[hsl(var(--border))] rounded w-1/2 mb-4" />
        <div className="h-10 bg-[hsl(var(--border))] rounded mb-3" />
        <div className="h-3 bg-[hsl(var(--border))] rounded w-3/4 mb-2" />
        <div className="h-3 bg-[hsl(var(--border))] rounded w-1/2" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-sm border border-[hsl(var(--border))] overflow-hidden shadow-luxury">
      {/* Header */}
      <div className="bg-[#2C1810] px-5 py-4">
        <p className="font-body text-xs text-[#FAF6F0]/60 mb-1 tracking-wide uppercase">Live Estimate</p>
        <motion.div
          animate={isPulsing ? { backgroundColor: ['rgba(201,168,76,0)', 'rgba(201,168,76,0.2)', 'rgba(201,168,76,0)'] } : {}}
          transition={{ duration: 0.4 }}
          className="rounded-sm"
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={`price-${priceBreakdown?.total}`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
              className="font-display text-3xl font-600 text-[#FAF6F0] tabular-nums"
            >
              {formatINR(priceBreakdown?.total)}
            </motion.p>
          </AnimatePresence>
        </motion.div>
        <p className="font-body text-xs text-[#FAF6F0]/50 mt-1">incl. 18% GST</p>
      </div>
      {/* Summary */}
      <div className="px-5 py-4 space-y-3">
        {/* Config summary */}
        <div className="space-y-2">
          {[
            { label: 'Medium', value: getMediumLabel(medium) },
            { label: 'Size', value: getSizeLabel(sizeKey) },
            { label: 'Faces', value: `${faces} × ×${priceBreakdown?.complexityMultiplier?.toFixed(2)}` },
          ]?.map(({ label, value }) => (
            <div key={`panel-${label}`} className="flex justify-between">
              <span className="font-body text-xs text-[#9C8878]">{label}</span>
              <span className="font-body text-xs font-500 text-[#2C1810]">{value}</span>
            </div>
          ))}
        </div>

        {/* Estimated timeline */}
        <div className="flex items-center gap-2 py-2.5 px-3 bg-[#FAF6F0] rounded-sm">
          <Clock size={13} className="text-[#C9A84C]" />
          <span className="font-body text-xs text-[#3D3530]">
            Ready in <strong>{priceBreakdown?.estimatedDays} days</strong>
            {rushDelivery && <span className="text-[#C9A84C]"> (rush)</span>}
          </span>
        </div>

        {/* Deposit split */}
        <div className="border-t border-[hsl(var(--border))] pt-3 space-y-1.5">
          <div className="flex justify-between">
            <span className="font-body text-xs text-[#9C8878]">Pay now (50%)</span>
            <span className="font-body text-sm font-600 text-[#C9A84C] tabular-nums">
              {formatINR(priceBreakdown?.depositAmount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-body text-xs text-[#9C8878]">On approval (50%)</span>
            <span className="font-body text-xs text-[#9C8878] tabular-nums">
              {formatINR(priceBreakdown?.balanceAmount)}
            </span>
          </div>
        </div>

        {/* Toggle breakdown */}
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="w-full flex items-center justify-between text-xs font-body text-[#9C8878] hover:text-[#2C1810] transition-colors py-1"
        >
          <span>Detailed breakdown</span>
          {showBreakdown ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        <AnimatePresence>
          {showBreakdown && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-1.5 pt-1 border-t border-[hsl(var(--border))]">
                {[
                  { label: 'Base price', value: formatINR(priceBreakdown?.basePrice) },
                  { label: `Size (×${priceBreakdown?.sizeMultiplier})`, value: formatINR(priceBreakdown?.basePrice * priceBreakdown?.sizeMultiplier) },
                  priceBreakdown?.frameCost > 0 && { label: 'Frame', value: formatINR(priceBreakdown?.frameCost) },
                  priceBreakdown?.addOnsCost > 0 && { label: 'Add-ons', value: formatINR(priceBreakdown?.addOnsCost) },
                  priceBreakdown?.rushFee > 0 && { label: 'Rush fee', value: formatINR(priceBreakdown?.rushFee) },
                  { label: 'Subtotal', value: formatINR(priceBreakdown?.subtotal) },
                  { label: 'GST 18%', value: formatINR(priceBreakdown?.gst) },
                ]?.filter(Boolean)?.map((row) => {
                  if (!row) return null;
                  return (
                    <div key={`detail-${row?.label}`} className="flex justify-between">
                      <span className="font-body text-xs text-[#9C8878]">{row?.label}</span>
                      <span className="font-body text-xs text-[#3D3530] tabular-nums">{row?.value}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Guarantee note */}
        <div className="flex items-start gap-2 pt-2 border-t border-[hsl(var(--border))]">
          <Info size={12} className="text-[#C9A84C] mt-0.5 flex-shrink-0" />
          <p className="font-body text-xs text-[#9C8878]">
            50-day satisfaction guarantee. If you're not happy after 2 revisions, we refund your deposit.
          </p>
        </div>
      </div>
    </div>
  );
}