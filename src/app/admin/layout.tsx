'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // gunakan hook dari App Router
import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import Footer from '@/components/admin/Footer';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isLoginPage, setIsLoginPage] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // State untuk mengatur sidebar
  const pathname = usePathname(); // lebih baik daripada window.location
  const router = useRouter();

  useEffect(() => {
    // Cek apakah path saat ini adalah halaman login
    setIsLoginPage(pathname === '/admin/login');
    setIsReady(true); // baru izinkan render

    // Validasi apakah admin sudah login
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn && !isLoginPage) {
      // Jika admin belum login dan bukan di halaman login, redirect ke halaman login
      router.push('/admin/login');
    }
  }, [pathname, router]);

  if (!isReady) {
    // Tahan render sampai pengecekan selesai
    return null;
  }

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen); // Fungsi untuk toggle sidebar

  if (isLoginPage) {
    return (
      <div className="flex min-h-screen bg-white">
        <main className="flex-grow container mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col">
        <Header />
        <main
          className={`flex-grow mx-auto px-4 py-6 transition-all duration-300 ${
            isSidebarOpen ? 'ml-64' : 'ml-16'
          }`} // Margin kiri berdasarkan status sidebar
        >
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
