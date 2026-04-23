import React from 'react';
import KalakritiNav from '@/components/KalakritiNav';
import HeroSection from './components/HeroSection';
import MediumShowcase from './components/MediumShowcase';
import HowItWorks from './components/HowItWorks';
import TestimonialsSection from './components/TestimonialsSection';
import SocialProofBar from './components/SocialProofBar';
import FooterCTA from './components/FooterCTA';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#FAF6F0] overflow-x-hidden">
      <KalakritiNav />
      <HeroSection />
      <SocialProofBar />
      <MediumShowcase />
      <HowItWorks />
      <TestimonialsSection />
      <FooterCTA />
    </main>
  );
}