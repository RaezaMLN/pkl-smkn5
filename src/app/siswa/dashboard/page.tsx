"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import SuratPernyataanModal from "@/components/siswa/SuratPernyataanModal";
import CVModal from "@/components/siswa/CVModald";

interface Perusahaan {
  nama: string;
  alamat: string;
  kontak: string;
  bidang: string;
  stats: string;

}

interface PendaftaranData {
  status: "disetujui" | "menunggu" | "ditolak";
  perusahaan_id: string;
}

interface SiswaData {
  id: string;
  nama: string;
  email: string;
  kelas: string;
  statusLaporan: "belum" | "proses" | "selesai";
}

const SiswaDashboardPage = () => {
  const [siswa, setSiswa] = useState<SiswaData | null>(null);
  const [pendaftaran, setPendaftaran] = useState<PendaftaranData | null>(null);
  const [perusahaan, setPerusahaan] = useState<Perusahaan | null>(null);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [isCVModalOpen, setIsCVModalOpen] = useState(false);


  useEffect(() => {
    const local = localStorage.getItem("siswa");
    if (!local) return setLoading(false);

    const { id } = JSON.parse(local);

    const fetchData = async () => {
      try {
        const siswaSnapshot = await getDoc(doc(db, "siswa", id));
        if (!siswaSnapshot.exists()) return setLoading(false);

        const siswaData = siswaSnapshot.data() as SiswaData;
        setSiswa(siswaData);

        const q = query(collection(db, "pendaftaran"), where("siswa_id", "==", id));
        const pendaftaranSnapshot = await getDocs(q);
        if (pendaftaranSnapshot.empty) return setLoading(false);

        const pendaftaranData = pendaftaranSnapshot.docs[0].data() as PendaftaranData;
        setPendaftaran(pendaftaranData);

        const perusahaanDoc = await getDoc(doc(db, "perusahaan", pendaftaranData.perusahaan_id));
        if (perusahaanDoc.exists()) {
          setPerusahaan(perusahaanDoc.data() as Perusahaan);
        }
      } catch (err) {
        console.error("Gagal mengambil data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (!siswa) return <div className="p-4 text-red-600">Data tidak ditemukan.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 text-gray-800 dark:text-white">
      {/* Header Siswa */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm sm:shadow-lg p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Halo, {siswa.nama} 👋</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">Kelas: {siswa.kelas}</p>
        </div>
        <Link href="/siswa/profil" className="w-full sm:w-auto">
          <button className="w-full sm:w-auto bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition text-sm font-medium">
            Edit Profil
          </button>
        </Link>
      </div>
  
      {/* Pendaftaran PKL */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm sm:shadow-lg p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-3">📋 Pendaftaran PKL</h2>

        {pendaftaran && perusahaan ? (
          <>
            <p className="text-green-600 dark:text-green-400">
              Anda sudah mendaftar untuk PKL di <br />
              <span className="text-xl sm:text-2xl text-blue-600 dark:text-blue-400 font-semibold">{perusahaan.nama}</span>
            </p>
            <p className="mt-4 inline-block bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 text-sm sm:text-base font-semibold px-4 py-2 rounded-lg shadow-sm">
              📊 Status: <span className="font-bold">{perusahaan.stats}</span>
            </p>
          </>
        ) : (
          <Link href="/siswa/pendaftaran" className="inline-block w-full sm:w-auto">
            <button className="w-full sm:w-auto bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition font-medium text-sm">
              Daftar Tempat PKL
            </button>
          </Link>
        )}
      </div>
  
      {/* Info Perusahaan */}
      {perusahaan && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm sm:shadow-lg p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-3">🏢 Tempat PKL</h2>
          <div className="space-y-1.5 text-sm sm:text-base">
            <p><strong className="text-gray-700 dark:text-gray-300">Perusahaan:</strong> {perusahaan.nama}</p>
            <p><strong className="text-gray-700 dark:text-gray-300">Bidang:</strong> {perusahaan.bidang}</p>
            <p><strong className="text-gray-700 dark:text-gray-300">Alamat:</strong> {perusahaan.alamat}</p>
            <p><strong className="text-gray-700 dark:text-gray-300">Kontak:</strong> {perusahaan.kontak}</p>
          </div>
        </div>
      )}
  
      {/* Aksi Dokumen */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm sm:shadow-lg p-4 sm:p-6 space-y-4">
        <h2 className="text-lg sm:text-xl font-semibold mb-3">📄 Dokumen Anda</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setOpenModal(true)}
            className="w-full sm:flex-1 bg-green-600 text-white py-2.5 px-4 rounded-lg hover:bg-green-700 transition font-medium text-sm text-center"
          >
            Unduh Surat Pernyataan PKL
          </button>
        </div>
      </div>

      {/* Modals */}
      <SuratPernyataanModal isOpen={openModal} onClose={() => setOpenModal(false)} />
      <CVModal isOpen={isCVModalOpen} onClose={() => setIsCVModalOpen(false)} />
    </div>
  );
};

const StatusCard = ({ title, status }: { title: string; status: string | null }) => {
  let color = "bg-gray-200 text-gray-800";
  if (status === "disetujui" || status === "lunas" || status === "selesai") color = "bg-green-100 text-green-800";
  else if (status === "menunggu" || status === "proses") color = "bg-yellow-100 text-yellow-800";
  else if (status === "ditolak" || status === "belum") color = "bg-red-100 text-red-800";

  return (
    <div className={`rounded-xl shadow p-4 ${color}`}>
      <h3 className="text-md font-semibold">{title}</h3>
      <p className="text-lg capitalize">{status || "Belum ada"}</p>
    </div>
  );
};

export default SiswaDashboardPage;
