// app/not-found.tsx
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center text-white">
      {/* Animated background using framer-motion */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-purple-800 via-indigo-600 to-blue-500 opacity-30"
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.1, 1], rotate: [0, 15, -15, 0] }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="z-10 text-center px-4">
        {/* <div className="flex justify-center mb-6">
          <Image
            src="/not-found.gif"
            alt="Not Found"
            width={300}
            height={300}
            className="rounded-lg shadow-lg"
          />
        </div> */}
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Oops! Halaman Tidak Ditemukan</h1>
        <p className="mb-6 text-lg text-gray-300">Sepertinya halaman yang kamu cari tidak tersedia.</p>
        <Link
          href="/siswa/dashboard"
          className="inline-block bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
