'use client';

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import Select from 'react-select';
import { motion } from 'framer-motion';

interface Pendaftaran {
  id: string;
  perusahaan_id: string;
  siswa_id: string;
  kelas: string;
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
  jurusan: string;
}

const ITEMS_PER_PAGE = 5;

const PendaftaranPage = () => {
  const [pendaftaran, setPendaftaran] = useState<Pendaftaran[]>([]);
  const [perusahaanList, setPerusahaanList] = useState<Perusahaan[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [perusahaanId, setPerusahaanId] = useState('');
  const [siswaId, setSiswaId] = useState('');
  const [status, setStatus] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerusahaan, setSelectedPerusahaan] = useState<{ label: string, value: string } | null>(null);
  const [selectedJurusan, setSelectedJurusan] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const statusOptions = ["menunggu", "diterima", "ditolak"];

  const fetchMaps = async () => {
    const perusahaanSnap = await getDocs(collection(db, "perusahaan"));
    const siswaSnap = await getDocs(collection(db, "siswa"));

    const perusahaanArr: Perusahaan[] = [];
    perusahaanSnap.forEach(doc => {
      perusahaanArr.push({ id: doc.id, nama: doc.data().nama });
    });

    const siswaArr: Siswa[] = [];
    siswaSnap.forEach(doc => {
      siswaArr.push({
        id: doc.id,
        nama: doc.data().nama,
        kelas: doc.data().kelas,
        jurusan: doc.data().jurusan
      });
    });

    setPerusahaanList(perusahaanArr);
    setSiswaList(siswaArr);
  };

  const fetchPendaftaran = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "pendaftaran"));
      const list = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Pendaftaran[];
      setPendaftaran(list);
    } catch (error) {
      console.error("Gagal mengambil data pendaftaran:", error);
    }
  };

  useEffect(() => {
    fetchPendaftaran();
    fetchMaps();
  }, []);

  const handleUpdate = async () => {
    try {
      await updateDoc(doc(db, "pendaftaran", editId), {
        perusahaan_id: perusahaanId,
        siswa_id: siswaId,
        status,
      });
      resetForm();
      fetchPendaftaran();
    } catch (error) {
      console.error("Gagal memperbarui pendaftaran:", error);
    }
  };

  const resetForm = () => {
    setEditMode(false);
    setEditId('');
    setPerusahaanId('');
    setSiswaId('');
    setStatus('');
  };

  const perusahaanOptions = perusahaanList.map(p => ({ label: p.nama, value: p.id }));
  const jurusanOptions = Array.from(new Set(siswaList.map(s => s.jurusan).filter(Boolean)))
    .map(jurusan => ({ label: jurusan, value: jurusan }));

  const filteredData = pendaftaran.filter(item => {
    const perusahaanNama = perusahaanList.find(p => p.id === item.perusahaan_id)?.nama || '';
    const siswa = siswaList.find(s => s.id === item.siswa_id);
    const siswaNama = siswa?.nama || '';
    const matchSearch = perusahaanNama.toLowerCase().includes(searchTerm.toLowerCase()) || siswaNama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPerusahaan = selectedPerusahaan ? item.perusahaan_id === selectedPerusahaan.value : true;
    const matchJurusan = selectedJurusan ? siswa?.jurusan === selectedJurusan : true;

    return matchSearch && matchPerusahaan && matchJurusan;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <motion.div 
      className="container mx-auto p-4 w-full"
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold mb-6 text-center text-blue-700">Manajemen Pendaftaran</h1>

      <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input
          type="text"
          placeholder="Cari nama perusahaan/siswa"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="border px-3 py-2 rounded shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />

        <Select
          options={perusahaanOptions}
          value={selectedPerusahaan}
          onChange={(option) => {
            setSelectedPerusahaan(option);
            setCurrentPage(1);
          }}
          isClearable
          placeholder="Filter perusahaan"
        />

        <Select
          options={jurusanOptions}
          value={selectedJurusan ? { label: selectedJurusan, value: selectedJurusan } : null}
          onChange={(option) => {
            setSelectedJurusan(option ? option.value : null);
            setCurrentPage(1);
          }}
          isClearable
          placeholder="Filter jurusan"
        />
      </motion.div>

      <div className="flex items-center gap-2 mb-4">
        <label className="font-medium">Data per halaman:</label>
        <select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(parseInt(e.target.value));
            setCurrentPage(1);
          }}
          className="border rounded px-3 py-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
        >
          {[10, 20, 50].map((count) => (
            <option key={count} value={count}>{count}</option>
          ))}
        </select>
      </div>

      <motion.table 
        className="min-w-full table-auto border shadow rounded-lg overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <thead className="bg-blue-100">
          <tr>
            <th className="px-4 py-2 text-left">No</th>
            <th className="px-4 py-2 text-left">Perusahaan</th>
            <th className="px-4 py-2 text-left">Siswa</th>
            <th className="px-4 py-2 text-left">Kelas</th>
            <th className="px-4 py-2 text-left">Jurusan</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-left">Tanggal Daftar</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((item, index) => {
            const perusahaanNama = perusahaanList.find(p => p.id === item.perusahaan_id)?.nama || '-';
            const siswa = siswaList.find(s => s.id === item.siswa_id);
            return (
              <motion.tr
                key={item.id}
                className="border-b hover:bg-blue-50"
                whileHover={{ scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <td className="px-4 py-2">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                <td className="px-4 py-2">{perusahaanNama}</td>
                <td className="px-4 py-2">{siswa?.nama || '-'}</td>
                <td className="px-4 py-2 capitalize">{siswa?.kelas || '-'}</td>
                <td className="px-4 py-2 capitalize">{siswa?.jurusan || '-'}</td>
                <td className="px-4 py-2 capitalize">{item.status}</td>
                <td className="px-4 py-2">{item.tanggal_daftar?.toDate?.().toLocaleString()}</td>
              </motion.tr>
            );
          })}
        </tbody>
      </motion.table>

      <div className="flex justify-center mt-6 space-x-2">
        {Array.from({ length: totalPages }).map((_, idx) => (
          <button
            key={idx + 1}
            onClick={() => setCurrentPage(idx + 1)}
            className={`px-3 py-1 rounded font-medium transition-all duration-200 ${currentPage === idx + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default PendaftaranPage;