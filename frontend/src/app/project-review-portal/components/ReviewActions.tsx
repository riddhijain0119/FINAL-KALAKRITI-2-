'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { CheckCircle, RotateCcw, AlertTriangle, X, Loader2, CreditCard, Pin } from 'lucide-react';
import { type Project, type ProjectStatus, type AnnotationPin } from './ReviewPortal';
import { formatINR } from '@/lib/pricing/engine';

interface ReviewActionsProps {
  project: Project;
  newPins: AnnotationPin[];
  onStatusChange: (status: ProjectStatus) => void;
  onClearPins: () => void;
}

interface RevisionForm {
  notes: string;
}

type ModalType = 'revision' | 'approve' | null;

export default function ReviewActions({
  project,
  newPins,
  onStatusChange,
  onClearPins,
}: ReviewActionsProps) {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RevisionForm>();

  const isApproved = project.status === 'FINAL_APPROVED' || project.status === 'SHIPPED';
  const noRevisionsLeft = project.revisionsUsed >= project.revisionsIncluded;

  const handleRevisionSubmit = async (data: RevisionForm) => {
    setIsSubmitting(true);

    // Backend integration: PATCH /api/projects/[id]/review
    // Body: { status: 'REVISION_REQUESTED', notes: data.notes, annotations: newPins }
    await new Promise((r) => setTimeout(r, 1800));

    setIsSubmitting(false);
    setActiveModal(null);
    reset();
    onClearPins();
    onStatusChange('REVISION_REQUESTED');
    toast.success('Revision request sent. Your artist will respond within 24 hours.', { duration: 5000 });
  };

  const handleApprove = async () => {
    setIsSubmitting(true);

    // Backend integration: PATCH /api/projects/[id]/review
    // Body: { status: 'FINAL_APPROVED' }
    // Then: charge remaining 50% via Razorpay
    await new Promise((r) => setTimeout(r, 2000));

    setIsSubmitting(false);
    setActiveModal(null);
    onStatusChange('FINAL_APPROVED');
    toast.success(
      `Portrait approved! Balance of ${formatINR(project.balanceDue)} charged. Final file will be delivered within 24 hours.`,
      { duration: 8000 }
    );
  };

  if (isApproved) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-5 flex items-center gap-4">
        <CheckCircle size={24} className="text-emerald-600 flex-shrink-0" />
        <div>
          <p className="font-body text-sm font-600 text-emerald-800">Portrait Approved</p>
          <p className="font-body text-xs text-emerald-700 mt-0.5">
            Your final high-resolution artwork will be delivered to your email within 24 hours. Physical print ships within 2–3 business days.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-sm border border-[hsl(var(--border))] p-4 shadow-luxury">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Left: New pins indicator */}
          <div className="flex items-center gap-3">
            {newPins.length > 0 ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-sm">
                <Pin size={13} className="text-[#C9A84C]" />
                <span className="font-body text-xs font-500 text-[#2C1810]">
                  {newPins.length} annotation{newPins.length > 1 ? 's' : ''} added
                </span>
                <button
                  onClick={onClearPins}
                  className="text-[#9C8878] hover:text-red-500 transition-colors ml-1"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <p className="font-body text-xs text-[#9C8878]">
                Add annotation pins to the draft to mark specific areas for revision.
              </p>
            )}

            {noRevisionsLeft && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 border border-red-100 rounded-sm">
                <AlertTriangle size={12} className="text-red-500" />
                <span className="font-body text-xs text-red-700">
                  No free revisions remaining — additional revisions charged at ₹500 each
                </span>
              </div>
            )}
          </div>

          {/* Right: Action buttons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setActiveModal('revision')}
              disabled={project.status === 'REVISION_REQUESTED'}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-sm text-sm font-body font-500 border transition-all ${
                project.status === 'REVISION_REQUESTED' ?'border-[hsl(var(--border))] text-[#9C8878] cursor-not-allowed opacity-60'
                  : noRevisionsLeft
                  ? 'border-orange-300 text-orange-700 hover:bg-orange-50' :'border-[hsl(var(--border))] text-[#3D3530] hover:border-[#2C1810] hover:text-[#2C1810]'
              }`}
            >
              <RotateCcw size={14} />
              Request Revision
              {noRevisionsLeft && <span className="text-xs text-orange-600">(+₹500)</span>}
            </button>

            <button
              onClick={() => setActiveModal('approve')}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-sm text-sm font-body font-600 hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-sm"
            >
              <CheckCircle size={14} />
              Approve & Finalise
            </button>
          </div>
        </div>
      </div>

      {/* Revision Modal */}
      <AnimatePresence>
        {activeModal === 'revision' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#2C1810]/50 backdrop-blur-sm"
              onClick={() => setActiveModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative bg-white rounded-sm shadow-luxury-lg w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-display text-xl font-500 text-[#2C1810]">Request a Revision</h2>
                  <p className="font-body text-xs text-[#9C8878] mt-0.5">
                    {project.revisionsIncluded - project.revisionsUsed > 0
                      ? `${project.revisionsIncluded - project.revisionsUsed} free revision${project.revisionsIncluded - project.revisionsUsed > 1 ? 's' : ''} remaining`
                      : 'Additional revision — ₹500 will be charged'}
                  </p>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-8 h-8 rounded-sm flex items-center justify-center text-[#9C8878] hover:text-[#2C1810] hover:bg-[#FAF6F0] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {newPins.length > 0 && (
                <div className="mb-4 p-3 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-sm">
                  <p className="font-body text-xs font-500 text-[#2C1810]">
                    {newPins.length} annotation pin{newPins.length > 1 ? 's' : ''} will be included with this request
                  </p>
                  <div className="mt-2 space-y-1">
                    {newPins.map((pin, i) => (
                      <p key={pin.id} className="font-body text-xs text-[#9C8878]">
                        Pin {i + 1}: {pin.comment}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(handleRevisionSubmit)} className="space-y-4">
                <div>
                  <label className="block font-body text-xs font-500 text-[#2C1810] mb-1">
                    Describe your requested changes *
                  </label>
                  <p className="font-body text-xs text-[#9C8878] mb-2">
                    Be as specific as possible. Include colours, proportions, expressions, or compositional changes.
                  </p>
                  <textarea
                    {...register('notes', {
                      required: 'Please describe the changes you need',
                      minLength: { value: 20, message: 'Please provide at least 20 characters of detail' },
                    })}
                    rows={5}
                    placeholder="e.g., The sari colours on the right figure need to be more vibrant — specifically the magenta border should be deeper. Also, can we soften the background slightly to focus more on the faces?"
                    className="w-full px-3 py-2.5 font-body text-sm text-[#2C1810] bg-[#FAF6F0] border border-[hsl(var(--border))] rounded-sm resize-none focus:outline-none focus:border-[#C9A84C] transition-colors placeholder:text-[#9C8878]/60"
                  />
                  {errors.notes && (
                    <p className="font-body text-xs text-red-500 mt-1">{errors.notes.message}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setActiveModal(null); reset(); }}
                    className="flex-1 py-2.5 border border-[hsl(var(--border))] text-[#9C8878] font-body text-sm rounded-sm hover:text-[#2C1810] hover:border-[#2C1810] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-[#2C1810] text-[#FAF6F0] font-body text-sm font-500 rounded-sm hover:bg-[#3D3530] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Revision Request'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Approve Modal */}
      <AnimatePresence>
        {activeModal === 'approve' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#2C1810]/50 backdrop-blur-sm"
              onClick={() => !isSubmitting && setActiveModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative bg-white rounded-sm shadow-luxury-lg w-full max-w-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={24} className="text-emerald-600" />
                </div>
                <h2 className="font-display text-xl font-500 text-[#2C1810] mb-2">Approve This Portrait?</h2>
                <p className="font-body text-xs text-[#9C8878]">
                  Once approved, this action cannot be undone. The balance payment will be charged and your final artwork will be prepared for delivery.
                </p>
              </div>

              {/* Balance due */}
              <div className="bg-[#FAF6F0] rounded-sm p-4 mb-5 text-center">
                <p className="font-body text-xs text-[#9C8878] mb-1">Balance due on approval</p>
                <p className="font-display text-2xl font-600 text-[#2C1810] tabular-nums">
                  {formatINR(project.balanceDue)}
                </p>
                <p className="font-body text-xs text-[#9C8878] mt-1">charged to your saved payment method</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => !isSubmitting && setActiveModal(null)}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 border border-[hsl(var(--border))] text-[#9C8878] font-body text-sm rounded-sm hover:text-[#2C1810] disabled:opacity-40 transition-colors"
                >
                  Go Back
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-emerald-600 text-white font-body text-sm font-600 rounded-sm hover:bg-emerald-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard size={14} />
                      Approve & Pay
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}