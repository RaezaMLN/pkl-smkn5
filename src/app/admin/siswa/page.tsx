'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { db } from '@/lib/firebase';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';

import {
  AlertTriangle,
  CheckSquare,
  Copy,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

import DownloadExcelModal from '@/components/admin/DownloadSiswaModal';

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

interface Siswa {
  id: string;
  nama: string;
  alamat: string;
  email: string;
  gender: string;
  hp: string;
  jurusan: string;
  kelas: string;
  konfirmasi: string;
  nisn: string;
  password: string;
  ttl: string;
}

interface SiswaStatus extends Siswa {
  namaNormal: string;
  jumlahNamaSama: number;
  terdaftarPKL: boolean;
  adaMonitoring: boolean;
  amanDihapus: boolean;
}

type StatusPklFilter =
  | 'all'
  | 'terdaftar'
  | 'belum';

/*
|--------------------------------------------------------------------------
| NORMALISASI NAMA
|--------------------------------------------------------------------------
*/

const normalizeNama = (
  value?: string
) => {
  return (value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
};

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function SiswaPage() {
  /*
  |--------------------------------------------------------------------------
  | DATA
  |--------------------------------------------------------------------------
  */

  const [
    siswa,
    setSiswa,
  ] = useState<Siswa[]>([]);

  const [
    siswaDalamPerusahaan,
    setSiswaDalamPerusahaan,
  ] = useState<Set<string>>(
    new Set()
  );

  const [
    siswaDalamMonitoring,
    setSiswaDalamMonitoring,
  ] = useState<Set<string>>(
    new Set()
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  /*
  |--------------------------------------------------------------------------
  | FORM
  |--------------------------------------------------------------------------
  */

  const [
    form,
    setForm,
  ] = useState<
    Omit<Siswa, 'id'>
  >({
    nama: '',
    alamat: '',
    email: '',
    gender: '',
    hp: '',
    jurusan: '',
    kelas: '',
    konfirmasi: '',
    nisn: '',
    password: '',
    ttl: '',
  });

  const [
    editMode,
    setEditMode,
  ] = useState(false);

  const [
    editId,
    setEditId,
  ] = useState('');

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | FILTER
  |--------------------------------------------------------------------------
  */

  const [
    searchTerm,
    setSearchTerm,
  ] = useState('');

  const [
    selectedKelas,
    setSelectedKelas,
  ] = useState('all');

  /*
  |--------------------------------------------------------------------------
  | FILTER STATUS PKL - BARU
  |--------------------------------------------------------------------------
  */

  const [
    selectedStatusPkl,
    setSelectedStatusPkl,
  ] =
    useState<StatusPklFilter>(
      'all'
    );

  const [
    sortNama,
    setSortNama,
  ] = useState('default');

  const [
    modeDuplikat,
    setModeDuplikat,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | PAGINATION
  |--------------------------------------------------------------------------
  */

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    itemsPerPage,
    setItemsPerPage,
  ] = useState(20);

  /*
  |--------------------------------------------------------------------------
  | DELETE SINGLE
  |--------------------------------------------------------------------------
  */

  const [
    showConfirmDelete,
    setShowConfirmDelete,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState('');

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | BULK DELETE
  |--------------------------------------------------------------------------
  */

  const [
    selectedIds,
    setSelectedIds,
  ] = useState<Set<string>>(
    new Set()
  );

  const [
    showBulkDelete,
    setShowBulkDelete,
  ] = useState(false);

  const [
    bulkDeleting,
    setBulkDeleting,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | EXCEL
  |--------------------------------------------------------------------------
  */

  const [
    showExcelModal,
    setShowExcelModal,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | ERROR / SUCCESS
  |--------------------------------------------------------------------------
  */

  const [
    error,
    setError,
  ] = useState('');

  const [
    success,
    setSuccess,
  ] = useState('');

  /*
  |--------------------------------------------------------------------------
  | FETCH DATA
  |--------------------------------------------------------------------------
  */

  const fetchData =
    async () => {
      try {
        setLoading(true);
        setError('');

        /*
        |--------------------------------------------------------------------------
        | LOAD PARALEL
        |--------------------------------------------------------------------------
        */

        const [
          siswaSnap,
          perusahaanSnap,
          monitoringSnap,
        ] = await Promise.all([
          getDocs(
            collection(
              db,
              'siswa'
            )
          ),

          getDocs(
            collection(
              db,
              'perusahaan'
            )
          ),

          getDocs(
            collection(
              db,
              'monitoring'
            )
          ),
        ]);

        /*
        |--------------------------------------------------------------------------
        | SISWA
        |--------------------------------------------------------------------------
        */

        const siswaList =
          siswaSnap.docs.map(
            (item) =>
              ({
                id:
                  item.id,

                ...item.data(),
              } as Siswa)
          );

        /*
        |--------------------------------------------------------------------------
        | SISWA YANG TERDAFTAR DI PERUSAHAAN
        |--------------------------------------------------------------------------
        */

        const perusahaanSiswaSet =
          new Set<string>();

        perusahaanSnap.docs.forEach(
          (perDoc) => {
            const data =
              perDoc.data();

            const ids =
              Array.isArray(
                data.siswa_terdaftar
              )
                ? data.siswa_terdaftar
                : [];

            ids.forEach(
              (
                id: unknown
              ) => {
                if (
                  typeof id ===
                  'string'
                ) {
                  perusahaanSiswaSet.add(
                    id
                  );
                }
              }
            );
          }
        );

        /*
        |--------------------------------------------------------------------------
        | SISWA YANG PUNYA MONITORING
        |--------------------------------------------------------------------------
        */

        const monitoringSiswaSet =
          new Set<string>();

        monitoringSnap.docs.forEach(
          (monitorDoc) => {
            const data =
              monitorDoc.data();

            if (
              typeof data.siswaId ===
                'string' &&
              data.siswaId
            ) {
              monitoringSiswaSet.add(
                data.siswaId
              );
            }
          }
        );

        /*
        |--------------------------------------------------------------------------
        | SET DATA
        |--------------------------------------------------------------------------
        */

        setSiswa(
          siswaList
        );

        setSiswaDalamPerusahaan(
          perusahaanSiswaSet
        );

        setSiswaDalamMonitoring(
          monitoringSiswaSet
        );
      } catch (err) {
        console.error(
          'Gagal mengambil data siswa:',
          err
        );

        setError(
          'Gagal mengambil data siswa.'
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchData();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | FORM CHANGE
  |--------------------------------------------------------------------------
  */

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const {
      name,
      value,
    } = e.target;

    setForm(
      (prev) => ({
        ...prev,
        [name]:
          value,
      })
    );
  };

  /*
  |--------------------------------------------------------------------------
  | RESET FORM
  |--------------------------------------------------------------------------
  */

  const resetForm =
    () => {
      setForm({
        nama: '',
        alamat: '',
        email: '',
        gender: '',
        hp: '',
        jurusan: '',
        kelas: '',
        konfirmasi: '',
        nisn: '',
        password: '',
        ttl: '',
      });

      setEditMode(false);
      setEditId('');
      setShowForm(false);
    };

  /*
  |--------------------------------------------------------------------------
  | ADD
  |--------------------------------------------------------------------------
  */

  const handleAdd =
    async () => {
      try {
        setError('');
        setSuccess('');

        await addDoc(
          collection(
            db,
            'siswa'
          ),
          form
        );

        resetForm();

        await fetchData();

        setSuccess(
          'Data siswa berhasil ditambahkan.'
        );
      } catch (err) {
        console.error(
          err
        );

        setError(
          'Gagal menambah siswa.'
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | EDIT
  |--------------------------------------------------------------------------
  */

  const handleEdit = (
    item: Siswa
  ) => {
    setEditMode(true);
    setEditId(
      item.id
    );

    const {
      id,
      ...formData
    } = item;

    setForm(
      formData
    );

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  /*
  |--------------------------------------------------------------------------
  | UPDATE
  |--------------------------------------------------------------------------
  */

  const handleUpdate =
    async () => {
      try {
        setError('');
        setSuccess('');

        await updateDoc(
          doc(
            db,
            'siswa',
            editId
          ),
          form
        );

        resetForm();

        await fetchData();

        setSuccess(
          'Data siswa berhasil diperbarui.'
        );
      } catch (err) {
        console.error(
          err
        );

        setError(
          'Gagal memperbarui siswa.'
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | HITUNG DUPLIKAT
  |--------------------------------------------------------------------------
  */

  const duplicateCountMap =
    useMemo(() => {
      const result =
        new Map<
          string,
          number
        >();

      siswa.forEach(
        (item) => {
          const key =
            normalizeNama(
              item.nama
            );

          if (!key) {
            return;
          }

          result.set(
            key,
            (
              result.get(
                key
              ) || 0
            ) + 1
          );
        }
      );

      return result;
    }, [
      siswa,
    ]);

  /*
  |--------------------------------------------------------------------------
  | DATA SISWA + STATUS
  |--------------------------------------------------------------------------
  */

  const siswaWithStatus =
    useMemo<
      SiswaStatus[]
    >(() => {
      return siswa.map(
        (item) => {
          const namaNormal =
            normalizeNama(
              item.nama
            );

          const jumlahNamaSama =
            duplicateCountMap.get(
              namaNormal
            ) || 1;

          const terdaftarPKL =
            siswaDalamPerusahaan.has(
              item.id
            );

          const adaMonitoring =
            siswaDalamMonitoring.has(
              item.id
            );

          return {
            ...item,

            namaNormal,

            jumlahNamaSama,

            terdaftarPKL,

            adaMonitoring,

            /*
            |--------------------------------------------------------------------------
            | AMAN DIHAPUS HANYA JIKA:
            | - tidak ada di perusahaan
            | - tidak punya monitoring
            |--------------------------------------------------------------------------
            */

            amanDihapus:
              !terdaftarPKL &&
              !adaMonitoring,
          };
        }
      );
    }, [
      siswa,
      duplicateCountMap,
      siswaDalamPerusahaan,
      siswaDalamMonitoring,
    ]);

  /*
  |--------------------------------------------------------------------------
  | GROUP DUPLIKAT
  |--------------------------------------------------------------------------
  */

  const duplicateGroups =
    useMemo(() => {
      const groups =
        new Map<
          string,
          SiswaStatus[]
        >();

      siswaWithStatus.forEach(
        (item) => {
          if (
            item.jumlahNamaSama <=
            1
          ) {
            return;
          }

          const existing =
            groups.get(
              item.namaNormal
            ) || [];

          existing.push(
            item
          );

          groups.set(
            item.namaNormal,
            existing
          );
        }
      );

      return groups;
    }, [
      siswaWithStatus,
    ]);

  /*
  |--------------------------------------------------------------------------
  | STATISTIK DUPLIKAT
  |--------------------------------------------------------------------------
  */

  const duplicateStats =
    useMemo(() => {
      let totalAkunDuplikat =
        0;

      let amanDihapus =
        0;

      duplicateGroups.forEach(
        (group) => {
          totalAkunDuplikat +=
            group.length;

          amanDihapus +=
            group.filter(
              (item) =>
                item.amanDihapus
            ).length;
        }
      );

      return {
        kelompok:
          duplicateGroups.size,

        totalAkunDuplikat,

        amanDihapus,
      };
    }, [
      duplicateGroups,
    ]);

  /*
  |--------------------------------------------------------------------------
  | STATISTIK PKL
  |--------------------------------------------------------------------------
  */

  const statusPklStats =
    useMemo(() => {
      const sudah =
        siswaWithStatus.filter(
          (item) =>
            item.terdaftarPKL
        ).length;

      const belum =
        siswaWithStatus.length -
        sudah;

      return {
        sudah,
        belum,
      };
    }, [
      siswaWithStatus,
    ]);

  /*
  |--------------------------------------------------------------------------
  | KELAS
  |--------------------------------------------------------------------------
  */

  const kelasList =
    useMemo(() => {
      return [
        'all',

        ...Array.from(
          new Set(
            siswa
              .map(
                (item) =>
                  item.kelas
              )
              .filter(
                (kelas) =>
                  kelas &&
                  kelas.trim() !==
                    ''
              )
          )
        ).sort(
          (a, b) =>
            a.localeCompare(
              b,
              'id'
            )
        ),
      ];
    }, [
      siswa,
    ]);

  /*
  |--------------------------------------------------------------------------
  | FILTER DATA
  |--------------------------------------------------------------------------
  */

  const filteredSiswa =
    useMemo(() => {
      const keyword =
        searchTerm
          .trim()
          .toLowerCase();

      const result =
        siswaWithStatus.filter(
          (item) => {
            /*
            |--------------------------------------------------------------------------
            | SEARCH
            |--------------------------------------------------------------------------
            */

            const cocokSearch =
              !keyword ||
              item.nama
                ?.toLowerCase()
                .includes(
                  keyword
                ) ||
              item.email
                ?.toLowerCase()
                .includes(
                  keyword
                ) ||
              item.nisn
                ?.toLowerCase()
                .includes(
                  keyword
                );

            /*
            |--------------------------------------------------------------------------
            | KELAS
            |--------------------------------------------------------------------------
            */

            const cocokKelas =
              selectedKelas ===
                'all' ||
              item.kelas ===
                selectedKelas;

            /*
            |--------------------------------------------------------------------------
            | STATUS PKL - BARU
            |--------------------------------------------------------------------------
            */

            const cocokStatusPkl =
              selectedStatusPkl ===
              'all'
                ? true
                : selectedStatusPkl ===
                  'terdaftar'
                ? item.terdaftarPKL
                : !item.terdaftarPKL;

            /*
            |--------------------------------------------------------------------------
            | DUPLIKAT
            |--------------------------------------------------------------------------
            */

            const cocokDuplikat =
              !modeDuplikat ||
              item.jumlahNamaSama >
                1;

            return (
              cocokSearch &&
              cocokKelas &&
              cocokStatusPkl &&
              cocokDuplikat
            );
          }
        );

      /*
      |--------------------------------------------------------------------------
      | MODE DUPLIKAT
      |--------------------------------------------------------------------------
      */

      if (
        modeDuplikat
      ) {
        return result.sort(
          (a, b) => {
            /*
            |--------------------------------------------------------------------------
            | NAMA SAMA DIBUAT BERDEKATAN
            |--------------------------------------------------------------------------
            */

            const namaCompare =
              a.namaNormal.localeCompare(
                b.namaNormal,
                'id'
              );

            if (
              namaCompare !==
              0
            ) {
              return namaCompare;
            }

            /*
            |--------------------------------------------------------------------------
            | AKUN YANG SUDAH TERPAKAI DITAMPILKAN PALING ATAS
            |--------------------------------------------------------------------------
            */

            const scoreA =
              (
                a.adaMonitoring
                  ? 2
                  : 0
              ) +
              (
                a.terdaftarPKL
                  ? 1
                  : 0
              );

            const scoreB =
              (
                b.adaMonitoring
                  ? 2
                  : 0
              ) +
              (
                b.terdaftarPKL
                  ? 1
                  : 0
              );

            return (
              scoreB -
              scoreA
            );
          }
        );
      }

      /*
      |--------------------------------------------------------------------------
      | SORT NORMAL
      |--------------------------------------------------------------------------
      */

      if (
        sortNama ===
        'az'
      ) {
        result.sort(
          (a, b) =>
            a.nama.localeCompare(
              b.nama,
              'id'
            )
        );
      }

      if (
        sortNama ===
        'za'
      ) {
        result.sort(
          (a, b) =>
            b.nama.localeCompare(
              a.nama,
              'id'
            )
        );
      }

      return result;
    }, [
      siswaWithStatus,
      searchTerm,
      selectedKelas,
      selectedStatusPkl,
      modeDuplikat,
      sortNama,
    ]);

  /*
  |--------------------------------------------------------------------------
  | RESET PAGINATION SAAT FILTER BERUBAH
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedKelas,
    selectedStatusPkl,
    sortNama,
    modeDuplikat,
    itemsPerPage,
  ]);

  /*
  |--------------------------------------------------------------------------
  | PAGINATION
  |--------------------------------------------------------------------------
  */

  const totalPages =
    Math.max(
      Math.ceil(
        filteredSiswa.length /
          itemsPerPage
      ),
      1
    );

  const paginatedSiswa =
    filteredSiswa.slice(
      (
        currentPage -
        1
      ) *
        itemsPerPage,

      currentPage *
        itemsPerPage
    );

  /*
  |--------------------------------------------------------------------------
  | TOGGLE SELECT
  |--------------------------------------------------------------------------
  */

  const toggleSelected = (
    id: string
  ) => {
    setSelectedIds(
      (prev) => {
        const next =
          new Set(
            prev
          );

        if (
          next.has(
            id
          )
        ) {
          next.delete(
            id
          );
        } else {
          next.add(
            id
          );
        }

        return next;
      }
    );
  };

  /*
  |--------------------------------------------------------------------------
  | PILIH DUPLIKAT AMAN
  |--------------------------------------------------------------------------
  */

  const selectSafeDuplicates =
    () => {
      const next =
        new Set<string>();

      duplicateGroups.forEach(
        (group) => {
          if (
            group.length <=
            1
          ) {
            return;
          }

          /*
          |--------------------------------------------------------------------------
          | PILIH AKUN UTAMA
          |--------------------------------------------------------------------------
          */

          const sorted =
            [...group].sort(
              (a, b) => {
                /*
                |--------------------------------------------------------------------------
                | AKUN UTAMA DIPRIORITASKAN BERDASARKAN:
                | monitoring > terdaftar PKL > NISN
                |--------------------------------------------------------------------------
                */

                const scoreA =
                  (
                    a.adaMonitoring
                      ? 100
                      : 0
                  ) +
                  (
                    a.terdaftarPKL
                      ? 50
                      : 0
                  ) +
                  (
                    a.nisn?.trim()
                      ? 10
                      : 0
                  );

                const scoreB =
                  (
                    b.adaMonitoring
                      ? 100
                      : 0
                  ) +
                  (
                    b.terdaftarPKL
                      ? 50
                      : 0
                  ) +
                  (
                    b.nisn?.trim()
                      ? 10
                      : 0
                  );

                return (
                  scoreB -
                  scoreA
                );
              }
            );

          /*
          |--------------------------------------------------------------------------
          | SELALU SIMPAN SATU AKUN UTAMA
          |--------------------------------------------------------------------------
          */

          const akunUtama =
            sorted[0];

          sorted.forEach(
            (item) => {
              if (
                item.id ===
                akunUtama.id
              ) {
                return;
              }

              if (
                item.amanDihapus
              ) {
                next.add(
                  item.id
                );
              }
            }
          );
        }
      );

      setSelectedIds(
        next
      );
    };

  /*
  |--------------------------------------------------------------------------
  | DELETE SINGLE
  |--------------------------------------------------------------------------
  */

  const handleDelete =
    async (
      id: string
    ) => {
      const target =
        siswaWithStatus.find(
          (item) =>
            item.id === id
        );

      /*
      |--------------------------------------------------------------------------
      | PROTEKSI
      |--------------------------------------------------------------------------
      */

      if (
        target &&
        !target.amanDihapus
      ) {
        setError(
          'Siswa ini sudah terhubung ke data PKL atau monitoring. Jangan hapus langsung agar relasi data tidak rusak.'
        );

        setShowConfirmDelete(
          false
        );

        return;
      }

      try {
        setDeleting(true);
        setError('');
        setSuccess('');

        await deleteDoc(
          doc(
            db,
            'siswa',
            id
          )
        );

        /*
        |--------------------------------------------------------------------------
        | HAPUS DARI SELECTED
        |--------------------------------------------------------------------------
        */

        setSelectedIds(
          (prev) => {
            const next =
              new Set(
                prev
              );

            next.delete(
              id
            );

            return next;
          }
        );

        await fetchData();

        setSuccess(
          'Data siswa berhasil dihapus.'
        );
      } catch (err) {
        console.error(
          err
        );

        setError(
          'Gagal menghapus siswa.'
        );
      } finally {
        setDeleting(false);

        setShowConfirmDelete(
          false
        );

        setDeletingId('');
      }
    };

  /*
  |--------------------------------------------------------------------------
  | BULK DELETE
  |--------------------------------------------------------------------------
  */

  const handleBulkDelete =
    async () => {
      if (
        selectedIds.size ===
        0
      ) {
        return;
      }

      /*
      |--------------------------------------------------------------------------
      | VALIDASI ULANG
      |--------------------------------------------------------------------------
      */

      const idsAman =
        Array.from(
          selectedIds
        ).filter(
          (id) => {
            const item =
              siswaWithStatus.find(
                (s) =>
                  s.id === id
              );

            return (
              item?.amanDihapus ===
              true
            );
          }
        );

      if (
        idsAman.length ===
        0
      ) {
        setError(
          'Tidak ada akun yang aman untuk dihapus.'
        );

        setShowBulkDelete(
          false
        );

        return;
      }

      try {
        setBulkDeleting(
          true
        );

        setError('');
        setSuccess('');

        /*
        |--------------------------------------------------------------------------
        | DELETE PARALEL
        |--------------------------------------------------------------------------
        */

        await Promise.all(
          idsAman.map(
            (id) =>
              deleteDoc(
                doc(
                  db,
                  'siswa',
                  id
                )
              )
          )
        );

        setSelectedIds(
          new Set()
        );

        setShowBulkDelete(
          false
        );

        await fetchData();

        setSuccess(
          `${idsAman.length} akun siswa berhasil dihapus.`
        );
      } catch (err) {
        console.error(
          'Bulk delete gagal:',
          err
        );

        setError(
          'Sebagian atau seluruh data gagal dihapus.'
        );
      } finally {
        setBulkDeleting(
          false
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | RESET FILTER
  |--------------------------------------------------------------------------
  */

  const resetFilter =
    () => {
      setSearchTerm('');
      setSelectedKelas(
        'all'
      );

      setSelectedStatusPkl(
        'all'
      );

      setSortNama(
        'default'
      );

      setModeDuplikat(
        false
      );

      setCurrentPage(1);
    };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (
    loading
  ) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-gray-50 dark:bg-gray-900">

        <div className="text-center">

          <div className="w-10 h-10 mx-auto border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />

          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Memuat data siswa...
          </p>

        </div>

      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">

      {/* ================================================================
          HEADER
      ================================================================= */}

      <div className="mb-6">

        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
          Manajemen Siswa
        </h1>

        <p className="text-slate-500 dark:text-gray-400 mt-1">
          Kelola data siswa dan bersihkan akun duplikat dengan aman.
        </p>

      </div>

      {/* ================================================================
          ERROR / SUCCESS
      ================================================================= */}

      {error && (
        <div className="mb-5 p-4 rounded-xl bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 p-4 rounded-xl bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300">
          {success}
        </div>
      )}

      {/* ================================================================
          STATISTIK
      ================================================================= */}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">

        {/* TOTAL */}

        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Akun
          </p>

          <h2 className="text-3xl font-bold text-blue-600 mt-2">
            {siswa.length}
          </h2>

          <p className="text-xs text-gray-400 mt-2">
            PKL {statusPklStats.sudah} • Belum {statusPklStats.belum}
          </p>

        </div>

        {/* KELOMPOK DUPLIKAT */}

        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Kelompok Nama Ganda
          </p>

          <h2 className="text-3xl font-bold text-orange-600 mt-2">
            {duplicateStats.kelompok}
          </h2>

        </div>

        {/* AKUN DUPLIKAT */}

        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Akun Dalam Kelompok Duplikat
          </p>

          <h2 className="text-3xl font-bold text-yellow-600 mt-2">
            {duplicateStats.totalAkunDuplikat}
          </h2>

        </div>

        {/* AMAN */}

        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Kandidat Aman
          </p>

          <h2 className="text-3xl font-bold text-green-600 mt-2">
            {duplicateStats.amanDihapus}
          </h2>

        </div>

        {/* SELECT */}

        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Dipilih Hapus
          </p>

          <h2 className="text-3xl font-bold text-red-600 mt-2">
            {selectedIds.size}
          </h2>

        </div>

      </div>

      {/* ================================================================
          DUPLICATE TOOL
      ================================================================= */}

      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-4 mb-6 shadow-sm">

        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">

          <div className="flex items-center gap-3">

            <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-950">

              <Copy
                className="text-orange-600"
                size={20}
              />

            </div>

            <div>

              <h2 className="font-semibold text-gray-900 dark:text-white">
                Pembersihan Duplikat
              </h2>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Hanya akun tanpa relasi PKL dan monitoring yang dapat dihapus otomatis.
              </p>

            </div>

          </div>

          <div className="flex flex-wrap gap-2">

            {/* HANYA DUPLIKAT */}

            <button
              type="button"
              onClick={() => {
                setModeDuplikat(
                  (prev) =>
                    !prev
                );

                setSelectedIds(
                  new Set()
                );
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                modeDuplikat
                  ? 'bg-orange-600 text-white'
                  : 'border border-orange-300 text-orange-700 dark:text-orange-300'
              }`}
            >
              <Copy
                size={16}
                className="inline mr-2"
              />

              {modeDuplikat
                ? 'Tampilkan Semua'
                : 'Hanya Duplikat'}
            </button>

            {/* AUTO SELECT */}

            <button
              type="button"
              onClick={
                selectSafeDuplicates
              }
              disabled={
                duplicateStats.kelompok ===
                0
              }
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-lg text-sm"
            >
              <CheckSquare
                size={16}
                className="inline mr-2"
              />

              Pilih Duplikat Aman
            </button>

            {/* BULK DELETE */}

            <button
              type="button"
              disabled={
                selectedIds.size ===
                0
              }
              onClick={() =>
                setShowBulkDelete(
                  true
                )
              }
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-lg text-sm"
            >
              <Trash2
                size={16}
                className="inline mr-2"
              />

              Hapus Terpilih ({selectedIds.size})
            </button>

          </div>

        </div>

      </div>

      {/* ================================================================
          TOOLBAR
      ================================================================= */}

      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-sm p-4 mb-6">

        <div className="flex flex-col gap-4">

          {/* ATAS */}

          <div className="flex flex-col xl:flex-row gap-3 xl:items-center xl:justify-between">

            {/* ADD */}

            <button
              type="button"
              onClick={() => {
                if (
                  showForm
                ) {
                  resetForm();
                } else {
                  resetForm();

                  setShowForm(
                    true
                  );
                }
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg whitespace-nowrap"
            >
              {showForm
                ? 'Tutup Form'
                : 'Tambah Siswa'}
            </button>

            {/* FILTER */}

            <div className="flex flex-wrap gap-3">

              {/* SEARCH */}

              <input
                type="text"
                placeholder="Cari nama, email, NISN..."
                value={
                  searchTerm
                }
                onChange={(e) =>
                  setSearchTerm(
                    e.target.value
                  )
                }
                className="px-4 py-2 min-w-[220px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />

              {/* KELAS */}

              <select
                value={
                  selectedKelas
                }
                onChange={(e) =>
                  setSelectedKelas(
                    e.target.value
                  )
                }
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >

                {kelasList.map(
                  (kelas) => (
                    <option
                      key={
                        kelas
                      }
                      value={
                        kelas
                      }
                    >
                      {kelas ===
                      'all'
                        ? 'Semua Kelas'
                        : kelas}
                    </option>
                  )
                )}

              </select>

              {/* ========================================================
                  STATUS PKL - BARU
              ========================================================= */}

              <select
                value={
                  selectedStatusPkl
                }
                onChange={(e) =>
                  setSelectedStatusPkl(
                    e.target
                      .value as StatusPklFilter
                  )
                }
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >

                <option value="all">
                  Semua Status PKL
                </option>

                <option value="terdaftar">
                  Sudah Terdaftar PKL
                </option>

                <option value="belum">
                  Belum Terdaftar PKL
                </option>

              </select>

              {/* SORT */}

              <select
                value={
                  sortNama
                }
                onChange={(e) =>
                  setSortNama(
                    e.target.value
                  )
                }
                disabled={
                  modeDuplikat
                }
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              >

                <option value="default">
                  Urutan Default
                </option>

                <option value="az">
                  Nama A-Z
                </option>

                <option value="za">
                  Nama Z-A
                </option>

              </select>

              {/* PER PAGE */}

              <select
                value={
                  itemsPerPage
                }
                onChange={(e) =>
                  setItemsPerPage(
                    Number(
                      e.target.value
                    )
                  )
                }
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >

                {[
                  10,
                  20,
                  50,
                  100,
                ].map(
                  (num) => (
                    <option
                      key={
                        num
                      }
                      value={
                        num
                      }
                    >
                      {num}/halaman
                    </option>
                  )
                )}

              </select>

              {/* RESET */}

              <button
                type="button"
                onClick={
                  resetFilter
                }
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Reset Filter
              </button>

              {/* EXCEL */}

              <button
                type="button"
                onClick={() =>
                  setShowExcelModal(
                    true
                  )
                }
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Download Excel
              </button>

            </div>

          </div>

          {/* ================================================================
              INFO FILTER
          ================================================================= */}

          <div className="pt-3 border-t border-gray-100 dark:border-gray-700">

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Menampilkan{' '}

              <strong className="text-gray-900 dark:text-white">
                {filteredSiswa.length}
              </strong>{' '}

              dari{' '}

              <strong className="text-gray-900 dark:text-white">
                {siswa.length}
              </strong>{' '}

              akun siswa

              {selectedStatusPkl ===
                'terdaftar' &&
                ' yang sudah terdaftar PKL'}

              {selectedStatusPkl ===
                'belum' &&
                ' yang belum terdaftar PKL'}

              {modeDuplikat &&
                ' dan memiliki nama duplikat'}.
            </p>

          </div>

        </div>

      </div>

      {/* ================================================================
          FORM
      ================================================================= */}

      {showForm && (
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-sm p-5 mb-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {Object.keys(
              form
            ).map(
              (key) => (
                <div
                  key={
                    key
                  }
                >

                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {key
                      .charAt(0)
                      .toUpperCase() +
                      key.slice(
                        1
                      )}
                  </label>

                  <input
                    type="text"
                    name={
                      key
                    }
                    value={
                      (
                        form as Record<
                          string,
                          string
                        >
                      )[key] ||
                      ''
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />

                </div>
              )
            )}

          </div>

          <div className="flex gap-2 mt-4">

            <button
              type="button"
              onClick={
                editMode
                  ? handleUpdate
                  : handleAdd
              }
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              {editMode
                ? 'Update Siswa'
                : 'Simpan Siswa'}
            </button>

            <button
              type="button"
              onClick={
                resetForm
              }
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg"
            >
              Batal
            </button>

          </div>

        </div>
      )}

      {/* ================================================================
          EXCEL MODAL
      ================================================================= */}

      {showExcelModal && (
        <DownloadExcelModal
          open={
            showExcelModal
          }
          onClose={() =>
            setShowExcelModal(
              false
            )
          }
        />
      )}

      {/* ================================================================
          TABLE
      ================================================================= */}

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">

        <table className="min-w-full text-sm">

          <thead className="bg-slate-50 dark:bg-gray-700">

            <tr>

              <th className="px-3 py-3 text-center text-gray-900 dark:text-white">
                Pilih
              </th>

              <th className="px-3 py-3 text-left text-gray-900 dark:text-white">
                No
              </th>

              <th className="px-3 py-3 text-left text-gray-900 dark:text-white">
                Nama
              </th>

              <th className="px-3 py-3 text-left text-gray-900 dark:text-white">
                Email
              </th>

              <th className="px-3 py-3 text-left text-gray-900 dark:text-white">
                NISN
              </th>

              <th className="px-3 py-3 text-left text-gray-900 dark:text-white">
                Kelas
              </th>

              <th className="px-3 py-3 text-left text-gray-900 dark:text-white">
                Status Data
              </th>

              <th className="px-3 py-3 text-center text-gray-900 dark:text-white">
                Aksi
              </th>

            </tr>

          </thead>

          <tbody>

            {paginatedSiswa.map(
              (
                item,
                index
              ) => (
                <tr
                  key={
                    item.id
                  }
                  className={`
                    border-t
                    border-gray-200
                    dark:border-gray-700
                    text-gray-900
                    dark:text-white
                    ${
                      item.jumlahNamaSama >
                      1
                        ? 'bg-orange-50/50 dark:bg-orange-950/10'
                        : 'hover:bg-slate-50 dark:hover:bg-gray-700'
                    }
                  `}
                >

                  {/* ======================================================
                      CHECKBOX
                  ======================================================= */}

                  <td className="px-3 py-3 text-center">

                    <input
                      type="checkbox"
                      checked={
                        selectedIds.has(
                          item.id
                        )
                      }
                      disabled={
                        !item.amanDihapus
                      }
                      onChange={() =>
                        toggleSelected(
                          item.id
                        )
                      }
                      className="w-4 h-4"
                      title={
                        item.amanDihapus
                          ? 'Pilih untuk dihapus'
                          : 'Tidak dapat dihapus karena sudah digunakan'
                      }
                    />

                  </td>

                  {/* ======================================================
                      NUMBER
                  ======================================================= */}

                  <td className="px-3 py-3">

                    {(currentPage -
                      1) *
                      itemsPerPage +
                      index +
                      1}

                  </td>

                  {/* ======================================================
                      NAMA
                  ======================================================= */}

                  <td className="px-3 py-3">

                    <div className="flex flex-wrap items-center gap-2">

                      <span className="font-medium">
                        {item.nama ||
                          '-'}
                      </span>

                      {item.jumlahNamaSama >
                        1 && (
                        <span className="px-2 py-0.5 text-[11px] rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">

                          Duplikat x
                          {
                            item.jumlahNamaSama
                          }

                        </span>
                      )}

                    </div>

                    <p className="text-[10px] text-gray-400 mt-1 font-mono">
                      ID: {item.id}
                    </p>

                  </td>

                  {/* ======================================================
                      EMAIL
                  ======================================================= */}

                  <td className="px-3 py-3">
                    {item.email ||
                      '-'}
                  </td>

                  {/* ======================================================
                      NISN
                  ======================================================= */}

                  <td className="px-3 py-3">
                    {item.nisn ||
                      '-'}
                  </td>

                  {/* ======================================================
                      KELAS
                  ======================================================= */}

                  <td className="px-3 py-3">

                    <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 text-xs">
                      {item.kelas ||
                        '-'}
                    </span>

                  </td>

                  {/* ======================================================
                      STATUS
                  ======================================================= */}

                  <td className="px-3 py-3">

                    <div className="flex flex-wrap gap-1.5">

                      {/* ==================================================
                          STATUS PKL
                      =================================================== */}

                      {item.terdaftarPKL ? (
                        <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          Terdaftar PKL
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          Belum Terdaftar PKL
                        </span>
                      )}

                      {/* MONITORING */}

                      {item.adaMonitoring && (
                        <span className="px-2 py-1 rounded-full text-[11px] bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                          Ada Monitoring
                        </span>
                      )}

                      {/* AMAN */}

                      {item.amanDihapus && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">

                          <ShieldCheck
                            size={12}
                          />

                          Tidak Terpakai

                        </span>
                      )}

                    </div>

                  </td>

                  {/* ======================================================
                      ACTION
                  ======================================================= */}

                  <td className="px-3 py-3">

                    <div className="flex justify-center gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          handleEdit(
                            item
                          )
                        }
                        className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        disabled={
                          !item.amanDihapus
                        }
                        onClick={() => {
                          setDeletingId(
                            item.id
                          );

                          setShowConfirmDelete(
                            true
                          );
                        }}
                        className="px-3 py-1.5 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded"
                      >
                        Hapus
                      </button>

                    </div>

                  </td>

                </tr>
              )
            )}

            {/* ============================================================
                EMPTY
            ============================================================= */}

            {paginatedSiswa.length ===
              0 && (
              <tr>

                <td
                  colSpan={
                    8
                  }
                  className="px-4 py-14 text-center text-gray-500 dark:text-gray-400"
                >

                  {selectedStatusPkl ===
                  'terdaftar'
                    ? 'Tidak ada siswa yang sudah terdaftar PKL sesuai filter.'
                    : selectedStatusPkl ===
                      'belum'
                    ? 'Tidak ada siswa yang belum terdaftar PKL sesuai filter.'
                    : 'Tidak ada data siswa.'}

                </td>

              </tr>
            )}

          </tbody>

        </table>

      </div>

      {/* ================================================================
          PAGINATION
      ================================================================= */}

      <div className="flex flex-wrap justify-center items-center mt-6 gap-2">

        <button
          type="button"
          disabled={
            currentPage ===
            1
          }
          onClick={() =>
            setCurrentPage(
              (prev) =>
                Math.max(
                  prev -
                    1,
                  1
                )
            )
          }
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          Prev
        </button>

        <span className="px-3 text-sm text-gray-600 dark:text-gray-300">

          Halaman{' '}

          <strong>
            {currentPage}
          </strong>{' '}

          dari{' '}

          <strong>
            {totalPages}
          </strong>

        </span>

        <button
          type="button"
          disabled={
            currentPage >=
            totalPages
          }
          onClick={() =>
            setCurrentPage(
              (prev) =>
                Math.min(
                  prev +
                    1,
                  totalPages
                )
            )
          }
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          Next
        </button>

      </div>

      {/* ================================================================
          SINGLE DELETE MODAL
      ================================================================= */}

      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">

            <div className="flex items-start gap-3">

              <AlertTriangle
                className="text-red-600 shrink-0"
              />

              <div>

                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Hapus akun siswa?
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Data ini tidak terhubung ke perusahaan maupun monitoring dan aman untuk dibersihkan.
                </p>

              </div>

            </div>

            <div className="flex justify-end gap-2 mt-6">

              <button
                type="button"
                onClick={() => {
                  setShowConfirmDelete(
                    false
                  );

                  setDeletingId('');
                }}
                disabled={
                  deleting
                }
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={
                  deleting
                }
                onClick={() =>
                  handleDelete(
                    deletingId
                  )
                }
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded"
              >
                {deleting
                  ? 'Menghapus...'
                  : 'Ya, Hapus'}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ================================================================
          BULK DELETE MODAL
      ================================================================= */}

      {showBulkDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg">

            <div className="flex items-start gap-3">

              <AlertTriangle
                className="text-red-600 shrink-0"
                size={24}
              />

              <div>

                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Hapus {selectedIds.size} akun siswa?
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Sistem hanya akan menghapus akun yang tidak ditemukan pada data perusahaan dan tidak memiliki monitoring.
                </p>

              </div>

            </div>

            <div className="mt-5 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">

              <p className="text-sm text-red-700 dark:text-red-300">
                Penghapusan tidak dapat dibatalkan. Pastikan akun utama siswa tetap dipertahankan.
              </p>

            </div>

            <div className="flex justify-end gap-2 mt-6">

              <button
                type="button"
                disabled={
                  bulkDeleting
                }
                onClick={() =>
                  setShowBulkDelete(
                    false
                  )
                }
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={
                  bulkDeleting
                }
                onClick={
                  handleBulkDelete
                }
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded"
              >
                {bulkDeleting
                  ? 'Menghapus...'
                  : `Hapus ${selectedIds.size} Akun`}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}