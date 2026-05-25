'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { User, Building2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DetailSiswaPage() {
  const { id } = useParams();
  const router = useRouter();

  const [siswa, setSiswa] = useState<any>(null);
  const [perusahaan, setPerusahaan] = useState<string>('Loading...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        // 🔥 ambil data siswa
        const siswaDoc = await getDoc(doc(db, 'siswa', id as string));

        if (!siswaDoc.exists()) return;

        const siswaData = siswaDoc.data();
        setSiswa(siswaData);

        // 🔥 cari perusahaan dari siswa_terdaftar
        const perusahaanSnap = await getDocs(collection(db, 'perusahaan'));

        let perusahaanNama = 'Belum PKL';

        for (const perDoc of perusahaanSnap.docs) {
          const perData = perDoc.data();
          const siswaList = perData.siswa_terdaftar || [];

          if (siswaList.includes(id)) {
            perusahaanNama = perData.nama;
            break;
          }
        }

        setPerusahaan(perusahaanNama);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (!siswa) {
    return <div className="text-center py-10">Data siswa tidak ditemukan</div>;
  }

  return (
    <div>
      {/* 🔙 Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 mb-4 text-blue-600 hover:underline"
      >
        <ArrowLeft size={16} />
        Kembali
      </button>

      {/* Header */}
      <h1 className="text-2xl font-semibold mb-6">
        Detail Siswa
      </h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid md:grid-cols-2 gap-6"
      >
        {/* 📌 Data Siswa */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
          <div className="flex items-center gap-2 mb-4">
            <User className="text-blue-600" />
            <h2 className="text-lg font-semibold">Data Siswa</h2>
          </div>

          <div className="space-y-2 text-sm">
            <p><strong>Nama:</strong> {siswa.nama}</p>
            <p><strong>NISN:</strong> {siswa.nisn}</p>
            <p><strong>Kelas:</strong> {siswa.kelas}</p>
            <p><strong>Jurusan:</strong> {siswa.jurusan}</p>
            <p><strong>Email:</strong> {siswa.email}</p>
            <p><strong>No HP:</strong> {siswa.hp}</p>
          </div>
        </div>

        {/* 🏢 Data PKL */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="text-green-600" />
            <h2 className="text-lg font-semibold">Data PKL</h2>
          </div>

          <div className="space-y-2 text-sm">
            <p><strong>Perusahaan:</strong> {perusahaan}</p>
            <p>
              <strong>Status:</strong>{' '}
              {perusahaan !== 'Belum PKL' ? (
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                  Aktif PKL
                </span>
              ) : (
                <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">
                  Belum PKL
                </span>
              )}
            </p>
          </div>
        </div>
      </motion.div>

      {/* 🔥 Placeholder Laporan (next step) */}
      <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-3">
          Laporan PKL
        </h2>

        <p className="text-sm text-gray-500">
          Belum ada laporan. (Fitur laporan akan dibuat selanjutnya)
        </p>
      </div>
    </div>
  );
}