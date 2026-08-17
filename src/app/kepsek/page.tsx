'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function KepsekPage() {
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn =
      localStorage.getItem(
        'isKepsekLoggedIn'
      );

    const kepsekLocal =
      localStorage.getItem(
        'kepsek'
      );

    /*
    |--------------------------------------------------------------------------
    | SUDAH LOGIN
    |--------------------------------------------------------------------------
    */

    if (
      isLoggedIn === 'true' &&
      kepsekLocal
    ) {
      try {
        const kepsek =
          JSON.parse(
            kepsekLocal
          );

        if (
          kepsek &&
          kepsek.id
        ) {
          router.replace(
            '/kepsek/dashboard'
          );

          return;
        }
      } catch {
        /*
        |--------------------------------------------------------------------------
        | SESSION RUSAK
        |--------------------------------------------------------------------------
        */

        localStorage.removeItem(
          'isKepsekLoggedIn'
        );

        localStorage.removeItem(
          'kepsek'
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | BELUM LOGIN
    |--------------------------------------------------------------------------
    */

    router.replace(
      '/kepsek/login'
    );
  }, [router]);

  /*
  |--------------------------------------------------------------------------
  | LOADING REDIRECT
  |--------------------------------------------------------------------------
  */

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
      <div className="text-center">

        <div
          className="
            w-10
            h-10
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
          Memuat E-PKL...
        </p>

      </div>
    </div>
  );
}