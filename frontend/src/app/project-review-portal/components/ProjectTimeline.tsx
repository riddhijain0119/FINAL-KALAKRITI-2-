'use client';

import React from 'react';
import { Check, Clock, AlertCircle, Eye, Brush, Truck } from 'lucide-react';
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
    id: 'tl-production',
    status: 'IN_PRODUCTION',
    label: 'In Production',
    description: 'Artist is working on your portrait',
    icon: Brush,
  },
  {
    id: 'tl-draft',
    status: 'DRAFT_READY',
    label: 'Draft Uploaded',
    description: 'First draft ready for your review',
    icon: Eye,
  },
  {
    id: 'tl-review',
    status: 'UNDER_REVIEW',
    label: 'Under Review',
    description: 'You are reviewing the current draft',
    icon: Clock,
  },
  {
    id: 'tl-revision',
    status: 'REVISION_REQUESTED',
    label: 'Revision Requested',
    description: 'Artist is implementing your feedback',
    icon: AlertCircle,
  },
  {
    id: 'tl-approved',
    status: 'FINAL_APPROVED',
    label: 'Approved',
    description: 'Final artwork approved — preparing for delivery',
    icon: Check,
  },
  {
    id: 'tl-shipped',
    status: 'SHIPPED',
    label: 'Shipped',
    description: 'Your portrait is on its way',
    icon: Truck,
  },
];

const STATUS_ORDER: ProjectStatus[] = [
  'IN_PRODUCTION',
  'DRAFT_READY',
  'UNDER_REVIEW',
  'REVISION_REQUESTED',
  'FINAL_APPROVED',
  'SHIPPED',
];

export default function ProjectTimeline({ project }: { project: Project }) {
  const currentIndex = STATUS_ORDER.indexOf(project.status);

  return (
    <div className="bg-white rounded-sm border border-[hsl(var(--border))] p-5">
      <h3 className="font-body text-sm font-600 text-[#2C1810] mb-5">Project Timeline</h3>

      <div className="relative">
        {/* Vertical connector */}
        <div className="absolute left-3.5 top-4 bottom-4 w-px bg-[hsl(var(--border))]" />

        <div className="space-y-5">
          {TIMELINE_STEPS.map((step, index) => {
            const stepIndex = STATUS_ORDER.indexOf(step.status);
            const isCompleted = stepIndex < currentIndex;
            const isActive = stepIndex === currentIndex;
            const isFuture = stepIndex > currentIndex;

            // Handle revision loop — if status cycled back
            const isRevisionLoop = step.status === 'REVISION_REQUESTED' && project.revisionsUsed > 0;

            return (
              <div key={step.id} className="relative flex items-start gap-3">
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
                    {isRevisionLoop && step.status === 'REVISION_REQUESTED' && (
                      <span className="ml-1.5 font-400 text-[#9C8878]">×{project.revisionsUsed}</span>
                    )}
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