'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default function DashboardPembimbing() {
  const [siswa, setSiswa] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSiswa = async () => {
      try {
        const pembimbingData = localStorage.getItem('pembimbing');

        if (!pembimbingData) return;

        const pembimbing = JSON.parse(pembimbingData);

        const q = query(
          collection(db, 'siswa'),
          where('pembimbingId', '==', pembimbing.id)
        );

        const snapshot = await getDocs(q);

        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setSiswa(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSiswa();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">
        Dashboard Pembimbing
      </h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {/* Statistik */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-600 text-white p-4 rounded">
              <h2 className="text-sm">Total Siswa Bimbingan</h2>
              <p className="text-2xl font-bold">{siswa.length}</p>
            </div>

            <div className="bg-green-600 text-white p-4 rounded">
              <h2 className="text-sm">Siswa Aktif</h2>
              <p className="text-2xl font-bold">
                {siswa.filter(s => s.perusahaanId).length}
              </p>
            </div>

            <div className="bg-yellow-500 text-white p-4 rounded">
              <h2 className="text-sm">Belum Dapat Tempat</h2>
              <p className="text-2xl font-bold">
                {siswa.filter(s => !s.perusahaanId).length}
              </p>
            </div>
          </div>

          {/* Tabel siswa */}
          <div className="bg-white rounded shadow p-4">
            <h2 className="text-lg font-semibold mb-3">
              Siswa Bimbingan
            </h2>

            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2">No</th>
                    <th className="px-4 py-2">Nama</th>
                    <th className="px-4 py-2">Kelas</th>
                    <th className="px-4 py-2">Perusahaan</th>
                  </tr>
                </thead>
                <tbody>
                  {siswa.length > 0 ? (
                    siswa.map((s, i) => (
                      <tr key={s.id}>
                        <td className="px-4 py-2">{i + 1}</td>
                        <td className="px-4 py-2">{s.nama}</td>
                        <td className="px-4 py-2">{s.kelas}</td>
                        <td className="px-4 py-2">
                          {s.perusahaanId ? 'Sudah PKL' : 'Belum PKL'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-4">
                        Tidak ada siswa
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