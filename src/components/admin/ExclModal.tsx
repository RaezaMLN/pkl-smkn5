"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Siswa = {
  id: string;
  nama: string;
  nisn: string;
  kelas: string;
  jurusan: string;
};

type Perusahaan = {
  id: string;
  nama: string;
  alamat: string;
  bidang: string;
  kontak: string;
  keterangan: string;
  kuota: number;
  siswa_terdaftar: string[];
};

interface Props {
  open: boolean;
  onClose: () => void;
  data: Perusahaan[];
}

type ExcelAlignment = {
  horizontal?: "left" | "center" | "right";
  vertical?: "top" | "center" | "bottom";
  wrapText?: boolean;
};

export default function ModalExcl({ open, onClose, data }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
      setSelectAll(false);
    }
  }, [open]);

  const getSiswaById = async (id: string): Promise<Siswa | null> => {
    const snap = await getDoc(doc(db, "siswa", id));
    if (snap.exists()) {
      const data = snap.data();
      return {
        id: snap.id,
        nama: data.nama,
        nisn: data.nisn,
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

    const workbook = XLSX.utils.book_new();
    const sheetData: any[][] = [];

    sheetData.push(["DATA SISWA TERDAFTAR PER PERUSAHAAN"]);
    sheetData.push([]);

    for (const perusahaanId of selectedIds) {
      const perusahaan = data.find((d) => d.id === perusahaanId);
      if (!perusahaan) continue;

      sheetData.push([`Perusahaan: ${perusahaan.nama}`]);
      sheetData.push(["No", "Nama Siswa", "NISN", "Kelas", "Jurusan"]);

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
            siswa.nisn,
            siswa.kelas,
            siswa.jurusan,
          ]);
        });
      }

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
        row[2] === "NISN"
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
          const alignment: ExcelAlignment = {
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
    onClose();
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setSelectedIds(checked ? data.map((d) => d.id) : []);
  };

  const toggleSelect = (id: string) => {
    const isSelected = selectedIds.includes(id);
    const newSelected = isSelected
      ? selectedIds.filter((item) => item !== id)
      : [...selectedIds, id];
    setSelectedIds(newSelected);
    setSelectAll(newSelected.length === data.length);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-md max-w-3xl w-full max-h-[80vh] overflow-auto shadow-lg">
        <h2 className="text-lg font-semibold mb-4 text-center">
          Pilih Data untuk Diunduh (Excel)
        </h2>

        <div className="mb-2 flex items-center justify-between">
          <label className="flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="mr-2"
            />
            Pilih Semua
          </label>
          <p className="text-sm text-gray-600">
            {selectedIds.length} dari {data.length} data dipilih
          </p>
        </div>

        <div className="max-h-64 overflow-y-auto border rounded p-3 mb-4">
          {data.length === 0 ? (
            <p className="text-center text-gray-500">Data tidak tersedia</p>
          ) : (
            data.map((item) => (
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
                {item.nama}
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
            disabled={selectedIds.length === 0}
            className={`px-4 py-2 rounded text-white transition ${
              selectedIds.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            Download Excel
          </button>
        </div>
      </div>
    </div>
  );
}
