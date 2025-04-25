// pages/siswa/pendaftaran/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  increment,
  arrayUnion,
} from 'firebase/firestore';
import { Card } from '@/components/ui/Card';
import PendaftaranModal from '@/components/siswa/PendaftaranModal'; // sesuaikan path


interface Company {
  id: string;
  nama: string;
  alamat: string;
  bidang: string;
  kontak: string;
  kuota: number;
  siswa_terdaftar: string[];
}

export default function DaftarPkl() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBidang, setSelectedBidang] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [uniqueBidang, setUniqueBidang] = useState<string[]>([]);

  // modal 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);


  useEffect(() => {
    const fetchCompanies = async () => {
      const companiesCollection = collection(db, 'perusahaan');
      const companySnapshot = await getDocs(companiesCollection);
      const companiesList = companySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Company[];

      const bidangList = Array.from(new Set(companiesList.map((c) => c.bidang)));

      setCompanies(companiesList);
      setFilteredCompanies(companiesList);
      setUniqueBidang(bidangList);
    };

    fetchCompanies();
  }, []);

  useEffect(() => {
    let result = [...companies];

    // Search
    if (searchQuery) {
      result = result.filter(
        (company) =>
          company.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
          company.bidang.toLowerCase().includes(searchQuery.toLowerCase()) ||
          company.alamat.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter bidang
    if (selectedBidang !== 'all') {
      result = result.filter((company) => company.bidang === selectedBidang);
    }

    setFilteredCompanies(result);
    setCurrentPage(1); // Reset ke halaman 1 saat filter berubah
  }, [searchQuery, selectedBidang, companies]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const openModal = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setSelectedCompany(company);
      setIsModalOpen(true);
    }
  };

  const handleDaftar = async (companyId: string) => {
    const siswaId = localStorage.getItem('siswa_id');
    if (!siswaId) {
      alert('ID siswa tidak ditemukan!');
      return;
    }

    const selectedCompany = companies.find((c) => c.id === companyId);
    if (!selectedCompany || selectedCompany.kuota <= 0) {
      alert('Kuota penuh atau perusahaan tidak ditemukan.');
      return;
    }

    try {
      await addDoc(collection(db, 'pendaftaran'), {
        siswa_id: siswaId,
        perusahaan_id: companyId,
        status: 'pending',
        tanggal_daftar: new Date().toISOString(),
      });

      const companyRef = doc(db, 'perusahaan', companyId);
      await updateDoc(companyRef, {
        kuota: increment(-1),
        siswa_terdaftar: arrayUnion(siswaId),
      });

      alert(`Berhasil mendaftar di perusahaan ${selectedCompany.nama}`);

      setCompanies((prev) =>
        prev.map((company) =>
          company.id === companyId
            ? {
                ...company,
                kuota: company.kuota - 1,
                siswa_terdaftar: [...company.siswa_terdaftar, siswaId],
              }
            : company
        )
      );
    } catch (error) {
      console.error('Gagal mendaftar:', error);
      alert('Terjadi kesalahan saat mendaftar.');
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-6">
      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Cari perusahaan..."
          className="p-2 border rounded-md w-full md:w-1/2"
        />
        <select
          value={selectedBidang}
          onChange={(e) => setSelectedBidang(e.target.value)}
          className="p-2 border rounded-md w-full md:w-1/4"
        >
          <option value="all">Semua Bidang</option>
          {uniqueBidang.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className="p-2 border rounded-md w-full md:w-1/4"
        >
          {[3, 6, 9, 12].map((num) => (
            <option key={num} value={num}>
              {num} per halaman
            </option>
          ))}
        </select>
      </div>

      {/* List Perusahaan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedCompanies.map((company) => (
          <Card
            key={company.id}
            className="bg-white shadow-md rounded-2xl p-5 border hover:shadow-xl transition-shadow duration-300"
          >
            <h3 className="text-xl font-bold text-blue-700 mb-2">
              {company.nama}
            </h3>
            <div className="text-gray-600 space-y-1 text-sm">
              <p>📍 <span className="font-medium">{company.alamat}</span></p>
              <p>💼 <span className="font-medium">{company.bidang}</span></p>
              <p>📞 <span className="font-medium">{company.kontak}</span></p>
            </div>
            <div className="mt-3">
              <p
                className={`text-sm font-semibold ${
                  company.kuota > 0 ? 'text-green-600' : 'text-red-500'
                }`}
              >
                Kuota: {company.kuota} siswa
              </p>
            </div>
            <button
              className="mt-4 bg-blue-500 text-white py-2 px-6 rounded-full hover:bg-blue-600 w-full"
              onClick={() => openModal(company.id)}
              disabled={company.kuota <= 0}
            >
              {company.kuota > 0 ? 'Daftar Sekarang' : 'Kuota Penuh'}
            </button>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-6 gap-2">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="p-2 bg-gray-200 rounded-md disabled:bg-gray-300"
        >
          Prev
        </button>
        <span className="text-sm">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="p-2 bg-gray-200 rounded-md disabled:bg-gray-300"
        >
          Next
        </button>
      </div>

      {/* Modal */}
      <PendaftaranModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedCompany={selectedCompany}
      />
    </div>
  );
}
