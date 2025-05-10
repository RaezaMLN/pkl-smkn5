// components/siswa/PendaftaranModal.tsx

"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { motion } from "framer-motion";

interface SiswaData {
  id: string;
  email: string;
  nama: string;
  kelas: string;
}

interface PerusahaanData {
  id: string;
  nama: string;
  alamat: string;
  kontak: string;
}

const PendaftaranModal = ({
  isOpen,
  onClose,
  onSuccess,
  selectedCompany,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Tambahkan ini
  selectedCompany: PerusahaanData | null;
}) => {
  const [loading, setLoading] = useState(false);
  const [siswaData, setSiswaData] = useState<SiswaData | null>(null);

  // Ambil data siswa dari localStorage
  const fetchSiswaData = () => {
    const local = localStorage.getItem("siswa");
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (parsed && parsed.id && parsed.email) {
          setSiswaData(parsed);
        } else {
          alert("Data siswa tidak valid. Silakan login ulang.");
          setSiswaData(null);
        }
      } catch (err) {
        console.error("Gagal parsing data siswa:", err);
        alert("Data siswa tidak dapat diproses.");
        setSiswaData(null);
      }
    } else {
      alert("Data siswa tidak ditemukan. Silakan login terlebih dahulu.");
      setSiswaData(null);
    }
  };

  const handleDaftar = async () => {
    if (!siswaData || !selectedCompany) {
      alert("Data belum lengkap. Silakan coba lagi.");
      return;
    }

    setLoading(true);
    try {
      const pendaftaranRef = collection(db, "pendaftaran");
      await addDoc(pendaftaranRef, {
        siswa_id: siswaData.id, // gunakan id siswa
        perusahaan_id: selectedCompany.id,
        status: "pending",
        tanggal_daftar: Timestamp.fromDate(new Date()),
      });
      
      alert("Pendaftaran berhasil.");
      if (onSuccess) onSuccess(); // ← tambahkan ini
      onClose();
    } catch (error) {
      console.error("Error saat menyimpan data pendaftaran:", error);
      alert("Terjadi kesalahan saat mendaftar. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSiswaData();
    }
  }, [isOpen]);

  return isOpen && selectedCompany ? (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center"
    >
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Konfirmasi Pendaftaran PKL</h2>
        <p className="mb-4 text-sm">
          Apakah Anda yakin ingin mendaftar di perusahaan <strong>{selectedCompany.nama}</strong>?
        </p>
        <p className="mb-4 text-sm text-gray-600">
          {selectedCompany.alamat} <br />
          Kontak: {selectedCompany.kontak}
        </p>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
          >
            Batal
          </button>
          <button
            onClick={handleDaftar}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Mengirim..." : "Ya, Daftar"}
          </button>
        </div>
      </div>
    </motion.div>
  ) : null;
};

export default PendaftaranModal;
