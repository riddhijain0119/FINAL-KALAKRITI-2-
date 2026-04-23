'use client';

import React from 'react';
import { Palette, Users, Clock, IndianRupee } from 'lucide-react';
import { type Project, type ProjectStatus } from './ReviewPortal';
import Icon from '@/components/ui/AppIcon';



const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bg: string; dot: string }> = {
  IN_PRODUCTION: { label: 'In Production', color: 'text-blue-700', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  DRAFT_READY: { label: 'Draft Ready', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  UNDER_REVIEW: { label: 'Under Review', color: 'text-purple-700', bg: 'bg-purple-50', dot: 'bg-purple-500' },
  REVISION_REQUESTED: { label: 'Revision Requested', color: 'text-orange-700', bg: 'bg-orange-50', dot: 'bg-orange-500' },
  FINAL_APPROVED: { label: 'Approved ✓', color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  SHIPPED: { label: 'Shipped', color: 'text-teal-700', bg: 'bg-teal-50', dot: 'bg-teal-500' },
};

export default function ProjectHeader({ project }: { project: Project }) {
  const statusCfg = STATUS_CONFIG[project.status];

  return (
    <div className="bg-white border-b border-[hsl(var(--border))] sticky top-16 z-20">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Project info */}
          <div className="flex items-center gap-4">
            <img
              src={project.artistAvatar}
              alt={`Portrait photo of artist ${project.artistName}`}
              className="w-10 h-10 rounded-full object-cover border-2 border-[#C9A84C]/30"
            />
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="font-display text-lg font-500 text-[#2C1810]">
                  Project #{project.id.split('-')[2]}
                </h1>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-body font-500 ${statusCfg.bg} ${statusCfg.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                  {statusCfg.label}
                </span>
              </div>
              <p className="font-body text-xs text-[#9C8878]">
                Artist: <span className="text-[#3D3530] font-500">{project.artistName}</span>
                {' · '}
                Client: <span className="text-[#3D3530] font-500">{project.clientName}</span>
              </p>
            </div>
          </div>

          {/* Right: Meta */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-body">
            {[
              { id: 'meta-medium', icon: Palette, label: project.medium },
              { id: 'meta-size', icon: null, label: project.size },
              { id: 'meta-faces', icon: Users, label: `${project.faces} faces` },
              { id: 'meta-delivery', icon: Clock, label: `Due ${project.estimatedDelivery}` },
              { id: 'meta-balance', icon: IndianRupee, label: `₹${project.balanceDue.toLocaleString('en-IN')} balance` },
            ].map(({ id, icon: Icon, label }) => (
              <div key={id} className="flex items-center gap-1 text-[#9C8878]">
                {Icon && <Icon size={12} />}
                <span>{label}</span>
              </div>
            ))}

            {/* Revision counter */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm font-500 ${
              project.revisionsUsed >= project.revisionsIncluded
                ? 'bg-red-50 text-red-700' :'bg-[#FAF6F0] text-[#3D3530]'
            }`}>
              <span>{project.revisionsUsed}/{project.revisionsIncluded}</span>
              <span className="font-400 text-[#9C8878]">revisions used</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}