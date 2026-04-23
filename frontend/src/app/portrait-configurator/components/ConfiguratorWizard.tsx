'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';
import { useWizardStore } from '@/lib/state/wizardStore';
import WizardStepIndicator from './WizardStepIndicator';
import Step1MediumSize from './Step1MediumSize';
import Step2FacesUpload from './Step2FacesUpload';
import Step3FramingAddons from './Step3FramingAddons';
import Step4QuoteSummary from './Step4QuoteSummary';
import LivePricePanel from './LivePricePanel';

export default function ConfiguratorWizard() {
  const { currentStep, recalcPrice } = useWizardStore();

  // Initialize price on mount
  useEffect(() => {
    recalcPrice();
  }, [recalcPrice]);

  const stepComponents = {
    1: <Step1MediumSize />,
    2: <Step2FacesUpload />,
    3: <Step3FramingAddons />,
    4: <Step4QuoteSummary />,
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#FAF6F0]">
      <Toaster position="bottom-right" richColors />

      {/* Header */}
      <div className="bg-white border-b border-[hsl(var(--border))] sticky top-16 z-30">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-xl font-500 text-[#2C1810]">Configure Your Portrait</h1>
              <p className="font-body text-xs text-[#9C8878] mt-0.5">
                Step {currentStep} of 4 — {
                  currentStep === 1 ? 'Choose your medium & size' :
                  currentStep === 2 ? 'Upload reference photos' :
                  currentStep === 3 ? 'Framing & add-ons': 'Review & confirm your order'
                }
              </p>
            </div>
            <WizardStepIndicator />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 py-8">
        <div className="flex flex-col xl:flex-row gap-8">
          {/* Wizard steps — main area */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={`wizard-step-${currentStep}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {stepComponents[currentStep as keyof typeof stepComponents]}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sticky price panel */}
          <div className="xl:w-80 xl:flex-shrink-0">
            <div className="sticky top-36">
              <LivePricePanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}