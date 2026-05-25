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

    setLaporan(data);
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
  const filteredData = laporan.filter((item) => {
    const matchSearch = item.kegiatan
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const matchBulan = filterBulan
      ? new Date(item.tanggal).getMonth().toString() === filterBulan
      : true;

    return matchSearch && matchBulan;
  });

  // 🔥 PAGINATION
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

useEffect(() => {
  setCurrentPage(1);
}, [search, filterBulan, itemsPerPage]);

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
    <div className="max-w-4xl mx-auto p-4">

      {/* ALERT */}
      {alertMsg && (
        <div className={`p-3 mb-4 rounded-lg text-sm
          ${alertType === 'success' && 'bg-green-100 text-green-700'}
          ${alertType === 'error' && 'bg-red-100 text-red-700'}
          ${alertType === 'warning' && 'bg-yellow-100 text-yellow-700'}
        `}>
          {alertMsg}
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Laporan Harian PKL</h1>

        <button
          onClick={() => setShowExport(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg"
        >
          <Download size={16} />
          Download Jurnal
        </button>
      </div>

      

      {/* FILTER */}
      <div className="flex gap-3 mb-4 flex-col md:flex-row">

  {/* SEARCH */}
  <input
    type="text"
    placeholder="Cari kegiatan..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="border px-3 py-2 rounded-lg w-full"
  />

  {/* FILTER BULAN */}
  <select
    value={filterBulan}
    onChange={(e) => setFilterBulan(e.target.value)}
    className="border px-3 py-2 rounded-lg"
  >
    <option value="">Semua Bulan</option>
    {[...Array(12)].map((_, i) => (
      <option key={i} value={i}>
        {new Date(0, i).toLocaleString('id-ID', { month: 'long' })}
      </option>
    ))}
  </select>

  {/* 🔥 LIMIT PER PAGE */}
  <select
    value={itemsPerPage}
    onChange={(e) => setItemsPerPage(Number(e.target.value))}
    className="border px-3 py-2 rounded-lg"
  >
    <option value={5}>5 / halaman</option>
    <option value={10}>10 / halaman</option>
    <option value={20}>20 / halaman</option>
    <option value={50}>50 / halaman</option>
  </select>

</div>

{/* FORM INPUT */}
<div className="bg-white p-6 rounded-xl shadow mb-6 space-y-4">

  <h2 className="text-lg font-semibold">
    {editId ? 'Edit Laporan' : 'Tambah Laporan'}
  </h2>

  <input
    type="date"
    value={tanggal}
    onChange={(e) => setTanggal(e.target.value)}
    className="w-full border px-3 py-2 rounded-lg"
  />

  <input
    type="text"
    placeholder="Kegiatan"
    value={kegiatan}
    onChange={(e) => setKegiatan(e.target.value)}
    className="w-full border px-3 py-2 rounded-lg"
  />

  <textarea
    placeholder="Keterangan"
    value={keterangan}
    onChange={(e) => setKeterangan(e.target.value)}
    className="w-full border px-3 py-2 rounded-lg"
  />

  <input
    type="text"
    placeholder="Link Foto (Google Drive)"
    value={fotoUrl}
    onChange={(e) => setFotoUrl(e.target.value)}
    className="w-full border px-3 py-2 rounded-lg"
  />

  <div className="flex gap-2">
    <button
      onClick={handleSubmit}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg"
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
        className="bg-gray-400 text-white px-4 py-2 rounded-lg"
      >
        Batal
      </button>
    )}
  </div>

</div>



      {/* LIST */}
      <div className="bg-white p-6 rounded-xl shadow">
        {paginatedData.map((item) => (
          <div key={item.id} className="border p-3 rounded mb-3 flex justify-between">

            <div>
              <p className="font-semibold">{item.tanggal}</p>
              <p>{item.kegiatan}</p>
              <p className="text-sm text-gray-500">{item.keterangan}</p>

              {item.foto && (
                <a href={item.foto} target="_blank" className="text-blue-600 text-sm">
                  Lihat Foto
                </a>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={() => handleEdit(item)}>
                <Pencil size={18} />
              </button>

              <button onClick={() => handleDelete(item.id)}>
                <Trash2 size={18} />
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* PAGINATION */}
      <div className="flex justify-between mt-4">
        <button
          onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
        >
          Prev
        </button>

        <span>Page {currentPage} / {totalPages}</span>

        <button
          onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>

      {/* EXPORT */}
      {showExport && siswa && (
        <ExportModal
          siswa={{
            ...siswa,
            laporan,
            perusahaanNama
          }}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}