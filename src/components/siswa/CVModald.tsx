"use client";

import { useEffect, useState } from "react";
import { generateDocx } from "@/lib/generateDocx";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function CVModal({ isOpen, onClose }: Props) {
  const [siswa, setSiswa] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSiswa = async () => {
      const siswaData = localStorage.getItem("siswa");
      if (!siswaData) return;

      const siswaParsed = JSON.parse(siswaData);
      const siswaId = siswaParsed.id;
      if (!siswaId) return;

      const docRef = doc(db, "siswa", siswaId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setSiswa(docSnap.data());
      }

      setLoading(false);
    };

    if (isOpen) fetchSiswa();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSiswa(null);
      setLoading(true);
    }
  }, [isOpen]);

  const handleDownload = async () => {
    if (!siswa) {
      alert("Data siswa tidak tersedia.");
      return;
    }

    await generateDocx("/template/cv.docx", {
      nama: siswa.nama,
      email: siswa.email,
      nohp: siswa.hp,
      alamat: siswa.alamat,
      ttl: siswa.ttl,
      gender: siswa.gender,
      agama: siswa.agama,
      kewarganegaraan: siswa.kewarganegaraan,
      p_sd: siswa.p_sd,
      p_smp: siswa.p_smp,
      p_smk: siswa.p_smk,
      keterampilan_teknis: siswa.keterampilan_teknis,
      keterampilan_nonteknis: siswa.keterampilan_nonteknis,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-xl shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Data Anda</h2>

        {loading ? (
          <p>Memuat data siswa...</p>
        ) : siswa ? (
          <div className="space-y-2 text-sm text-gray-700">
            <p><strong>Nama:</strong> {siswa.nama}</p>
            <p><strong>Email:</strong> {siswa.email}</p>
            <p><strong>No HP:</strong> {siswa.hp}</p>
            <p><strong>Alamat:</strong> {siswa.alamat}</p>
            <p><strong>Tempat, Tanggal Lahir:</strong> {siswa.ttl}</p>
            <p><strong>Jenis Kelamin:</strong> {siswa.gender}</p>
            <p><strong>Agama:</strong> {siswa.agama}</p>
            <p><strong>Kewarganegaraan:</strong> {siswa.kewarganegaraan}</p>
            <p><strong>Pendidikan SD:</strong> {siswa.p_sd}</p>
            <p><strong>Pendidikan SMP:</strong> {siswa.p_smp}</p>
            <p><strong>Pendidikan SMK:</strong> {siswa.p_smk}</p>
            <p><strong>Keterampilan Teknis:</strong> {siswa.keterampilan_teknis}</p>
            <p><strong>Keterampilan Non-Teknis:</strong> {siswa.keterampilan_nonteknis}</p>

            <div className="mt-4 flex justify-between gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Batal
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Unduh CV
              </button>
            </div>
          </div>
        ) : (
          <p>Data siswa tidak ditemukan.</p>
        )}
      </div>
    </div>
  );
}
