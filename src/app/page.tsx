'use client';

import Image from "next/image";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6 sm:p-10 bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 font-sans">
      {/* Header */}
      <motion.header
  initial={{ opacity: 0, y: -50 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8 }}
  className="flex flex-col items-center gap-4 mt-10"
>
<div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-4">
  {/* Logo kiri */}
  <Image
    src="/pplg.png"
    alt="Logo PPLG"
    className="w-16 sm:w-[90px] h-auto object-contain"
    width={90}
    height={90}
  />
  <Image
    src="/tjkt.png"
    alt="Logo TJKT"
    className="w-20 sm:w-[110px] h-auto object-contain"
    width={110}
    height={110}
  />

  {/* Logo utama */}
  <Image
    src="/sekolah.png"
    alt="Logo SMKN 5"
    className="w-24 sm:w-[120px] h-auto object-contain"
    width={120}
    height={120}
  />

  {/* Logo kanan */}
  <Image
    src="/pf.png"
    alt="Logo PF"
    className="w-16 sm:w-[90px] h-auto object-contain"
    width={90}
    height={90}
  />
  <Image
    src="/tjat.png"
    alt="Logo TJAT"
    className="w-16 sm:w-[90px] h-auto object-contain"
    width={90}
    height={90}
  />
</div>

  <h1 className="text-4xl sm:text-5xl font-bold text-center text-blue-800 dark:text-white">
    E-PKL SMKN 5 Telkom Banda Aceh
  </h1>
  <p className="text-center text-gray-700 dark:text-gray-300 max-w-xl">
    Sistem informasi Praktik Kerja Lapangan berbasis digital untuk siswa, perusahaan, dan admin di SMKN 5 Telkom Banda Aceh.
  </p>
</motion.header>


      {/* Content */}
      <motion.main
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="flex flex-col items-center gap-6 text-center mt-16"
      >
        <div className="text-xl font-medium text-blue-700 dark:text-blue-300">Selamat Datang di Portal E-PKL</div>
        <div className="flex gap-4 flex-wrap justify-center">
          <a
            href="/siswa/login"
            className="bg-blue-600 text-white px-6 py-3 rounded-full text-sm font-semibold shadow hover:bg-blue-700 transition-transform transform hover:scale-105"
          >
            Masuk
          </a>
          <a
            href="siswa/register"
            className="bg-green-600 text-white px-6 py-3 rounded-full text-sm font-semibold shadow hover:bg-green-700 transition-transform transform hover:scale-105"
          >
            Daftar
          </a>
         
        </div>
      </motion.main>

      {/* Footer */}
      <footer className="mt-16 mb-6 text-sm text-gray-500 dark:text-gray-400 text-center">
        &copy; {new Date().getFullYear()} SMKN 5 Telkom Banda Aceh. All rights reserved.
      </footer>
    </div>
  );
}
