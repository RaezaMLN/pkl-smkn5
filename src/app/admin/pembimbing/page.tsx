'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Plus, Trash, Pencil } from 'lucide-react';

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

  return (
    <div className="p-6">

      <h1 className="text-2xl font-bold mb-6">
        Manajemen Pembimbing
      </h1>

      {/* FORM */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-xl shadow mb-6"
      >
        <div className="grid md:grid-cols-2 gap-4">

          <input
            placeholder="Nama"
            value={nama}
            onChange={e => setNama(e.target.value)}
            className="border p-2 rounded"
          />

          <input
            placeholder="No HP"
            value={noHp}
            onChange={e => setNoHp(e.target.value)}
            className="border p-2 rounded"
          />

          <input
            placeholder="NIP (opsional)"
            value={nip}
            onChange={e => setNip(e.target.value)}
            className="border p-2 rounded"
          />

          <input
            placeholder="NIK (username)"
            value={nik}
            onChange={e => setNik(e.target.value)}
            className="border p-2 rounded"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border p-2 rounded"
          />
        </div>

        <button
          onClick={handleSubmit}
          className="mt-4 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus size={16} />
          {editId ? 'Update' : 'Tambah'}
        </button>
      </motion.div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-lg font-semibold mb-4">
          Daftar Pembimbing
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2">No</th>
                <th className="px-3 py-2">Nama</th>
                <th className="px-3 py-2">No HP</th>
                <th className="px-3 py-2">NIP</th>
                <th className="px-3 py-2">NIK</th>
                <th className="px-3 py-2">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {data.map((item, index) => (
                <tr key={item.id}>
                  <td className="px-3 py-2">{index + 1}</td>
                  <td className="px-3 py-2">{item.nama}</td>
                  <td className="px-3 py-2">{item.no_hp}</td>
                  <td className="px-3 py-2">{item.nip || '-'}</td>
                  <td className="px-3 py-2">{item.nik}</td>
                  <td className="px-3 py-2 flex gap-2">

                    <button
                      onClick={() => handleEdit(item)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded"
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="bg-red-600 text-white px-2 py-1 rounded"
                    >
                      <Trash size={14} />
                    </button>

                  </td>
                </tr>
              ))}

              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-4">
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