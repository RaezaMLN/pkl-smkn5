'use client';

import { useEffect, useState } from 'react';
import {
  doc,
  getDoc,
  updateDoc,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  motion,
  AnimatePresence,
} from 'framer-motion';

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
  canDelete?: boolean;
};

export default function SiswaTerdaftarModal({
  isOpen,
  onClose,
  perusahaanId,
  canDelete = false,
}: Props) {
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [loading, setLoading] = useState(true);

  const [siswaPendingDelete, setSiswaPendingDelete] =
    useState<Siswa | null>(null);

  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchSiswaTerdaftar = async () => {
      if (!perusahaanId) return;

      setLoading(true);

      try {
        const perusahaanRef = doc(
          db,
          'perusahaan',
          perusahaanId
        );

        const perusahaanSnap =
          await getDoc(perusahaanRef);

        if (!perusahaanSnap.exists()) {
          setSiswaList([]);
          return;
        }

        const data = perusahaanSnap.data();

        const siswaIds: string[] =
          data.siswa_terdaftar || [];

        const siswaData: Siswa[] = [];

        for (const id of siswaIds) {
          const siswaSnap = await getDoc(
            doc(db, 'siswa', id)
          );

          if (siswaSnap.exists()) {
            siswaData.push({
              id: siswaSnap.id,
              ...siswaSnap.data(),
            } as Siswa);
          }
        }

        setSiswaList(siswaData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchSiswaTerdaftar();
    }
  }, [isOpen, perusahaanId]);

  const konfirmasiHapusSiswa = async () => {
    if (!canDelete) return;

    if (!perusahaanId || !siswaPendingDelete)
      return;

    setDeleting(true);

    try {
      const perusahaanRef = doc(
        db,
        'perusahaan',
        perusahaanId
      );

      await updateDoc(perusahaanRef, {
        siswa_terdaftar: arrayRemove(
          siswaPendingDelete.id
        ),
      });

      setSiswaList((prev) =>
        prev.filter(
          (s) =>
            s.id !== siswaPendingDelete.id
        )
      );

      setSiswaPendingDelete(null);
    } catch (error) {
      console.error(
        'Gagal menghapus siswa:',
        error
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-xl max-w-xl w-full p-6 mx-4"
              initial={{
                y: 50,
                opacity: 0,
              }}
              animate={{
                y: 0,
                opacity: 1,
              }}
              exit={{
                y: 50,
                opacity: 0,
              }}
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-bold">
                    Siswa Terdaftar
                  </h2>

                  <p className="text-sm text-gray-500">
                    Total {siswaList.length}{' '}
                    peserta
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {loading ? (
                <div className="py-8 text-center">
                  Memuat data...
                </div>
              ) : siswaList.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  Belum ada siswa yang
                  terdaftar.
                </div>
              ) : (
                <ul className="space-y-3 max-h-96 overflow-y-auto">
                  {siswaList.map((siswa) => (
                    <li
                      key={siswa.id}
                      className="border rounded-xl p-4 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-semibold">
                          {siswa.nama}
                        </p>

                        <div className="flex gap-2 mt-2 flex-wrap">
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                            {siswa.kelas}
                          </span>

                          <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">
                            {siswa.jurusan}
                          </span>
                        </div>
                      </div>

                      {canDelete && (
                        <button
                          onClick={() =>
                            setSiswaPendingDelete(
                              siswa
                            )
                          }
                          className="text-red-500 hover:text-red-700 text-lg font-bold"
                          title="Hapus siswa"
                        >
                          ✕
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {canDelete && (
        <AnimatePresence>
          {siswaPendingDelete && (
            <motion.div
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-xl p-6 w-full max-w-md"
                initial={{
                  scale: 0.9,
                  opacity: 0,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                }}
                exit={{
                  scale: 0.9,
                  opacity: 0,
                }}
              >
                <h3 className="text-lg font-semibold text-red-600 mb-2">
                  Konfirmasi Hapus
                </h3>

                <p className="text-gray-700 mb-4">
                  Hapus{' '}
                  <strong>
                    {
                      siswaPendingDelete.nama
                    }
                  </strong>{' '}
                  dari daftar peserta?
                </p>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() =>
                      setSiswaPendingDelete(
                        null
                      )
                    }
                    className="px-4 py-2 rounded bg-gray-200"
                  >
                    Batal
                  </button>

                  <button
                    onClick={
                      konfirmasiHapusSiswa
                    }
                    disabled={deleting}
                    className="px-4 py-2 rounded bg-red-600 text-white"
                  >
                    {deleting
                      ? 'Menghapus...'
                      : 'Ya, Hapus'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  );
}