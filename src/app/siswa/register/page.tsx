"use client"

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import Modal from "@/components/ui/Modal"; // Import Modal

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    nama: "",
    nisn: "",
    email: "",
    hp: "",
    gender: "",
    ttl: "",
    alamat: "",
    kelas: "",
    jurusan: "",
    wali: "",
    password: "",
    konfirmasi: "",
  });
  const [showModal, setShowModal] = useState(false); // State untuk kontrol modal
  const [modalMessage, setModalMessage] = useState(""); // Pesan untuk modal

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi password dan konfirmasi password
    if (formData.password !== formData.konfirmasi) {
      setModalMessage("Password dan konfirmasi tidak cocok!");
      setShowModal(true);
      return;
    }

    // Cek jika data wajib diisi belum lengkap
    const requiredFields = [
      "nama",
      "nisn",
      "email",
      "hp",
      "gender",
      "ttl",
      "alamat",
      "kelas",
      "jurusan",
      "wali",
      "password",
    ];

    for (let field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        setModalMessage(`${field} harus diisi!`);
        setShowModal(true);
        return;
      }
    }

    try {
      await addDoc(collection(db, "siswa"), {
        ...formData,
        createdAt: serverTimestamp(),
      });

      setModalMessage("Pendaftaran berhasil!");
      setShowModal(true);
      // Redirect ke halaman login setelah berhasil daftar
      setTimeout(() => {
        window.location.href = "/siswa/login"; // Ganti dengan routing yang sesuai
      }, 1500);
    } catch (error) {
      console.error("Gagal daftar:", error);
      setModalMessage("Terjadi kesalahan saat pendaftaran.");
      setShowModal(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 sm:p-10">
      <motion.form
        className="w-full sm:w-96 bg-white p-6 rounded-xl shadow-md"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        onSubmit={handleRegister}
      >
        <h2 className="text-3xl font-bold text-center text-blue-800 dark:text-white mb-6">
          Daftar Akun Siswa
        </h2>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            name="nama"
            value={formData.nama}
            onChange={handleChange}
            placeholder="Nama Lengkap"
            className="px-4 py-2 border border-gray-300 rounded-md"
            required
          />
          <input
            type="text"
            name="nisn"
            value={formData.nisn}
            onChange={handleChange}
            placeholder="NISN"
            className="px-4 py-2 border border-gray-300 rounded-md"
            required
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            className="px-4 py-2 border border-gray-300 rounded-md"
            required
          />
          <input
            type="text"
            name="hp"
            value={formData.hp}
            onChange={handleChange}
            placeholder="No. HP"
            className="px-4 py-2 border border-gray-300 rounded-md"
            required
          />
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="px-4 py-2 border border-gray-300 rounded-md"
            required
          >
            <option value="">Pilih Jenis Kelamin</option>
            <option value="Laki-laki">Laki-Laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>
          <input
            type="text"
            name="ttl"
            value={formData.ttl}
            onChange={handleChange}
            placeholder="Tempat, Tanggal Lahir"
            className="px-4 py-2 border border-gray-300 rounded-md"
            required
          />
          <textarea
            name="alamat"
            value={formData.alamat}
            onChange={handleChange}
            placeholder="Alamat"
            className="px-4 py-2 border border-gray-300 rounded-md"
            required
          ></textarea>
        
          <select
            name="kelas"
            value={formData.kelas}
            onChange={handleChange}
            className="px-4 py-2 border border-gray-300 rounded-md"
            required>
            <option value="">Pilih kelas</option>
            <option value="XII RPL 1">XII RPL 1</option>
            <option value="XII RPL 2">XII RPL 2</option>
            <option value="XII RPL 3">XII RPL 3</option>
            <option value="XII TJKT 1">XII TJKT 1</option>
            <option value="XII TJKT 2">XII TJKT 2</option>
            <option value="XII TJKT 3">XII TJKT 3</option>
            <option value="XII TJAT">XII TJAT</option>
            <option value="XII PF 1">XII PF 1</option>
            <option value="XII PF 2">XII PF 2</option>
          </select>
      
          <select
            name="jurusan"
            value={formData.jurusan}
            onChange={handleChange}
            className="px-4 py-2 border border-gray-300 rounded-md"
            required>
            <option value="">Pilih jurusan</option>
            <option value="Rekaysa Perangkat Lunak">RPL</option>
            <option value="Teknik Jaringan Akses Telekomunikasi">TJAT</option>
            <option value="Teknik Jaringan Komputer Telekomunikasi">TJKT</option>
            <option value="Produksi Film">PF</option>
          </select>
          <input
            type="text"
            name="wali"
            value={formData.wali}
            onChange={handleChange}
            placeholder="Nama Lengkap Orang tua / Wali"
            className="px-4 py-2 border border-gray-300 rounded-md"
            required
          />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            className="px-4 py-2 border border-gray-300 rounded-md"
            required
          />
          <input
            type="password"
            name="konfirmasi"
            value={formData.konfirmasi}
            onChange={handleChange}
            placeholder="Konfirmasi Password"
            className="px-4 py-2 border border-gray-300 rounded-md"
            required
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md mt-4 hover:bg-blue-700"
          >
            Daftar
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Sudah punya akun?{" "}
            <a href="/siswa/login" className="text-blue-600 hover:underline">
              Masuk
            </a>
          </p>
        </div>
      </motion.form>

      {showModal && (
        <Modal message={modalMessage} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
};

export default RegisterPage;
