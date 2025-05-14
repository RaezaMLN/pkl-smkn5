// components/PendidikanModal.tsx

import React, { useState } from 'react';

interface PendidikanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPendidikan: (pendidikan: { tingkat: string; namaSekolah: string }) => void;
}

const PendidikanModal: React.FC<PendidikanModalProps> = ({ isOpen, onClose, onAddPendidikan }) => {
  const [newPendidikan, setNewPendidikan] = useState({ tingkat: '', namaSekolah: '' });
  const [errorMessage, setErrorMessage] = useState('');

  const handleAddPendidikan = () => {
    if (!newPendidikan.tingkat || !newPendidikan.namaSekolah) {
      setErrorMessage('Tingkat pendidikan dan nama sekolah harus diisi');
      return;
    }

    onAddPendidikan(newPendidikan);
    setNewPendidikan({ tingkat: '', namaSekolah: '' });
    setErrorMessage('');
    onClose();  // Menutup modal setelah menambah pendidikan
  };

  return isOpen ? (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
        <h3 className="text-lg font-semibold mb-4">Tambah Pendidikan</h3>

        {/* Error message */}
        {errorMessage && <div className="text-red-500 text-sm mb-4">{errorMessage}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700">Tingkat Pendidikan</label>
          <input
            type="text"
            value={newPendidikan.tingkat}
            onChange={(e) => setNewPendidikan({ ...newPendidikan, tingkat: e.target.value })}
            className="mt-1 p-2 w-full border rounded-md"
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Nama Sekolah</label>
          <input
            type="text"
            value={newPendidikan.namaSekolah}
            onChange={(e) => setNewPendidikan({ ...newPendidikan, namaSekolah: e.target.value })}
            className="mt-1 p-2 w-full border rounded-md"
          />
        </div>

        <div className="mt-4 flex justify-between">
          <button
            type="button"
            onClick={handleAddPendidikan}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md"
          >
            Tambah
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  ) : null;
};

export default PendidikanModal;
