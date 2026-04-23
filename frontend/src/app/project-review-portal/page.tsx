import React from 'react';
import KalakritiNav from '@/components/KalakritiNav';
import ReviewPortal from './components/ReviewPortal';

export default function ProjectReviewPortalPage() {
  return (
    <main className="min-h-screen bg-[#FAF6F0]">
      <KalakritiNav />
      <div className="pt-16">
        <ReviewPortal />
      </div>
    </main>
  );
}