'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import bcrypt from 'bcryptjs';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { motion } from 'framer-motion';

interface AdminData {
  email: string;
  password: string;
  nama: string;
}

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const adminRef = collection(db, 'admin');
      const q = query(adminRef, where('email', '==', email));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError('Admin tidak ditemukan!');
        return;
      }

      const doc = snapshot.docs[0];
      const adminData = doc.data() as AdminData;
      const isPasswordValid = await bcrypt.compare(password, adminData.password);

      if (isPasswordValid) {
        const token = crypto.randomUUID();

        localStorage.setItem('userId', doc.id);
        localStorage.setItem('userEmail', adminData.email);
        localStorage.setItem('userName', adminData.nama);
        localStorage.setItem('token', token);
        localStorage.setItem('isLoggedIn', 'true');

        router.push('/admin/dashboard');
      } else {
        setError('Password salah!');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Gagal login. Silakan coba lagi.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="bg-white shadow-xl rounded-2xl px-8 py-10 w-full max-w-md"
      >
        <h1 className="text-3xl font-bold text-blue-700 text-center mb-6">Login Admin</h1>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Masukkan email admin"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Masukkan password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition duration-300"
          >
            Login
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
