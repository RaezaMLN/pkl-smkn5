'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore';
import {
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  User,
  Download
} from 'lucide-react';
import ExportModal from '@/components/pembimbing/ExportModal';

export default function LaporanPembimbingPage() {
  const router = useRouter();
  const [groupedData, setGroupedData] = useState<any[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [alertMsg, setAlertMsg] = useState('');

  // Check if still logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isPembimbingLoggedIn');
    if (isLoggedIn !== 'true') {
      router.replace('/pembimbing/login');
    }
  }, [router]);

  // 🔥 FILTER
  const [search, setSearch] = useState('');
  const [kelasFilter, setKelasFilter] = useState('');
  const [jurusanFilter, setJurusanFilter] = useState('');

  // 🔥 MODAL EXPORT
  const [selectedSiswa, setSelectedSiswa] = useState<any>(null);

  // 🔥 FETCH DATA
  const fetchData = async () => {
  try {
    const pembimbingLocal = localStorage.getItem('pembimbing');
    if (!pembimbingLocal) return;

    const pembimbing = JSON.parse(pembimbingLocal);

    const perusahaanSnap = await getDocs(collection(db, 'perusahaan'));

    let siswaIds: string[] = [];
    const siswaPerusahaanMap: any = {};

    // 🔥 mapping siswa -> perusahaan
    perusahaanSnap.docs.forEach((doc) => {
      const data = doc.data();

      if (data.pembimbingId === pembimbing.id) {
        const siswaList = data.siswa_terdaftar || [];

        siswaIds.push(...siswaList);

        siswaList.forEach((id: string) => {
          siswaPerusahaanMap[id] = data.nama;
        });
      }
    });

    const siswaSnap = await getDocs(collection(db, 'siswa'));

    const siswaMap: any = {};

    siswaSnap.docs.forEach((doc) => {
      siswaMap[doc.id] = {
        nama: doc.data().nama,
        kelas: doc.data().kelas,
        jurusan: doc.data().jurusan,
        perusahaanNama: siswaPerusahaanMap[doc.id] || 'Belum PKL',
      };
    });

    const laporanSnap = await getDocs(collection(db, 'laporan'));

    const grouped: any = {};

    laporanSnap.docs.forEach((docSnap) => {
      const data = docSnap.data();

      if (siswaIds.includes(data.siswaId)) {
        if (!grouped[data.siswaId]) {
          grouped[data.siswaId] = {
            siswaId: data.siswaId,
            nama: siswaMap[data.siswaId]?.nama || 'Siswa',
            kelas: siswaMap[data.siswaId]?.kelas || '-',
            jurusan: siswaMap[data.siswaId]?.jurusan || '-',
            perusahaanNama: siswaMap[data.siswaId]?.perusahaanNama || 'Belum PKL',
            laporan: [],
          };
        }

        grouped[data.siswaId].laporan.push({
          id: docSnap.id,
          ...data,
        });
      }
    });

    setGroupedData(Object.values(grouped));

  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchData();
  }, []);

  // 🔥 FILTER LOGIC
  const filteredData = groupedData.filter((s) => {
    return (
      s.nama.toLowerCase().includes(search.toLowerCase()) &&
      (!kelasFilter || s.kelas === kelasFilter) &&
      (!jurusanFilter || s.jurusan === jurusanFilter)
    );
  });

  // 🔥 UPDATE STATUS
  const handleUpdate = async (id: string, status: string) => {
    await updateDoc(doc(db, 'laporan', id), { status });

    setAlertMsg(`Laporan ${status}`);
    fetchData();
  };

  return (
    <div className="max-w-6xl mx-auto p-4 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">

      {/* ALERT */}
      {alertMsg && (
        <div className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 p-3 rounded mb-4 text-sm">
          {alertMsg}
        </div>
      )}

      <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
        Laporan Siswa Bimbingan
      </h1>

      {/* 🔥 FILTER UI */}
      <div className="grid md:grid-cols-3 gap-3 mb-6">
        <input
          placeholder="Cari siswa..."
          className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          placeholder="Filter Kelas (contoh: XII RPL 3)"
          value={kelasFilter}
          onChange={(e) => setKelasFilter(e.target.value)}
          className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />

        <input
          placeholder="Filter Jurusan (contoh: RPL)"
          value={jurusanFilter}
          onChange={(e) => setJurusanFilter(e.target.value)}
          className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      {/* CONTENT */}
      {loading ? (
        <p>Loading...</p>
      ) : filteredData.length > 0 ? (
        <div className="space-y-4">

          {filteredData.map((siswa) => (
            <div
              key={siswa.siswaId}
              className="bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-lg border border-gray-200 dark:border-gray-700"
            >

              {/* HEADER */}
              <div
                onClick={() =>
                  setOpenId(openId === siswa.siswaId ? null : siswa.siswaId)
                }
                className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <User className="text-blue-600 dark:text-blue-400" />
                    <h2 className="font-semibold text-gray-900 dark:text-white">{siswa.nama}</h2>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {siswa.kelas} • {siswa.jurusan}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  
                  {/* EXPORT */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSiswa(siswa);
                    }}
                    className="text-blue-600"
                  >
                    <Download size={18} />
                  </button>

                  {openId === siswa.siswaId ? (
                    <ChevronUp />
                  ) : (
                    <ChevronDown />
                  )}
                </div>
              </div>

              {/* DROPDOWN */}
              {openId === siswa.siswaId && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">

                  {siswa.laporan.map((item: any) => (
                    <div
                      key={item.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 flex justify-between bg-gray-50 dark:bg-gray-700"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{item.tanggal}</p>
                        <p className="text-gray-700 dark:text-gray-200">{item.kegiatan}</p>

                        {item.foto && (
                          <a
                            href={item.foto}
                            target="_blank"
                            className="text-blue-600 text-sm underline"
                          >
                            Lihat Foto
                          </a>
                        )}

                        <div className="mt-1">
                          <span className="text-xs bg-yellow-100 px-2 py-1 rounded">
                            {item.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleUpdate(item.id, 'disetujui')
                          }
                          className="text-green-600"
                        >
                          <CheckCircle size={20} />
                        </button>

                        <button
                          onClick={() =>
                            handleUpdate(item.id, 'ditolak')
                          }
                          className="text-red-600"
                        >
                          <XCircle size={20} />
                        </button>
                      </div>
                    </div>
                  ))}

                </div>
              )}

            </div>
          ))}

        </div>
      ) : (
        <p className="text-gray-500">
          Tidak ada data
        </p>
      )}

      {/* 🔥 MODAL EXPORT */}
      {selectedSiswa && (
        <ExportModal
          siswa={selectedSiswa}
          onClose={() => setSelectedSiswa(null)}
        />
      )}
    </div>
  );
}