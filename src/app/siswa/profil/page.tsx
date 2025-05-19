'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import CreatableSelect from 'react-select/creatable';


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
  // penambahan
  wali: string;
  no_wali: string;
  ibu: string;
  no_ibu: string;
  ayah: string;
  no_ayah: string;
  alamat_ortu: string;
  agama: string;
  kewarganegaraan: string;
  p_sd: string;
  p_smp: string;
  p_smk: string;
  keterampilan_teknis: string[];
  keterampilan_nonteknis: string[];
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
    wali: '',
    no_wali: '',
    ayah: '',
    no_ayah: '',
    ibu: '',
    no_ibu: '',
    alamat_ortu: '',
    agama: '',
    kewarganegaraan: '',
    p_sd: '',
    p_smp: '',
    p_smk: '',
    keterampilan_teknis: [],
    keterampilan_nonteknis: [],
  });

const opsiTeknis = [
  { value: 'HTML', label: 'HTML' },
  { value: 'CSS', label: 'CSS' },
  { value: 'React', label: 'React' },
  { value: 'Firebase', label: 'Firebase' },
];

const opsiNonTeknis = [
  { value: 'Public Speaking', label: 'Public Speaking' },
  { value: 'Teamwork', label: 'Teamwork' },
  { value: 'Leadership', label: 'Leadership' },
];



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
            wali: data.wali,
            no_wali: data.no_wali,
            ayah: data.ayah,
            no_ayah: data.no_ayah,
            ibu: data.ibu,
            no_ibu: data.no_ibu,
            alamat_ortu: data.alamat_ortu,
            agama: data.agama,
            kewarganegaraan: data.kewarganegaraan,
            p_sd: data.p_sd,
            p_smp: data.p_smp,
            p_smk: data.p_smk,
            keterampilan_teknis: Array.isArray(data.keterampilan_teknis)
            ? data.keterampilan_teknis
            : data.keterampilan_teknis
            ? data.keterampilan_teknis.split(',').map((s:string) => s.trim())
            : [],
          keterampilan_nonteknis: Array.isArray(data.keterampilan_nonteknis)
            ? data.keterampilan_nonteknis
            : data.keterampilan_nonteknis
            ? data.keterampilan_nonteknis.split(',').map((s:string) => s.trim())
            : [],
          });
        }
      };
      fetchProfile();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
  
      // Filter formData supaya tidak ada undefined
      const filteredData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== undefined)
      );
  
      try {
        await updateDoc(profileDocRef, filteredData);
        setModalMessage('Profil berhasil diperbarui!');
        setShowModal(true);
      } catch (error) {
        console.error('Gagal update profil:', error);
        setModalMessage('Terjadi kesalahan saat memperbarui profil.');
        setShowModal(true);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(false);
      setModalMessage('Data pengguna tidak ditemukan.');
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
          {[
            { id: 'nama', label: 'Nama' },
            { id: 'nisn', label: 'NISN' },
            { id: 'email', label: 'Email' },
            { id: 'hp', label: 'No. HP' },
            { id: 'gender', label: 'Jenis Kelamin' },
            { id: 'agama', label: 'Agama' },
            { id: 'kewarganegaraan', label: 'Kewarganegaraan' },
            { id: 'ttl', label: 'Tempat, Tanggal Lahir' },
            { id: 'alamat', label: 'Alamat' },
            { id: 'kelas', label: 'Kelas' },
            { id: 'jurusan', label: 'Kompetensi Keahlian' },

           
            // { id: 'pendidikan', label: 'Pendidikan' },  // simpan dalam bentuk array agar bisa mengisi multiple
            // { id: 'keterampilan_teknis', label: 'Keterampilan Teknis' },  //buat select untuk tentukan pilihan keterampilan teknis
            // { id: 'keterampilan_nonteknis', label: 'Keterampilan Non-Teknis' },  // Nbuat select untuk tentukan pilihan keterampilan non-teknis

       
          ].map((field) => (
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

          <span className="block text-md font-bold text-2xl my-5 text-gray-700">Pendidikan</span>
          {[
            { id: 'p_sd', label: 'SD/sederajat' },
            { id: 'p_smp', label: 'SMP/sederajat' },
            { id: 'p_smk', label: 'SMK/sederajat' },
         
          ].map((field) => (
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
        <span className="block text-md font-bold text-2xl my-5 text-gray-700">Keterampilan</span>
          <label className="block text-sm font-medium text-gray-700 mb-1">Keterampilan Teknis</label>
          <CreatableSelect
            isMulti
            options={opsiTeknis}
            value={formData.keterampilan_teknis.map((val) => ({ value: val, label: val }))}
            onChange={(selected) =>
              setFormData((prev) => ({
                ...prev,
                keterampilan_teknis: selected ? selected.map((s) => s.value) : [],
              }))
            }
          />

          <label className="block text-sm font-medium text-gray-700 mb-1 mt-4">Keterampilan Non-Teknis</label>
          <CreatableSelect
            isMulti
            options={opsiNonTeknis}
            value={formData.keterampilan_nonteknis.map((val) => ({ value: val, label: val }))}
            onChange={(selected) =>
              setFormData((prev) => ({
                ...prev,
                keterampilan_nonteknis: selected ? selected.map((s) => s.value) : [],
              }))
            }
          />

           <span className="block text-md font-bold text-2xl my-5 text-gray-700">Orang Tua / Wali</span>
        {[    
            // buat judul pemisah untuk orang tua / wali 

            { id: 'ibu', label: 'Ibu' },  // New Field
            { id: 'no_ibu', label: 'No. Ibu' },  // New Field
            { id: 'ayah', label: 'Ayah' },  // New Field
            { id: 'no_ayah', label: 'No. Ayah' },  // New Field
            { id: 'wali', label: 'Wali' },  // New Field
            { id: 'no_wali', label: 'No. Wali' },  // New Field
            { id: 'alamat_ortu', label: 'Alamat Orang Tua' },  // New Field
          ].map((field) => (
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
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-md shadow-md">
            <p>{modalMessage}</p>
            <button
              onClick={handleCloseModal}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-1 px-4 rounded"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
