'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, LogIn, AlertCircle } from 'lucide-react';

export default function LoginPembimbing() {
  const router = useRouter();

  const [nik, setNik] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState<{
    type: 'error' | 'success';
    message: string;
  } | null>(null);

  const handleLogin = async () => {
    if (!nik || !password) {
      setToast({
        type: 'error',
        message: 'NIK dan password harus diisi',
      });
      return;
    }

    setLoading(true);

    try {
      const q = query(
        collection(db, 'pembimbing'),
        where('nik', '==', nik),
        where('password', '==', password)
      );

      const snap = await getDocs(q);

      if (!snap.empty) {
        const docData = snap.docs[0];

        localStorage.setItem('isPembimbingLoggedIn', 'true');
        localStorage.setItem(
          'pembimbing',
          JSON.stringify({
            id: docData.id,
            ...docData.data(),
          })
        );

        setToast({
          type: 'success',
          message: 'Login berhasil!',
        });

        setTimeout(() => {
          router.push('/pembimbing/dashboard');
        }, 800);
      } else {
        setToast({
          type: 'error',
          message: 'NIK atau password salah',
        });
      }
    } catch (err) {
      console.error(err);
      setToast({
        type: 'error',
        message: 'Terjadi kesalahan saat login',
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">

      {/* TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className={`fixed top-0 left-1/2 -translate-x-1/2 px-5 py-3 rounded-lg shadow-lg flex items-center gap-2 text-white z-50 ${
              toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CARD */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 w-full max-w-md"
      >
        {/* HEADER */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Login Pembimbing
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Masuk ke dashboard pembimbing
          </p>
        </div>

        {/* INPUT NIK */}
        <div className="mb-4">
          <label className="text-sm text-gray-600 dark:text-gray-300">
            NIK (Username)
          </label>
          <div className="flex items-center border rounded-lg px-3 py-2 mt-1 focus-within:ring-2 focus-within:ring-blue-500">
            <User className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="text"
              value={nik}
              onChange={(e) => setNik(e.target.value)}
              className="w-full outline-none bg-transparent text-sm"
              placeholder="Masukkan NIK"
            />
          </div>
        </div>

        {/* INPUT PASSWORD */}
        <div className="mb-6">
          <label className="text-sm text-gray-600 dark:text-gray-300">
            Password
          </label>
          <div className="flex items-center border rounded-lg px-3 py-2 mt-1 focus-within:ring-2 focus-within:ring-blue-500">
            <Lock className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full outline-none bg-transparent text-sm"
              placeholder="Masukkan password"
            />
          </div>
        </div>

        {/* BUTTON */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition disabled:opacity-50"
        >
          <LogIn className="w-4 h-4" />
          {loading ? 'Memproses...' : 'Login'}
        </motion.button>
      </motion.div>
    </div>
  );
}