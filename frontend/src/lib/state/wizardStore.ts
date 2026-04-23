/**
 * Kalakriti Configurator Wizard State — Zustand Store
 * Manages all 4 steps of the portrait configurator
 * Backend integration: Persist config to /api/projects/draft on step completion
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  type Medium,
  type SizeKey,
  type FrameOption,
  type PricingConfig,
  type PriceBreakdown,
  calculatePrice,
} from '../pricing/engine';

export type WizardStep = 1 | 2 | 3 | 4;

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string; // Client-side preview; Backend: replace with S3 key after upload
  resolution?: { width: number; height: number };
  isValid: boolean;
  validationMessage?: string;
}

export interface WizardState {
  // Navigation
  currentStep: WizardStep;
  completedSteps: WizardStep[];

  // Step 1: Medium & Size
  medium: Medium;
  sizeKey: SizeKey;

  // Step 2: Faces & Upload
  faces: number;
  uploadedFiles: UploadedFile[];
  specialInstructions: string;

  // Step 3: Framing & Add-ons
  frameOption: FrameOption;
  rushDelivery: boolean;
  digitalCopy: boolean;
  certificateOfAuthenticity: boolean;

  // Step 4: Contact
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  deliveryAddress: string;

  // Computed pricing
  priceBreakdown: PriceBreakdown | null;

  // Actions
  setStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  markStepComplete: (step: WizardStep) => void;

  setMedium: (medium: Medium) => void;
  setSizeKey: (size: SizeKey) => void;
  setFaces: (faces: number) => void;
  addUploadedFile: (file: UploadedFile) => void;
  removeUploadedFile: (id: string) => void;
  setSpecialInstructions: (text: string) => void;

  setFrameOption: (frame: FrameOption) => void;
  setRushDelivery: (value: boolean) => void;
  setDigitalCopy: (value: boolean) => void;
  setCertificateOfAuthenticity: (value: boolean) => void;

  setClientDetails: (details: Partial<Pick<WizardState, 'clientName' | 'clientEmail' | 'clientPhone' | 'deliveryAddress'>>) => void;

  recalcPrice: () => void;
  resetWizard: () => void;
}

const defaultState = {
  currentStep: 1 as WizardStep,
  completedSteps: [] as WizardStep[],
  medium: 'watercolor' as Medium,
  sizeKey: 'A4' as SizeKey,
  faces: 1,
  uploadedFiles: [] as UploadedFile[],
  specialInstructions: '',
  frameOption: 'none' as FrameOption,
  rushDelivery: false,
  digitalCopy: false,
  certificateOfAuthenticity: false,
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  deliveryAddress: '',
  priceBreakdown: null as PriceBreakdown | null,
};

export const useWizardStore = create<WizardState>()(
  persist(
    (set, get) => ({
      ...defaultState,

      setStep: (step) => set({ currentStep: step }),

      nextStep: () => {
        const { currentStep } = get();
        if (currentStep < 4) {
          set({ currentStep: (currentStep + 1) as WizardStep });
        }
      },

      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 1) {
          set({ currentStep: (currentStep - 1) as WizardStep });
        }
      },

      markStepComplete: (step) => {
        const { completedSteps } = get();
        if (!completedSteps.includes(step)) {
          set({ completedSteps: [...completedSteps, step] });
        }
      },

      setMedium: (medium) => {
        set({ medium });
        get().recalcPrice();
      },

      setSizeKey: (sizeKey) => {
        set({ sizeKey });
        get().recalcPrice();
      },

      setFaces: (faces) => {
        set({ faces: Math.max(1, Math.min(8, faces)) });
        get().recalcPrice();
      },

      addUploadedFile: (file) => {
        set((state) => ({ uploadedFiles: [...state.uploadedFiles, file] }));
      },

      removeUploadedFile: (id) => {
        set((state) => ({
          uploadedFiles: state.uploadedFiles.filter((f) => f.id !== id),
        }));
      },

      setSpecialInstructions: (text) => set({ specialInstructions: text }),

      setFrameOption: (frameOption) => {
        set({ frameOption });
        get().recalcPrice();
      },

      setRushDelivery: (rushDelivery) => {
        set({ rushDelivery });
        get().recalcPrice();
      },

      setDigitalCopy: (digitalCopy) => {
        set({ digitalCopy });
        get().recalcPrice();
      },

      setCertificateOfAuthenticity: (certificateOfAuthenticity) => {
        set({ certificateOfAuthenticity });
        get().recalcPrice();
      },

      setClientDetails: (details) => set(details),

      recalcPrice: () => {
        const state = get();
        const config: PricingConfig = {
          medium: state.medium,
          sizeKey: state.sizeKey,
          faces: state.faces,
          frameOption: state.frameOption,
          rushDelivery: state.rushDelivery,
          digitalCopy: state.digitalCopy,
          certificateOfAuthenticity: state.certificateOfAuthenticity,
        };
        const breakdown = calculatePrice(config);
        set({ priceBreakdown: breakdown });
      },

      resetWizard: () => set({ ...defaultState }),
    }),
    {
      name: 'kalakriti-wizard-v1',
      storage: createJSONStorage(() => sessionStorage),
      // Don't persist uploaded file dataUrls to avoid sessionStorage bloat
      partialize: (state) => ({
        ...state,
        uploadedFiles: state.uploadedFiles.map((f) => ({
          ...f,
          dataUrl: '', // Clear dataUrl from persistence
        })),
      }),
    }
  )
);