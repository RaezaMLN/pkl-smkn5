'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/pembimbing/Sidebar';
import Navbar from '@/components/pembimbing/Navbar';
import Footer from '@/components/pembimbing/Footer';

export default function PembimbingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [pembimbing, setPembimbing] = useState<any | null>(null);

  const isAuthPage = pathname === '/pembimbing/login';

  // 🔥 FIX UTAMA: re-check saat route berubah
  useEffect(() => {
    const loginStatus = localStorage.getItem('isPembimbingLoggedIn');
    const pembimbingData = localStorage.getItem('pembimbing');

    if (loginStatus === 'true' && pembimbingData) {
      try {
        setPembimbing(JSON.parse(pembimbingData));
        setIsLoggedIn(true);
      } catch {
        setIsLoggedIn(false);
      }
    } else {
      setIsLoggedIn(false);
    }
  }, [pathname]); // ✅ INI KUNCI FIX

  // redirect kalau belum login
  useEffect(() => {
    if (isLoggedIn === false && !isAuthPage) {
      router.replace('/pembimbing/login');
    }
  }, [isLoggedIn, isAuthPage, router]);

  // loading state
  if (isLoggedIn === null) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  // halaman login (tanpa layout)
  if (isAuthPage) {
    return <>{children}</>;
  }

  // layout utama
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex flex-col flex-1">
        <Navbar pembimbing={pembimbing} />
        <main className="flex-1 p-4">{children}</main>
        <Footer />
      </div>
    </div>
  );
}