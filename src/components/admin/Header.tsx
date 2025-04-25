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
    <header className="bg-blue-700 text-white py-4 shadow-md">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <h1 className="text-xl font-bold pl-20">Admin Panel</h1> {/* Geser ke kanan */}
        <div className="flex items-center space-x-4">
          <span className="text-sm">Selamat datang, Admin!</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
