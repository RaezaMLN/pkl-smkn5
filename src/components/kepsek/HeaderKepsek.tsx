'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  GraduationCap,
  UserRound,
} from 'lucide-react';

interface KepsekData {
  id?: string;
  nama?: string;
  username?: string;
}

export default function HeaderKepsek() {
  const [
    kepsek,
    setKepsek,
  ] =
    useState<KepsekData | null>(
      null
    );

  /*
  |--------------------------------------------------------------------------
  | AMBIL DATA KEPSEK
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    try {
      const local =
        localStorage.getItem(
          'kepsek'
        );

      if (local) {
        setKepsek(
          JSON.parse(local)
        );
      }
    } catch (err) {
      console.error(
        'Gagal membaca data Kepala Sekolah:',
        err
      );
    }
  }, []);

  return (
    <header
      className="
        sticky
        top-0
        z-30
        h-20
        flex
        items-center
        justify-between
        px-4
        md:px-6
        bg-white/95
        dark:bg-gray-900/95
        backdrop-blur
        border-b
        border-gray-200
        dark:border-gray-800
      "
    >

      {/* LEFT */}

      <div>

        <div
          className="
            flex
            items-center
            gap-2
            lg:hidden
          "
        >
          <GraduationCap
            size={22}
            className="
              text-blue-600
            "
          />

          <span
            className="
              font-bold
              text-gray-900
              dark:text-white
            "
          >
            E-PKL
          </span>
        </div>

        <div
          className="
            hidden
            lg:block
          "
        >

          <p
            className="
              text-sm
              text-gray-500
              dark:text-gray-400
            "
          >
            Sistem Monitoring Praktik Kerja Lapangan
          </p>

        </div>

      </div>

      {/* USER */}

      <div
        className="
          flex
          items-center
          gap-3
        "
      >

        <div
          className="
            hidden
            sm:block
            text-right
          "
        >

          <p
            className="
              text-sm
              font-semibold
              text-gray-900
              dark:text-white
            "
          >
            {kepsek?.nama ||
              'Kepala Sekolah'}
          </p>

          <p
            className="
              text-xs
              text-gray-500
              dark:text-gray-400
            "
          >
            Kepala Sekolah
          </p>

        </div>

        <div
          className="
            w-10
            h-10
            flex
            items-center
            justify-center
            rounded-full
            bg-blue-100
            dark:bg-blue-950
            text-blue-600
            dark:text-blue-300
          "
        >
          <UserRound
            size={20}
          />
        </div>

      </div>

    </header>
  );
}