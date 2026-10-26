'use client';

import React, { useState, useEffect } from 'react';

const Header = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fungsi untuk menangani logout
  const handleLogout = () => {
    // Hapus data yang berkaitan dengan login di localStorage
    localStorage.removeItem('user'); // Menghapus data user yang disimpan di localStorage
    localStorage.removeItem('isLoggedIn'); // Menghapus status login

    // Redirect ke halaman login setelah logout
    window.location.href = '/admin/login'; // Ganti dengan path login Anda
  };

  // Render loading spinner until mounted on the client
  if (!isClient) return null;

  return (
    <header className="bg-blue-700 text-white py-3.5 shadow-md sticky top-0 z-30">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <h1 className="text-lg sm:text-xl font-bold md:pl-20 pl-0">Admin Panel</h1>
        <div className="flex items-center space-x-3">
          <span className="hidden sm:inline text-sm text-blue-100">Selamat datang, Admin!</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-3.5 py-1.5 rounded-lg text-sm font-medium transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
