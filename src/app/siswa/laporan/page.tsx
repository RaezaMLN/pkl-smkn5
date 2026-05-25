'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export default function LaporanSiswaPage() {
  const [tanggal, setTanggal] = useState('');
  const [kegiatan, setKegiatan] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [loading, setLoading] = useState(false);

  // 🔥 convert link drive ke format image
  const convertDriveUrl = (url: string) => {
    if (!url.includes("drive.google.com")) return url;

    const match = url.match(/\/d\/(.*?)\//);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }

    return url;
  };

  const handleSubmit = async () => {
    const siswaLocal = localStorage.getItem('siswa');
    if (!siswaLocal) return;

    const siswa = JSON.parse(siswaLocal);

    if (!tanggal || !kegiatan) {
      alert('Tanggal dan kegiatan wajib diisi');
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, 'laporan'), {
        siswaId: siswa.id,
        tanggal,
        kegiatan,
        keterangan,
        foto: convertDriveUrl(fotoUrl), // 🔥 simpan foto
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      alert('Laporan berhasil dikirim');

      setTanggal('');
      setKegiatan('');
      setKeterangan('');
      setFotoUrl('');
    } catch (err) {
      console.error(err);
      alert('Gagal kirim laporan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">
        Input Laporan Harian
      </h1>

      <div className="space-y-4">

        <input
          type="date"
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          type="text"
          placeholder="Kegiatan"
          value={kegiatan}
          onChange={(e) => setKegiatan(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <textarea
          placeholder="Keterangan"
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          className="w-full border p-2 rounded"
        />

        {/* 🔥 INPUT FOTO */}
        <input
          type="text"
          placeholder="Link Foto (Google Drive)"
          value={fotoUrl}
          onChange={(e) => setFotoUrl(e.target.value)}
          className="w-full border p-2 rounded"
        />

        {/* 🔥 PREVIEW */}
        {fotoUrl && (
          <img
            src={convertDriveUrl(fotoUrl)}
            alt="Preview"
            className="w-full h-40 object-cover rounded border"
          />
        )}

        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? 'Menyimpan...' : 'Kirim Laporan'}
        </button>
      </div>
    </div>
  );
}