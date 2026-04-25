'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle, Truck, Brush, ClipboardList, ArrowRight } from 'lucide-react';
import { type Project } from './ReviewPortal';

interface ReviewActionsProps {
  project: Project;
}

const STATUS_VIEW: Record<string, { icon: any; title: string; body: string; bg: string; color: string; iconColor: string }> = {
  ORDER_RECEIVED: {
    icon: ClipboardList,
    title: 'Order received — payment confirmed',
    body: 'Your order is in our queue. The assigned artist will begin production shortly. You will receive an update by email when production starts.',
    bg: 'bg-amber-50 border-amber-200', color: 'text-amber-800', iconColor: 'text-amber-600',
  },
  IN_PRODUCTION: {
    icon: Brush,
    title: 'In production',
    body: 'Your artist is hand-crafting your portrait now. We will email you the moment your artwork ships out.',
    bg: 'bg-blue-50 border-blue-200', color: 'text-blue-800', iconColor: 'text-blue-600',
  },
  SHIPPED: {
    icon: Truck,
    title: 'Shipped',
    body: 'Your portrait is on the way. Use the tracking link in your email to follow its journey home.',
    bg: 'bg-teal-50 border-teal-200', color: 'text-teal-800', iconColor: 'text-teal-600',
  },
  DELIVERED: {
    icon: CheckCircle,
    title: 'Delivered',
    body: 'We hope you love your Kalakriti masterpiece. If you have a moment, a review on Google or Instagram means the world to our artists.',
    bg: 'bg-emerald-50 border-emerald-200', color: 'text-emerald-800', iconColor: 'text-emerald-600',
  },
};

export default function ReviewActions({ project }: ReviewActionsProps) {
  const cfg = STATUS_VIEW[project.status] || STATUS_VIEW.IN_PRODUCTION;
  const Icon = cfg.icon;

  return (
    <div className={`border rounded-sm p-5 flex items-start gap-4 ${cfg.bg}`} data-testid="review-status-card">
      <Icon size={24} className={`flex-shrink-0 mt-0.5 ${cfg.iconColor}`} />
      <div className="flex-1">
        <p className={`font-display text-base font-600 ${cfg.color}`}>{cfg.title}</p>
        <p className={`font-body text-sm leading-relaxed mt-1 ${cfg.color}/80`}>{cfg.body}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/track-order"
            data-testid="track-order-link"
            className="inline-flex items-center gap-1.5 text-xs font-body font-600 px-4 py-2 rounded-sm bg-[#2C1810] text-[#FAF6F0] hover:bg-[#1A0E09] transition-colors"
          >
            Track Order <ArrowRight size={12} />
          </Link>
          <Link
            href="/my-orders"
            className="inline-flex items-center gap-1.5 text-xs font-body font-500 px-4 py-2 rounded-sm border border-[hsl(var(--border))] text-[#3D3530] hover:bg-white transition-colors"
          >
            My Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
