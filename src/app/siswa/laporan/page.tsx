'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';

import {
  Pencil,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download
} from 'lucide-react';

import ExportModal from '@/components/pembimbing/ExportModal';

export default function LaporanSiswaPage() {

  const [tanggal, setTanggal] = useState('');
  const [kegiatan, setKegiatan] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');

  const [laporan, setLaporan] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [alertMsg, setAlertMsg] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | ''>('');

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);

  const [perusahaanNama, setPerusahaanNama] = useState('Belum PKL');

  // 🔥 FILTER & PAGINATION
  const [search, setSearch] = useState('');
  const [filterBulan, setFilterBulan] = useState('');
  const [sortBy, setSortBy] = useState('terbaru');
  const [currentPage, setCurrentPage] = useState(1);

 const [itemsPerPage, setItemsPerPage] = useState(5);

  const siswaLocal = localStorage.getItem('siswa');
  const siswa = siswaLocal ? JSON.parse(siswaLocal) : null;

  // 🔥 AUTO HIDE ALERT
  useEffect(() => {
    if (alertMsg) {
      const timer = setTimeout(() => {
        setAlertMsg('');
        setAlertType('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alertMsg]);

  // 🔥 FETCH LAPORAN
  const fetchLaporan = async () => {
    if (!siswa) return;

    const q = query(
      collection(db, 'laporan'),
      where('siswaId', '==', siswa.id)
    );

    const snap = await getDocs(q);

    const data = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Urutkan default: tanggal terbaru -> terlama
    const sortedData = data.sort((a: any, b: any) => {
      const dateCompare = (b.tanggal || '').localeCompare(a.tanggal || '');
      if (dateCompare !== 0) return dateCompare;
      const timeB = b.createdAt?.toMillis?.() || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
      const timeA = a.createdAt?.toMillis?.() || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
      return timeB - timeA;
    });

    setLaporan(sortedData);
  };

  // 🔥 AMBIL PERUSAHAAN
  const getPerusahaanSiswa = async () => {
    const perusahaanSnap = await getDocs(collection(db, 'perusahaan'));

    for (const docSnap of perusahaanSnap.docs) {
      const data = docSnap.data();
      if ((data.siswa_terdaftar || []).includes(siswa.id)) {
        return data.nama;
      }
    }
    return 'Belum PKL';
  };

  useEffect(() => {
    fetchLaporan();

    const load = async () => {
      if (!siswa) return;
      const nama = await getPerusahaanSiswa();
      setPerusahaanNama(nama);
    };

    load();
  }, []);

  // 🔥 FILTER LOGIC
  const filteredData = laporan

.filter((item) => {
  const matchSearch = item.kegiatan
    ?.toLowerCase()
    .includes(search.toLowerCase());
  const matchBulan = filterBulan
    ? item.tanggal?.split('-')[1] ===
      String(Number(filterBulan) + 1).padStart(2,'0')
    : true;
  return matchSearch && matchBulan;
})
.sort((a,b)=>{
  if(sortBy === 'az'){
    return a.kegiatan.localeCompare(
      b.kegiatan,
      'id',
      { sensitivity:'base' }
    );
  }
  if(sortBy === 'za'){
    return b.kegiatan.localeCompare(
      a.kegiatan,
      'id',
      { sensitivity:'base' }
    );
  }
  if(sortBy === 'terlama'){
    return (a.tanggal || '').localeCompare(
      b.tanggal || ''
    );
  }
  return (b.tanggal || '').localeCompare(
    a.tanggal || ''
  );
});

  // 🔥 PAGINATION
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

useEffect(() => {
  setCurrentPage(1);
}, [
  search,
  filterBulan,
  sortBy,
  itemsPerPage
]);

  // 🔥 RESET
  const resetForm = () => {
    setTanggal('');
    setKegiatan('');
    setKeterangan('');
    setFotoUrl('');
    setEditId(null);
  };

  // 🔥 CREATE / UPDATE
  const handleSubmit = async () => {
    if (!tanggal || !kegiatan) {
      setAlertMsg('Tanggal dan kegiatan wajib diisi');
      setAlertType('warning');
      return;
    }

    setLoading(true);

    try {
      if (editId) {
        await updateDoc(doc(db, 'laporan', editId), {
          tanggal,
          kegiatan,
          keterangan,
          foto: fotoUrl,
        });

        setAlertMsg('Laporan berhasil diupdate');
      } else {
        await addDoc(collection(db, 'laporan'), {
          siswaId: siswa.id,
          tanggal,
          kegiatan,
          keterangan,
          foto: fotoUrl,
          status: 'pending',
          createdAt: serverTimestamp(),
        });

        setAlertMsg('Laporan berhasil ditambahkan');
      }

      setAlertType('success');
      resetForm();
      fetchLaporan();

    } catch {
      setAlertMsg('Gagal menyimpan laporan');
      setAlertType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: any) => {
    setTanggal(item.tanggal);
    setKegiatan(item.kegiatan);
    setKeterangan(item.keterangan);
    setFotoUrl(item.foto || '');
    setEditId(item.id);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'laporan', id));
      setAlertMsg('Laporan berhasil dihapus');
      setAlertType('success');
      fetchLaporan();
    } catch {
      setAlertMsg('Gagal menghapus laporan');
      setAlertType('error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">

      {/* ALERT */}
      {alertMsg && (
        <div className={`p-3 rounded-lg text-sm
          ${alertType === 'success' && 'bg-green-100 dark:bg-green-900/60 text-green-700 dark:text-green-200 border border-green-200 dark:border-green-800'}
          ${alertType === 'error' && 'bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-800'}
          ${alertType === 'warning' && 'bg-yellow-100 dark:bg-yellow-900/60 text-yellow-700 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800'}
        `}>
          {alertMsg}
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Laporan Harian PKL</h1>

        <button
          onClick={() => setShowExport(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg transition text-sm font-medium shadow-sm"
        >
          <Download size={16} />
          Download Jurnal
        </button>
      </div>

      {/* FILTER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
        {/* SEARCH */}
        <input
          type="text"
          placeholder="Cari kegiatan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        />

        {/* FILTER BULAN */}
        <select
          value={filterBulan}
          onChange={(e) => setFilterBulan(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="">Semua Bulan</option>
          {[...Array(12)].map((_, i) => (
            <option key={i} value={i}>
              {new Date(0, i).toLocaleString('id-ID', { month: 'long' })}
            </option>
          ))}
        </select>

        {/* SORT */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="terbaru">Tanggal Terbaru</option>
          <option value="terlama">Tanggal Terlama</option>
          <option value="az">Kegiatan A - Z</option>
          <option value="za">Kegiatan Z - A</option>
        </select>

        {/* LIMIT PER PAGE */}
        <select
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className="border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value={5}>5 / halaman</option>
          <option value={10}>10 / halaman</option>
          <option value={20}>20 / halaman</option>
          <option value={50}>50 / halaman</option>
        </select>
      </div>

      {/* FORM INPUT */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm sm:shadow-lg border border-gray-200 dark:border-gray-700 space-y-3.5">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
          {editId ? 'Edit Laporan' : 'Tambah Laporan'}
        </h2>

        <input
          type="date"
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        />

        <input
          type="text"
          placeholder="Kegiatan"
          value={kegiatan}
          onChange={(e) => setKegiatan(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        />

        <textarea
          placeholder="Keterangan"
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        />

        <input
          type="text"
          placeholder="Link Foto (Google Drive)"
          value={fotoUrl}
          onChange={(e) => setFotoUrl(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        />

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSubmit}
            className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition text-sm font-medium"
          >
            {loading
              ? 'Menyimpan...'
              : editId
              ? 'Update'
              : 'Tambah'}
          </button>

          {editId && (
            <button
              onClick={resetForm}
              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition text-sm"
            >
              Batal
            </button>
          )}
        </div>
      </div>

      {/* LIST */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm sm:shadow-lg border border-gray-200 dark:border-gray-700">
        {paginatedData.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-6 text-sm">
            Tidak ada laporan ditemukan.
          </p>
        ) : (
          paginatedData.map((item) => (
            <div key={item.id} className="border border-gray-200 dark:border-gray-600 p-3 sm:p-4 rounded-xl mb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-blue-600 dark:text-blue-400 text-xs sm:text-sm">{item.tanggal}</p>
                <p className="text-gray-800 dark:text-gray-100 font-medium break-words mt-0.5 text-sm sm:text-base">{item.kegiatan}</p>
                {item.keterangan && (
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 break-words mt-1">{item.keterangan}</p>
                )}
                {item.foto && (
                  <a href={item.foto} target="_blank" rel="noopener noreferrer" className="inline-block text-blue-600 dark:text-blue-400 hover:underline text-xs mt-1.5 font-medium">
                    Lihat Foto ↗
                  </a>
                )}
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0">
                <button
                  onClick={() => handleEdit(item)}
                  className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                  title="Edit"
                >
                  <Pencil size={18} />
                </button>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 transition"
                  title="Hapus"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 text-sm text-gray-700 dark:text-gray-300 px-1">
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            Prev
          </button>

          <span className="font-medium">Halaman {currentPage} / {totalPages}</span>

          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            Next
          </button>
        </div>
      )}

      {/* EXPORT */}
      {showExport && siswa && (
        <ExportModal
          siswa={{
            ...siswa,
            laporan,
            perusahaanNama
          }}
          defaultSort={sortBy === 'terlama' ? 'terlama' : 'terbaru'}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}