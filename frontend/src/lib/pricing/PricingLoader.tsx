'use client';

import { useEffect } from 'react';
import { loadPricingFromCMS } from '@/lib/pricing/engine';
import { useWizardStore } from '@/lib/state/wizardStore';

/**
 * Mounts at top of the configurator. Fetches latest pricing from /api/content/pricing
 * and triggers a wizard recalc once values land.
 */
export default function PricingLoader() {
  useEffect(() => {
    loadPricingFromCMS().then(() => {
      useWizardStore.getState().recalcPrice();
    });
  }, []);
  return null;
}
