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
  { value: 'Microsoft Office', label: 'Microsoft Office' },
  { value: 'Canva', label: 'Canva' },
  { value: 'Adobe Ilustrator', label: 'Adobe Ilustrator' },
  { value: 'Corel Draw', label: 'Corel Draw' },
  { value: 'CapCut', label: 'CapCut' },
  { value: 'Jaringan Dasar', label: 'Jaringan Dasar' },
  { value: 'Routing dan Switching', label: 'Routing dan Switching' },
  { value: 'Mikrotik', label: 'Mikrotik' },
  { value: 'Linux Server', label: 'Linux Server' },
  { value: 'Keamanan Jaringan', label: 'Keamanan Jaringan' },
  { value: 'Jaringan Akses Fiber Optik', label: 'Jaringan Akses Fiber Optik' },
  { value: 'Teknologi Wireless', label: 'Teknologi Wireless' },
  { value: 'Pemrograman Jaringan', label: 'Pemrograman Jaringan' },
  { value: 'Perangkat Telekomunikasi', label: 'Perangkat Telekomunikasi' },
  { value: 'HTML & CSS', label: 'HTML & CSS' },
  { value: 'JavaScript', label: 'JavaScript' },
  { value: 'PHP', label: 'PHP' },
  { value: 'Mysql CRUD', label: 'Mysql CRUD' },
  { value: 'Basis Data', label: 'Basis Data' },
  { value: 'Sinematografi', label: 'Sinematografi' },
  { value: 'Editing Video', label: 'Editing Video' },
  { value: 'Penyutradaraan', label: 'Penyutradaraan' },
  { value: 'Penulisan Skenario', label: 'Penulisan Skenario' },
  { value: 'Manajemen Produksi', label: 'Manajemen Produksi' },
];

const opsiNonTeknis = [
  { value: 'Manajemen Waktu', label: 'Manajemen Waktu' },
  { value: 'Kerja Sama Tim', label: 'Kerja Sama Tim' },
  { value: 'Komunikasi Efektif', label: 'Komunikasi Efektif' },
  { value: 'Etika Profesional', label: 'Etika Profesional' },
  { value: 'Kepemimpinan Lapangan', label: 'Kepemimpinan Lapangan' },
  { value: 'Keselamatan Kerja', label: 'Keselamatan Kerja' },
  { value: 'Problem Solving', label: 'Problem Solving' },
  { value: 'Kolaborasi Tim', label: 'Kolaborasi Tim' },
  { value: 'Presentasi Proyek', label: 'Presentasi Proyek' },
  { value: 'Kreativitas', label: 'Kreativitas' },
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

  const opsiAgama = [
    { value: 'Islam', label: 'Islam' },
    { value: 'Kristen', label: 'Kristen' },
    { value: 'Katolik', label: 'Katolik' },
    { value: 'Hindu', label: 'Hindu' },
    { value: 'Buddha', label: 'Buddha' },
    { value: 'Konghucu', label: 'Konghucu' },
  ];
  
  const opsiKewarganegaraan = [
    { value: 'Indonesia', label: 'Indonesia' },
    { value: 'Asing', label: 'Asing' },
  ];
  

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
            // { id: 'agama', label: 'Agama' },
            // { id: 'kewarganegaraan', label: 'Kewarganegaraan' },
            { id: 'ttl', label: 'Tempat, Tanggal Lahir' },
            { id: 'alamat', label: 'Alamat' },
            { id: 'kelas', label: 'Kelas' },
            { id: 'jurusan', label: 'Konsentrasi Keahlian' },

           
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

        <label className="block text-sm font-medium text-gray-700">Agama</label>
        <CreatableSelect
          isClearable
          options={opsiAgama}
          value={formData.agama ? { value: formData.agama, label: formData.agama } : null}
          onChange={(selected) =>
            setFormData((prev) => ({
              ...prev,
              agama: selected ? selected.value : '',
            }))
          }
          className="mb-4"
        />

        <label className="block text-sm font-medium text-gray-700">Kewarganegaraan</label>
        <CreatableSelect
          isClearable
          options={opsiKewarganegaraan}
          value={formData.kewarganegaraan ? { value: formData.kewarganegaraan, label: formData.kewarganegaraan } : null}
          onChange={(selected) =>
            setFormData((prev) => ({
              ...prev,
              kewarganegaraan: selected ? selected.value : '',
            }))
          }
          className="mb-4"
        />


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
                placeholder='nama-sekolah (thn masuk - thn tamat/sampai sekarang)'
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
            placeholder="tambahkan lainnya (optional)"
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
            placeholder="tambahkan lainnya (optional)"
            onChange={(selected) =>
              setFormData((prev) => ({
                ...prev,
                keterampilan_nonteknis: selected ? selected.map((s) => s.value) : [],
              }))
            }
          />

           <span className="block text-md font-bold text-2xl my-5 text-gray-700">Orang Tua / Wali</span>
           {[
              { id: 'ibu', label: 'Ibu' },
              { id: 'no_ibu', label: 'No. Ibu', isPhone: true },
              { id: 'ayah', label: 'Ayah' },
              { id: 'no_ayah', label: 'No. Ayah', isPhone: true },
              { id: 'wali', label: 'Wali' },
              { id: 'no_wali', label: 'No. Wali', isPhone: true },
              { id: 'alamat_ortu', label: 'Alamat Orang Tua' },
            ].map((field) => (
              <div key={field.id}>
                <label htmlFor={field.id} className="block text-sm font-medium text-gray-700">
                  {field.label}
                </label>
                <input
                  id={field.id}
                  name={field.id}
                  type={field.isPhone ? "tel" : "text"}
                  value={(formData as any)[field.id]}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Jika field nomor HP, validasi hanya angka
                    if (field.isPhone && !/^\d*$/.test(value)) return; // Tolak jika bukan angka
                    handleChange(e);
                  }}
                  className="mt-1 p-2 w-full border rounded-md"
                  inputMode={field.isPhone ? "numeric" : undefined} // Mobile numeric keyboard
                  pattern={field.isPhone ? "\\d*" : undefined} // Validasi angka
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
