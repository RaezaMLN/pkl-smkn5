'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Users, Eye } from 'lucide-react';

export default function SiswaBimbinganPage() {
  const router = useRouter();
  const [siswa, setSiswa] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if still logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isPembimbingLoggedIn');
    if (isLoggedIn !== 'true') {
      router.replace('/pembimbing/login');
    }
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pembimbingData = localStorage.getItem('pembimbing');
        if (!pembimbingData) return;

        const pembimbing = JSON.parse(pembimbingData);

        let siswaResult: any[] = [];

        const perusahaanSnap = await getDocs(collection(db, 'perusahaan'));

        for (const perDoc of perusahaanSnap.docs) {
          const perData = perDoc.data();

          if (perData.pembimbingId === pembimbing.id) {
            const siswaIds = perData.siswa_terdaftar || [];

            for (const siswaId of siswaIds) {
              const siswaDoc = await getDoc(doc(db, 'siswa', siswaId));

              if (siswaDoc.exists()) {
                siswaResult.push({
                  id: siswaDoc.id,
                  ...siswaDoc.data(),
                  perusahaanNama: perData.nama,
                  status: 'Aktif PKL',
                });
              }
            }
          }
        }

        setSiswa(siswaResult);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Users className="text-blue-600" />
        <h1 className="text-2xl font-semibold">Siswa Bimbingan</h1>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow p-4"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 text-left">
                  <th className="px-4 py-2">No</th>
                  <th className="px-4 py-2">Nama</th>
                  <th className="px-4 py-2">Kelas</th>
                  <th className="px-4 py-2">Perusahaan</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-center">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {siswa.length > 0 ? (
                  siswa.map((s, i) => (
                    <tr key={s.id} className="border-t">
                      <td className="px-4 py-2">{i + 1}</td>
                      <td className="px-4 py-2">{s.nama}</td>
                      <td className="px-4 py-2">{s.kelas}</td>
                      <td className="px-4 py-2">
                        {s.perusahaanNama}
                      </td>
                      <td className="px-4 py-2">
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm">
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() =>
                            router.push(`/pembimbing/siswa/${s.id}`)
                          }
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <Eye size={16} />
                          Lihat
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      Tidak ada siswa bimbingan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}