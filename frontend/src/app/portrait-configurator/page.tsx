import React from 'react';
import KalakritiNav from '@/components/KalakritiNav';
import ConfiguratorWizard from './components/ConfiguratorWizard';
import PricingLoader from '@/lib/pricing/PricingLoader';

export default function PortraitConfiguratorPage() {
  return (
    <main className="min-h-screen bg-[#FAF6F0]">
      <PricingLoader />
      <KalakritiNav />
      <div className="pt-16">
        <ConfiguratorWizard />
      </div>
    </main>
  );
}