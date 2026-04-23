'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { useWizardStore } from '@/lib/state/wizardStore';

const STEPS = [
  { id: 'step-indicator-1', label: 'Medium & Size', number: 1 },
  { id: 'step-indicator-2', label: 'Photos', number: 2 },
  { id: 'step-indicator-3', label: 'Framing', number: 3 },
  { id: 'step-indicator-4', label: 'Summary', number: 4 },
];

export default function WizardStepIndicator() {
  const { currentStep, completedSteps, setStep } = useWizardStore();

  return (
    <div className="hidden sm:flex items-center gap-0">
      {STEPS.map((step, index) => {
        const isActive = step.number === currentStep;
        const isCompleted = completedSteps.includes(step.number as 1 | 2 | 3 | 4);
        const isClickable = isCompleted || step.number < currentStep;

        return (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => isClickable && setStep(step.number as 1 | 2 | 3 | 4)}
              disabled={!isClickable && !isActive}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-sm transition-all duration-150 ${
                isActive
                  ? 'bg-[#C9A84C]/15 text-[#2C1810] cursor-default'
                  : isCompleted
                  ? 'text-[#2C1810] hover:bg-[#2C1810]/5 cursor-pointer'
                  : 'text-[#9C8878] cursor-not-allowed'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-body font-600 flex-shrink-0 transition-all ${
                  isActive
                    ? 'border-[#C9A84C] bg-[#C9A84C] text-[#2C1810]'
                    : isCompleted
                    ? 'border-[#2C1810] bg-[#2C1810] text-white'
                    : 'border-[hsl(var(--border))] text-[#9C8878]'
                }`}
              >
                {isCompleted ? <Check size={12} /> : step.number}
              </span>
              <span className="hidden md:block text-xs font-body font-500">{step.label}</span>
            </button>

            {index < STEPS.length - 1 && (
              <div
                className={`w-6 h-px mx-1 transition-colors duration-300 ${
                  step.number < currentStep ? 'bg-[#2C1810]/30' : 'bg-[hsl(var(--border))]'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}