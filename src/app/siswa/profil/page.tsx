'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

interface SiswaProfile {
  nama: string;
  nisn: string;
  email: string;
  hp: string;
  gender: string;
  ttl: string;
  alamat: string;
  kelas: string;
  jurusan: string;
  password: string;
}

export default function ProfilSiswa() {
  const [profile, setProfile] = useState<SiswaProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordBaru, setPasswordBaru] = useState('');
  const [retypePassword, setRetypePassword] = useState('');
  const [formData, setFormData] = useState<Omit<SiswaProfile, 'password'>>({
    nama: '',
    nisn: '',
    email: '',
    hp: '',
    gender: '',
    ttl: '',
    alamat: '',
    kelas: '',
    jurusan: '',
  });
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    const siswaData = localStorage.getItem('siswa');
    const storedDocId = siswaData ? JSON.parse(siswaData).id : null;
    
    if (storedDocId) {
      const fetchProfile = async () => {
        const profileDocRef = doc(db, 'siswa', storedDocId);
        const docSnapshot = await getDoc(profileDocRef);
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setProfile(data as SiswaProfile);
          setFormData({
            nama: data.nama,
            nisn: data.nisn,
            email: data.email,
            hp: data.hp,
            gender: data.gender,
            ttl: data.ttl,
            alamat: data.alamat,
            kelas: data.kelas,
            jurusan: data.jurusan,
          });
        }
      };
      fetchProfile();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const siswaData = localStorage.getItem('siswa');
    const storedDocId = siswaData ? JSON.parse(siswaData).id : null;
    if (storedDocId) {
      const profileDocRef = doc(db, 'siswa', storedDocId);
      await updateDoc(profileDocRef, {
        ...formData,
      });
      setIsSubmitting(false);
      setModalMessage('Profil berhasil diperbarui!');
      setShowModal(true);
    }
  };

  const handleChangePassword = async () => {
    if (passwordBaru !== retypePassword) {
      setModalMessage('Password tidak cocok!');
      setShowModal(true);
      return;
    }

    const siswaData = localStorage.getItem('siswa');
    const storedDocId = siswaData ? JSON.parse(siswaData).id : null;
    if (storedDocId) {
      const profileDocRef = doc(db, 'siswa', storedDocId);
      await updateDoc(profileDocRef, {
        password: passwordBaru,
      });
      setModalMessage('Password berhasil diperbarui!');
      setShowModal(true);
      setPasswordBaru('');
      setRetypePassword('');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Profil Siswa</h2>

      {profile ? (
        <>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[{ id: 'nama', label: 'Nama' }, { id: 'nisn', label: 'NISN' }, { id: 'email', label: 'Email' }, { id: 'hp', label: 'No. HP' }, { id: 'gender', label: 'Jenis Kelamin' }, { id: 'ttl', label: 'Tempat, Tanggal Lahir' }, { id: 'alamat', label: 'Alamat' }, { id: 'kelas', label: 'Kelas' }, { id: 'jurusan', label: 'Jurusan' }].map((field) => (
              <div key={field.id}>
                <label htmlFor={field.id} className="block text-sm font-medium text-gray-700">{field.label}</label>
                <input
                  id={field.id}
                  name={field.id}
                  type="text"
                  value={(formData as any)[field.id]}
                  onChange={handleChange}
                  className="mt-1 p-2 w-full border rounded-md"
                />
              </div>
            ))}

            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 transition text-white py-2 rounded-md"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Memperbarui...' : 'Perbarui Profil'}
              </button>
            </div>
          </form>

          {/* Form ubah password */}
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold">Ubah Password</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password Baru</label>
              <input
                type="password"
                value={passwordBaru}
                onChange={(e) => setPasswordBaru(e.target.value)}
                className="mt-1 p-2 w-full border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Ulangi Password</label>
              <input
                type="password"
                value={retypePassword}
                onChange={(e) => setRetypePassword(e.target.value)}
                className="mt-1 p-2 w-full border rounded-md"
              />
            </div>

            <button
              onClick={handleChangePassword}
              disabled={!passwordBaru || !retypePassword || passwordBaru !== retypePassword}
              className={`w-full ${passwordBaru && retypePassword && passwordBaru === retypePassword ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'} text-white py-2 rounded-md`}
            >
              Ubah Password
            </button>
          </div>
        </>
      ) : (
        <p>Memuat profil...</p>
      )}

      {/* Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
            <h3 className="text-lg font-semibold mb-4">{modalMessage}</h3>
            <button
              onClick={handleCloseModal}
              className="w-full bg-blue-600 hover:bg-blue-700 transition text-white py-2 rounded-md"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
