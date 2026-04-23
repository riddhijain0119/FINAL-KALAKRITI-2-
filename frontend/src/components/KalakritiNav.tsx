'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { Menu, X, Palette, FolderOpen, Home, Images } from 'lucide-react';

const navItems = [
  { label: 'Home', href: '/home-page', icon: Home },
  { label: 'Gallery', href: '/gallery', icon: Images },
  { label: 'Create Portrait', href: '/portrait-configurator', icon: Palette },
  { label: 'My Projects', href: '/project-review-portal', icon: FolderOpen },
];

export default function KalakritiNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#FAF6F0]/95 backdrop-blur-md shadow-luxury border-b border-warm-border'
            : 'bg-[#FAF6F0]/80 backdrop-blur-sm'
        }`}
      >
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/home-page" className="flex items-center gap-3 group">
            <AppLogo size={56} />
            <span className="font-display text-2xl font-600 text-[#2C1810] tracking-tight hidden sm:block">
              Kalakriti
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems?.map((item) => {
              const isActive = pathname === item?.href;
              return (
                <Link
                  key={`nav-${item?.href}`}
                  href={item?.href}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm font-body font-medium rounded-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-[#2C1810] text-[#FAF6F0]'
                      : 'text-[#2C1810] hover:bg-[#2C1810]/10'
                  }`}
                >
                  <item.icon size={15} />
                  {item?.label}
                </Link>
              );
            })}
          </nav>

          {/* CTA + Mobile Toggle */}
          <div className="flex items-center gap-3">
            <Link
              href="/portrait-configurator"
              className="hidden md:inline-flex btn-gold text-xs px-4 py-2"
            >
              Start Your Portrait
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-sm text-[#2C1810] hover:bg-[#2C1810]/5 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>
      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-[#2C1810]/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute top-0 right-0 w-72 h-full bg-[#FAF6F0] shadow-luxury-lg flex flex-col pt-16">
            <nav className="flex flex-col p-4 gap-1">
              {navItems?.map((item) => {
                const isActive = pathname === item?.href;
                return (
                  <Link
                    key={`mobile-nav-${item?.href}`}
                    href={item?.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-body font-medium rounded-sm transition-all duration-150 ${
                      isActive
                        ? 'bg-[#2C1810] text-[#FAF6F0]'
                        : 'text-[#3D3530] hover:bg-[#2C1810]/8'
                    }`}
                  >
                    <item.icon size={16} />
                    {item?.label}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 mt-auto border-t border-warm-border">
              <Link
                href="/portrait-configurator"
                onClick={() => setMobileOpen(false)}
                className="btn-gold w-full justify-center"
              >
                Start Your Portrait
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}