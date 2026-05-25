'use client';

import { Bell, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar({ pembimbing }: { pembimbing?: any }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("isPembimbingLoggedIn");
    localStorage.removeItem("pembimbing");
    router.replace("/pembimbing/login");
  };

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex justify-between items-center bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-3 shadow-sm ms-16"
      >
        <div className="text-xl font-semibold text-blue-700 dark:text-white">
          Dashboard Pembimbing
        </div>

        <div className="flex items-center gap-4">
          {/* Nama pembimbing */}
          {pembimbing && (
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {pembimbing.nama}
            </span>
          )}

          <button className="text-gray-600 dark:text-gray-300 hover:text-blue-600">
            <Bell />
          </button>

          <button
            onClick={() => setShowConfirm(true)}
            className="text-gray-600 dark:text-gray-300 hover:text-red-500"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </motion.header>

      {/* Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg w-full max-w-sm text-center"
            >
              <h2 className="text-lg font-semibold mb-2">
                Keluar dari akun?
              </h2>
              <p className="mb-4 text-gray-600">
                Apakah yakin ingin logout?
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Batal
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  Ya, Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}