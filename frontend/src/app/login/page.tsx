'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import { LogIn, ShieldCheck } from 'lucide-react';

/**
 * Handles Emergent Google Auth login for BOTH admin and customer.
 * Admin status is determined by email allowlist server-side (ADMIN_EMAILS env).
 *
 * REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
 */
export default function LoginPage() {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // Synchronous-ish check: if arriving with #session_id=, exchange it via backend.
  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (hash.includes('session_id=')) {
      const sid = new URLSearchParams(hash.replace(/^#/, '')).get('session_id');
      if (sid) {
        setProcessing(true);
        (async () => {
          try {
            const me: any = await api('/api/auth/session', {
              method: 'POST',
              headers: { 'X-Session-ID': sid },
            });
            // Clear hash then route based on role
            window.history.replaceState({}, '', window.location.pathname);
            router.replace(me.role === 'admin' ? '/admin' : '/my-orders');
          } catch (e: any) {
            setError(e?.message || 'Authentication failed');
            setProcessing(false);
          }
        })();
      }
    } else {
      // If already logged in, redirect
      api('/api/auth/me').then((me: any) => {
        router.replace(me.role === 'admin' ? '/admin' : '/my-orders');
      }).catch(() => {});
    }
  }, [router]);

  const startLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/login';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <main className="min-h-screen bg-[#FAF6F0] flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-[#FFFDF9] border border-[#E0D5C8] rounded-2xl p-10 shadow-luxury text-center">
        <Link href="/home-page" className="flex items-center gap-2 justify-center mb-6">
          <AppLogo size={56} />
        </Link>
        <h1 className="font-display text-3xl text-[#2C1810] mb-2">Sign in to Kalakriti</h1>
        <p className="text-sm text-[#9C8878] mb-8 font-body">Track orders, manage projects, or access the admin console.</p>

        {processing && <p className="text-sm text-[#C9A84C] mb-4" data-testid="login-processing">Completing sign in…</p>}
        {error && <p className="text-sm text-red-600 mb-4" data-testid="login-error">{error}</p>}

        <button onClick={startLogin} data-testid="login-google-btn" className="w-full flex items-center justify-center gap-3 bg-[#2C1810] text-[#FAF6F0] font-body font-medium py-3 rounded-sm hover:bg-[#1A0E09] transition-colors">
          <LogIn size={18} /> Continue with Google
        </button>
        <p className="mt-6 text-xs text-[#9C8878] flex items-center justify-center gap-1.5">
          <ShieldCheck size={12} /> Secure OAuth by Google · 7-day session
        </p>
      </div>
    </main>
  );
}
