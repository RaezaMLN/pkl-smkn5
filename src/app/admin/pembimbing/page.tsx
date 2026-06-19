'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import * as XLSX from "xlsx";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Plus, Trash, Pencil, FileUp } from "lucide-react";


interface Pembimbing {
  id: string;
  nama: string;
  no_hp: string;
  nip: string;
  nik: string;
  password: string;
}

export default function AdminPembimbingPage() {
  const [data, setData] = useState<Pembimbing[]>([]);
  const [nama, setNama] = useState('');
  const [noHp, setNoHp] = useState('');
  const [nip, setNip] = useState('');
  const [nik, setNik] = useState('');
  const [password, setPassword] = useState('');

  const [editId, setEditId] = useState<string | null>(null);

  const fetchData = async () => {
    const snap = await getDocs(collection(db, 'pembimbing'));
    const list = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Pembimbing[];

    setData(list);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setNama('');
    setNoHp('');
    setNip('');
    setNik('');
    setPassword('');
    setEditId(null);
  };

  const handleSubmit = async () => {
    if (!nama || !nik || !password) {
      alert('Field wajib diisi');
      return;
    }

    if (editId) {
      await updateDoc(doc(db, 'pembimbing', editId), {
        nama,
        no_hp: noHp,
        nip,
        nik,
        password,
      });
    } else {
      await addDoc(collection(db, 'pembimbing'), {
        nama,
        no_hp: noHp,
        nip,
        nik,
        password,
      });
    }

    resetForm();
    fetchData();
  };

  const handleEdit = (item: Pembimbing) => {
    setNama(item.nama);
    setNoHp(item.no_hp);
    setNip(item.nip);
    setNik(item.nik);
    setPassword(item.password);
    setEditId(item.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus data ini?')) return;

    await deleteDoc(doc(db, 'pembimbing', id));
    fetchData();
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (evt) => {
    const data = new Uint8Array(evt.target?.result as ArrayBuffer);
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // ✅ Tambahkan generic <Pembimbing>
    const rows: Pembimbing[] = XLSX.utils.sheet_to_json<Pembimbing>(sheet);

    for (const row of rows) {
      await addDoc(collection(db, "pembimbing"), {
        nama: row.nama,
        no_hp: row.no_hp,
        nip: row.nip || "",
        nik: row.nik,
        password: row.password,
      });
    }

    fetchData();
    alert("Import Excel selesai!");
  };
  reader.readAsArrayBuffer(file);
};
  

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">

      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Manajemen Pembimbing
      </h1>

      {/* FORM */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow dark:shadow-lg mb-6"
      >
        <div className="grid md:grid-cols-2 gap-4">

          <input
            placeholder="Nama"
            value={nama}
            onChange={e => setNama(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />

          <input
            placeholder="No HP"
            value={noHp}
            onChange={e => setNoHp(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />

          <input
            placeholder="NIP (opsional)"
            value={nip}
            onChange={e => setNip(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />

          <input
            placeholder="NIK (username)"
            value={nik}
            onChange={e => setNik(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

       <div className="mt-4 flex gap-2">
          {/* Tombol Tambah/Update */}
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
          >
            <Plus size={16} />
            {editId ? "Update" : "Tambah"}
          </button>

          {/* Tombol Import Excel */}
          <label className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded cursor-pointer transition">
            <FileUp size={16} />
            <span>Import</span>
            <input
              type="file"
              accept=".xlsx"
              onChange={handleImportExcel}
              className="hidden"
            />
          </label>
        </div>


      </motion.div>

      {/* TABLE */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-lg p-4">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Daftar Pembimbing
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <th className="px-3 py-2 text-gray-900 dark:text-white">No</th>
                <th className="px-3 py-2 text-gray-900 dark:text-white">Nama</th>
                <th className="px-3 py-2 text-gray-900 dark:text-white">No HP</th>
                <th className="px-3 py-2 text-gray-900 dark:text-white">NIP</th>
                <th className="px-3 py-2 text-gray-900 dark:text-white">NIK</th>
                <th className="px-3 py-2 text-gray-900 dark:text-white">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {data.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <td className="px-3 py-2 text-gray-900 dark:text-white">{index + 1}</td>
                  <td className="px-3 py-2 text-gray-900 dark:text-white">{item.nama}</td>
                  <td className="px-3 py-2 text-gray-900 dark:text-white">{item.no_hp}</td>
                  <td className="px-3 py-2 text-gray-900 dark:text-white">{item.nip || '-'}</td>
                  <td className="px-3 py-2 text-gray-900 dark:text-white">{item.nik}</td>
                  <td className="px-3 py-2 flex gap-2">

                    <button
                      onClick={() => handleEdit(item)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded transition"
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition"
                    >
                      <Trash size={14} />
                    </button>

                  </td>
                </tr>
              ))}

              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-900 dark:text-gray-300">
                    Belum ada data
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
}