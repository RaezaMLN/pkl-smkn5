"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ModalDownloadSiswa({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [siswaList, setSiswaList] = useState<any[]>([]);

  useEffect(() => {
    if (open) fetchData();
  }, [open]);

  const fetchData = async () => {
    const snap = await getDocs(collection(db, "siswa"));
    const raw = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const filtered = filterUniqueSiswa(raw);
    setSiswaList(filtered);
  };

  const filterUniqueSiswa = (data: any[]) => {
    const seen = new Set();
    return data.filter((item) => {
      const key = `${item.nama?.toLowerCase()}-${item.email?.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const handleDownload = () => {
    if (siswaList.length === 0) {
      alert("Data siswa kosong!");
      return;
    }

    const sheetData = [
      [
        "No", "Nama", "Email", "Gender", "TTL",
        "Alamat", "No HP", "Agama", "Warga Negara",
        "SD", "SMP", "SMK",
        "Keterampilan Teknis", "Keterampilan Nonteknis"
      ]
    ];

    siswaList.forEach((siswa, idx) => {
      sheetData.push([
        idx + 1,
        siswa.nama || "",
        siswa.email || "",
        siswa.gender || "",
        siswa.ttl || "",
        siswa.alamat || "",
        siswa.hp || "",
        siswa.agama || "",
        siswa.kewarganegaraan || "",
        siswa.p_sd || "",
        siswa.p_smp || "",
        siswa.p_smk || "",
        (siswa.keterampilan_teknis || []).join(", "),
        (siswa.keterampilan_nonteknis || []).join(", ")
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Siswa");

    XLSX.writeFile(workbook, "data-siswa.xlsx");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4 text-center">Download Data Siswa</h2>

        <p className="mb-4 text-sm text-gray-600 text-center">
          Total siswa unik: {siswaList.length}
        </p>

        <div className="flex justify-end gap-3">
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
            Download Excel
          </button>
        </div>
      </div>
    </div>
  );
}
