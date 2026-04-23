'use client';

import React, { useState } from 'react';
import { Toaster } from 'sonner';
import ProjectTimeline from './ProjectTimeline';
import DraftViewer from './DraftViewer';
import RevisionThread from './RevisionThread';
import ReviewActions from './ReviewActions';
import ProjectHeader from './ProjectHeader';

// Backend: fetch from /api/projects/[id] — replace with real project data
export type ProjectStatus =
'IN_PRODUCTION' | 'DRAFT_READY' | 'UNDER_REVIEW' | 'REVISION_REQUESTED' | 'FINAL_APPROVED' | 'SHIPPED';

export interface AnnotationPin {
  id: string;
  x: number; // percentage of image width
  y: number; // percentage of image height
  comment: string;
  author: 'client' | 'artist';
  createdAt: string;
  resolved: boolean;
}

export interface Revision {
  id: string;
  number: number;
  requestedAt: string;
  resolvedAt?: string;
  status: 'pending' | 'in_progress' | 'resolved';
  clientNotes: string;
  artistResponse?: string;
  draftImageUrl: string;
  draftImageAlt: string;
  annotations: AnnotationPin[];
}

export interface Project {
  id: string;
  clientName: string;
  artistName: string;
  artistAvatar: string;
  medium: string;
  size: string;
  faces: number;
  status: ProjectStatus;
  startedAt: string;
  estimatedDelivery: string;
  revisionsIncluded: number;
  revisionsUsed: number;
  currentDraftUrl: string;
  currentDraftAlt: string;
  depositPaid: number;
  balanceDue: number;
  revisions: Revision[];
  specialInstructions: string;
}

// Mock project data — Backend: replace with /api/projects/[id] response
const MOCK_PROJECT: Project = {
  id: 'project-KAL-2847',
  clientName: 'Priya Krishnamurthy',
  artistName: 'Meera Iyer',
  artistAvatar: "/assets/images/gallery/art-28.jpeg",
  medium: 'Watercolour',
  size: 'A3 (12×16 in)',
  faces: 2,
  status: 'UNDER_REVIEW',
  startedAt: '03 Apr 2026',
  estimatedDelivery: '12 Apr 2026',
  revisionsIncluded: 2,
  revisionsUsed: 1,
  currentDraftUrl: "/assets/images/gallery/art-29.jpeg",
  currentDraftAlt: 'Watercolour portrait draft showing two figures with warm tones — watermarked with KALAKRITI DRAFT',
  depositPaid: 2400,
  balanceDue: 2400,
  specialInstructions: 'Soft pastel background, warm tones. Please make my mother\'s sari more prominent.',
  revisions: [
  {
    id: 'revision-001',
    number: 1,
    requestedAt: '06 Apr 2026',
    resolvedAt: '08 Apr 2026',
    status: 'resolved',
    clientNotes: 'The background feels too dark. Can we lighten it to a warm ivory? Also the left figure\'s eyes look slightly off — please adjust.',
    artistResponse: 'Lightened the background to warm ivory and corrected the eye proportions. Updated draft uploaded.',
    draftImageUrl: "/assets/images/gallery/art-30.jpeg",
    draftImageAlt: 'First draft of watercolour portrait before revision adjustments',
    annotations: [
    {
      id: 'ann-001-1',
      x: 28,
      y: 42,
      comment: 'Eyes look slightly asymmetric — please correct',
      author: 'client',
      createdAt: '06 Apr 2026',
      resolved: true
    },
    {
      id: 'ann-001-2',
      x: 70,
      y: 60,
      comment: 'Background too dark here — warm ivory please',
      author: 'client',
      createdAt: '06 Apr 2026',
      resolved: true
    }]

  },
  {
    id: 'revision-002',
    number: 2,
    requestedAt: '09 Apr 2026',
    status: 'in_progress',
    clientNotes: 'Looking much better! One last thing — the sari colours on the right figure need to be more vibrant. The magenta should pop more.',
    draftImageUrl: "/assets/images/gallery/art-31.jpeg",
    draftImageAlt: 'Second draft of watercolour portrait showing revised background and corrected eyes',
    annotations: [
    {
      id: 'ann-002-1',
      x: 62,
      y: 55,
      comment: 'Sari colour needs to be more vibrant — magenta should pop',
      author: 'client',
      createdAt: '09 Apr 2026',
      resolved: false
    }]

  }]

};

export default function ReviewPortal() {
  const [project, setProject] = useState<Project>(MOCK_PROJECT);
  const [activeAnnotations, setActiveAnnotations] = useState<AnnotationPin[]>(
    MOCK_PROJECT.revisions[MOCK_PROJECT.revisions.length - 1]?.annotations || []
  );
  const [newPins, setNewPins] = useState<AnnotationPin[]>([]);

  const handleStatusChange = (newStatus: ProjectStatus) => {
    // Backend integration: PATCH /api/projects/[id]/review { status: newStatus }
    setProject((prev) => ({ ...prev, status: newStatus }));
  };

  const handleAddPin = (pin: AnnotationPin) => {
    setNewPins((prev) => [...prev, pin]);
  };

  const handleRemovePin = (pinId: string) => {
    setNewPins((prev) => prev.filter((p) => p.id !== pinId));
  };

  const allPins = [...activeAnnotations, ...newPins];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#FAF6F0]">
      <Toaster position="bottom-right" richColors />

      {/* Project Header */}
      <ProjectHeader project={project} />

      {/* Main layout */}
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 py-6">
        <div className="flex flex-col xl:flex-row gap-6">

          {/* Left sidebar: Timeline + Revision thread */}
          <div className="xl:w-80 flex-shrink-0 space-y-4">
            <ProjectTimeline project={project} />
            <RevisionThread project={project} />
          </div>

          {/* Center: Draft viewer */}
          <div className="flex-1 min-w-0">
            <DraftViewer
              project={project}
              pins={allPins}
              newPins={newPins}
              onAddPin={handleAddPin}
              onRemovePin={handleRemovePin} />
            
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="mt-6">
          <ReviewActions
            project={project}
            newPins={newPins}
            onStatusChange={handleStatusChange}
            onClearPins={() => setNewPins([])} />
          
        </div>
      </div>
    </div>);

}