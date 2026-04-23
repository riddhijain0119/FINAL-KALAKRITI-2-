'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, MessageSquare, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { type Project } from './ReviewPortal';

export default function RevisionThread({ project }: { project: Project }) {
  const [expandedId, setExpandedId] = useState<string | null>(
    project.revisions.length > 0 ? project.revisions[project.revisions.length - 1].id : null
  );

  const remainingRevisions = project.revisionsIncluded - project.revisionsUsed;

  return (
    <div className="bg-white rounded-sm border border-[hsl(var(--border))] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-body text-sm font-600 text-[#2C1810]">Revision History</h3>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-body font-500 ${
          remainingRevisions <= 0
            ? 'bg-red-50 text-red-700'
            : remainingRevisions === 1
            ? 'bg-amber-50 text-amber-700' :'bg-[#FAF6F0] text-[#3D3530]'
        }`}>
          {remainingRevisions <= 0 ? (
            <AlertCircle size={11} />
          ) : (
            <MessageSquare size={11} />
          )}
          {remainingRevisions <= 0
            ? 'No revisions remaining'
            : `${remainingRevisions} revision${remainingRevisions > 1 ? 's' : ''} remaining`}
        </div>
      </div>

      {project.revisions.length === 0 ? (
        <div className="text-center py-6">
          <MessageSquare size={24} className="text-[hsl(var(--border))] mx-auto mb-2" />
          <p className="font-body text-xs text-[#9C8878]">No revisions requested yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {project.revisions.map((revision) => {
            const isExpanded = expandedId === revision.id;
            const statusIcon = revision.status === 'resolved'
              ? CheckCircle
              : revision.status === 'in_progress'
              ? Clock
              : AlertCircle;
            const statusColor = revision.status === 'resolved' ?'text-emerald-600'
              : revision.status === 'in_progress' ?'text-amber-600' :'text-red-600';
            const StatusIcon = statusIcon;

            return (
              <div
                key={revision.id}
                className={`border rounded-sm overflow-hidden transition-colors ${
                  isExpanded ? 'border-[#C9A84C]/40' : 'border-[hsl(var(--border))]'
                }`}
              >
                {/* Revision header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : revision.id)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-[#FAF6F0] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-body text-xs font-600 text-[#2C1810]">
                      Revision {revision.number}
                    </span>
                    <StatusIcon size={12} className={statusColor} />
                    <span className={`font-body text-xs capitalize ${statusColor}`}>
                      {revision.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-body text-xs text-[#9C8878]">{revision.requestedAt}</span>
                    {isExpanded ? (
                      <ChevronUp size={13} className="text-[#9C8878]" />
                    ) : (
                      <ChevronDown size={13} className="text-[#9C8878]" />
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 border-t border-[hsl(var(--border))] pt-3 space-y-3">
                        {/* Client notes */}
                        <div>
                          <p className="font-body text-xs font-600 text-[#9C8878] mb-1">Your Request</p>
                          <p className="font-body text-xs text-[#3D3530] leading-relaxed bg-[#FAF6F0] p-2.5 rounded-sm italic">
                            &ldquo;{revision.clientNotes}&rdquo;
                          </p>
                        </div>

                        {/* Annotations count */}
                        {revision.annotations.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="font-body text-xs text-[#9C8878]">
                              {revision.annotations.length} annotation{revision.annotations.length > 1 ? 's' : ''}
                            </span>
                            <span className="text-[#9C8878]">·</span>
                            <span className="font-body text-xs text-emerald-600">
                              {revision.annotations.filter((a) => a.resolved).length} resolved
                            </span>
                          </div>
                        )}

                        {/* Artist response */}
                        {revision.artistResponse && (
                          <div>
                            <p className="font-body text-xs font-600 text-[#9C8878] mb-1">Artist Response</p>
                            <p className="font-body text-xs text-[#3D3530] leading-relaxed bg-[#C9A84C]/5 border border-[#C9A84C]/20 p-2.5 rounded-sm">
                              {revision.artistResponse}
                            </p>
                          </div>
                        )}

                        {revision.resolvedAt && (
                          <p className="font-body text-xs text-[#9C8878]">
                            Resolved: {revision.resolvedAt}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}