'use client';

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  setDoc
} from "firebase/firestore";

interface Pengajuan {
  id: string;
  namaSiswa: string;
  namaPerusahaan: string;
  alamatPerusahaan: string;
  kontakPerusahaan: string;
  bidangPerusahaan: string;
  status: string;
  alasanDitolak?: string;
  timestamp: string;
}

const PengajuanTempatPklPage = () => {
  const [pengajuan, setPengajuan] = useState<Pengajuan[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  // Fungsi untuk mengambil data pengajuan
  const fetchPengajuan = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "pengajuan"));

      const pengajuanList: Pengajuan[] = await Promise.all(
        querySnapshot.docs.map(async (docItem) => {
          const data = docItem.data();

          let namaSiswa = "Tidak diketahui";
          const siswaRef = data.diajukan_oleh;

          if (siswaRef && typeof siswaRef === 'object' && 'path' in siswaRef) {
            try {
              const siswaDoc = await getDoc(siswaRef);
              if (siswaDoc.exists()) {
                const siswaData = siswaDoc.data() as { nama?: string };
                namaSiswa = siswaData.nama ?? namaSiswa;
              }
            } catch (error) {
              console.error("Gagal mengambil data siswa:", error);
            }
          }

          return {
            id: docItem.id,
            namaSiswa,
            namaPerusahaan: data.nama_perusahaan || '',
            alamatPerusahaan: data.alamat || '',
            kontakPerusahaan: data.kontak || '',
            bidangPerusahaan: data.bidang || '',
            status: data.status || '',
            alasanDitolak: data.alasan_ditolak || '',
            timestamp: data.timestamp?.toDate().toISOString() || '',
          };
        })
      );

      setPengajuan(pengajuanList);
    } catch (error) {
      console.error("Gagal mengambil data pengajuan:", error);
    }
  };

  useEffect(() => {
    fetchPengajuan();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "pengajuan", id));
      fetchPengajuan(); // Refresh data
      setShowConfirmDelete(false);
    } catch (error) {
      console.error("Gagal menghapus pengajuan:", error);
    }
  };

  const handleUpdate = async (id: string, status: string) => {
    try {
      const pengajuanRef = doc(db, "pengajuan", id);
      await updateDoc(pengajuanRef, {
        status: status,
      });
      fetchPengajuan(); // Refresh data
    } catch (error) {
      console.error("Gagal memperbarui pengajuan:", error);
    }
  };

  // Fungsi untuk menerima pengajuan dan memindahkan data ke koleksi 'perusahaan'
  const handleTerima = async (id: string) => {
    try {
      const pengajuanRef = doc(db, "pengajuan", id);
      const pengajuanDoc = await getDoc(pengajuanRef);
  
      if (pengajuanDoc.exists()) {
        const data = pengajuanDoc.data();
  
        // Data yang akan dipindahkan ke koleksi perusahaan
        const perusahaanData = {
          nama: data?.nama_perusahaan,          // Nama perusahaan
          alamat: data?.alamat,                  // Alamat perusahaan
          bidang: data?.bidang,                  // Bidang perusahaan
          kontak: data?.kontak,                  // Kontak perusahaan
          kuota: 10,                             // Set nilai default untuk kuota (misalnya 10)
          siswa_terdaftar: [],                   // Array kosong untuk siswa terdaftar
          timestamp: data?.timestamp,            // Timestamp jika diperlukan
        };
  
        // Menyimpan data ke koleksi perusahaan
        const perusahaanRef = doc(db, "perusahaan", id); // Menggunakan ID yang sama
        await setDoc(perusahaanRef, perusahaanData);
  
        // Mengupdate status pengajuan menjadi diterima
        await updateDoc(pengajuanRef, {
          status: "diterima",
        });
  
        // Mengambil data pengajuan terbaru
        fetchPengajuan();
      }
    } catch (error) {
      console.error("Gagal menerima pengajuan:", error);
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

  // Pagination and Search
  const filteredPengajuan = pengajuan.filter((data) =>
    data.namaSiswa.toLowerCase().includes(search.toLowerCase()) ||
    data.namaPerusahaan.toLowerCase().includes(search.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPengajuan.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPengajuan.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Manajemen Pengajuan Tempat PKL</h1>

      {/* Search */}
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700">Cari Pengajuan</label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 p-2 rounded-md w-full"
          placeholder="Cari berdasarkan nama siswa atau perusahaan"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border rounded-md overflow-hidden">
  <thead className="bg-gray-100 text-left">
    <tr>
      <th className="px-4 py-3">No.</th>
      <th className="px-4 py-3">Nama Siswa</th>
      <th className="px-4 py-3">Nama Perusahaan</th>
      <th className="px-4 py-3">Alamat</th>
      <th className="px-4 py-3">Kontak</th>
      <th className="px-4 py-3">Bidang</th>
      <th className="px-4 py-3">Status</th>
      <th className="px-4 py-3">Aksi</th>
    </tr>
  </thead>
  <tbody>
    {currentItems.map((pengajuanData, index) => (
      <tr key={pengajuanData.id} className="border-t">
        <td className="px-4 py-2">{(currentPage - 1) * itemsPerPage + index + 1}</td>
        <td className="px-4 py-2">{pengajuanData.namaSiswa}</td>
        <td className="px-4 py-2">{pengajuanData.namaPerusahaan}</td>
        <td className="px-4 py-2">{pengajuanData.alamatPerusahaan}</td>
        <td className="px-4 py-2">{pengajuanData.kontakPerusahaan}</td>
        <td className="px-4 py-2">{pengajuanData.bidangPerusahaan}</td>
        <td className="px-4 py-2 capitalize">{pengajuanData.status}</td>
        <td className="px-4 py-2">
          <div className="flex flex-wrap gap-2">
          <button
              onClick={() => handleTerima(pengajuanData.id)}  // Memanggil handleTerima alih-alih handleUpdate
              className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded-md text-sm"
            >
              Terima
            </button>
            <button
              onClick={() => handleUpdate(pengajuanData.id, 'ditolak')}
              className="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded-md text-sm"
            >
              Tolak
            </button>
            <button
              onClick={() => handleConfirmDelete(pengajuanData.id)}
              className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md text-sm"
            >
              Hapus
            </button>
          </div>
        </td>
      </tr>
    ))}
  </tbody>
</table>

      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4 mt-6">
        <button
          onClick={() => paginate(currentPage - 1)}
          className="bg-gray-300 hover:bg-gray-400 text-black py-1 px-4 rounded-md"
          disabled={currentPage === 1}
        >
          Prev
        </button>
        <span className="text-sm text-gray-600">
          Halaman {currentPage} dari {totalPages}
        </span>
        <button
          onClick={() => paginate(currentPage + 1)}
          className="bg-gray-300 hover:bg-gray-400 text-black py-1 px-4 rounded-md"
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>

      {/* Modal Konfirmasi Hapus */}
      {showConfirmDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4">Konfirmasi Penghapusan</h2>
            <p className="mb-6 text-sm text-gray-600">Apakah Anda yakin ingin menghapus pengajuan ini?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleCancelDelete}
                className="bg-gray-300 hover:bg-gray-400 text-black py-2 px-4 rounded-md"
              >
                Tidak
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md"
              >
                Ya
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PengajuanTempatPklPage;
