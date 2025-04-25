'use client';

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  getDoc,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp,
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
}

const PendaftaranPage = () => {
  const [pendaftaran, setPendaftaran] = useState<Pendaftaran[]>([]);
  const [perusahaanList, setPerusahaanList] = useState<Perusahaan[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [perusahaanId, setPerusahaanId] = useState('');
  const [siswaId, setSiswaId] = useState('');
  const [status, setStatus] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deletingId, setDeletingId] = useState('');

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
      siswaArr.push({ id: doc.id, nama: doc.data().nama });
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

  const handleEdit = (item: Pendaftaran) => {
    setEditMode(true);
    setEditId(item.id);
    setPerusahaanId(item.perusahaan_id);
    setSiswaId(item.siswa_id);
    setStatus(item.status);
  };

  const resetForm = () => {
    setEditMode(false);
    setEditId('');
    setPerusahaanId('');
    setSiswaId('');
    setStatus('');
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "pendaftaran", id));
      setShowConfirmDelete(false);
      fetchPendaftaran();
    } catch (error) {
      console.error("Gagal menghapus pendaftaran:", error);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      // Update status pendaftaran terlebih dahulu
      const pendaftaranRef = doc(db, "pendaftaran", id);
      const pendaftaranSnap = await getDoc(pendaftaranRef);
      const pendaftaranData = pendaftaranSnap.data() as Pendaftaran;
  
      // Jika status diterima, update data perusahaan dan siswa
      if (newStatus === "diterima") {
        const perusahaanRef = doc(db, "perusahaan", pendaftaranData.perusahaan_id);
        const perusahaanSnap = await getDoc(perusahaanRef);
        const perusahaanData = perusahaanSnap.data();
  
        // Pastikan data perusahaan ada sebelum melanjutkan
        if (!perusahaanData) {
          alert("Data perusahaan tidak ditemukan");
          return;
        }
  
        // Periksa kuota perusahaan, jika kuota masih ada
        if (perusahaanData.kuota > 0) {
          // Menambahkan siswa ke field siswa_terdaftar di data perusahaan
          const updatedSiswaList = perusahaanData.siswa_terdaftar || [];
          updatedSiswaList.push(pendaftaranData.siswa_id);
  
          // Mengurangi kuota perusahaan
          await updateDoc(perusahaanRef, {
            siswa_terdaftar: updatedSiswaList,
            kuota: perusahaanData.kuota - 1, // Mengurangi kuota
          });
  
          // Update status pendaftaran menjadi diterima
          await updateDoc(pendaftaranRef, { status: "diterima" });
          fetchPendaftaran();
        } else {
          alert("Kuota perusahaan sudah penuh");
        }
      } else {
        // Jika status ditolak, hanya update status pendaftaran
        await updateDoc(pendaftaranRef, { status: newStatus });
        fetchPendaftaran();
      }
    } catch (error) {
      console.error("Gagal memperbarui status:", error);
    }
  };
  
  
  
  

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-xl font-semibold mb-4">Manajemen Pendaftaran</h1>

      {editMode && (
        <div className="mb-4 space-y-2">
          <div>
            <label className="block font-medium">Perusahaan</label>
            <select
              value={perusahaanId}
              onChange={(e) => setPerusahaanId(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">-- Pilih Perusahaan --</option>
              {perusahaanList.map(p => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium">Siswa</label>
            <select
              value={siswaId}
              onChange={(e) => setSiswaId(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">-- Pilih Siswa --</option>
              {siswaList.map(s => (
                <option key={s.id} value={s.id}>{s.nama}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">-- Pilih Status --</option>
              {statusOptions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Update
            </button>
            <button
              onClick={resetForm}
              className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      <table className="min-w-full table-auto">
      <thead>
  <tr>
    <th className="px-4 py-2 text-left">No</th>
    <th className="px-4 py-2 text-left">Perusahaan</th>
    <th className="px-4 py-2 text-left">Siswa</th>
    <th className="px-4 py-2 text-left">Status</th>
    <th className="px-4 py-2 text-left">Tanggal Daftar</th>
    <th className="px-4 py-2 text-left">Aksi</th>
  </tr>
</thead>
<tbody>
  {pendaftaran.map((item, index) => {
    const perusahaanNama = perusahaanList.find(p => p.id === item.perusahaan_id)?.nama || '-';
    const siswaNama = siswaList.find(s => s.id === item.siswa_id)?.nama || '-';
    return (
      <tr key={item.id} className="border-b">
        <td className="px-4 py-2">{index + 1}</td>
        <td className="px-4 py-2">{perusahaanNama}</td>
        <td className="px-4 py-2">{siswaNama}</td>
        <td className="px-4 py-2 capitalize">{item.status}</td>
        <td className="px-4 py-2">{item.tanggal_daftar?.toDate?.().toLocaleString()}</td>
        <td className="px-4 py-2 space-x-1">
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => handleEdit(item)}
              className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
            >
              Edit
            </button>
            <button
              onClick={() => {
                setDeletingId(item.id);
                setShowConfirmDelete(true);
              }}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              Hapus
            </button>
            <button
              onClick={() => handleStatusUpdate(item.id, "diterima")}
              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
            >
              Terima
            </button>
            <button
              onClick={() => handleStatusUpdate(item.id, "ditolak")}
              className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
            >
              Tolak
            </button>
          </div>
        </td>
      </tr>
    );
  })}
</tbody>
      </table>

      {showConfirmDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-md">
            <p className="mb-4">Yakin ingin menghapus pendaftaran ini?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleDelete(deletingId)}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Ya
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
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

export default PendaftaranPage;
