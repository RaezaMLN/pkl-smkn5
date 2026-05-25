'use client';

import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore';

export default function MigratePembimbingPage() {

  const handleMigrate = async () => {
    try {
      const perusahaanSnap = await getDocs(collection(db, 'perusahaan'));

      let totalUpdated = 0;

      for (const perDoc of perusahaanSnap.docs) {
        const perData = perDoc.data();

        const pembimbingId = perData.pembimbingId;
        const siswaList = perData.siswa_terdaftar || [];

        // 🔥 skip kalau tidak ada pembimbing atau tidak ada siswa
        if (!pembimbingId || siswaList.length === 0) continue;

        for (const siswaId of siswaList) {
          await updateDoc(doc(db, 'siswa', siswaId), {
            pembimbingId: pembimbingId
          });

          totalUpdated++;
        }
      }

      alert(`Migrasi selesai! ${totalUpdated} siswa berhasil diupdate`);
    } catch (err) {
      console.error(err);
      alert('Migrasi gagal');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">
        Migrasi Pembimbing ke Siswa
      </h1>

      <p className="mb-4 text-sm text-gray-600">
        Script ini akan menambahkan pembimbing ke siswa berdasarkan data perusahaan.
        Hanya siswa yang sudah terdaftar di perusahaan yang akan diupdate.
      </p>

      <button
        onClick={handleMigrate}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Jalankan Migrasi
      </button>
    </div>
  );
}