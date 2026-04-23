'use client';
import React, { useEffect, useRef, useState } from 'react';
import { API_BASE } from '@/lib/api';
import { MessageCircle, X, Send, Phone, Sparkles, ArrowRight, Paperclip, CreditCard } from 'lucide-react';
import Link from 'next/link';

type ChatMsg = {
  role: 'user' | 'assistant';
  text: string;
  cta?: 'configure' | 'call' | 'pay' | null;
  images?: string[]; // URLs to render
  payment_url?: string;
  order_id?: string;
};

const WELCOME: ChatMsg = {
  role: 'assistant',
  text:
    "Namaste! I'm Kalakriti Sakhi ✨\n\nI can help with pricing, mediums, or order status — and I can even place your order from right here. Just tap 📎 to attach your photo(s). How can I help?",
};

const QUICK_PROMPTS = [
  'What does a watercolour A3 cost?',
  'Place my order from here',
  'Status of my order?',
  'Which medium for a gift?',
];

function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let s = window.localStorage.getItem('kalakriti_chat_session');
  if (!s) {
    s = `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    window.localStorage.setItem('kalakriti_chat_session', s);
  }
  return s;
}

export default function AIChatBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([WELCOME]);
  const [loading, setLoading] = useState(false);
  const [supportPhone, setSupportPhone] = useState('+919667788175');
  const [pendingImages, setPendingImages] = useState<string[]>([]); // base64 data URLs
  const scrollerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessionId = useRef<string>('');

  useEffect(() => {
    sessionId.current = getSessionId();
    // Load prior history
    fetch(`${API_BASE}/api/chat/history?session_id=${sessionId.current}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.support_phone) setSupportPhone(d.support_phone);
        if (d?.messages?.length) {
          setMessages([WELCOME, ...d.messages.map((m: any) => ({ role: m.role, text: m.text }))]);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, open]);

  const send = async (text: string) => {
    const msg = text.trim();
    if ((!msg && pendingImages.length === 0) || loading) return;
    const imgsForThisTurn = pendingImages;
    setMessages((prev) => [...prev, { role: 'user', text: msg, images: imgsForThisTurn }]);
    setInput('');
    setPendingImages([]);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId.current,
          message: msg || '(image uploaded)',
          images: imgsForThisTurn,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (data.support_phone) setSupportPhone(data.support_phone);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.reply,
          cta: data.cta,
          payment_url: data.payment_url,
          order_id: data.order_id,
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: "Sorry ji, I couldn't reach our team just now. Please tap the call button below to speak with us directly.",
          cta: 'call',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const maxImages = 5 - pendingImages.length;
    const arr = Array.from(files).slice(0, Math.max(maxImages, 0));
    const reads = arr.map(
      (f) =>
        new Promise<string>((resolve, reject) => {
          if (!f.type.startsWith('image/')) {
            reject(new Error('not image'));
            return;
          }
          if (f.size > 6 * 1024 * 1024) {
            reject(new Error('too large'));
            return;
          }
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = () => reject(r.error);
          r.readAsDataURL(f);
        }),
    );
    try {
      const results = await Promise.all(reads);
      setPendingImages((p) => [...p, ...results].slice(0, 5));
    } catch {
      // ignore unsupported files silently
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const callHref = `tel:${supportPhone.replace(/\s|-/g, '')}`;

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3" data-testid="ai-chat-container">
      {open && (
        <div
          data-testid="ai-chat-card"
          className="w-[350px] max-w-[calc(100vw-2rem)] h-[540px] max-h-[calc(100vh-6rem)] rounded-2xl bg-[#FFFDF9] border border-[#E0D5C8] overflow-hidden flex flex-col animate-fade-in"
          style={{ boxShadow: '0 16px 48px rgba(44,24,16,0.22)' }}
        >
          {/* Header */}
          <div className="bg-[#2C1810] px-4 py-3 flex items-center justify-between border-b border-[#C9A84C]/30">
            <div className="flex items-center gap-2 text-[#FAF6F0]">
              <div className="w-8 h-8 rounded-full bg-[#C9A84C] flex items-center justify-center">
                <Sparkles size={14} className="text-[#2C1810]" />
              </div>
              <div className="leading-tight">
                <div className="font-display text-sm font-500">Kalakriti Sakhi</div>
                <div className="font-body text-[10px] text-[#C9A84C]">AI concierge · online</div>
              </div>
            </div>
            <button
              data-testid="ai-chat-close"
              aria-label="close"
              onClick={() => setOpen(false)}
              className="text-[#FAF6F0]/70 hover:text-[#FAF6F0]"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF6F0]/60">
            {messages.map((m, i) => (
              <div
                key={`msg-${i}`}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                data-testid={`ai-msg-${m.role}-${i}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl font-body text-[13px] leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-[#2C1810] text-[#FAF6F0] rounded-br-md'
                      : 'bg-white text-[#3D3530] rounded-bl-md border border-[#E0D5C8]'
                  }`}
                >
                  {m.images && m.images.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {m.images.map((src, j) => (
                        <img
                          key={j}
                          src={src}
                          alt="uploaded"
                          data-testid={`ai-msg-img-${i}-${j}`}
                          className="w-20 h-20 object-cover rounded-md border border-[#C9A84C]/40"
                        />
                      ))}
                    </div>
                  )}
                  {m.text}
                  {m.cta === 'configure' && (
                    <Link
                      href="/portrait-configurator"
                      onClick={() => setOpen(false)}
                      data-testid="ai-cta-configure"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-500 bg-[#C9A84C] text-[#2C1810] px-3 py-1.5 rounded-sm hover:bg-[#A07830] hover:text-white transition-colors"
                    >
                      Start Configurator <ArrowRight size={12} />
                    </Link>
                  )}
                  {m.cta === 'pay' && m.payment_url && (
                    <Link
                      href={m.payment_url}
                      onClick={() => setOpen(false)}
                      data-testid="ai-cta-pay"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-500 bg-[#2C1810] text-[#C9A84C] px-3.5 py-2 rounded-sm hover:bg-[#3D3530] transition-colors"
                    >
                      <CreditCard size={12} /> Pay Now
                    </Link>
                  )}
                  {m.cta === 'call' && (
                    <a
                      href={callHref}
                      data-testid="ai-cta-call"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-500 bg-[#2C1810] text-[#FAF6F0] px-3 py-1.5 rounded-sm hover:bg-[#3D3530] transition-colors"
                    >
                      <Phone size={12} /> Call {supportPhone}
                    </a>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-[#E0D5C8] px-3.5 py-2.5 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-[#9C8878] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#9C8878] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#9C8878] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick prompts (shown only on initial state) */}
          {messages.length <= 1 && !loading && (
            <div className="px-4 pb-2 pt-1 flex flex-wrap gap-1.5 bg-[#FAF6F0]/60">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  data-testid={`ai-quick-prompt-${q.slice(0, 12)}`}
                  onClick={() => send(q)}
                  className="text-[11px] font-body text-[#3D3530] bg-white border border-[#E0D5C8] px-2.5 py-1 rounded-full hover:border-[#C9A84C] hover:text-[#2C1810] transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t border-[#E0D5C8] bg-white"
          >
            {pendingImages.length > 0 && (
              <div className="px-3 pt-2 flex flex-wrap gap-1.5" data-testid="ai-pending-images">
                {pendingImages.map((src, i) => (
                  <div key={i} className="relative">
                    <img src={src} alt="preview" className="w-14 h-14 object-cover rounded-md border border-[#C9A84C]/50" />
                    <button
                      type="button"
                      data-testid={`ai-remove-img-${i}`}
                      onClick={() =>
                        setPendingImages((p) => p.filter((_, idx) => idx !== i))
                      }
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#2C1810] text-[#FAF6F0] flex items-center justify-center"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="p-3 flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <button
                type="button"
                data-testid="ai-chat-attach"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || pendingImages.length >= 5}
                aria-label="Attach photos"
                className="w-9 h-9 rounded-full bg-[#FAF6F0] text-[#2C1810] border border-[#E0D5C8] flex items-center justify-center hover:border-[#C9A84C] disabled:opacity-40 transition-colors"
              >
                <Paperclip size={14} />
              </button>
              <input
                data-testid="ai-chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me about pricing, mediums, orders…"
                disabled={loading}
                className="flex-1 font-body text-[13px] text-[#2C1810] bg-[#FAF6F0] border border-[#E0D5C8] rounded-full px-4 py-2 focus:outline-none focus:border-[#C9A84C] disabled:opacity-60"
              />
              <button
                data-testid="ai-chat-send"
                type="submit"
                disabled={loading || (!input.trim() && pendingImages.length === 0)}
                className="w-9 h-9 rounded-full bg-[#C9A84C] text-[#2C1810] flex items-center justify-center hover:bg-[#A07830] hover:text-white disabled:opacity-40 transition-colors"
              >
                <Send size={14} />
              </button>
            </div>
          </form>
        </div>
      )}

      <button
        data-testid="ai-chat-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label="Chat with Kalakriti AI"
        className="relative w-14 h-14 rounded-full bg-[#C9A84C] text-[#2C1810] flex items-center justify-center shadow-[0_8px_24px_rgba(201,168,76,0.55)] hover:scale-110 transition-transform"
      >
        {open ? <X size={22} /> : <Sparkles size={22} />}
        {!open && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#2C1810] border-2 border-[#C9A84C] animate-pulse" />
        )}
      </button>
    </div>
  );
}
