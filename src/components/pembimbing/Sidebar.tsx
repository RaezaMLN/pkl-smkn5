'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Home, Users, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { label: 'Dashboard', href: '/pembimbing/dashboard', icon: <Home size={20} /> },
  { label: 'Siswa Bimbingan', href: '/pembimbing/siswa', icon: <Users size={20} /> },
  { label: 'Laporan', href: '/pembimbing/laporan', icon: <FileText size={20} /> },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <motion.aside
      animate={{ width: isOpen ? 240 : 72 }}
      className="h-screen bg-gradient-to-b from-blue-700 to-blue-800 text-white px-4 py-6 shadow-lg fixed md:relative z-40 flex flex-col"
    >
      <div className="flex items-center justify-between mb-8">
        {isOpen && (
          <h2 className="text-xl font-bold whitespace-nowrap">
            E-PKL Guru
          </h2>
        )}

        <button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <nav className="flex flex-col gap-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-blue-600"
          >
            {item.icon}
            {isOpen && <span className="text-sm">{item.label}</span>}
          </Link>
        ))}
      </nav>
    </motion.aside>
  );
}