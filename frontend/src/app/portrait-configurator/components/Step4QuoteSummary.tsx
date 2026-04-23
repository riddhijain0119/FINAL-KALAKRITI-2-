'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Check, Loader2, Lock, CreditCard, ArrowLeft, Sparkles } from 'lucide-react';
import { useWizardStore } from '@/lib/state/wizardStore';
import { formatINR, getMediumLabel, getSizeLabel } from '@/lib/pricing/engine';
import { API_BASE } from '@/lib/api';

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export default function Step4QuoteSummary() {
  const {
    medium,
    sizeKey,
    faces,
    frameOption,
    rushDelivery,
    digitalCopy,
    certificateOfAuthenticity,
    uploadedFiles,
    specialInstructions,
    priceBreakdown,
    prevStep,
    setClientDetails,
    resetWizard,
  } = useWizardStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ContactForm>();

  // Auto-fill from AI chat session (if customer has been chatting with Sakhi)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sid = window.localStorage.getItem('kalakriti_chat_session');
    if (!sid) return;
    fetch(`${API_BASE}/api/chat/prefill?session_id=${encodeURIComponent(sid)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.found) {
          if (d.name) setValue('name', d.name);
          if (d.email) setValue('email', d.email);
          if (d.phone) setValue('phone', d.phone);
          if (d.address) setValue('address', d.address);
          setPrefilled(true);
        }
      })
      .catch(() => {});
  }, [setValue]);

  const onSubmit = async (data: ContactForm) => {
    setIsSubmitting(true);
    setClientDetails(data);

    // Backend integration: POST /api/projects/create with full wizard state
    await new Promise((r) => setTimeout(r, 2000));

    setIsSubmitting(false);
    setOrderPlaced(true);
    toast.success('Order placed! Your artist will begin within 24 hours.', { duration: 6000 });
  };

  if (!priceBreakdown) return null;

  if (orderPlaced) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
          <Check size={28} className="text-emerald-600" />
        </div>
        <h2 className="font-display text-3xl font-500 text-[#2C1810] mb-3">Order Confirmed!</h2>
        <p className="font-body text-sm text-[#9C8878] max-w-sm mb-8">
          Your artist has been assigned and will upload the first draft within the estimated timeline. You'll receive an email with your project review link.
        </p>
        <div className="flex gap-3">
          <button onClick={() => { resetWizard(); }} className="btn-outline px-6">
            Create Another Portrait
          </button>
          <a href="/project-review-portal" className="btn-primary px-6">
            View My Project
          </a>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-500 text-[#2C1810] mb-1">Review Your Order</h2>
        <p className="font-body text-sm text-[#9C8878]">Confirm your configuration and enter delivery details.</p>
      </div>

      {/* Configuration summary */}
      <div className="bg-white rounded-sm border border-[hsl(var(--border))] p-5">
        <h3 className="font-body text-sm font-600 text-[#2C1810] mb-4">Your Configuration</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6">
          {[
            { label: 'Medium', value: getMediumLabel(medium) },
            { label: 'Size', value: getSizeLabel(sizeKey) },
            { label: 'Faces', value: `${faces} ${faces === 1 ? 'face' : 'faces'}` },
            { label: 'Frame', value: frameOption === 'none' ? 'No frame' : frameOption.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) },
            { label: 'Rush Delivery', value: rushDelivery ? 'Yes (+35%)' : 'Standard' },
            { label: 'Estimated', value: `${priceBreakdown.estimatedDays} days` },
          ].map(({ label, value }) => (
            <div key={`summary-${label}`}>
              <p className="font-body text-xs text-[#9C8878]">{label}</p>
              <p className="font-body text-sm font-500 text-[#2C1810]">{value}</p>
            </div>
          ))}
        </div>

        {uploadedFiles.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[hsl(var(--border))]">
            <p className="font-body text-xs text-[#9C8878] mb-2">{uploadedFiles.length} reference photo{uploadedFiles.length > 1 ? 's' : ''} uploaded</p>
            <div className="flex gap-2">
              {uploadedFiles.slice(0, 4).map((f) => (
                <div key={`thumb-${f.id}`} className="w-10 h-10 rounded-sm overflow-hidden bg-[#FAF6F0]">
                  {f.dataUrl && (
                    <img src={f.dataUrl} alt={`Reference photo thumbnail for ${f.name}`} className="w-full h-full object-cover" />
                  )}
                </div>
              ))}
              {uploadedFiles.length > 4 && (
                <div className="w-10 h-10 rounded-sm bg-[#FAF6F0] flex items-center justify-center">
                  <span className="font-body text-xs text-[#9C8878]">+{uploadedFiles.length - 4}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Price breakdown */}
      <div className="bg-white rounded-sm border border-[hsl(var(--border))] p-5">
        <h3 className="font-body text-sm font-600 text-[#2C1810] mb-4">Price Breakdown</h3>
        <div className="space-y-2">
          {[
            { label: `Base price (${getMediumLabel(medium)})`, value: formatINR(priceBreakdown.basePrice) },
            { label: `Size multiplier (×${priceBreakdown.sizeMultiplier})`, value: formatINR(priceBreakdown.basePrice * (priceBreakdown.sizeMultiplier - 1)) },
            { label: `Complexity (×${priceBreakdown.complexityMultiplier.toFixed(2)}, ${faces} faces)`, value: formatINR(priceBreakdown.basePrice * priceBreakdown.sizeMultiplier * (priceBreakdown.complexityMultiplier - 1)) },
            priceBreakdown.frameCost > 0 && { label: 'Framing', value: formatINR(priceBreakdown.frameCost) },
            priceBreakdown.addOnsCost > 0 && { label: 'Add-ons', value: formatINR(priceBreakdown.addOnsCost) },
            priceBreakdown.rushFee > 0 && { label: 'Rush delivery fee', value: formatINR(priceBreakdown.rushFee) },
          ].filter(Boolean).map((row) => {
            if (!row) return null;
            return (
              <div key={`breakdown-${row.label}`} className="flex justify-between">
                <span className="font-body text-xs text-[#9C8878]">{row.label}</span>
                <span className="font-body text-xs text-[#3D3530] tabular-nums">{row.value}</span>
              </div>
            );
          })}
          <div className="flex justify-between border-t border-[hsl(var(--border))] pt-2">
            <span className="font-body text-xs text-[#9C8878]">GST (18%)</span>
            <span className="font-body text-xs text-[#3D3530] tabular-nums">{formatINR(priceBreakdown.gst)}</span>
          </div>
          <div className="flex justify-between bg-[#FAF6F0] -mx-5 px-5 py-3 mt-2">
            <span className="font-body text-sm font-600 text-[#2C1810]">Total payable</span>
            <span className="font-display text-lg font-600 text-[#2C1810] tabular-nums">{formatINR(priceBreakdown.total)}</span>
          </div>
          <p className="font-body text-[11px] text-[#9C8878] pt-1">Full payment · Portrait ships directly after completion.</p>
        </div>
      </div>

      {/* Contact form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-sm border border-[hsl(var(--border))] p-5 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-body text-sm font-600 text-[#2C1810]">Delivery Details</h3>
          {prefilled && (
            <span className="inline-flex items-center gap-1 text-[11px] font-body text-[#C9A84C]">
              <Sparkles size={11} /> Auto-filled from chat
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-body text-xs font-500 text-[#2C1810] mb-1">Full Name *</label>
            <input
              {...register('name', { required: 'Name is required' })}
              placeholder="Priya Krishnamurthy"
              className="w-full px-3 py-2 font-body text-sm text-[#2C1810] bg-[#FAF6F0] border border-[hsl(var(--border))] rounded-sm focus:outline-none focus:border-[#C9A84C] transition-colors placeholder:text-[#9C8878]/60"
            />
            {errors.name && <p className="font-body text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block font-body text-xs font-500 text-[#2C1810] mb-1">Email Address *</label>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
              })}
              type="email"
              placeholder="priya@example.com"
              className="w-full px-3 py-2 font-body text-sm text-[#2C1810] bg-[#FAF6F0] border border-[hsl(var(--border))] rounded-sm focus:outline-none focus:border-[#C9A84C] transition-colors placeholder:text-[#9C8878]/60"
            />
            {errors.email && <p className="font-body text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block font-body text-xs font-500 text-[#2C1810] mb-1">Phone Number *</label>
            <input
              {...register('phone', {
                required: 'Phone number is required',
                pattern: { value: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit Indian mobile number' },
              })}
              type="tel"
              placeholder="9876543210"
              className="w-full px-3 py-2 font-body text-sm text-[#2C1810] bg-[#FAF6F0] border border-[hsl(var(--border))] rounded-sm focus:outline-none focus:border-[#C9A84C] transition-colors placeholder:text-[#9C8878]/60"
            />
            {errors.phone && <p className="font-body text-xs text-red-500 mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="block font-body text-xs font-500 text-[#2C1810] mb-1">DeliveryAddress *</label>
            <input
              {...register('address', { required: 'Delivery address is required' })}
              placeholder="Flat 4B, Prestige Towers, Koramangala, Bengaluru 560034"
              className="w-full px-3 py-2 font-body text-sm text-[#2C1810] bg-[#FAF6F0] border border-[hsl(var(--border))] rounded-sm focus:outline-none focus:border-[#C9A84C] transition-colors placeholder:text-[#9C8878]/60"
            />
            {errors.address && <p className="font-body text-xs text-red-500 mt-1">{errors.address.message}</p>}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-4 border-t border-[hsl(var(--border))]">
          <button type="button" onClick={prevStep} className="btn-outline px-6">
            <ArrowLeft size={15} />
            Back
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs font-body text-[#9C8878]">
              <Lock size={12} />
              Secured by Cashfree
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-gold px-8 py-3 min-w-[200px] justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard size={15} />
                  Pay {formatINR(priceBreakdown.total)} with Cashfree
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}