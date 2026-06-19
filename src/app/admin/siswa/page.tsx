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
    nama: "",
    alamat: "",
    email: "",
    gender: "",
    hp: "",
    jurusan: "",
    kelas: "",
    konfirmasi: "",
    nisn: "",
    password: "",
    ttl: "",
  });

  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [showConfirmDelete, setShowConfirmDelete] =
    useState(false);

  const [deletingId, setDeletingId] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedKelas, setSelectedKelas] =
    useState("all");

  const [sortNama, setSortNama] =
  useState("default");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [itemsPerPage, setItemsPerPage] =
    useState(20);

  const [showExcelModal, setShowExcelModal] =
    useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchSiswa = async () => {
    try {
      const querySnapshot = await getDocs(
        collection(db, "siswa")
      );

      const siswaList = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Siswa)
      );

      setSiswa(siswaList);
    } catch (error) {
      console.error(
        "Gagal mengambil data siswa:",
        error
      );
    }
  };

  useEffect(() => {
    fetchSiswa();
  }, []);

  const handleAdd = async () => {
    try {
      await addDoc(
        collection(db, "siswa"),
        form
      );

      resetForm();
      fetchSiswa();
    } catch (error) {
      console.error(
        "Gagal menambah siswa:",
        error
      );
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
      const siswaRef = doc(
        db,
        "siswa",
        editId
      );

      await updateDoc(siswaRef, form);

      resetForm();
      fetchSiswa();
    } catch (error) {
      console.error(
        "Gagal memperbarui siswa:",
        error
      );
    }
  };

  const resetForm = () => {
    setForm({
      nama: "",
      alamat: "",
      email: "",
      gender: "",
      hp: "",
      jurusan: "",
      kelas: "",
      konfirmasi: "",
      nisn: "",
      password: "",
      ttl: "",
    });

    setEditMode(false);
    setEditId("");
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(
        doc(db, "siswa", id)
      );

      fetchSiswa();
      setShowConfirmDelete(false);
    } catch (error) {
      console.error(
        "Gagal menghapus siswa:",
        error
      );
    }
  };

  // daftar kelas unik
  const kelasList = [
    "all",
    ...Array.from(
      new Set(
        siswa
          .map((item) => item.kelas)
          .filter(
            (kelas) =>
              kelas &&
              kelas.trim() !== ""
          )
      )
    ),
  ];

  // filter nama + kelas
  const filteredSiswa = siswa
  .filter((item) => {
    const cocokNama =
      typeof item.nama === "string" &&
      item.nama
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const cocokKelas =
      selectedKelas === "all"
        ? true
        : item.kelas === selectedKelas;

    return cocokNama && cocokKelas;
  })
  .sort((a, b) => {
    if (sortNama === "az") {
      return a.nama.localeCompare(
        b.nama,
        "id"
      );
    }

    if (sortNama === "za") {
      return b.nama.localeCompare(
        a.nama,
        "id"
      );
    }

    return 0;
  });

  // reset pagination saat filter berubah
 useEffect(() => {
  setCurrentPage(1);
}, [
  searchTerm,
  selectedKelas,
  sortNama,
]);

  const totalPages = Math.ceil(
    filteredSiswa.length /
      itemsPerPage
  );

  const paginatedSiswa =
    filteredSiswa.slice(
      (currentPage - 1) *
        itemsPerPage,
      currentPage *
        itemsPerPage
    );
  return (
  <div className="max-w-7xl mx-auto p-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">

    {/* HEADER */}
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
        Manajemen Siswa
      </h1>

      <p className="text-slate-500 dark:text-gray-400 mt-1">
        Kelola data siswa dan filter berdasarkan kelas.
      </p>
    </div>

    {/* STATISTIK */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-5 shadow-sm dark:shadow-md">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Total Siswa
        </p>
        <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
          {siswa.length}
        </h2>
      </div>

      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-5 shadow-sm dark:shadow-md">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Total Kelas
        </p>
        <h2 className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
          {kelasList.length - 1}
        </h2>
      </div>

      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-5 shadow-sm dark:shadow-md">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Hasil Filter
        </p>
        <h2 className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
          {filteredSiswa.length}
        </h2>
      </div>
    </div>

    {/* TOOLBAR */}
    <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-sm dark:shadow-md p-4 mb-6">
      <div className="flex flex-col lg:flex-row gap-4 justify-between">

        <button
          onClick={() => {
            setShowForm(!showForm);
            resetForm();
          }}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
        >
          {showForm ? "Tutup Form" : "Tambah Siswa"}
        </button>

        <div className="flex flex-wrap gap-3">

          <input
            type="text"
            placeholder="Cari siswa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />

          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {kelasList.map((kelas) => (
              <option
                key={kelas}
                value={kelas}
              >
                {kelas === "all"
                  ? "Semua Kelas"
                  : kelas}
              </option>
            ))}
          </select>
          {/* Sort  */}
          <select
            value={sortNama}
            onChange={(e) =>
              setSortNama(e.target.value)
            }
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="default">
              Urutan Default
            </option>

            <option value="az">
              Nama A - Z
            </option>

            <option value="za">
              Nama Z - A
            </option>
          </select>

          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {[5, 10, 20, 50].map((num) => (
              <option key={num} value={num}>
                {num}/halaman
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowExcelModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            Download Excel
          </button>

        </div>
      </div>
    </div>

    {/* FORM */}
    {showForm && (
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-sm dark:shadow-md p-5 mb-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.keys(form).map((key) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </label>

              <input
                type="text"
                name={key}
                value={(form as any)[key]}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={editMode ? handleUpdate : handleAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            {editMode
              ? "Update Siswa"
              : "Simpan Siswa"}
          </button>

          <button
            onClick={resetForm}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded-lg transition"
          >
            Batal
          </button>
        </div>

      </div>
    )}

    {showExcelModal && (
      <DownloadExcelModal
        open={showExcelModal}
        onClose={() =>
          setShowExcelModal(false)
        }
      />
    )}

    {/* TABEL */}
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm dark:shadow-md">
      <table className="min-w-full text-sm">

        <thead className="bg-slate-50 dark:bg-gray-700">
          <tr>
            <th className="px-3 py-3 text-left text-gray-900 dark:text-white">No</th>
            <th className="px-3 py-3 text-left text-gray-900 dark:text-white">Nama</th>
            <th className="px-3 py-3 text-left text-gray-900 dark:text-white">Email</th>
            <th className="px-3 py-3 text-left text-gray-900 dark:text-white">NISN</th>
            <th className="px-3 py-3 text-left text-gray-900 dark:text-white">Kelas</th>
            <th className="px-3 py-3 text-left text-gray-900 dark:text-white">No HP</th>
            <th className="px-3 py-3 text-center text-gray-900 dark:text-white">Aksi</th>
          </tr>
        </thead>

        <tbody>
          {paginatedSiswa.map((s, i) => (
            <tr
              key={s.id}
              className="border-t border-gray-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
            >
              <td className="px-3 py-3">
                {(currentPage - 1) *
                  itemsPerPage +
                  i +
                  1}
              </td>

              <td className="px-3 py-3">
                {s.nama}
              </td>

              <td className="px-3 py-3">
                {s.email}
              </td>

              <td className="px-3 py-3">
                {s.nisn}
              </td>

              <td className="px-3 py-3">
                <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 text-xs">
                  {s.kelas}
                </span>
              </td>

              <td className="px-3 py-3">
                {s.hp}
              </td>

              <td className="px-3 py-3 text-center space-x-2">
                <button
                  onClick={() =>
                    handleEdit(s)
                  }
                  className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded transition"
                >
                  Edit
                </button>

                <button
                  onClick={() => {
                    setDeletingId(s.id);
                    setShowConfirmDelete(true);
                  }}
                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded transition"
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>

      </table>
    </div>

    {/* PAGINATION */}
    <div className="flex justify-center mt-6 gap-2">
      <button
        disabled={currentPage === 1}
        onClick={() =>
          setCurrentPage((prev) =>
            Math.max(prev - 1, 1)
          )
        }
        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        Prev
      </button>

      {Array.from(
        { length: totalPages },
        (_, i) => (
          <button
            key={i}
            onClick={() =>
              setCurrentPage(i + 1)
            }
            className={`px-4 py-2 rounded-lg transition ${
              currentPage === i + 1
                ? "bg-blue-600 text-white"
                : "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            {i + 1}
          </button>
        )
      )}

      <button
        disabled={currentPage === totalPages}
        onClick={() =>
          setCurrentPage((prev) =>
            Math.min(
              prev + 1,
              totalPages
            )
          )
        }
        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        Next
      </button>
    </div>

    {/* MODAL DELETE */}
    {showConfirmDelete && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-[400px]">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Yakin ingin menghapus siswa ini?
          </h2>

          <div className="flex justify-end gap-2">
            <button
              onClick={() =>
                setShowConfirmDelete(false)
              }
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded transition"
            >
              Batal
            </button>

            <button
              onClick={() =>
                handleDelete(deletingId)
              }
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition"
            >
              Ya, Hapus
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
};

export default SiswaPage;
