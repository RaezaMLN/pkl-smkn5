'use client';

import { useState } from 'react';
import { saveAs } from 'file-saver';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { Download, X } from 'lucide-react';

export default function ExportModal({ siswa, onClose, defaultSort = 'terlama' }: any) {

  const [bulan, setBulan] = useState(new Date().getMonth());
  const [urutan, setUrutan] = useState<'terbaru' | 'terlama'>(
    defaultSort === 'terbaru' ? 'terbaru' : 'terlama'
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const bulanList = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember'
  ];

  // 🔥 FORMAT TANGGAL
  const formatTanggal = (tgl: string) => {
    if (!tgl) return '-';
    const dateObj = tgl.includes('T') ? new Date(tgl) : new Date(`${tgl}T00:00:00`);
    return isNaN(dateObj.getTime())
      ? tgl
      : dateObj.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
  };

  // 🔥 FILTER BULAN & SORT SESUAI PILIHAN
  const filterByMonth = () => {
    if (!siswa?.laporan) return [];

    return (siswa.laporan as any[])
      .filter((l: any) => {
        if (!l.tanggal) return false;
        const parts = l.tanggal.split('-');
        const itemMonth =
          parts.length >= 2
            ? parseInt(parts[1], 10) - 1
            : new Date(l.tanggal).getMonth();
        return itemMonth === bulan;
      })
      .sort((a: any, b: any) => {
        const dateCompare =
          urutan === 'terlama'
            ? (a.tanggal || '').localeCompare(b.tanggal || '')
            : (b.tanggal || '').localeCompare(a.tanggal || '');

        if (dateCompare !== 0) return dateCompare;

        const timeB = b.createdAt?.toMillis?.() || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        const timeA = a.createdAt?.toMillis?.() || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        return urutan === 'terlama' ? timeA - timeB : timeB - timeA;
      });
  };

  // 🔥 EXPORT DOCX
  const exportDocx = async () => {
    setErrorMsg('');
    setLoading(true);

    try {
      const laporanBulanan = filterByMonth();

      if (laporanBulanan.length === 0) {
        setErrorMsg('Tidak ada laporan di bulan ini');
        setLoading(false);
        return;
      }

      const response = await fetch('/template/template-jurnal.docx');

      if (!response.ok) {
        throw new Error('Template tidak ditemukan');
      }

      const content = await response.arrayBuffer();

      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      doc.setData({
        nama: siswa.nama || '-',
        nisn: siswa.nisn || '-',
        jurusan: siswa.jurusan || '-',
        tempat: siswa.perusahaanNama || 'Belum PKL',
        bulan: bulanList[bulan],

        laporan: laporanBulanan.map((l: any, i: number) => ({
          no: i + 1,
          tanggal: formatTanggal(l.tanggal),
          kegiatan: l.kegiatan || '-',
        })),
      });

      doc.render();

      const blob = doc.getZip().generate({
        type: 'blob',
      });

      saveAs(blob, `Jurnal_${siswa.nama}_${bulanList[bulan]}.docx`);

    } catch (error) {
      console.error(error);
      setErrorMsg('Gagal export file. Periksa template.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-sm shadow-xl border border-gray-200 dark:border-gray-700">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Export Jurnal Bulanan
          </h2>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* ERROR */}
        {errorMsg && (
          <div className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 p-2.5 rounded-lg mb-3 text-sm border border-red-200 dark:border-red-800">
            {errorMsg}
          </div>
        )}

        {/* PILIH BULAN */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Pilih Bulan:
          </label>
          <select
            value={bulan}
            onChange={(e) => setBulan(Number(e.target.value))}
            className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            {bulanList.map((b, i) => (
              <option key={i} value={i}>{b}</option>
            ))}
          </select>
        </div>

        {/* PILIH URUTAN TANGGAL */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Urutan Tanggal:
          </label>
          <select
            value={urutan}
            onChange={(e) => setUrutan(e.target.value as 'terbaru' | 'terlama')}
            className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="terlama">Tanggal Terlama ke Terbaru (1 s/d 31)</option>
            <option value="terbaru">Tanggal Terbaru ke Terlama (31 s/d 1)</option>
          </select>
        </div>

        {/* BUTTON */}
        <div className="flex flex-col gap-3">

          <button
            onClick={exportDocx}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
          >
            <Download size={16} />
            {loading ? 'Memproses...' : 'Download DOCX'}
          </button>

          <button
            onClick={onClose}
            className="bg-gray-400 hover:bg-gray-500 text-white py-2 rounded transition"
          >
            Tutup
          </button>

        </div>

      </div>
    </div>
  );
}