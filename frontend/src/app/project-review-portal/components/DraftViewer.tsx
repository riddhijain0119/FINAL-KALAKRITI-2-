'use client';

import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, X, MessageSquare, ZoomIn, ZoomOut } from 'lucide-react';
import { type Project, type AnnotationPin } from './ReviewPortal';

interface DraftViewerProps {
  project: Project;
  pins: AnnotationPin[];
  newPins: AnnotationPin[];
  onAddPin: (pin: AnnotationPin) => void;
  onRemovePin: (pinId: string) => void;
}

interface PinFormState {
  x: number;
  y: number;
  comment: string;
}

export default function DraftViewer({
  project,
  pins,
  newPins,
  onAddPin,
  onRemovePin,
}: DraftViewerProps) {
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [pendingPin, setPendingPin] = useState<PinFormState | null>(null);
  const [activePin, setActivePin] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const imageRef = useRef<HTMLDivElement>(null);
  const pinCommentRef = useRef<HTMLInputElement>(null);

  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isAnnotating) return;
      if (!imageRef.current) return;

      const rect = imageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      setPendingPin({ x, y, comment: '' });
      setTimeout(() => pinCommentRef.current?.focus(), 50);
    },
    [isAnnotating]
  );

  const handleConfirmPin = () => {
    if (!pendingPin || !pendingPin.comment.trim()) return;

    const newPin: AnnotationPin = {
      id: `pin-new-${Date.now()}`,
      x: pendingPin.x,
      y: pendingPin.y,
      comment: pendingPin.comment.trim(),
      author: 'client',
      createdAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      resolved: false,
    };

    onAddPin(newPin);
    setPendingPin(null);
  };

  const handleCancelPin = () => {
    setPendingPin(null);
  };

  const allPins = pins;
  const isApproved = project.status === 'FINAL_APPROVED' || project.status === 'SHIPPED';

  return (
    <div className="bg-white rounded-sm border border-[hsl(var(--border))] overflow-hidden shadow-luxury">
      {/* Viewer toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))] bg-[#FAF6F0]">
        <div className="flex items-center gap-2">
          <p className="font-body text-sm font-600 text-[#2C1810]">Current Draft</p>
          <span className="font-body text-xs text-[#9C8878]">
            — Revision {project.revisionsUsed > 0 ? project.revisionsUsed : 'Initial'}
          </span>
          {/* Watermark warning */}
          <span className="inline-flex items-center gap-1 font-body text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-sm border border-amber-100">
            Watermarked draft
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            className="w-7 h-7 rounded-sm border border-[hsl(var(--border))] flex items-center justify-center text-[#9C8878] hover:text-[#2C1810] hover:border-[#C9A84C] transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut size={13} />
          </button>
          <span className="font-body text-xs text-[#9C8878] w-8 text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
            className="w-7 h-7 rounded-sm border border-[hsl(var(--border))] flex items-center justify-center text-[#9C8878] hover:text-[#2C1810] hover:border-[#C9A84C] transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn size={13} />
          </button>

          {/* Annotate toggle */}
          {!isApproved && (
            <button
              onClick={() => {
                setIsAnnotating(!isAnnotating);
                setPendingPin(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-body font-500 border transition-all ${
                isAnnotating
                  ? 'bg-[#C9A84C] border-[#C9A84C] text-[#2C1810]'
                  : 'border-[hsl(var(--border))] text-[#9C8878] hover:border-[#C9A84C] hover:text-[#2C1810]'
              }`}
            >
              <Pin size={12} />
              {isAnnotating ? 'Click image to pin' : 'Add Annotation'}
            </button>
          )}
        </div>
      </div>

      {/* Image area */}
      <div className="overflow-auto bg-[#1A1410]" style={{ maxHeight: '600px' }}>
        <div
          ref={imageRef}
          className={`relative mx-auto transition-transform duration-200 ${isAnnotating ? 'cursor-crosshair' : 'cursor-default'}`}
          style={{
            width: `${zoom * 100}%`,
            minWidth: '300px',
          }}
          onClick={handleImageClick}
        >
          {/* Draft image */}
          <img
            src={project.currentDraftUrl}
            alt={project.currentDraftAlt}
            className="w-full h-auto block"
            draggable={false}
          />

          {/* Watermark overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <div
              className="font-display text-white/8 text-4xl font-700 tracking-widest uppercase rotate-[-30deg] whitespace-nowrap"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
            >
              KALAKRITI · DRAFT · KALAKRITI · DRAFT
            </div>
          </div>

          {/* Annotation pins */}
          {allPins.map((pin, pinIndex) => {
            const isNew = newPins.some((p) => p.id === pin.id);
            const isActive = activePin === pin.id;

            return (
              <div
                key={pin.id}
                className="absolute"
                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              >
                {/* Pin marker */}
                <motion.button
                  initial={isNew ? { scale: 0 } : { scale: 1 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePin(isActive ? null : pin.id);
                  }}
                  className={`annotation-pin w-6 h-6 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-xs font-body font-700 transition-all ${
                    pin.resolved
                      ? 'bg-emerald-500 border-white border-2'
                      : isNew
                      ? 'bg-[#C9A84C] border-white border-2'
                      : 'bg-red-500 border-white border-2'
                  }`}
                  aria-label={`Annotation pin ${pinIndex + 1}`}
                >
                  <span className="text-white text-xs">{pinIndex + 1}</span>
                </motion.button>

                {/* Pin tooltip */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute z-20 left-4 -top-2 w-56 bg-white rounded-sm shadow-luxury-lg border border-[hsl(var(--border))] p-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <MessageSquare size={11} className="text-[#9C8878]" />
                          <span className="font-body text-xs font-600 text-[#2C1810] capitalize">
                            {pin.author}
                          </span>
                          <span className="font-body text-xs text-[#9C8878]">· {pin.createdAt}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {pin.resolved && (
                            <span className="font-body text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                              Resolved
                            </span>
                          )}
                          {isNew && (
                            <button
                              onClick={() => { onRemovePin(pin.id); setActivePin(null); }}
                              className="text-[#9C8878] hover:text-red-500 transition-colors"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="font-body text-xs text-[#3D3530] leading-relaxed">{pin.comment}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* Pending pin form */}
          <AnimatePresence>
            {pendingPin && (
              <div
                className="absolute z-30"
                style={{ left: `${pendingPin.x}%`, top: `${pendingPin.y}%` }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Temporary pin marker */}
                <div className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C9A84C] border-2 border-white flex items-center justify-center animate-pulse">
                  <Pin size={11} className="text-[#2C1810]" />
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute left-4 -top-2 w-64 bg-white rounded-sm shadow-luxury-lg border border-[#C9A84C] p-3"
                >
                  <p className="font-body text-xs font-600 text-[#2C1810] mb-2">Add your comment</p>
                  <input
                    ref={pinCommentRef}
                    type="text"
                    value={pendingPin.comment}
                    onChange={(e) => setPendingPin((p) => p ? { ...p, comment: e.target.value } : null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleConfirmPin();
                      if (e.key === 'Escape') handleCancelPin();
                    }}
                    placeholder="Describe what needs to change..."
                    className="w-full px-2.5 py-1.5 font-body text-xs text-[#2C1810] bg-[#FAF6F0] border border-[hsl(var(--border))] rounded-sm focus:outline-none focus:border-[#C9A84C] mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleConfirmPin}
                      disabled={!pendingPin.comment.trim()}
                      className="flex-1 py-1 bg-[#C9A84C] text-[#2C1810] text-xs font-body font-600 rounded-sm disabled:opacity-40 hover:bg-[#E8C96A] transition-colors"
                    >
                      Add Pin
                    </button>
                    <button
                      onClick={handleCancelPin}
                      className="flex-1 py-1 border border-[hsl(var(--border))] text-[#9C8878] text-xs font-body rounded-sm hover:text-[#2C1810] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Annotation legend */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-t border-[hsl(var(--border))] bg-[#FAF6F0]">
        <p className="font-body text-xs text-[#9C8878]">Annotations:</p>
        {[
          { id: 'legend-open', color: 'bg-red-500', label: 'Open' },
          { id: 'legend-new', color: 'bg-[#C9A84C]', label: 'New (unsaved)' },
          { id: 'legend-resolved', color: 'bg-emerald-500', label: 'Resolved' },
        ].map(({ id, color, label }) => (
          <div key={id} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-full ${color}`} />
            <span className="font-body text-xs text-[#9C8878]">{label}</span>
          </div>
        ))}
        {newPins.length > 0 && (
          <span className="ml-auto font-body text-xs text-[#C9A84C] font-500">
            {newPins.length} unsaved pin{newPins.length > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}