'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, Home, Users, FileText, ClipboardCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  {
    label: 'Dashboard',
    shortLabel: 'Dashboard',
    href: '/pembimbing/dashboard',
    icon: Home,
  },
  {
    label: 'Siswa Bimbingan',
    shortLabel: 'Siswa',
    href: '/pembimbing/siswa',
    icon: Users,
  },
  {
    label: 'Monitoring',
    shortLabel: 'Monitoring',
    href: '/pembimbing/monitoring',
    icon: ClipboardCheck,
  },
  {
    label: 'Laporan',
    shortLabel: 'Laporan',
    href: '/pembimbing/laporan',
    icon: FileText,
  },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/pembimbing/dashboard') {
      return pathname === '/pembimbing/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* ================================================================
          DESKTOP SIDEBAR (md ke atas)
      ================================================================= */}
      <motion.aside
        animate={{ width: isOpen ? 240 : 72 }}
        className="hidden md:flex flex-col h-screen sticky top-0 bg-gradient-to-b from-blue-700 to-blue-800 dark:from-gray-800 dark:to-gray-900 text-white px-4 py-6 shadow-lg transition-all duration-300 z-40"
      >
        <div className="flex items-center justify-between mb-8">
          {isOpen && (
            <h2 className="text-xl font-bold whitespace-nowrap">
              E-PKL Guru
            </h2>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="ml-auto text-white p-1 rounded hover:bg-blue-600 dark:hover:bg-gray-700 transition"
            aria-label="Toggle Sidebar"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                  active
                    ? 'bg-blue-600 dark:bg-blue-600 text-white shadow-sm'
                    : 'text-blue-100 hover:bg-blue-600/70 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex-shrink-0">
                  <Icon size={20} />
                </div>
                {isOpen && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </motion.aside>

      {/* ================================================================
          MOBILE STICKY BOTTOM NAVIGATION (< md)
      ================================================================= */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 px-3 py-1.5 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]"
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 ${
                  active
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium'
                }`}
              >
                <div
                  className={`p-1 rounded-lg transition-colors ${
                    active ? 'bg-blue-50 dark:bg-blue-950/60' : ''
                  }`}
                >
                  <Icon size={20} />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[70px]">
                  {item.shortLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}