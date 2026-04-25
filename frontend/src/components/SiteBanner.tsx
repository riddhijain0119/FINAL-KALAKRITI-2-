'use client';
import { useEffect, useState } from 'react';
import { fetchContent } from '@/lib/api';

interface Banner {
  enabled: boolean;
  text: string;
  link: string;
  bg_color: string;
  text_color: string;
  starts_at?: string;
  ends_at?: string;
}

function isVisible(b: Banner): boolean {
  if (!b?.enabled || !b?.text) return false;
  const now = Date.now();
  if (b.starts_at) { try { if (new Date(b.starts_at).getTime() > now) return false; } catch {} }
  if (b.ends_at)   { try { if (new Date(b.ends_at).getTime()   < now) return false; } catch {} }
  return true;
}

export default function SiteBanner() {
  const [b, setB] = useState<Banner | null>(null);
  useEffect(() => {
    fetchContent<Banner>('banner').then(setB).catch(() => {});
  }, []);

  if (!b || !isVisible(b)) return null;

  const inner = (
    <div
      className="w-full text-center py-2 px-4 text-xs sm:text-sm font-body font-500 tracking-wide"
      style={{ backgroundColor: b.bg_color || '#2C1810', color: b.text_color || '#E8C96A' }}
      data-testid="site-banner"
    >
      {b.text}
    </div>
  );

  if (b.link) {
    return (
      <a href={b.link} className="block hover:opacity-90 transition-opacity">
        {inner}
      </a>
    );
  }
  return inner;
}
