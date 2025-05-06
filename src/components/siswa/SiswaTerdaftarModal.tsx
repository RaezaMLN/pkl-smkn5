'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';

type Siswa = {
  id: string;
  nama: string;
  nisn: string;
  kelas: string;
  jurusan: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  perusahaanId: string | null;
};

export default function SiswaTerdaftarModal({ isOpen, onClose, perusahaanId }: Props) {
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSiswaTerdaftar = async () => {
      if (!perusahaanId) return;

      setLoading(true);
      const perusahaanRef = doc(db, 'perusahaan', perusahaanId);
      const perusahaanSnap = await getDoc(perusahaanRef);

      if (!perusahaanSnap.exists()) {
        setSiswaList([]);
        setLoading(false);
        return;
      }

      const data = perusahaanSnap.data();
      const siswaIds: string[] = data.siswa_terdaftar || [];

      const siswaData: Siswa[] = [];

      for (const id of siswaIds) {
        const siswaSnap = await getDoc(doc(db, 'siswa', id));
        if (siswaSnap.exists()) {
          siswaData.push({ id: siswaSnap.id, ...siswaSnap.data() } as Siswa);
        }
      }

      setSiswaList(siswaData);
      setLoading(false);
    };

    if (isOpen) fetchSiswaTerdaftar();
  }, [isOpen, perusahaanId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Siswa Terdaftar</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {loading ? (
              <p>Memuat data siswa...</p>
            ) : siswaList.length === 0 ? (
              <p>Belum ada siswa yang terdaftar.</p>
            ) : (
              <ul className="space-y-3 max-h-64 overflow-y-auto">
                {siswaList.map((siswa) => (
                  <li key={siswa.id} className="border p-3 rounded">
                    <p className="font-medium">{siswa.nama}</p>
                    <p className="text-sm text-gray-600">NISN: {siswa.nisn} | Kelas: {siswa.kelas}| Jurusan: {siswa.jurusan}</p>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={onClose}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
