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

  if (loading) return <div className="p-4">Loading...</div>;
  if (!siswa) return <div className="p-4 text-red-600">Data tidak ditemukan.</div>;
  console.log(perusahaan)

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-800 dark:text-white">
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Siswa */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Halo, {siswa.nama} 👋</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">Kelas: {siswa.kelas}</p>
        </div>
        <Link href="/siswa/profil">
          <button className="bg-gray-700 text-white py-2 px-4 rounded hover:bg-gray-600 transition">
            Edit Profil
          </button>
        </Link>
      </div>
  
      {/* Pendaftaran PKL */}
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
  <h2 className="text-xl font-semibold mb-3">📋 Pendaftaran PKL</h2>

  {pendaftaran && perusahaan ? (
    <>
          <p className="text-green-600">
            Anda sudah mendaftar untuk PKL di <br />
            <span className="text-2xl text-blue-600 font-semibold">{perusahaan.nama}</span>
          </p>
          <p className="mt-4 inline-block bg-indigo-100 dark:bg-indigo-700 text-indigo-800 dark:text-white text-base font-semibold px-4 py-2 rounded-lg shadow-sm">
            📊 Status: <span className="font-bold">{perusahaan.stats}</span>
          </p>

        </>
      ) : (
        <Link href="/siswa/pendaftaran">
          <button className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition">
            Daftar Tempat PKL
          </button>
        </Link>
      )}
    </div>

  
      {/* Info Perusahaan */}
      {perusahaan && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-3">🏢 Tempat PKL</h2>
          <div className="space-y-1">
            <p><strong>Perusahaan:</strong> {perusahaan.nama}</p>
            <p><strong>Bidang:</strong> {perusahaan.bidang}</p>
            <p><strong>Alamat:</strong> {perusahaan.alamat}</p>
            <p><strong>Kontak:</strong> {perusahaan.kontak}</p>
          </div>
        </div>
      )}
  
      {/* Aksi Dokumen */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold mb-3">📄 Dokumen Anda</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => setOpenModal(true)}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
          >
            Unduh Surat Pernyataan PKL
          </button>
          {/* <button
            onClick={() => setIsCVModalOpen(true)}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
          >
            Lihat & Unduh CV
          </button> */}
        </div>
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
