'use client';

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import SiswaTerdaftarModal from "@/components/siswa/SiswaTerdaftarModal"
import PdfModal from "@/components/admin/PdfModal"
import ExclModal from "@/components/admin/ExclModal";
import { useMemo } from 'react';



interface Perusahaan {
  id: string;
  nama: string;
  alamat: string;
  bidang: string;
  kontak: string;
  kuota: number;
  stats: string;
  keterangan: string;
  siswa_terdaftar: string[];
}

const PerusahaanPage = () => {
  const [perusahaan, setPerusahaan] = useState<Perusahaan[]>([]);
  const [nama, setNama] = useState('');
  const [alamat, setAlamat] = useState('');
  const [bidang, setBidang] = useState('');
  const [kontak, setKontak] = useState('');
  const [stats, setStats] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [kuota, setKuota] = useState<number>(0);
  const [siswaTerdaftar, setSiswaTerdaftar] = useState<string[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPdfOpen, setModalPdfOpen] = useState(false);
  const [modalExclOpen, setModalExclOpen] = useState(false);
  const [selectedPerusahaanId, setSelectedPerusahaanId] = useState<string | null>(null);
  const [filterStats, setFilterStats] = useState("Semua");


  const handleLihatSiswa = (perusahaanId: string) => {
  setSelectedPerusahaanId(perusahaanId);
  setModalOpen(true);
};

  const fetchPerusahaan = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "perusahaan"));
      const perusahaanList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Perusahaan);
      setPerusahaan(perusahaanList);
    } catch (error) {
      console.error("Gagal mengambil data perusahaan:", error);
    }
  };

  useEffect(() => {
    fetchPerusahaan();
  }, []);

  const handleAdd = async () => {
    if (!nama || !alamat || !bidang || !kontak || !stats || kuota <= 0) {
      setError("Semua field harus diisi dengan benar.");
      return;
    }

    try {
      await addDoc(collection(db, "perusahaan"), {
        nama,
        alamat,
        bidang,
        kontak,
        stats,
        kuota,
        keterangan,
        siswa_terdaftar: [],
      });
      setNama('');
      setAlamat('');
      setBidang('');
      setKontak('');
      setStats('');
      setKuota(0);
      setKeterangan('');
      setError('');
      fetchPerusahaan();
    } catch (error) {
      console.error("Gagal menambah perusahaan:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "perusahaan", id));
      fetchPerusahaan();
      setShowConfirmDelete(false);
    } catch (error) {
      console.error("Gagal menghapus perusahaan:", error);
    }
  };

  const handleEdit = (id: string, nama: string, alamat: string, bidang: string, kontak: string, keterangan:string, kuota: number, stats: string) => {
    setEditMode(true);
    setEditId(id);
    setNama(nama);
    setAlamat(alamat);
    setBidang(bidang);
    setKontak(kontak);
    setStats(stats);
    setKuota(kuota);
    setKeterangan(keterangan);
  };

  const handleUpdate = async () => {
    if (!nama || !alamat || !bidang || !kontak || !stats || !keterangan) {
      setError("Semua field harus diisi dengan benar.");
      return;
    }

    try {
      const perusahaanRef = doc(db, "perusahaan", editId);
      await updateDoc(perusahaanRef, {
        nama,
        alamat,
        bidang,
        kontak,
        stats,
        kuota,
        keterangan,
      });
      setEditMode(false);
      setNama('');
      setAlamat('');
      setBidang('');
      setKontak('');
      setStats('');
      setKuota(0);
      setKeterangan('');
      setError('');
      fetchPerusahaan();
    } catch (error) {
      console.error("Gagal memperbarui perusahaan:", error);
    }
  };

  const handleConfirmDelete = (id: string) => {
    setDeletingId(id);
    setShowConfirmDelete(true);
  };

  const handleCancelDelete = () => {
    setShowConfirmDelete(false);
    setDeletingId('');
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

const currentItems = useMemo(() => {
  return perusahaan
    .filter(per => {
      const matchesSearch =
        per.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        per.alamat.toLowerCase().includes(searchQuery.toLowerCase()) ||
        per.bidang.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        filterStats === "Semua" || per.stats === filterStats;

      return matchesSearch && matchesStatus;
    })
    .slice(indexOfFirstItem, indexOfLastItem);
}, [perusahaan, searchQuery, filterStats, indexOfFirstItem, indexOfLastItem]);



const totalPages = useMemo(() => {
  const filtered = perusahaan.filter(per => {
    const matchesSearch =
      per.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      per.alamat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      per.bidang.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStats === "Semua" || per.stats === filterStats;

    return matchesSearch && matchesStatus;
  });

  return Math.ceil(filtered.length / itemsPerPage);
}, [perusahaan, searchQuery, filterStats, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };


  return (
    <div className="max-w-full mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Manajemen Perusahaan</h1>

      <div className="mb-4">
        {error && <p className="text-red-500">{error}</p>}

        <div className="grid grid-cols-2 gap-4">
          <div className="mb-2">
            <label className="block text-sm font-medium">Nama Perusahaan</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Nama perusahaan"
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium">Alamat Perusahaan</label>
            <input
              type="text"
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Alamat perusahaan"
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium">Bidang</label>
            <input
              type="text"
              value={bidang}
              onChange={(e) => setBidang(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Bidang perusahaan"
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium">Kontak</label>
            <input
              type="number"
              value={kontak}
              onChange={(e) => setKontak(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Kontak perusahaan"
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium">Status</label>
            <select
              value={stats}
              onChange={(e) => setStats(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">-- Pilih Status --</option>
              <option value="sudah di surati">sudah di surati</option>
              <option value="menunggu surat balasan">menunggu surat balasan</option>
              <option value="menunggu pengantaran siswa">menunggu pengantaran siswa</option>
              <option value="siswa sudah di antar">siswa sudah di antar</option>
              <option value="siswa sudah di jemput">siswa sudah di jemput</option>
            </select>
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium">Kuota</label>
            <input
              type="number"
              value={kuota}
              onChange={(e) => setKuota(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Kuota perusahaan"
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium">Keterangan</label>
            <input
              type="text"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Keterangan"
            />
          </div>
        </div>

       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            placeholder="Cari perusahaan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 p-2 border border-gray-300 rounded-md"
          />
          <select
            value={filterStats}
            onChange={(e) => {
              setFilterStats(e.target.value);
              setCurrentPage(1);
            }}
            className="p-2 border border-gray-300 rounded-md"
          >
            <option value="Semua">Semua Status</option>
            <option value="sudah di surati">sudah di surati</option>
            <option value="menunggu surat balasan">menunggu surat balasan</option>
            <option value="menunggu pengantaran siswa">menunggu pengantaran siswa</option>
            <option value="siswa sudah di antar">siswa sudah di antar</option>
            <option value="siswa sudah di jemput">siswa sudah di jemput</option>
          </select>
        </div>

        <button
          onClick={editMode ? handleUpdate : handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 w-full sm:w-auto"
        >
          {editMode ? "Update Perusahaan" : "Tambah Perusahaan"}
        </button>
      </div>

      </div>
       <button
        onClick={() => setModalPdfOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Unduh Data PDF
      </button>

      <PdfModal
        open={modalPdfOpen}
        onClose={() => setModalPdfOpen(false)}
        data={perusahaan}  // kirim seluruh list perusahaan
      />

      <button
  onClick={() => setModalExclOpen(true)}
  className="ml-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
>
  Unduh Data Excel
</button>
<ExclModal
  open={modalExclOpen}
  onClose={() => setModalExclOpen(false)}
  data={perusahaan}
/>


      <div className="overflow-x-auto">
        <table className="min-w-full table-auto mb-4">
          <thead>
            <tr>
              <th className="px-4 py-2">No</th>
              <th className="px-4 py-2">Nama Perusahaan</th>
              <th className="px-4 py-2">Alamat</th>
              <th className="px-4 py-2">Bidang</th>
              <th className="px-4 py-2">Kontak</th>
              <th className="px-4 py-2">Keterangan</th>
              <th className="px-4 py-2">stats</th>
              <th className="px-4 py-2">Kuota</th>
              <th className="px-4 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((per, index) => (
              <tr key={per.id}>
                <td className="px-4 py-2">{index + 1 + (currentPage - 1) * itemsPerPage}</td>
                <td className="px-4 py-2">{per.nama}</td>
                <td className="px-4 py-2">{per.alamat}</td>
                <td className="px-4 py-2">{per.bidang}</td>
                <td className="px-4 py-2">{per.kontak}</td>
                <td className="px-4 py-2">{per.keterangan}</td>
                <td className="px-4 py-2">{per.stats}</td>
                <td className="px-4 py-2">{per.kuota}</td>
                <td className="px-4 py-2 flex space-x-2">
                  {/* Di dalam tabel daftar perusahaan */}
                <button
                  onClick={() => handleLihatSiswa(per.id)}
                  className="text-blue-600 hover:underline"
                >
                  Lihat Siswa
                </button>

                  <button
                    onClick={() => handleEdit(per.id, per.nama, per.alamat, per.bidang, per.kontak, per.keterangan, per.kuota, per.stats)}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleConfirmDelete(per.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

     {/* Pagination */}
<div className="flex justify-between items-center">
  <div>
    <label className="mr-2">Tampilkan:</label>
    <select
      value={itemsPerPage}
      onChange={handleItemsPerPageChange}
      className="px-2 py-1 border border-gray-300 rounded-md"
    >
      <option value={5}>5</option>
      <option value={10}>10</option>
      <option value={20}>20</option>
    </select>
  </div>
  <div className="flex items-center space-x-4">
    <button
      disabled={currentPage === 1}
      onClick={() => handlePageChange(currentPage - 1)}
      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
    >
      Previous
    </button>
    
    {/* Menampilkan nomor halaman */}
    <span className="text-lg font-semibold">
      Page {currentPage} / {totalPages}
    </span>

    <button
      disabled={currentPage === totalPages}
      onClick={() => handlePageChange(currentPage + 1)}
      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
    >
      Next
    </button>
  </div>
</div>

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-md">
            <p>Apakah Anda yakin ingin menghapus perusahaan ini?</p>
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => handleDelete(deletingId)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Hapus
              </button>
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

<SiswaTerdaftarModal
  isOpen={modalOpen}
  onClose={() => setModalOpen(false)}
  perusahaanId={selectedPerusahaanId}
/>

    </div>
  );
};

export default PerusahaanPage;
