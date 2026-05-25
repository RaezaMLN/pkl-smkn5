'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Lock, LogIn } from 'lucide-react';

export default function LoginPembimbing() {
  const router = useRouter();

  const [nik, setNik] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
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

        router.push('/pembimbing/dashboard');
      } else {
        alert('NIK atau password salah');
      }
    } catch (err) {
      console.error(err);
      alert('Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Login Pembimbing
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Masuk ke dashboard pembimbing
          </p>
        </div>

        {/* Input NIK */}
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

        {/* Input Password */}
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

        {/* Button */}
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