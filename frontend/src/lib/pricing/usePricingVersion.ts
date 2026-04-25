'use client';

/**
 * React hook that subscribes to pricing CMS updates.
 * Components that read MEDIUM_BASE_PRICES / SIZE_MULTIPLIERS / etc. directly
 * use this hook to re-render when the admin updates pricing in the CMS.
 */
import { useEffect, useState } from 'react';
import { subscribeToPricing, getPricingVersion } from './engine';

export function usePricingVersion(): number {
  const [version, setVersion] = useState<number>(getPricingVersion());

  useEffect(() => {
    const unsub = subscribeToPricing(() => setVersion(getPricingVersion()));
    // Sync once on mount (in case version changed between SSR and effect)
    setVersion(getPricingVersion());
    return () => { unsub(); };
  }, []);

  return version;
}
