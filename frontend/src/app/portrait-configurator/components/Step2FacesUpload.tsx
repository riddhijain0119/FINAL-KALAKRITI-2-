'use client';

import React, { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Upload, X, AlertTriangle, CheckCircle, Minus, Plus, Image as ImageIcon } from 'lucide-react';
import { useWizardStore, type UploadedFile } from '@/lib/state/wizardStore';
import { calculateComplexityMultiplier, MEDIUM_BASE_PRICES, SIZE_MULTIPLIERS } from '@/lib/pricing/engine';
import { usePricingVersion } from '@/lib/pricing/usePricingVersion';

// Minimum resolution for acceptable portrait quality
const MIN_WIDTH = 800;
const MIN_HEIGHT = 800;

function validateImageResolution(
  file: File
): Promise<{ width: number; height: number; isValid: boolean; message?: string }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const isValid = img.width >= MIN_WIDTH && img.height >= MIN_HEIGHT;
      resolve({
        width: img.width,
        height: img.height,
        isValid,
        message: isValid
          ? undefined
          : `Image is ${img.width}×${img.height}px — minimum ${MIN_WIDTH}×${MIN_HEIGHT}px required for print quality.`,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0, isValid: false, message: 'Could not read image dimensions.' });
    };
    img.src = url;
  });
}

export default function Step2FacesUpload() {
  const {
    faces,
    setFaces,
    uploadedFiles,
    addUploadedFile,
    removeUploadedFile,
    specialInstructions,
    setSpecialInstructions,
    nextStep,
    prevStep,
    markStepComplete,
    medium,
    sizeKey,
  } = useWizardStore();
  usePricingVersion(); // re-render when admin updates CMS pricing

  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const complexityMultiplier = calculateComplexityMultiplier(faces);

  // Face-count price preview using current medium + size (before frame/addons/GST)
  const sizeMul = SIZE_MULTIPLIERS[sizeKey] ?? 1;
  const baseForMedium = MEDIUM_BASE_PRICES[medium] ?? 0;
  const facePriceFor = (n: number) => Math.round(baseForMedium * sizeMul * calculateComplexityMultiplier(n));

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      setIsProcessing(true);
      const fileArray = Array.from(files);
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

      for (const file of fileArray) {
        if (!allowedTypes.includes(file.type)) {
          toast.error(`${file.name} — only JPG, PNG, WebP, or HEIC files are accepted`);
          continue;
        }
        if (file.size > 20 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 20MB — please compress and re-upload`);
          continue;
        }

        // Validate resolution
        const validation = await validateImageResolution(file);

        // Create preview dataUrl
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });

        const uploadedFile: UploadedFile = {
          id: `file-${Date.now()}-${file.name.replace(/\s/g, '-')}`,
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl,
          resolution: { width: validation.width, height: validation.height },
          isValid: validation.isValid,
          validationMessage: validation.message,
        };

        addUploadedFile(uploadedFile);

        if (!validation.isValid) {
          toast.warning(`${file.name} — low resolution detected. The portrait may appear soft.`, {
            duration: 5000,
          });
        } else {
          toast.success(`${file.name} uploaded successfully`);
        }
      }

      setIsProcessing(false);
    },
    [addUploadedFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const handleContinue = () => {
    if (uploadedFiles.length === 0) {
      toast.error('Please upload at least one reference photo before continuing');
      return;
    }
    markStepComplete(2);
    nextStep();
  };

  return (
    <div className="space-y-8">
      {/* Face Counter */}
      <div>
        <h2 className="font-display text-2xl font-500 text-[#2C1810] mb-1">How many faces?</h2>
        <p className="font-body text-sm text-[#9C8878] mb-6">
          Each additional face adds artistic complexity — our pricing reflects this transparently.
        </p>

        <div className="flex items-start gap-8">
          {/* Counter */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setFaces(faces - 1)}
              disabled={faces <= 1}
              className="w-10 h-10 rounded-full border border-[hsl(var(--border))] flex items-center justify-center text-[#2C1810] hover:border-[#C9A84C] hover:text-[#C9A84C] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Minus size={16} />
            </button>
            <div className="text-center">
              <span className="font-display text-4xl font-600 text-[#2C1810] tabular-nums">{faces}</span>
              <p className="font-body text-xs text-[#9C8878]">{faces === 1 ? 'face' : 'faces'}</p>
            </div>
            <button
              onClick={() => setFaces(faces + 1)}
              disabled={faces >= 8}
              className="w-10 h-10 rounded-full border border-[hsl(var(--border))] flex items-center justify-center text-[#2C1810] hover:border-[#C9A84C] hover:text-[#C9A84C] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Complexity visualization */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="font-body text-xs text-[#9C8878]">Complexity multiplier</span>
              <motion.span
                key={`multiplier-${complexityMultiplier}`}
                initial={{ scale: 1.2, color: '#C9A84C' }}
                animate={{ scale: 1, color: '#2C1810' }}
                className="font-body text-sm font-600 tabular-nums"
              >
                ×{complexityMultiplier.toFixed(2)}
              </motion.span>
            </div>
            <div className="h-2 bg-[hsl(var(--border))] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#C9A84C] to-[#A07830] rounded-full"
                animate={{ width: `${Math.min(100, ((complexityMultiplier - 1) / 3) * 100 + 10)}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            </div>
            <div className="flex justify-between mt-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={`face-marker-${i + 1}`} className={`font-body text-xs ${i + 1 === faces ? 'text-[#C9A84C] font-600' : 'text-[#9C8878]'}`}>
                  {i + 1}
                </span>
              ))}
            </div>
            <p className="font-body text-xs text-[#9C8878] mt-2">
              {faces === 1 ? 'Single portrait — base pricing' :
               faces === 2 ? 'Couple or duo — standard complexity' :
               faces <= 4 ? 'Group portrait — moderate complexity': 'Large group — high complexity, extended timeline'}
            </p>
          </div>
        </div>

        {/* Face-count price preview */}
        <div className="mt-4 p-3 rounded-sm border border-[hsl(var(--border))] bg-white" data-testid="face-price-preview">
          <p className="font-body text-xs text-[#9C8878] mb-2 uppercase tracking-widest">
            Price by number of faces · current medium + size
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((n) => {
              const isCurrent = faces === n;
              return (
                <button
                  key={`face-price-${n}`}
                  onClick={() => setFaces(n)}
                  data-testid={`face-price-${n}`}
                  className={`text-left px-3 py-2 rounded-sm border transition-colors ${
                    isCurrent
                      ? 'border-[#C9A84C] bg-[#C9A84C]/10'
                      : 'border-[hsl(var(--border))] bg-[#FAF6F0] hover:border-[#C9A84C]/60'
                  }`}
                >
                  <p className="font-body text-[11px] text-[#9C8878]">{n} {n === 1 ? 'face' : 'faces'}</p>
                  <p className={`font-body text-sm font-600 tabular-nums ${isCurrent ? 'text-[#2C1810]' : 'text-[#3D3530]'}`}>
                    ₹{facePriceFor(n).toLocaleString('en-IN')}
                  </p>
                </button>
              );
            })}
          </div>
          <p className="font-body text-[11px] text-[#9C8878] mt-2">
            Before frame, add-ons &amp; GST. Tap a tile to set face count.
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      <div>
        <h2 className="font-display text-2xl font-500 text-[#2C1810] mb-1">Upload Reference Photos</h2>
        <p className="font-body text-sm text-[#9C8878] mb-4">
          Upload clear, well-lit photos. Minimum 800×800px for print quality. We validate instantly.
        </p>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-sm p-10 text-center cursor-pointer transition-all duration-200 ${
            isDragOver
              ? 'border-[#C9A84C] bg-[#C9A84C]/5 scale-[1.01]'
              : 'border-[hsl(var(--border))] bg-white hover:border-[#C9A84C]/60 hover:bg-[#C9A84C]/3'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && processFiles(e.target.files)}
          />

          <div className="flex flex-col items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isDragOver ? 'bg-[#C9A84C]/20' : 'bg-[#FAF6F0]'}`}>
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload size={22} className={isDragOver ? 'text-[#C9A84C]' : 'text-[#9C8878]'} />
              )}
            </div>
            <div>
              <p className="font-body text-sm font-500 text-[#2C1810]">
                {isDragOver ? 'Drop to upload' : 'Drag photos here, or click to browse'}
              </p>
              <p className="font-body text-xs text-[#9C8878] mt-1">
                JPG, PNG, WebP, HEIC — max 20MB each — min 800×800px
              </p>
            </div>
          </div>
        </div>

        {/* Uploaded files */}
        <AnimatePresence>
          {uploadedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-2"
            >
              {uploadedFiles.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`flex items-center gap-3 p-3 rounded-sm border ${
                    file.isValid
                      ? 'bg-white border-[hsl(var(--border))]'
                      : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  {/* Preview thumbnail */}
                  <div className="w-12 h-12 rounded-sm overflow-hidden flex-shrink-0 bg-[#FAF6F0]">
                    {file.dataUrl ? (
                      <img
                        src={file.dataUrl}
                        alt={`Preview of uploaded reference photo ${file.name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={16} className="text-[#9C8878]" />
                      </div>
                    )}
                  </div>

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-500 text-[#2C1810] truncate">{file.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="font-body text-xs text-[#9C8878]">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                      {file.resolution && (
                        <span className="font-body text-xs text-[#9C8878]">
                          {file.resolution.width}×{file.resolution.height}px
                        </span>
                      )}
                    </div>
                    {!file.isValid && file.validationMessage && (
                      <p className="font-body text-xs text-amber-700 mt-1 flex items-center gap-1">
                        <AlertTriangle size={11} />
                        {file.validationMessage}
                      </p>
                    )}
                  </div>

                  {/* Status + Remove */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {file.isValid ? (
                      <CheckCircle size={16} className="text-emerald-500" />
                    ) : (
                      <AlertTriangle size={16} className="text-amber-500" />
                    )}
                    <button
                      onClick={() => removeUploadedFile(file.id)}
                      className="w-6 h-6 rounded-sm flex items-center justify-center text-[#9C8878] hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Special Instructions */}
      <div>
        <label className="block font-body text-sm font-500 text-[#2C1810] mb-1">
          Special Instructions <span className="text-[#9C8878] font-400">(optional)</span>
        </label>
        <p className="font-body text-xs text-[#9C8878] mb-2">
          Mention background preferences, colour palette requests, poses, or anything specific about the composition.
        </p>
        <textarea
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
          placeholder="e.g., Soft pastel background, warm tones. Please make my mother's sari more prominent. The photo shows a slight shadow on the left — please correct this."
          rows={4}
          className="w-full px-3 py-2.5 font-body text-sm text-[#2C1810] bg-white border border-[hsl(var(--border))] rounded-sm resize-none focus:outline-none focus:border-[#C9A84C] transition-colors placeholder:text-[#9C8878]/60"
        />
        <p className="font-body text-xs text-[#9C8878] mt-1 text-right">
          {specialInstructions.length}/500
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-[hsl(var(--border))]">
        <button onClick={prevStep} className="btn-outline px-6">
          Back
        </button>
        <button onClick={handleContinue} className="btn-primary px-8">
          Continue to Framing
        </button>
      </div>
    </div>
  );
}