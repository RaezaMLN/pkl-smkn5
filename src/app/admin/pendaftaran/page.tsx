'use client';

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  getDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

interface Pendaftaran {
  id: string;
  perusahaan_id: string;
  siswa_id: string;
  status: string;
  tanggal_daftar: any;
}

interface Perusahaan {
  id: string;
  nama: string;
}

interface Siswa {
  id: string;
  nama: string;
  kelas: string;
}

const PendaftaranPage = () => {
  const [pendaftaran, setPendaftaran] = useState<Pendaftaran[]>([]);
  const [perusahaanList, setPerusahaanList] = useState<Perusahaan[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [filterStatus, setFilterStatus] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterPerusahaan, setFilterPerusahaan] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const statusOptions = ["pending", "diterima", "ditolak"];
  

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
  setCurrentPage(1);
}, [
  searchTerm,
  filterStatus,
  filterKelas,
  filterPerusahaan,
  itemsPerPage
]);

  const fetchData = async () => {
    const perusahaanSnap = await getDocs(collection(db, "perusahaan"));
    const siswaSnap = await getDocs(collection(db, "siswa"));
    const pendaftaranSnap = await getDocs(collection(db, "pendaftaran"));

    setPerusahaanList(perusahaanSnap.docs.map(d => ({
      id: d.id,
      nama: d.data().nama
    })));

    setSiswaList(siswaSnap.docs.map(d => ({
      id: d.id,
      nama: d.data().nama,
      kelas: d.data().kelas
    })));

    setPendaftaran(pendaftaranSnap.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as Pendaftaran[]);
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    const ref = doc(db, "pendaftaran", id);
    const snap = await getDoc(ref);
    const data = snap.data() as Pendaftaran;

    if (!data) return;

    if (newStatus === "diterima") {
      const perusahaanRef = doc(db, "perusahaan", data.perusahaan_id);
      const perusahaanSnap = await getDoc(perusahaanRef);

      if (!perusahaanSnap.exists()) return;

      const perusahaanData = perusahaanSnap.data();
      const list = perusahaanData.siswa_terdaftar || [];

      if (!list.includes(data.siswa_id)) {
        list.push(data.siswa_id);
        await updateDoc(perusahaanRef, { siswa_terdaftar: list });
      }

      await updateDoc(ref, { status: "diterima" });
    } else {
      await updateDoc(ref, { status: newStatus });
    }

    fetchData();
  };

  const handleDelete = async (id: string) => {
    const ref = doc(db, "pendaftaran", id);
    await deleteDoc(ref);
    fetchData();
  };

  // FILTER
  const filteredData = pendaftaran.filter(item => {
    const perusahaan = perusahaanList.find(p => p.id === item.perusahaan_id)?.nama || '';
    const siswa = siswaList.find(s => s.id === item.siswa_id);

    const statusFix = item.status === "menunggu" ? "pending" : item.status;

    return (
      (
        perusahaan.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        siswa?.nama?.toLowerCase().includes(debouncedSearch.toLowerCase())
      ) &&
      (filterStatus === '' || statusFix === filterStatus) &&
      (filterKelas === '' || siswa?.kelas === filterKelas) &&
      (filterPerusahaan === '' || item.perusahaan_id === filterPerusahaan)
    );
  });

  // SORT
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField) return 0;

    let aVal: any;
    let bVal: any;

    if (sortField === 'siswa') {
      aVal = siswaList.find(s => s.id === a.siswa_id)?.nama || '';
      bVal = siswaList.find(s => s.id === b.siswa_id)?.nama || '';
    } else if (sortField === 'perusahaan') {
      aVal = perusahaanList.find(p => p.id === a.perusahaan_id)?.nama || '';
      bVal = perusahaanList.find(p => p.id === b.perusahaan_id)?.nama || '';
    } else {
      aVal = a[sortField as keyof Pendaftaran];
      bVal = b[sortField as keyof Pendaftaran];
    }

    return sortDirection === 'asc'
      ? aVal > bVal ? 1 : -1
      : aVal < bVal ? 1 : -1;
  });

  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(
  sortedData.length / itemsPerPage
);

const handleSort = (field: string) => {
  if (sortField === field) {
    setSortDirection(
      sortDirection === "asc"
        ? "desc"
        : "asc"
    );
  } else {
    setSortField(field);
    setSortDirection("asc");
  }
};

const getPageNumbers = () => {
  const pages = [];

  for (
    let i = Math.max(1, currentPage - 2);
    i <= Math.min(totalPages, currentPage + 2);
    i++
  ) {
    pages.push(i);
  }

  return pages;
};

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen w-full transition-colors duration-300">

      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Manajemen Pendaftaran</h1>

      {/* SUMMARY */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {["pending","diterima","ditolak"].map(status => {
          const count = pendaftaran.filter(p =>
            (p.status === "menunggu" ? "pending" : p.status) === status
          ).length;

          return (
            <div key={status} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow dark:shadow-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{status}</p>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{count}</h2>
            </div>
          );
        })}
      </div>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Cari siswa / perusahaan..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 w-full border rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
      />

      {/* FILTER */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">

        <select value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)} className="border p-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600">
          <option value="">Semua Status</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select value={filterKelas} onChange={(e)=>setFilterKelas(e.target.value)} className="border p-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600">
          <option value="">Semua Kelas</option>
         {[...new Set(siswaList.map((s) => s.kelas))]
            .map((k, index) => (
              <option
                key={`${k}-${index}`}
                value={k}
              >
                {k}
              </option>
          ))}
        </select>

        <select value={filterPerusahaan} onChange={(e)=>setFilterPerusahaan(e.target.value)} className="border p-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600">
          <option value="">Semua Perusahaan</option>
          {perusahaanList.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
        </select>

        <select value={itemsPerPage} onChange={(e)=>setItemsPerPage(parseInt(e.target.value))} className="border p-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600">
          {[5, 10, 20, 50].map((n) => (
            <option
              key={n}
              value={n}
            >
              {n} / halaman
            </option>
          ))}
        </select>

      </div>

      {/* TABLE */}
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-lg">
        <table className="w-full">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-gray-900 dark:text-white">No</th>
              <th className="px-4 py-3 cursor-pointer text-gray-900 dark:text-white" onClick={()=>handleSort("perusahaan")}>Perusahaan</th>
              <th className="px-4 py-3 cursor-pointer text-gray-900 dark:text-white" onClick={()=>handleSort("siswa")}>Siswa</th>
              <th className="px-4 py-3 text-gray-900 dark:text-white">Kelas</th>
              <th className="px-4 py-3 cursor-pointer text-gray-900 dark:text-white" onClick={()=>handleSort("status")}>Status</th>
              <th className="px-4 py-3 cursor-pointer text-gray-900 dark:text-white" onClick={()=>handleSort("tanggal_daftar")}>Tanggal</th>
              <th className="px-4 py-3 text-gray-900 dark:text-white">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {paginatedData.map((item, i) => {
              const perusahaan = perusahaanList.find(p => p.id === item.perusahaan_id);
              const siswa = siswaList.find(s => s.id === item.siswa_id);
              const statusFix = item.status === "menunggu" ? "pending" : item.status;

              return (
                <tr key={item.id} className="border-t hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-700">
                  <td className="px-4 py-3 text-gray-900 dark:text-white">
                    {(currentPage - 1) * itemsPerPage + i + 1}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{perusahaan?.nama}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{siswa?.nama}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 text-xs">
                      {siswa?.kelas}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium
                        ${
                          statusFix === "diterima"
                            ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200"
                            : statusFix === "ditolak"
                            ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200"
                            : "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200"
                        }
                      `}
                    >
                      {statusFix}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{item.tanggal_daftar?.toDate?.().toLocaleDateString()}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={()=>handleStatusUpdate(item.id,"diterima")} className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded transition">✔</button>
                    <button onClick={()=>handleStatusUpdate(item.id,"ditolak")} className="bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white px-2 py-1 rounded transition">✖</button>
                    <button onClick={()=>handleDelete(item.id)} className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition">🗑</button>
                  </td>
                </tr>
              );
            })}
          </tbody>

        </table>
      </div>
      {/* PAGINATION */}
<div className="flex justify-between items-center mt-6">

  <p className="text-sm text-gray-500 dark:text-gray-400">
    Total {sortedData.length} data
  </p>

  <div className="flex gap-2">

    <button
      disabled={currentPage === 1}
      onClick={() =>
        setCurrentPage(currentPage - 1)
      }
      className="px-3 py-2 border rounded disabled:opacity-50 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
    >
      Prev
    </button>

    {getPageNumbers().map((page) => (
      <button
        key={page}
        onClick={() =>
          setCurrentPage(page)
        }
        className={`px-3 py-2 rounded transition ${
          currentPage === page
            ? "bg-blue-600 text-white"
            : "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
        }`}
      >
        {page}
      </button>
    ))}

    <button
      disabled={
        currentPage === totalPages
      }
      onClick={() =>
        setCurrentPage(currentPage + 1)
      }
      className="px-3 py-2 border rounded disabled:opacity-50 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
    >
      Next
    </button>

  </div>

</div>

    </div>
  );
};

export default PendaftaranPage;