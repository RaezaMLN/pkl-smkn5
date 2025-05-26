import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

export default function DownloadPDFModal({ open, onClose, data }: Props) {
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

  const handleDownload = async () => {
  if (selectedIds.length === 0) {
    alert("Pilih data terlebih dahulu");
    return;
  }

  const docPDF = new jsPDF();

  // Atur margin kiri, kanan, atas, bawah (dalam mm)
  const margin = 15;
  const pageWidth = docPDF.internal.pageSize.getWidth();
  const pageHeight = docPDF.internal.pageSize.getHeight();

  let yOffset = margin;

  for (let i = 0; i < selectedIds.length; i++) {
    const perusahaan = data.find((d) => d.id === selectedIds[i]);
    if (!perusahaan) continue;

    if (i > 0) yOffset += 10;

    // Cek kalau yOffset mendekati bawah halaman, buat halaman baru
    if (yOffset > pageHeight - margin) {
      docPDF.addPage();
      yOffset = margin;
    }

    docPDF.setFontSize(14);
    // posisi x di margin kiri, y di yOffset
    docPDF.text(perusahaan.nama, margin, yOffset);
    yOffset += 7; // kasih jarak bawah judul

    docPDF.setFontSize(10);

    if (!perusahaan.siswa_terdaftar || perusahaan.siswa_terdaftar.length === 0) {
      docPDF.text("Tidak ada siswa terdaftar", margin, yOffset);
      yOffset += 10;
    } else {
      const siswaList = await Promise.all(
        perusahaan.siswa_terdaftar.map((id) => getSiswaById(id))
      );

      const tableData = siswaList
        .filter((s): s is Siswa => s !== null)
        .map((siswa, index) => [
          index + 1,
          siswa.nama,
          siswa.nisn,
          siswa.kelas,
          siswa.jurusan,
        ]);

      autoTable(docPDF, {
        startY: yOffset,
        margin: { left: margin, right: margin }, // margin kiri dan kanan untuk tabel
        head: [["No", "Nama", "NISN", "Kelas", "Kompetensi Keahlian"]],
        body: tableData,
        styles: { fontSize: 9 },
        theme: 'grid',
        didDrawPage: (data) => {
          if (data.cursor && data.cursor.y != null) {
            yOffset = data.cursor.y + 10;

            // Kalau sudah dekat bawah, bikin halaman baru
            if (yOffset > pageHeight - margin) {
              docPDF.addPage();
              yOffset = margin;
            }
          }
        }
      });
    }
  }

  docPDF.save("data-siswa-perusahaan.pdf");
  onClose();
};


  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedIds(data.map((d) => d.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      const newSelected = selectedIds.filter((item) => item !== id);
      setSelectedIds(newSelected);
      if (selectAll) setSelectAll(false);
    } else {
      const newSelected = [...selectedIds, id];
      setSelectedIds(newSelected);
      if (newSelected.length === data.length) setSelectAll(true);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-md max-w-3xl w-full max-h-[80vh] overflow-auto shadow-lg">
        <h2 className="text-lg font-semibold mb-4 text-center">
          Pilih Data untuk Diunduh
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
            onClick={handleDownload}
            disabled={selectedIds.length === 0}
            className={`px-4 py-2 rounded text-white transition ${
              selectedIds.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
