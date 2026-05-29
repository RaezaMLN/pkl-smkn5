'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import Sidebar from '@/components/pembimbing/Sidebar';
import Navbar from '@/components/pembimbing/Navbar';
import Footer from '@/components/pembimbing/Footer';

interface Pembimbing {
  id?: string;
  [key: string]: any;
}

export default function PembimbingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pembimbing, setPembimbing] = useState<Pembimbing | null>(null);

  const isAuthPage = pathname.startsWith('/pembimbing/login');

  useEffect(() => {
    const checkAuth = () => {
      try {
        const loginStatus =
          localStorage.getItem('isPembimbingLoggedIn') === 'true';

        const pembimbingData = localStorage.getItem('pembimbing');

        if (loginStatus && pembimbingData) {
          const parsed = JSON.parse(pembimbingData);

          setPembimbing(parsed);
          setIsLoggedIn(true);
        } else {
          setPembimbing(null);
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);

        localStorage.removeItem('isPembimbingLoggedIn');
        localStorage.removeItem('pembimbing');

        setPembimbing(null);
        setIsLoggedIn(false);
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuth();

    window.addEventListener('storage', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, [pathname]);

  useEffect(() => {
    if (!authChecked) return;

    // Belum login
    if (!isLoggedIn && !isAuthPage) {
      router.replace('/pembimbing/login');
      return;
    }

    // Sudah login tapi buka halaman login
    if (isLoggedIn && isAuthPage) {
      router.replace('/pembimbing/dashboard');
    }
  }, [authChecked, isLoggedIn, isAuthPage, router]);

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  // Halaman login tanpa layout
  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex flex-col flex-1">
        <Navbar pembimbing={pembimbing} />
        <main className="flex-1 p-4">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}