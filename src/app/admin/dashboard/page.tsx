'use client';

import { Card, CardContent } from "@/components/ui/Card";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

const AdminDashboard = () => {
  const [counts, setCounts] = useState({
    siswa: 0,
    perusahaan: 0,
    pendaftaran: 0,
    pengajuanTempatPkl: 0, // Mengganti nama variabel pengajuan menjadi pengajuanTempatPkl
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const siswaSnap = await getDocs(collection(db, "siswa"));
        const perusahaanSnap = await getDocs(collection(db, "perusahaan"));
        const pendaftaranSnap = await getDocs(collection(db, "pendaftaran"));
        const pengajuanTempatPklSnap = await getDocs(collection(db, "pengajuan-tempat-pkl")); // Mengganti nama koleksi di sini

        setCounts({
          siswa: siswaSnap.size,
          perusahaan: perusahaanSnap.size,
          pendaftaran: pendaftaranSnap.size,
          pengajuanTempatPkl: pengajuanTempatPklSnap.size, // Mengganti nama variabel di sini
        });
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 p-4 w-full place-items-center ms-10">
      <DashboardCard title="Siswa" count={counts.siswa} />
      <DashboardCard title="Perusahaan" count={counts.perusahaan} />
      <DashboardCard title="Pendaftaran" count={counts.pendaftaran} />
      <DashboardCard title="Pengajuan Tempat PKL" count={counts.pengajuanTempatPkl} /> {/* Mengganti label di sini */}
    </div>
  );
};

const DashboardCard = ({ title, count }: { title: string; count: number }) => (
  <Card className="rounded-2xl shadow-md p-4 max-w-sm w-full hover:shadow-lg transition-shadow duration-300">
    <CardContent>
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-100">{title}</h3>
      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{count}</p>
    </CardContent>
  </Card>
);

export default AdminDashboard;
