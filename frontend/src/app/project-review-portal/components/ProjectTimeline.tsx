'use client';

import React from 'react';
import { Check, ClipboardList, Brush, Truck, PackageCheck } from 'lucide-react';
import { type Project, type ProjectStatus } from './ReviewPortal';

interface TimelineStep {
  id: string;
  status: ProjectStatus;
  label: string;
  description: string;
  icon: React.ElementType;
}

const TIMELINE_STEPS: TimelineStep[] = [
  {
    id: 'tl-received',
    status: 'ORDER_RECEIVED',
    label: 'Order Received',
    description: 'Payment confirmed — your order is in the queue',
    icon: ClipboardList,
  },
  {
    id: 'tl-production',
    status: 'IN_PRODUCTION',
    label: 'In Production',
    description: 'Artist is hand-crafting your portrait',
    icon: Brush,
  },
  {
    id: 'tl-shipped',
    status: 'SHIPPED',
    label: 'Shipped',
    description: 'Your portrait is on the way',
    icon: Truck,
  },
  {
    id: 'tl-delivered',
    status: 'DELIVERED',
    label: 'Delivered',
    description: 'Enjoy your Kalakriti artwork',
    icon: PackageCheck,
  },
];

const STATUS_ORDER: ProjectStatus[] = [
  'ORDER_RECEIVED',
  'IN_PRODUCTION',
  'SHIPPED',
  'DELIVERED',
];

export default function ProjectTimeline({ project }: { project: Project }) {
  const currentIndex = STATUS_ORDER.indexOf(project.status);

  return (
    <div className="bg-white rounded-sm border border-[hsl(var(--border))] p-5" data-testid="project-timeline">
      <h3 className="font-body text-sm font-600 text-[#2C1810] mb-5">Project Timeline</h3>

      <div className="relative">
        {/* Vertical connector */}
        <div className="absolute left-3.5 top-4 bottom-4 w-px bg-[hsl(var(--border))]" />

        <div className="space-y-5">
          {TIMELINE_STEPS.map((step) => {
            const stepIndex = STATUS_ORDER.indexOf(step.status);
            const isCompleted = stepIndex < currentIndex;
            const isActive = stepIndex === currentIndex;
            const isFuture = stepIndex > currentIndex;

            return (
              <div key={step.id} className="relative flex items-start gap-3" data-testid={`timeline-step-${step.status}`}>
                {/* Icon bubble */}
                <div
                  className={`relative z-10 w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
                    isCompleted
                      ? 'bg-[#2C1810] border-[#2C1810]'
                      : isActive
                      ? 'bg-[#C9A84C] border-[#C9A84C]'
                      : 'bg-white border-[hsl(var(--border))]'
                  }`}
                >
                  {isCompleted ? (
                    <Check size={13} className="text-white" />
                  ) : (
                    <step.icon
                      size={13}
                      className={
                        isActive ? 'text-[#2C1810]' : isFuture ? 'text-[hsl(var(--border))]' : 'text-[#9C8878]'
                      }
                    />
                  )}
                </div>

                {/* Content */}
                <div className="pt-0.5 min-w-0">
                  <p
                    className={`font-body text-xs font-600 ${
                      isActive ? 'text-[#C9A84C]' : isCompleted ? 'text-[#2C1810]' : 'text-[#9C8878]'
                    }`}
                  >
                    {step.label}
                  </p>
                  {(isActive || isCompleted) && (
                    <p className="font-body text-xs text-[#9C8878] mt-0.5">{step.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Special instructions */}
      {project.specialInstructions && (
        <div className="mt-5 pt-4 border-t border-[hsl(var(--border))]">
          <p className="font-body text-xs font-600 text-[#2C1810] mb-1.5">Your Instructions</p>
          <p className="font-body text-xs text-[#9C8878] leading-relaxed italic">
            &ldquo;{project.specialInstructions}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
