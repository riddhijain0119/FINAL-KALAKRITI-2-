import React from 'react';
import Link from 'next/link';
import { Upload, Palette, CheckCircle, Package } from 'lucide-react';

const STEPS = [
  {
    id: 'step-configure',
    number: '01',
    icon: Palette,
    title: 'Configure & Price',
    description: 'Choose your medium, size, and number of faces. Our live pricing engine shows the exact cost — no surprises at checkout.',
    detail: 'Takes 3 minutes',
  },
  {
    id: 'step-upload',
    number: '02',
    icon: Upload,
    title: 'Upload References',
    description: 'Upload your reference photos directly in our configurator. We validate resolution on the spot — no blurry results.',
    detail: 'Instant validation',
  },
  {
    id: 'step-review',
    number: '03',
    icon: CheckCircle,
    title: 'Review & Approve',
    description: 'Your artist shares a watermarked draft. Annotate directly on the image, request revisions, or approve — all in one place.',
    detail: '2 revisions included',
  },
  {
    id: 'step-deliver',
    number: '04',
    icon: Package,
    title: 'Receive Your Art',
    description: 'High-resolution digital file delivered instantly. Physical print shipped in archival packaging with tracking.',
    detail: 'Pan-India delivery',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 bg-white border-y border-[hsl(var(--border))]">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="section-label mb-3">The Process</p>
          <h2 className="font-display text-3xl md:text-4xl font-500 text-[#2C1810] mb-4">
            From photo to framed art,{' '}
            <em className="italic text-[#C9A84C]">without the chaos</em>
          </h2>
          <p className="font-body text-sm text-[#9C8878] max-w-lg mx-auto">
            We replaced the WhatsApp-back-and-forth with a structured workflow. You always know where your project stands.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-[hsl(var(--border))] to-transparent" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS?.map((step, index) => (
              <div key={step?.id} className="relative flex flex-col items-center text-center">
                {/* Step number bubble */}
                <div className="relative mb-5">
                  <div className="w-16 h-16 rounded-full bg-[#FAF6F0] border border-[hsl(var(--border))] flex items-center justify-center shadow-inset-luxury">
                    <step.icon size={24} className="text-[#C9A84C]" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#2C1810] text-[#FAF6F0] text-xs font-body font-600 flex items-center justify-center">
                    {index + 1}
                  </span>
                </div>

                <h3 className="font-display text-lg font-500 text-[#2C1810] mb-2">{step?.title}</h3>
                <p className="font-body text-xs text-[#9C8878] leading-relaxed mb-3">{step?.description}</p>
                <span className="inline-flex items-center gap-1 font-body text-xs font-500 text-[#C9A84C] bg-[#C9A84C]/10 px-2.5 py-1 rounded-sm">
                  {step?.detail}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-14">
          <Link href="/portrait-configurator" className="btn-primary px-8 py-3.5 text-sm">
            Start My Portrait — Takes 3 Minutes
          </Link>
        </div>
      </div>
    </section>
  );
}