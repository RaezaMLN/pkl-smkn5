"use client";

import { useEffect, useState } from "react";
import { generateDocx } from "@/lib/generateDocx";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function SuratPernyataanModal({ isOpen, onClose }: Props) {
  const [siswa, setSiswa] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrtu, setSelectedOrtu] = useState<string>(""); // Untuk jenis orang tua
  const [namaOrtu, setNamaOrtu] = useState<string>("");
  const [noOrtu, setNoOrtu] = useState<string>("");

  useEffect(() => {
    const fetchSiswa = async () => {
      const siswaData = localStorage.getItem("siswa");
      if (!siswaData) return;

      const siswa = JSON.parse(siswaData); // Mengubah string JSON ke objek
      const siswaId = siswa.id; // Mengambil id siswa

      if (!siswaId) return;

      const docRef = doc(db, "siswa", siswaId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setSiswa(docSnap.data());
      }

      setLoading(false);
    };

    if (isOpen) {
      fetchSiswa();
    }
  }, [isOpen]);

  // Handle download dengan data yang sudah diverifikasi
  const handleDownload = async () => {
    if (!siswa || !namaOrtu || !noOrtu) return;

    // Gunakan data yang dimasukkan siswa, jika ada
    await generateDocx("/template/surat_pernyataan.docx", {
      nama: siswa.nama,
      gender: siswa.gender,
      ttl: siswa.ttl,
      nisn: siswa.nisn,
      kelas: siswa.kelas,
      jurusan: siswa.jurusan,
      ortu: namaOrtu,
      no_ortu: noOrtu,
      alamat_ortu: siswa.alamat_ortu,
      tanggal_surat: new Date().toLocaleDateString("id-ID"),
    });
  };

  // Handle perubahan input untuk orang tua
  const handleOrtuChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedOrtu(event.target.value);
    if (event.target.value === "wali") {
      setNamaOrtu(""); // Set default jika wali
      setNoOrtu("");   // Set default jika wali
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Konfirmasi Data Surat</h2>

        {loading ? (
          <p>Memuat data siswa...</p>
        ) : (
          <>
            <div className="space-y-1 text-sm text-gray-700">
              <p><strong>Nama:</strong> {siswa.nama}</p>
              <p><strong>Jenis Kelamin:</strong> {siswa.gender}</p>
              <p><strong>TTL:</strong> {siswa.ttl}</p>
              <p><strong>NISN:</strong> {siswa.nisn}</p>
              <p><strong>Kelas:</strong> {siswa.kelas}</p>
              <p><strong>Jurusan:</strong> {siswa.jurusan}</p>

              <div>
                <label htmlFor="ortu" className="block text-sm">Jenis Orang Tua</label>
                <select
                  id="ortu"
                  value={selectedOrtu}
                  onChange={handleOrtuChange}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="">Pilih Jenis Orang Tua</option>
                  <option value="ayah">Ayah</option>
                  <option value="ibu">Ibu</option>
                  <option value="wali">Wali</option>
                </select>
              </div>

              {selectedOrtu && (
                <>
                  <div className="mt-4">
                    <label htmlFor="nama_ortu" className="block text-sm">Nama Orang Tua</label>
                    <input
                      type="text"
                      id="nama_ortu"
                      value={namaOrtu}
                      onChange={(e) => setNamaOrtu(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="Masukkan nama orang tua"
                    />
                  </div>

                  <div className="mt-4">
                    <label htmlFor="no_ortu" className="block text-sm">No. HP Orang Tua</label>
                    <input
                      type="text"
                      id="no_ortu"
                      value={noOrtu}
                      onChange={(e) => setNoOrtu(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="Masukkan nomor HP orang tua"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 flex justify-between gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Batal
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Unduh Surat
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
