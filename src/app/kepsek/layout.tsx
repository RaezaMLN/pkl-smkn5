'use client';

import {
  ReactNode,
  useEffect,
  useState,
} from 'react';

import {
  usePathname,
  useRouter,
} from 'next/navigation';

import SidebarKepsek from '@/components/kepsek/SidebarKepsek';
import HeaderKepsek from '@/components/kepsek/HeaderKepsek';

interface KepsekLayoutProps {
  children: ReactNode;
}

export default function KepsekLayout({
  children,
}: KepsekLayoutProps) {
  const pathname =
    usePathname();

  const router =
    useRouter();

  /*
  |--------------------------------------------------------------------------
  | STATE AUTH
  |--------------------------------------------------------------------------
  */

  const [
    checkingAuth,
    setCheckingAuth,
  ] = useState(true);

  const [
    authorized,
    setAuthorized,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | LOGIN PAGE
  |--------------------------------------------------------------------------
  */

  const isLoginPage =
    pathname ===
    '/kepsek/login';

  /*
  |--------------------------------------------------------------------------
  | CHECK SESSION
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    /*
    |--------------------------------------------------------------------------
    | LOGIN TIDAK PERLU PROTEKSI
    |--------------------------------------------------------------------------
    */

    if (isLoginPage) {
      setAuthorized(true);
      setCheckingAuth(false);

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | PROTECTED PAGE
    |--------------------------------------------------------------------------
    */

    const isLoggedIn =
      localStorage.getItem(
        'isKepsekLoggedIn'
      );

    const kepsekLocal =
      localStorage.getItem(
        'kepsek'
      );

    if (
      isLoggedIn !== 'true' ||
      !kepsekLocal
    ) {
      setAuthorized(false);
      setCheckingAuth(false);

      router.replace(
        '/kepsek/login'
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDASI JSON
    |--------------------------------------------------------------------------
    */

    try {
      const parsed =
        JSON.parse(
          kepsekLocal
        );

      if (
        !parsed ||
        !parsed.id
      ) {
        throw new Error(
          'Session tidak valid'
        );
      }

      setAuthorized(true);
    } catch {
      localStorage.removeItem(
        'isKepsekLoggedIn'
      );

      localStorage.removeItem(
        'kepsek'
      );

      setAuthorized(false);

      router.replace(
        '/kepsek/login'
      );
    } finally {
      setCheckingAuth(false);
    }
  }, [
    isLoginPage,
    pathname,
    router,
  ]);

  /*
  |--------------------------------------------------------------------------
  | LOGIN PAGE
  |--------------------------------------------------------------------------
  */

  if (isLoginPage) {
    return <>{children}</>;
  }

  /*
  |--------------------------------------------------------------------------
  | CHECKING AUTH
  |--------------------------------------------------------------------------
  */

  if (checkingAuth) {
    return (
      <div
        className="
          min-h-screen
          flex
          items-center
          justify-center
          bg-gray-50
          dark:bg-gray-950
        "
      >

        <div
          className="
            text-center
          "
        >

          <div
            className="
              w-9
              h-9
              mx-auto
              border-4
              border-blue-200
              border-t-blue-600
              rounded-full
              animate-spin
            "
          />

          <p
            className="
              mt-4
              text-sm
              text-gray-500
              dark:text-gray-400
            "
          >
            Memeriksa akses...
          </p>

        </div>

      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | BELUM LOGIN
  |--------------------------------------------------------------------------
  */

  if (!authorized) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | PROTECTED LAYOUT
  |--------------------------------------------------------------------------
  */

  return (
    <div
      className="
        min-h-screen
        bg-gray-50
        dark:bg-gray-950
      "
    >

      <SidebarKepsek />

      <div
        className="
          min-h-screen
          lg:pl-64
        "
      >

        <HeaderKepsek />

        <main
          className="
            p-4
            md:p-6
            pb-24
            lg:pb-8
          "
        >
          {children}
        </main>

      </div>

    </div>
  );
}