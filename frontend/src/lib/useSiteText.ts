'use client';
import { useEffect, useState } from 'react';

/**
 * Site-wide editable text from /admin/listings → Site Text.
 * Components call useSiteText() and read t['hero_headline'] etc.
 * Falls back to the default value passed if CMS hasn't loaded yet
 * or the key is missing — so the UI never shows blanks.
 */
let _cache: Record<string, string> | null = null;
let _inflight: Promise<Record<string, string>> | null = null;

async function fetchSiteText(): Promise<Record<string, string>> {
  if (_cache) return _cache;
  if (!_inflight) {
    const base = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    _inflight = fetch(`${base}/api/content/site_text`)
      .then((r) => (r.ok ? r.json() : { data: {} }))
      .then((j) => {
        _cache = (j?.data as Record<string, string>) || {};
        return _cache;
      })
      .catch(() => {
        _cache = {};
        return _cache;
      });
  }
  return _inflight;
}

export function useSiteText() {
  const [text, setText] = useState<Record<string, string>>(_cache || {});
  useEffect(() => {
    fetchSiteText().then((d) => setText({ ...d }));
  }, []);
  return (key: string, fallback: string = '') => text[key] ?? fallback;
}
