'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { motion } from 'framer-motion';
import { User, Building2, ArrowLeft } from 'lucide-react';

export default function DetailSiswaPage() {
  const { id } = useParams();
  const router = useRouter();

  const [siswa, setSiswa] = useState<any>(null);
  const [perusahaan, setPerusahaan] = useState<string>('Loading...');
  const [laporan, setLaporan] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        // 🔥 ambil siswa
        const siswaDoc = await getDoc(doc(db, 'siswa', id as string));

        if (!siswaDoc.exists()) return;

        setSiswa(siswaDoc.data());

        // 🔥 cari perusahaan
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

        // 🔥 ambil laporan
        const q = query(
          collection(db, 'laporan'),
          where('siswaId', '==', id)
        );

        const laporanSnap = await getDocs(q);

        const laporanData = laporanSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setLaporan(laporanData);

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

      <h1 className="text-2xl font-semibold mb-6">
        Detail Siswa
      </h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid md:grid-cols-2 gap-6"
      >
        {/* DATA SISWA */}
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center gap-2 mb-4">
            <User className="text-blue-600" />
            <h2 className="text-lg font-semibold">Data Siswa</h2>
          </div>

          <div className="space-y-2 text-sm">
            <p><strong>Nama:</strong> {siswa.nama}</p>
            <p><strong>Kelas:</strong> {siswa.kelas}</p>
            <p><strong>Email:</strong> {siswa.email}</p>
          </div>
        </div>

        {/* DATA PKL */}
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="text-green-600" />
            <h2 className="text-lg font-semibold">Data PKL</h2>
          </div>

          <p><strong>Perusahaan:</strong> {perusahaan}</p>

          <p className="mt-2">
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
      </motion.div>

      {/* 🔥 LAPORAN */}
      <div className="mt-8 bg-white p-6 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-4">
          Laporan Harian
        </h2>

        {laporan.length > 0 ? (
          <div className="space-y-4">
            {laporan.map((l) => (
              <div key={l.id} className="border rounded-lg p-3">

                <div className="flex justify-between">
                  <p className="font-semibold">{l.tanggal}</p>
                  <span className="text-xs bg-yellow-100 px-2 py-1 rounded">
                    {l.status}
                  </span>
                </div>

                <p className="mt-1">{l.kegiatan}</p>
                <p className="text-sm text-gray-500">{l.keterangan}</p>

                {/* 🔥 LINK FOTO (FINAL) */}
                {l.foto && (
                  <div className="mt-2">
                    <a
                      href={l.foto}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700 transition"
                    >
                      Lihat Foto
                    </a>
                  </div>
                )}

              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Belum ada laporan
          </p>
        )}
      </div>
    </div>
  );
}