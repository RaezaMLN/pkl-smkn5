'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Home, FilePlus2, Send, User } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { label: 'Dashboard', href: '/siswa/dashboard', icon: <Home size={20} /> },
  { label: 'Daftar PKL', href: '/siswa/pendaftaran', icon: <FilePlus2 size={20} /> },
  { label: 'Ajukan Tempat PKL', href: '/siswa/pengajuan', icon: <Send size={20} /> },
  { label: 'Tempat PKL', href: '/siswa/dudi', icon: <FilePlus2 size={20} /> },
  { label: 'Profil', href: '/siswa/profil', icon: <User size={20} /> },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <motion.aside
      animate={{ width: isOpen ? 240 : 72 }}
      className={`h-screen bg-gradient-to-b from-blue-700 to-blue-800 dark:from-gray-800 dark:to-gray-900 text-white px-4 py-6 shadow-lg transition-all duration-300 fixed md:relative z-40 flex flex-col`}
    >
      <div className="flex items-center justify-between mb-8">
        {isOpen && (
          <motion.h2
            initial={false}
            animate={{ opacity: isOpen ? 1 : 0 }}
            className="text-xl font-bold tracking-wide whitespace-nowrap"
          >
            E-PKL Siswa
          </motion.h2>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="ml-auto text-white p-1 rounded hover:bg-blue-600 dark:hover:bg-gray-700 transition"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <nav className="flex flex-col gap-3 mt-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-blue-600 dark:hover:bg-gray-700 transition-colors group"
          >
            <div>{item.icon}</div>
            {isOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium whitespace-nowrap"
              >
                {item.label}
              </motion.span>
            )}
          </Link>
        ))}
      </nav>
    </motion.aside>
  );
}
