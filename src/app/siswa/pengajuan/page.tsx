'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc } from 'firebase/firestore';

export default function PengajuanPkl() {
  const [formData, setFormData] = useState({
    nama_perusahaan: '',
    alamat: '',
    kontak: '',
    bidang: '',
  });

  const [siswaId, setSiswaId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Ambil data siswa dari localStorage
  useEffect(() => {
    const siswaData = localStorage.getItem('siswa');
    if (siswaData) {
      const parsed = JSON.parse(siswaData);
      setSiswaId(parsed.id); // Pastikan kamu simpan id siswa saat login
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const { nama_perusahaan, alamat, kontak, bidang } = formData;

    if (!nama_perusahaan || !alamat || !kontak || !bidang) {
      setErrorMessage('Semua field harus diisi!');
      setIsSubmitting(false);
      return;
    }

    if (!siswaId) {
      setErrorMessage('Data siswa tidak ditemukan. Silakan login ulang.');
      setIsSubmitting(false);
      return;
    }

    try {
      const pengajuanCollection = collection(db, 'pengajuan');
      const siswaRef = doc(db, 'siswa', siswaId);

      await addDoc(pengajuanCollection, {
        nama_perusahaan,
        alamat,
        kontak,
        bidang,
        diajukan_oleh: siswaRef,
        status: 'menunggu',
        alasan_ditolak: '',
        timestamp: new Date(),
      });

      setFormData({
        nama_perusahaan: '',
        alamat: '',
        kontak: '',
        bidang: '',
      });

      alert('Pengajuan berhasil dikirim!');
    } catch (error) {
      console.error('Gagal mengirim pengajuan:', error);
      setErrorMessage('Terjadi kesalahan. Coba lagi nanti.');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Pengajuan Tempat PKL Baru</h1>

      {errorMessage && <div className="text-red-500 mb-4">{errorMessage}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField label="Nama Perusahaan" name="nama_perusahaan" value={formData.nama_perusahaan} onChange={handleChange} />
        <InputField label="Alamat" name="alamat" value={formData.alamat} onChange={handleChange} />
        <InputField label="Kontak" name="kontak" value={formData.kontak} onChange={handleChange} />
        <InputField label="Bidang" name="bidang" value={formData.bidang} onChange={handleChange} />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          {isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan'}
        </button>
      </form>
    </div>
  );
}

function InputField({ label, name, value, onChange }: any) {
  return (
    <div>
      <label className="block text-sm font-medium">{label}</label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        className="mt-1 p-2 w-full border rounded-md"
        required
      />
    </div>
  );
}
