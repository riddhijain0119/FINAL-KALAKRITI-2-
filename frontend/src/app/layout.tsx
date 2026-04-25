import React from 'react';
import type { Metadata, Viewport } from 'next';
import '../styles/tailwind.css';
import AIChatBot from '@/components/AIChatBot';
import SiteBanner from '@/components/SiteBanner';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Kalakriti — Transform Your Memories into Museum-Grade Art',
  description: 'Kalakriti turns your reference photos into handcrafted watercolor, pencil, and oil portraits with transparent pricing, live configurator, and structured artist review.',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-body bg-rice-paper antialiased"><SiteBanner />{children}
<AIChatBot />
</body>
    </html>
  );
}