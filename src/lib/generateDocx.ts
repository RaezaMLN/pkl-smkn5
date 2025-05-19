import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";

/**
 * Mengunduh file surat pernyataan .docx berdasarkan template dan data siswa
 * @param templateUrl URL relatif ke file template .docx (misal: "/template/surat_pernyataan.docx")
 * @param data Objek data yang akan diisi ke dalam template (berdasarkan placeholder dalam template)
 */
export async function generateDocx(templateUrl: string, data: Record<string, string>) {
  try {
    console.log("Fetching template from:", templateUrl);

    // Ambil file template .docx dari public folder
    const response = await fetch(templateUrl);

    // Jika fetch gagal, tampilkan error
    if (!response.ok) {
        throw new Error(`Template tidak ditemukan: ${response.statusText}`);
      }

    // Menggunakan blob daripada arrayBuffer
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();

    // Load file .docx sebagai zip
    const zip = new PizZip(arrayBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Isi data ke dalam placeholder {{...}}
    doc.setData(data);

    try {
      doc.render(); // Proses render dokumen dengan data
    } catch (error: any) {
      console.error("Template rendering error:", error);
      throw new Error("Gagal merender dokumen. Pastikan semua placeholder sesuai.");
    }

    // Hasilkan blob dan trigger download
    const out = doc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    saveAs(out, "FilePKL.docx");
  } catch (err) {
    console.error("Gagal mengunduh template atau membuat dokumen:", err);
    alert("Terjadi kesalahan saat membuat surat. Silakan coba lagi.");
  }
}
