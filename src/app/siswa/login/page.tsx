'use client';

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { query, where, getDocs, collection } from "firebase/firestore";

export default function SiswaLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setErrorMessage("Email dan Password harus diisi.");
      return;
    }

    try {
      const q = query(
        collection(db, "siswa"),
        where("email", "==", email),
        where("password", "==", password)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userId = userDoc.id;
        const userData = userDoc.data();

        const siswaData = {
          id: userId,
          ...userData,
        };

        // Simpan seluruh data siswa ke localStorage
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("siswa", JSON.stringify(siswaData));

        // Redirect ke dashboard siswa
        window.location.href = "/siswa/dashboard";
      } else {
        setErrorMessage("Email atau password salah.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("Terjadi kesalahan saat login.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-6">
          <Image src="/Sekolah.png" alt="Logo SMKN 5" width={80} height={80} />
          <h1 className="text-2xl font-bold text-blue-800 dark:text-white mt-2">
            Login Siswa
          </h1>
        </div>

        {errorMessage && (
          <div className="text-red-600 text-center mb-4">{errorMessage}</div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Masuk
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
          Belum punya akun?{" "}
          <Link
            href="/siswa/register"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            Daftar di sini
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
