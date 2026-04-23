'use client';
import React, { useEffect, useState } from 'react';
import { api, API_BASE } from '@/lib/api';
import { MessageCircle, X } from 'lucide-react';

/**
 * Floating WhatsApp chat button. Non-intrusive — fixed bottom-right.
 * Uses backend to generate wa.me click-to-chat link.
 */
export default function WhatsAppFloatingButton() {
  const [open, setOpen] = useState(false);
  const [waLink, setWaLink] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const msg = "Hi Kalakriti! I'd love to know more about custom portraits.";
    api<{ wa_link: string }>(`/api/whatsapp/chat-link?message=${encodeURIComponent(msg)}`)
      .then((d) => setWaLink(d.wa_link))
      .catch(() => setWaLink(''));
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3" data-testid="wa-float-container">
      {open && (
        <div
          data-testid="wa-float-card"
          className="w-72 rounded-2xl bg-[#FFFDF9] border border-[#E0D5C8] shadow-luxury-lg overflow-hidden animate-fade-in"
          style={{ boxShadow: '0 12px 40px rgba(44,24,16,0.18)' }}
        >
          <div className="bg-[#25D366] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <MessageCircle size={18} />
              <span className="font-body font-medium text-sm">Chat with Kalakriti</span>
            </div>
            <button aria-label="close" onClick={() => setOpen(false)} className="text-white/90 hover:text-white">
              <X size={16} />
            </button>
          </div>
          <div className="p-4 text-sm font-body text-[#3D3530] leading-relaxed">
            Have a question about a portrait, pricing, or your order? Our studio replies within a few hours on WhatsApp.
          </div>
          <a
            data-testid="wa-open-chat-btn"
            href={waLink || `${API_BASE}/api/whatsapp/chat-link`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-[#25D366] text-white font-body font-medium py-3 hover:bg-[#1ebe5b] transition-colors"
          >
            Open WhatsApp
          </a>
        </div>
      )}
      <button
        data-testid="wa-float-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label="Chat on WhatsApp"
        className="w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-[0_8px_24px_rgba(37,211,102,0.45)] hover:scale-110 transition-transform"
      >
        {open ? <X size={22} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
