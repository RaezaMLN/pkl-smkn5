'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function Navbar() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newMode);
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow px-6 py-4 flex items-center justify-between">
      {/* Logo dan Brand */}
      <Link href="/">
      <div className="flex items-center gap-3">
        <Image
          src="/Sekolah.png"
          alt="Logo Sekolah"
          width={40}
          height={40}
          className="rounded-full"
        />
        <span className="font-semibold text-lg text-gray-800 dark:text-white">
          PKL SMKN 5 TELKOM BANDA ACEH
        </span>
      </div>
        </Link>
      {/* Right Menu */}
      <div className="flex items-center gap-4">
        <Link
          href="/siswa/login"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Login
        </Link>
        <Link
          href="/siswa/register"
          className="text-sm text-green-600 dark:text-green-400 hover:underline"
        >
          Daftar
        </Link>
        <button
          onClick={toggleDarkMode}
          className="ml-2 p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          {isDarkMode ? '🌙' : '☀️'}
        </button>
      </div>
    </nav>
  );
}
