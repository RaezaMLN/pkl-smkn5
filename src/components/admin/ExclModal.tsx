"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Siswa = {
  id: string;
  nama: string;
  hp: string;
  kelas: string;
  jurusan: string;
};

type Perusahaan = {
  id: string;
  nama: string;
  alamat: string;
  bidang: string;
  kuota: number;
  stats?: string;
  siswa_terdaftar: string[];
};

interface Props {
  open: boolean;
  onClose: () => void;
  data: Perusahaan[];
}

export default function ModalExcl({ open, onClose, data }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
      setSelectAll(false);
      setFilterStatus("Semua");
      setSearchQuery("");
    }
  }, [open]);

  const getSiswaById = async (id: string): Promise<Siswa | null> => {
    const snap = await getDoc(doc(db, "siswa", id));
    if (snap.exists()) {
      const data = snap.data();
      return {
        id: snap.id,
        nama: data.nama,
        hp: data.hp,
        kelas: data.kelas,
        jurusan: data.jurusan,
      };
    }
    return null;
  };

  const handleDownloadExcel = async () => {
    if (selectedIds.length === 0) {
      alert("Pilih data terlebih dahulu");
      return;
    }

    setLoading(true);

    const workbook = XLSX.utils.book_new();
    const sheetData: any[][] = [];

    sheetData.push(["DATA SISWA TERDAFTAR PER PERUSAHAAN"]);
    sheetData.push([]);

    for (const perusahaanId of selectedIds) {
      const perusahaan = data.find((d) => d.id === perusahaanId);
      if (!perusahaan) continue;

      sheetData.push([`Perusahaan: ${perusahaan.nama}`]);
      sheetData.push([`Alamat: ${perusahaan.alamat}`]);
      sheetData.push([`Status: ${perusahaan.stats}`]);

      sheetData.push([]);

      sheetData.push(["No", "Nama Siswa", "No.hp", "Kelas", "Jurusan"]);

      const siswaList = await Promise.all(
        perusahaan.siswa_terdaftar.map((id) => getSiswaById(id))
      );
      const siswaData = siswaList.filter((s): s is Siswa => s !== null);

      if (siswaData.length === 0) {
        sheetData.push(["-", "Tidak ada siswa terdaftar", "", "", ""]);
      } else {
        siswaData.forEach((siswa, idx) => {
          sheetData.push([
            idx + 1,
            siswa.nama,
            siswa.hp,
            siswa.kelas,
            siswa.jurusan,
          ]);
        });
      }

      // sheetData.push([`Jumlah Siswa: ${siswaData.length}`]);
      sheetData.push([]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const merges = [];

    merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } });

    sheetData.forEach((row, i) => {
      if (row.length === 1 && row[0]?.toString().startsWith("Perusahaan:")) {
        merges.push({ s: { r: i, c: 0 }, e: { r: i, c: 4 } });
      }
    });

    worksheet["!merges"] = merges;
    worksheet["!cols"] = [
      { wch: 5 },
      { wch: 30 },
      { wch: 18 },
      { wch: 12 },
      { wch: 18 },
    ];

    const setCellStyle = (
      ws: XLSX.WorkSheet,
      cell: string,
      style: Partial<XLSX.CellObject["s"]>
    ) => {
      if (!ws[cell]) ws[cell] = {};
      ws[cell].s = style;
    };

    for (let col = 0; col <= 4; col++) {
      const cell = XLSX.utils.encode_cell({ r: 0, c: col });
      setCellStyle(worksheet, cell, {
        font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F81BD" } },
        alignment: { horizontal: "center", vertical: "center" },
      });
    }

    sheetData.forEach((row, r) => {
      if (row.length === 1 && row[0]?.toString().startsWith("Perusahaan:")) {
        for (let col = 0; col <= 4; col++) {
          const cell = XLSX.utils.encode_cell({ r: r, c: col });
          setCellStyle(worksheet, cell, {
            font: { bold: true, color: { rgb: "000000" } },
            fill: { fgColor: { rgb: "D9E1F2" } },
            alignment: { horizontal: "left", vertical: "center" },
          });
        }
      }

      if (
        row.length === 5 &&
        row[0] === "No" &&
        row[1] === "Nama Siswa" &&
        row[2] === "No.hp"
      ) {
        for (let col = 0; col <= 4; col++) {
          const cell = XLSX.utils.encode_cell({ r: r, c: col });
          setCellStyle(worksheet, cell, {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4472C4" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } },
            },
          });
        }
      }

      if (row.length === 5 && typeof row[0] === "number") {
        for (let col = 0; col <= 4; col++) {
          const cell = XLSX.utils.encode_cell({ r: r, c: col });
          const alignment = {
            vertical: "center",
            horizontal: col === 0 || col === 2 || col === 3 ? "center" : "left",
          };
          setCellStyle(worksheet, cell, {
            alignment,
            border: {
              top: { style: "thin", color: { rgb: "CCCCCC" } },
              bottom: { style: "thin", color: { rgb: "CCCCCC" } },
              left: { style: "thin", color: { rgb: "CCCCCC" } },
              right: { style: "thin", color: { rgb: "CCCCCC" } },
            },
          });
        }
      }
    });

    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Siswa");
    XLSX.writeFile(workbook, "data-siswa-perusahaan.xlsx");

    setLoading(false);
    onClose();
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setSelectedIds(checked ? filteredData.map((d) => d.id) : []);
  };

  const toggleSelect = (id: string) => {
    const newSelected = selectedIds.includes(id)
      ? selectedIds.filter((i) => i !== id)
      : [...selectedIds, id];

    setSelectedIds(newSelected);
    setSelectAll(newSelected.length === filteredData.length);
  };

  const filteredData = data.filter((item) => {
    const matchStatus =
      filterStatus === "Semua" || item.stats === filterStatus;
    const matchSearch = item.nama.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-md max-w-3xl w-full max-h-[90vh] overflow-auto shadow-lg">
        <h2 className="text-lg font-semibold mb-4 text-center">
          Pilih Data untuk Diunduh (Excel)
        </h2>

        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <label className="flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="mr-2"
            />
            Pilih Semua
          </label>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="Semua">Semua</option>
              <option value="sudah di surati">sudah di surati</option>
              <option value="menunggu surat balasan">menunggu surat balasan</option>
              <option value="menunggu pengantaran siswa">menunggu pengantaran siswa</option>
              <option value="siswa sudah di antar">siswa sudah di antar</option>
              <option value="siswa sudah di jemput">siswa sudah di jemput</option>
            </select>
          </div>
        </div>

        <input
          type="text"
          placeholder="Cari nama perusahaan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border rounded px-3 py-1 mb-3 text-sm"
        />

        <div className="max-h-64 overflow-y-auto border rounded p-3 mb-4">
          {filteredData.length === 0 ? (
            <p className="text-center text-gray-500">Data tidak ditemukan</p>
          ) : (
            filteredData.map((item) => (
              <label
                key={item.id}
                className="flex items-center mb-1 cursor-pointer hover:bg-gray-100 rounded px-1 select-none"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={() => toggleSelect(item.id)}
                  className="mr-2"
                />
                {item.nama} <span className="ml-2 text-xs text-gray-500">({item.stats || "-"})</span>
              </label>
            ))
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
          >
            Batal
          </button>
          <button
            onClick={handleDownloadExcel}
            disabled={selectedIds.length === 0 || loading}
            className={`px-4 py-2 rounded text-white transition ${
              selectedIds.length === 0 || loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Memproses..." : "Download Excel"}
          </button>
        </div>
      </div>
    </div>
  );
}
