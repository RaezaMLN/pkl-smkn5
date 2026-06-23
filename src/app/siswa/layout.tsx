'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/siswa/SideBar';
import Navbar from '@/components/siswa/Navbar';
import Footer from '@/components/siswa/Footer';

export default function SiswaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null); // null = belum dicek
  const [siswa, setSiswa] = useState<any | null>(null); // Menyimpan data siswa
  
  const isAuthPage = pathname === '/siswa/login' || pathname === '/siswa/register';

  useEffect(() => {
    // Jalankan hanya di client
    const loginStatus = localStorage.getItem('isLoggedIn');
    const siswaData = localStorage.getItem('siswa');

    if (loginStatus === 'true' && siswaData) {
      setSiswa(JSON.parse(siswaData)); // Menyimpan data siswa
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn === false && !isAuthPage) {
      router.replace('/siswa/login');
    }
  }, [isLoggedIn, isAuthPage, router]);

  // Tunggu validasi login selesai
  if (isLoggedIn === null) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  // Halaman login dan register tanpa layout
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Layout siswa (sudah login)
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Navbar />
        <main className="flex-1 p-4">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
