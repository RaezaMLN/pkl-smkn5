'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';

export default function DashboardPembimbing() {
  const [siswa, setSiswa] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pembimbingData = localStorage.getItem('pembimbing');
        if (!pembimbingData) return;

        const pembimbing = JSON.parse(pembimbingData);

        let siswaResult: any[] = [];

        // 🔥 ambil semua perusahaan
        const perusahaanSnap = await getDocs(collection(db, 'perusahaan'));

        for (const perDoc of perusahaanSnap.docs) {
          const perData = perDoc.data();

          // 🔥 hanya perusahaan milik pembimbing ini
          if (perData.pembimbingId === pembimbing.id) {
            const siswaIds = perData.siswa_terdaftar || [];

            for (const siswaId of siswaIds) {
              const siswaDoc = await getDoc(doc(db, 'siswa', siswaId));

              if (siswaDoc.exists()) {
                siswaResult.push({
                  id: siswaDoc.id,
                  ...siswaDoc.data(),
                  perusahaanNama: perData.nama,
                  statusPKL: 'Aktif',
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

  // 🔥 statistik (AKURAT)
  const total = siswa.length;
  const aktif = siswa.length;
  const belum = 0; // ❗ karena yang ditampilkan hanya yg sudah PKL

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">
        Dashboard Pembimbing
      </h1>

      {loading ? (
        <div className="flex justify-center py-10">Loading...</div>
      ) : (
        <>
          {/* Statistik */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-600 text-white p-4 rounded-xl shadow">
              <h2 className="text-sm">Total Siswa Bimbingan</h2>
              <p className="text-2xl font-bold">{total}</p>
            </div>

            <div className="bg-green-600 text-white p-4 rounded-xl shadow">
              <h2 className="text-sm">Siswa Aktif PKL</h2>
              <p className="text-2xl font-bold">{aktif}</p>
            </div>

            <div className="bg-yellow-500 text-white p-4 rounded-xl shadow">
              <h2 className="text-sm">Belum Dapat Tempat</h2>
              <p className="text-2xl font-bold">{belum}</p>
            </div>
          </div>

          {/* Tabel */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <h2 className="text-lg font-semibold mb-3">
              Siswa Bimbingan
            </h2>

            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700 text-left">
                    <th className="px-4 py-2">No</th>
                    <th className="px-4 py-2">Nama</th>
                    <th className="px-4 py-2">Kelas</th>
                    <th className="px-4 py-2">Perusahaan</th>
                    <th className="px-4 py-2">Status</th>
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
                            Aktif PKL
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-4">
                        Belum ada siswa bimbingan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}