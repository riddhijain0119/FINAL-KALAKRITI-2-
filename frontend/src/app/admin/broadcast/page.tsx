'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Me } from '@/lib/api';
import AppLogo from '@/components/ui/AppLogo';
import { ArrowLeft, Send, Users, Mail, History as HistoryIcon, AlertTriangle } from 'lucide-react';

interface AudienceCounts { all: number; paid: number; delivered: number }
interface BroadcastEntry {
  broadcast_id: string;
  subject: string;
  audience: string;
  recipient_count: number;
  sent_count: number;
  sent_by: string;
  sent_at: string;
}

const AUDIENCE_LABELS: Record<string, string> = {
  all: 'All customers',
  paid: 'Paid customers (any time)',
  delivered: 'Customers with delivered orders',
};

export default function AdminBroadcastPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [audience, setAudience] = useState<'all'|'paid'|'delivered'>('all');
  const [counts, setCounts] = useState<AudienceCounts | null>(null);
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('<p>Hi there,</p>\n<p>Use code <strong>DIWALI20</strong> to get 20% off your next portrait at <a href="https://kalakritishop.in">Kalakriti</a>.</p>\n<p>— Team Kalakriti</p>');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string>('');
  const [history, setHistory] = useState<BroadcastEntry[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const u = await api<Me>('/api/auth/me');
        if (u.role !== 'admin') { router.replace('/my-orders'); return; }
        setMe(u);
        const [c, h] = await Promise.all([
          api<AudienceCounts>('/api/admin/broadcast/audience'),
          api<BroadcastEntry[]>('/api/admin/broadcast/history'),
        ]);
        setCounts(c); setHistory(h);
      } catch { router.replace('/login'); }
      finally { setLoading(false); }
    })();
  }, [router]);

  if (loading) return <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center text-[#2C1810]">Loading…</div>;

  const send = async (dryRun: boolean) => {
    if (!subject.trim() || !html.trim()) { setResult('Subject and message body are required'); return; }
    if (!dryRun && !confirm(`Send to ${counts?.[audience] ?? '?'} customers? This cannot be undone.`)) return;
    setSending(true); setResult('');
    try {
      const r: any = await api('/api/admin/broadcast/send', {
        method: 'POST',
        body: JSON.stringify({ audience, subject, html, dry_run: dryRun }),
      });
      if (dryRun) setResult(`Preview: would send to ${r.recipients} recipient(s). Sample: ${(r.sample || []).join(', ')}`);
      else {
        setResult(`✓ Sent to ${r.sent}/${r.recipients} recipients (broadcast ${r.broadcast_id})`);
        setHistory(await api<BroadcastEntry[]>('/api/admin/broadcast/history'));
      }
    } catch (e: any) { setResult('Failed: ' + (e?.message || 'unknown')); }
    finally { setSending(false); }
  };

  const recipientCount = counts?.[audience] ?? 0;

  return (
    <main className="min-h-screen bg-[#FAF6F0]">
      <header className="bg-[#2C1810] text-[#FAF6F0] px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin" className="flex items-center gap-2">
          <ArrowLeft size={16} className="text-[#E8C96A]" />
          <AppLogo size={32} className="bg-[#FAF6F0] rounded-full p-1" />
          <div>
            <p className="font-display text-xl leading-none">Kalakriti</p>
            <p className="text-xs text-[#E8C96A] tracking-widest uppercase">Email Broadcast</p>
          </div>
        </Link>
        <span className="text-sm text-[#E0D5C8]">{me?.email}</span>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#FFFDF9] border border-[#E0D5C8] rounded-2xl p-6 shadow-luxury">
            <h2 className="font-display text-3xl text-[#2C1810] mb-2">New Broadcast</h2>
            <p className="text-sm text-[#9C8878] mb-6">Send a one-off email to customers based on their order history. Uses your Resend integration.</p>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-body text-[#9C8878] uppercase tracking-widest mb-2">Audience</label>
                <div className="grid sm:grid-cols-3 gap-2" data-testid="broadcast-audience">
                  {(['all', 'paid', 'delivered'] as const).map((k) => (
                    <button key={k} onClick={() => setAudience(k)} data-testid={`audience-${k}`}
                      className={`p-3 rounded-sm border text-left ${audience === k ? 'border-[#C9A84C] bg-[#C9A84C]/10' : 'border-[#E0D5C8] bg-[#FAF6F0]/40'}`}>
                      <p className="font-display text-sm text-[#2C1810]">{AUDIENCE_LABELS[k]}</p>
                      <p className="text-xs text-[#9C8878] mt-0.5">{counts?.[k] ?? 0} recipients</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-body text-[#9C8878] uppercase tracking-widest mb-2">Subject</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="🎉 20% off all portraits this Diwali"
                  className="w-full px-3 py-2 text-sm rounded-sm border border-[#E0D5C8] bg-white" data-testid="broadcast-subject"/>
              </div>

              <div>
                <label className="block text-xs font-body text-[#9C8878] uppercase tracking-widest mb-2">Message body (HTML supported)</label>
                <textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={10}
                  className="w-full px-3 py-2 text-sm rounded-sm border border-[#E0D5C8] bg-white font-mono leading-relaxed" data-testid="broadcast-html"/>
                <p className="text-xs text-[#9C8878] mt-1">Use HTML tags like &lt;p&gt;, &lt;strong&gt;, &lt;a href=&quot;…&quot;&gt; for formatting.</p>
              </div>

              <div>
                <p className="text-xs font-body text-[#9C8878] uppercase tracking-widest mb-2">Live preview</p>
                <div className="bg-white border border-[#E0D5C8] rounded-sm p-4">
                  <p className="font-body text-xs text-[#9C8878] mb-2">From: kalakriti &lt;onboarding@resend.dev&gt;</p>
                  <p className="font-display text-lg text-[#2C1810] mb-3">{subject || '(no subject)'}</p>
                  <div className="prose prose-sm max-w-none text-[#3D3530]" dangerouslySetInnerHTML={{ __html: html || '<em>Empty body</em>' }}/>
                </div>
              </div>

              {result && (
                <div className="rounded-sm px-4 py-3 text-sm bg-[#FAF6F0] border border-[#E0D5C8]" data-testid="broadcast-result">
                  {result}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button onClick={() => send(true)} disabled={sending} data-testid="broadcast-preview-btn"
                  className="px-5 py-2.5 rounded-sm border border-[#E0D5C8] text-sm font-body inline-flex items-center gap-1.5 hover:bg-[#FAF6F0] disabled:opacity-60">
                  <Users size={14}/> Preview audience
                </button>
                <button onClick={() => send(false)} disabled={sending || recipientCount === 0} data-testid="broadcast-send-btn"
                  className="px-5 py-2.5 rounded-sm bg-[#C9A84C] text-[#2C1810] hover:bg-[#E8C96A] text-sm font-body font-600 inline-flex items-center gap-1.5 disabled:opacity-60">
                  <Send size={14}/> {sending ? 'Sending…' : `Send to ${recipientCount} customer${recipientCount === 1 ? '' : 's'}`}
                </button>
              </div>

              <div className="rounded-sm bg-amber-50 border border-amber-200 p-3 flex items-start gap-2 text-xs text-amber-900">
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                <span>Once sent, broadcasts cannot be unsent. Always click <strong>Preview audience</strong> first.</span>
              </div>
            </div>
          </div>
        </div>

        {/* History sidebar */}
        <aside className="bg-[#FFFDF9] border border-[#E0D5C8] rounded-2xl p-5 shadow-luxury h-fit sticky top-6">
          <div className="flex items-center gap-2 mb-3">
            <HistoryIcon size={16} className="text-[#9C8878]" />
            <h3 className="font-display text-lg text-[#2C1810]">Recent broadcasts</h3>
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-[#9C8878]" data-testid="broadcast-history-empty">No broadcasts sent yet.</p>
          ) : (
            <ul className="space-y-3 text-sm" data-testid="broadcast-history">
              {history.map((h) => (
                <li key={h.broadcast_id} className="border-b border-[#E0D5C8] pb-2 last:border-0">
                  <p className="font-body font-600 text-[#2C1810] line-clamp-1">{h.subject}</p>
                  <p className="text-xs text-[#9C8878] mt-0.5">
                    {AUDIENCE_LABELS[h.audience] || h.audience} · {h.sent_count}/{h.recipient_count} sent
                  </p>
                  <p className="text-[10px] text-[#9C8878] mt-0.5">{new Date(h.sent_at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </main>
  );
}
