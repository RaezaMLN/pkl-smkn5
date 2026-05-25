'use client';

import { useState } from 'react';
import { saveAs } from 'file-saver';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { Download, X } from 'lucide-react';

export default function ExportModal({ siswa, onClose }: any) {

  const [bulan, setBulan] = useState(6);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const bulanList = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember'
  ];

  // 🔥 FORMAT TANGGAL
  const formatTanggal = (tgl: string) => {
    return new Date(tgl).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // 🔥 FILTER BULAN
  const filterByMonth = () => {
    return siswa.laporan.filter((l: any) => {
      const date = new Date(l.tanggal);
      return date.getMonth() === bulan;
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
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

      <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-xl">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            Export Jurnal Bulanan
          </h2>

          <button onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* ERROR */}
        {errorMsg && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-3 text-sm">
            {errorMsg}
          </div>
        )}

        {/* PILIH BULAN */}
        <select
          value={bulan}
          onChange={(e) => setBulan(Number(e.target.value))}
          className="w-full border p-2 rounded mb-4"
        >
          {bulanList.map((b, i) => (
            <option key={i} value={i}>{b}</option>
          ))}
        </select>

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
            className="bg-gray-400 text-white py-2 rounded hover:bg-gray-500"
          >
            Tutup
          </button>

        </div>

      </div>
    </div>
  );
}