'use client';

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import DownloadExcelModal from "@/components/admin/DownloadSiswaModal";


interface Siswa {
  id: string;
  nama: string;
  alamat: string;
  email: string;
  gender: string;
  hp: string;
  jurusan: string;
  kelas: string;
  konfirmasi: string;
  nisn: string;
  password: string;
  ttl: string;
}

const SiswaPage = () => {
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [form, setForm] = useState<Omit<Siswa, "id">>({
    nama: "", alamat: "", email: "", gender: "", hp: "", jurusan: "",
    kelas: "", konfirmasi: "", nisn: "", password: "", ttl: ""
  });
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  // Search & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const fetchSiswa = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "siswa"));
      const siswaList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Siswa));
      setSiswa(siswaList);
    } catch (error) {
      console.error("Gagal mengambil data siswa:", error);
    }
  };

  useEffect(() => {
    fetchSiswa();
  }, []);

  const handleAdd = async () => {
    try {
      await addDoc(collection(db, "siswa"), form);
      resetForm();
      fetchSiswa();
    } catch (error) {
      console.error("Gagal menambah siswa:", error);
    }
  };

  const handleEdit = (s: Siswa) => {
    setEditMode(true);
    setEditId(s.id);
    const { id, ...formData } = s;
    setForm(formData);
    setShowForm(true);
  };

  const handleUpdate = async () => {
    try {
      const siswaRef = doc(db, "siswa", editId);
      await updateDoc(siswaRef, form);
      resetForm();
      fetchSiswa();
    } catch (error) {
      console.error("Gagal memperbarui siswa:", error);
    }
  };

  const resetForm = () => {
    setForm({
      nama: "", alamat: "", email: "", gender: "", hp: "", jurusan: "",
      kelas: "", konfirmasi: "", nisn: "", password: "", ttl: ""
    });
    setEditMode(false);
    setEditId('');
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "siswa", id));
      fetchSiswa();
      setShowConfirmDelete(false);
    } catch (error) {
      console.error("Gagal menghapus siswa:", error);
    }
  };

  // Filtered & Paginated Data
  const filteredSiswa = siswa.filter(s =>
    s.nama.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredSiswa.length / itemsPerPage);
  const paginatedSiswa = filteredSiswa.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );


  const [showExcelModal, setShowExcelModal] = useState(false);


  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <h1 className="text-xl font-semibold mb-4">Manajemen Siswa</h1>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <button
          onClick={() => {
            setShowForm(!showForm);
            resetForm();
          }}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          {showForm ? "Tutup Form" : "Tambah Siswa"}
        </button>

        <div className="flex items-center gap-2">
          <label htmlFor="search" className="text-sm">Cari Nama:</label>
          <input
            id="search"
            type="text"
            placeholder="Cari siswa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded"
          />
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1); // reset ke halaman pertama
            }}
            className="px-2 py-1 border border-gray-300 rounded"
          >
            {[5, 10, 20, 50].map(num => (
              <option key={num} value={num}>{num}/halaman</option>
            ))}
          </select>
        </div>
      </div>

      {/* Form Input */}
      {showForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {Object.keys(form).map((key) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </label>
              <input
                type="text"
                name={key}
                value={(form as any)[key]}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <div className="md:col-span-2 flex gap-2">
            <button
              onClick={editMode ? handleUpdate : handleAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {editMode ? "Update Siswa" : "Simpan Siswa"}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      <button
  onClick={() => setShowExcelModal(true)}
  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
>
  Download Excel
</button>

{showExcelModal && (
  <DownloadExcelModal
    open={showExcelModal} onClose={() => setShowExcelModal(false)}
  />
)}


      {/* Daftar Siswa */}
      <table className="min-w-full table-auto mt-6 text-sm border">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-2 py-2 border">No</th>
            <th className="px-2 py-2 border">Nama</th>
            <th className="px-2 py-2 border">Email</th>
            <th className="px-2 py-2 border">NISN</th>
            <th className="px-2 py-2 border">Kelas</th>
            <th className="px-2 py-2 border">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {paginatedSiswa.map((s, i) => (
            <tr key={s.id} className="border-b">
              <td className="px-2 py-1 text-center">
                {(currentPage - 1) * itemsPerPage + i + 1}
              </td>
              <td className="px-2 py-1">{s.nama}</td>
              <td className="px-2 py-1">{s.email}</td>
              <td className="px-2 py-1">{s.nisn}</td>
              <td className="px-2 py-1">{s.kelas}</td>
              <td className="px-2 py-1 space-x-2 text-center">
                <button
                  onClick={() => handleEdit(s)}
                  className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setDeletingId(s.id);
                    setShowConfirmDelete(true);
                  }}
                  className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    {/* Pagination */}
<div className="flex justify-center mt-4 gap-2 items-center">
  {/* Tombol Kembali */}
  <button
    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
    className="px-3 py-1 rounded border bg-white hover:bg-gray-200 disabled:opacity-50"
    disabled={currentPage === 1}
  >
    &lt; Prev
  </button>

  {/* Nomor Halaman */}
  {Array.from({ length: totalPages }, (_, i) => (
    <button
      key={i}
      onClick={() => setCurrentPage(i + 1)}
      className={`px-3 py-1 rounded border ${
        currentPage === i + 1
          ? 'bg-blue-600 text-white'
          : 'bg-white hover:bg-gray-200'
      }`}
    >
      {i + 1}
    </button>
  ))}

  {/* Tombol Next */}
  <button
    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
    className="px-3 py-1 rounded border bg-white hover:bg-gray-200 disabled:opacity-50"
    disabled={currentPage === totalPages}
  >
    Next &gt;
  </button>
</div>


      {/* Modal Hapus */}
      {showConfirmDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg text-center">
            <h2 className="mb-4 text-lg font-semibold">Yakin ingin menghapus siswa ini?</h2>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => handleDelete(deletingId)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Ya, Hapus
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiswaPage;
