import React from 'react';
import KalakritiNav from '@/components/KalakritiNav';
import ConfiguratorWizard from './components/ConfiguratorWizard';

export default function PortraitConfiguratorPage() {
  return (
    <main className="min-h-screen bg-[#FAF6F0]">
      <KalakritiNav />
      <div className="pt-16">
        <ConfiguratorWizard />
      </div>
    </main>
  );
}