'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useRouter,
} from 'next/navigation';

import {
  collection,
  getDocs,
} from 'firebase/firestore';

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  FolderKanban,
  Search,
  TriangleAlert,
  UserRoundCheck,
  Users,
} from 'lucide-react';

import { db } from '@/lib/firebase';

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

interface LaporanItem {
  id: string;

  siswaId: string;
  siswaNama: string;
  kelas: string;
  jurusan: string;

  pembimbingId: string;
  pembimbingNama: string;

  perusahaanId: string;
  perusahaanNama: string;

  tanggal: string;
  waktu: string;

  jenisMonitoring: string;

  progressProject?: number;

  statusPerkembangan: string;

  sortTime: number;
}

interface FilterOption {
  id: string;
  nama: string;
}

interface KepsekLocal {
  id?: string;
  nama?: string;
  username?: string;
}

type SortOrder =
  | 'terbaru'
  | 'terlama'
  | 'siswa_az'
  | 'siswa_za';

/*
|--------------------------------------------------------------------------
| HELPER MONITORING TIME
|--------------------------------------------------------------------------
*/

const getMonitoringTime = (
  data: Record<string, any>
) => {
  if (data.tanggal) {
    const value = new Date(
      `${data.tanggal}T${data.waktu || '00:00'}`
    ).getTime();

    if (!Number.isNaN(value)) {
      return value;
    }
  }

  if (
    data.createdAt &&
    typeof data.createdAt.toMillis === 'function'
  ) {
    return data.createdAt.toMillis();
  }

  return 0;
};

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function LaporanKepsekPage() {
  const router = useRouter();

  /*
  |--------------------------------------------------------------------------
  | DATA
  |--------------------------------------------------------------------------
  */

  const [
    laporan,
    setLaporan,
  ] = useState<LaporanItem[]>([]);

  const [
    siswaOptions,
    setSiswaOptions,
  ] = useState<FilterOption[]>([]);

  const [
    pembimbingOptions,
    setPembimbingOptions,
  ] = useState<FilterOption[]>([]);

  const [
    perusahaanOptions,
    setPerusahaanOptions,
  ] = useState<FilterOption[]>([]);

  /*
  |--------------------------------------------------------------------------
  | FILTER
  |--------------------------------------------------------------------------
  */

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    filterSiswa,
    setFilterSiswa,
  ] = useState('');

  const [
    filterPembimbing,
    setFilterPembimbing,
  ] = useState('');

  const [
    filterPerusahaan,
    setFilterPerusahaan,
  ] = useState('');

  const [
    filterBulan,
    setFilterBulan,
  ] = useState('');

  const [
    filterStatus,
    setFilterStatus,
  ] = useState('');

  const [
    sortOrder,
    setSortOrder,
  ] = useState<SortOrder>(
    'terbaru'
  );

  /*
  |--------------------------------------------------------------------------
  | PAGINATION
  |--------------------------------------------------------------------------
  */

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const itemsPerPage = 10;

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  const [
    exportingExcel,
    setExportingExcel,
  ] = useState(false);

  const [
    exportingPdf,
    setExportingPdf,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | FETCH DATA
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        /*
        |--------------------------------------------------------------------------
        | LOAD COLLECTION PARALEL
        |--------------------------------------------------------------------------
        */

        const [
          monitoringSnap,
          siswaSnap,
          pembimbingSnap,
          perusahaanSnap,
        ] = await Promise.all([
          getDocs(
            collection(
              db,
              'monitoring'
            )
          ),

          getDocs(
            collection(
              db,
              'siswa'
            )
          ),

          getDocs(
            collection(
              db,
              'pembimbing'
            )
          ),

          getDocs(
            collection(
              db,
              'perusahaan'
            )
          ),
        ]);

        /*
        |--------------------------------------------------------------------------
        | SISWA MAP
        |--------------------------------------------------------------------------
        */

        const siswaMap =
          new Map<
            string,
            {
              nama: string;
              kelas: string;
              jurusan: string;
            }
          >();

        const nextSiswaOptions: FilterOption[] =
          [];

        siswaSnap.docs.forEach(
          (docItem) => {
            const data =
              docItem.data();

            const nama =
              data.nama ||
              'Siswa';

            siswaMap.set(
              docItem.id,
              {
                nama,

                kelas:
                  data.kelas ||
                  '-',

                jurusan:
                  data.jurusan ||
                  '-',
              }
            );

            nextSiswaOptions.push({
              id:
                docItem.id,

              nama,
            });
          }
        );

        /*
        |--------------------------------------------------------------------------
        | PEMBIMBING MAP
        |--------------------------------------------------------------------------
        */

        const pembimbingMap =
          new Map<
            string,
            string
          >();

        const nextPembimbingOptions: FilterOption[] =
          [];

        pembimbingSnap.docs.forEach(
          (docItem) => {
            const data =
              docItem.data();

            const nama =
              data.nama ||
              'Pembimbing';

            pembimbingMap.set(
              docItem.id,
              nama
            );

            nextPembimbingOptions.push({
              id:
                docItem.id,

              nama,
            });
          }
        );

        /*
        |--------------------------------------------------------------------------
        | PERUSAHAAN MAP
        |--------------------------------------------------------------------------
        */

        const perusahaanMap =
          new Map<
            string,
            string
          >();

        const nextPerusahaanOptions: FilterOption[] =
          [];

        perusahaanSnap.docs.forEach(
          (docItem) => {
            const data =
              docItem.data();

            const nama =
              data.nama ||
              '-';

            perusahaanMap.set(
              docItem.id,
              nama
            );

            nextPerusahaanOptions.push({
              id:
                docItem.id,

              nama,
            });
          }
        );

        /*
        |--------------------------------------------------------------------------
        | BUILD LAPORAN
        |--------------------------------------------------------------------------
        */

        const result: LaporanItem[] =
          monitoringSnap.docs.map(
            (monitorDoc) => {
              const data =
                monitorDoc.data();

              const siswa =
                siswaMap.get(
                  data.siswaId
                );

              let progress:
                | number
                | undefined =
                undefined;

              if (
                typeof data.progressProject ===
                'number'
              ) {
                progress =
                  Math.min(
                    Math.max(
                      data.progressProject,
                      0
                    ),
                    100
                  );
              }

              return {
                id:
                  monitorDoc.id,

                siswaId:
                  data.siswaId ||
                  '',

                siswaNama:
                  siswa?.nama ||
                  'Siswa',

                kelas:
                  siswa?.kelas ||
                  '-',

                jurusan:
                  siswa?.jurusan ||
                  '-',

                pembimbingId:
                  data.pembimbingId ||
                  '',

                pembimbingNama:
                  pembimbingMap.get(
                    data.pembimbingId
                  ) ||
                  'Pembimbing',

                perusahaanId:
                  data.perusahaanId ||
                  '',

                perusahaanNama:
                  perusahaanMap.get(
                    data.perusahaanId
                  ) ||
                  '-',

                tanggal:
                  data.tanggal ||
                  '',

                waktu:
                  data.waktu ||
                  '',

                jenisMonitoring:
                  data.jenisMonitoring ||
                  '',

                progressProject:
                  progress,

                statusPerkembangan:
                  data.statusPerkembangan ||
                  '',

                sortTime:
                  getMonitoringTime(
                    data
                  ),
              };
            }
          );

        /*
        |--------------------------------------------------------------------------
        | SORT DEFAULT
        |--------------------------------------------------------------------------
        */

        result.sort(
          (a, b) =>
            b.sortTime -
            a.sortTime
        );

        /*
        |--------------------------------------------------------------------------
        | SORT OPTIONS
        |--------------------------------------------------------------------------
        */

        nextSiswaOptions.sort(
          (a, b) =>
            a.nama.localeCompare(
              b.nama,
              'id'
            )
        );

        nextPembimbingOptions.sort(
          (a, b) =>
            a.nama.localeCompare(
              b.nama,
              'id'
            )
        );

        nextPerusahaanOptions.sort(
          (a, b) =>
            a.nama.localeCompare(
              b.nama,
              'id'
            )
        );

        /*
        |--------------------------------------------------------------------------
        | SET STATE
        |--------------------------------------------------------------------------
        */

        if (!cancelled) {
          setLaporan(
            result
          );

          setSiswaOptions(
            nextSiswaOptions
          );

          setPembimbingOptions(
            nextPembimbingOptions
          );

          setPerusahaanOptions(
            nextPerusahaanOptions
          );
        }
      } catch (err) {
        console.error(
          'Gagal mengambil laporan Kepala Sekolah:',
          err
        );

        if (!cancelled) {
          setError(
            'Data laporan gagal dimuat.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | JENIS MONITORING
  |--------------------------------------------------------------------------
  */

  const jenisLabel = (
    jenis?: string
  ) => {
    switch (jenis) {
      case 'kunjungan_langsung':
        return 'Kunjungan Langsung';

      case 'online':
        return 'Online / Video Call';

      case 'telepon':
        return 'Telepon';

      case 'koordinasi_industri':
        return 'Koordinasi Industri';

      case 'lainnya':
        return 'Lainnya';

      default:
        return (
          jenis?.replaceAll(
            '_',
            ' '
          ) ||
          '-'
        );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | STATUS
  |--------------------------------------------------------------------------
  */

  const statusLabel = (
    status?: string
  ) => {
    switch (status) {
      case 'sangat_baik':
        return 'Sangat Baik';

      case 'baik':
        return 'Baik';

      case 'perlu_perhatian':
        return 'Perlu Perhatian';

      case 'bermasalah':
        return 'Bermasalah';

      default:
        return '-';
    }
  };

  const statusClass = (
    status?: string
  ) => {
    switch (status) {
      case 'sangat_baik':
        return `
          bg-green-100
          text-green-700
          dark:bg-green-950
          dark:text-green-300
        `;

      case 'baik':
        return `
          bg-blue-100
          text-blue-700
          dark:bg-blue-950
          dark:text-blue-300
        `;

      case 'perlu_perhatian':
        return `
          bg-yellow-100
          text-yellow-700
          dark:bg-yellow-950
          dark:text-yellow-300
        `;

      case 'bermasalah':
        return `
          bg-red-100
          text-red-700
          dark:bg-red-950
          dark:text-red-300
        `;

      default:
        return `
          bg-gray-100
          text-gray-600
          dark:bg-gray-800
          dark:text-gray-300
        `;
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FILTER + SORT
  |--------------------------------------------------------------------------
  */

  const filteredData =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      const filtered =
        laporan.filter(
          (item) => {
            const matchSearch =
              !keyword ||
              item.siswaNama
                .toLowerCase()
                .includes(
                  keyword
                ) ||
              item.kelas
                .toLowerCase()
                .includes(
                  keyword
                ) ||
              item.jurusan
                .toLowerCase()
                .includes(
                  keyword
                ) ||
              item.pembimbingNama
                .toLowerCase()
                .includes(
                  keyword
                ) ||
              item.perusahaanNama
                .toLowerCase()
                .includes(
                  keyword
                );

            const matchSiswa =
              !filterSiswa ||
              item.siswaId ===
                filterSiswa;

            const matchPembimbing =
              !filterPembimbing ||
              item.pembimbingId ===
                filterPembimbing;

            const matchPerusahaan =
              !filterPerusahaan ||
              item.perusahaanId ===
                filterPerusahaan;

            const matchBulan =
              !filterBulan ||
              item.tanggal.startsWith(
                filterBulan
              );

            const matchStatus =
              !filterStatus ||
              item.statusPerkembangan ===
                filterStatus;

            return (
              matchSearch &&
              matchSiswa &&
              matchPembimbing &&
              matchPerusahaan &&
              matchBulan &&
              matchStatus
            );
          }
        );

      const result =
        [...filtered];

      result.sort(
        (a, b) => {
          switch (
            sortOrder
          ) {
            case 'terbaru':
              return (
                b.sortTime -
                a.sortTime
              );

            case 'terlama':
              return (
                a.sortTime -
                b.sortTime
              );

            case 'siswa_az':
              return a.siswaNama.localeCompare(
                b.siswaNama,
                'id'
              );

            case 'siswa_za':
              return b.siswaNama.localeCompare(
                a.siswaNama,
                'id'
              );

            default:
              return 0;
          }
        }
      );

      return result;
    }, [
      laporan,
      search,
      filterSiswa,
      filterPembimbing,
      filterPerusahaan,
      filterBulan,
      filterStatus,
      sortOrder,
    ]);

  /*
  |--------------------------------------------------------------------------
  | RESET PAGE SAAT FILTER BERUBAH
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    filterSiswa,
    filterPembimbing,
    filterPerusahaan,
    filterBulan,
    filterStatus,
    sortOrder,
  ]);

  /*
  |--------------------------------------------------------------------------
  | SUMMARY
  |--------------------------------------------------------------------------
  */

  const summary =
    useMemo(() => {
      const siswaSet =
        new Set<string>();

      let totalProgress =
        0;

      let jumlahProgress =
        0;

      let perluPerhatian =
        0;

      filteredData.forEach(
        (item) => {
          if (
            item.siswaId
          ) {
            siswaSet.add(
              item.siswaId
            );
          }

          if (
            typeof item.progressProject ===
            'number'
          ) {
            totalProgress +=
              item.progressProject;

            jumlahProgress +=
              1;
          }

          if (
            item.statusPerkembangan ===
              'perlu_perhatian' ||
            item.statusPerkembangan ===
              'bermasalah'
          ) {
            perluPerhatian +=
              1;
          }
        }
      );

      const rataRataProgress =
        jumlahProgress > 0
          ? Math.round(
              totalProgress /
                jumlahProgress
            )
          : 0;

      return {
        totalMonitoring:
          filteredData.length,

        totalSiswa:
          siswaSet.size,

        rataRataProgress,

        perluPerhatian,
      };
    }, [
      filteredData,
    ]);

  /*
  |--------------------------------------------------------------------------
  | PAGINATION
  |--------------------------------------------------------------------------
  */

  const totalPages =
    Math.max(
      Math.ceil(
        filteredData.length /
          itemsPerPage
      ),
      1
    );

  const startIndex =
    (currentPage - 1) *
    itemsPerPage;

  const paginatedData =
    filteredData.slice(
      startIndex,
      startIndex +
        itemsPerPage
    );

  /*
  |--------------------------------------------------------------------------
  | FORMAT TANGGAL
  |--------------------------------------------------------------------------
  */

  const formatTanggal = (
    tanggal?: string
  ) => {
    if (!tanggal) {
      return '-';
    }

    const match =
      tanggal.match(
        /^(\d{4})-(\d{2})-(\d{2})$/
      );

    if (!match) {
      return tanggal;
    }

    const date =
      new Date(
        Number(match[1]),
        Number(match[2]) -
          1,
        Number(match[3])
      );

    return new Intl.DateTimeFormat(
      'id-ID',
      {
        day:
          '2-digit',

        month:
          'short',

        year:
          'numeric',
      }
    ).format(date);
  };

  /*
  |--------------------------------------------------------------------------
  | FORMAT TANGGAL PANJANG
  |--------------------------------------------------------------------------
  */

  const formatTanggalPanjang = (
    tanggal?: string
  ) => {
    if (!tanggal) {
      return '-';
    }

    const match =
      tanggal.match(
        /^(\d{4})-(\d{2})-(\d{2})$/
      );

    if (!match) {
      return tanggal;
    }

    const date =
      new Date(
        Number(match[1]),
        Number(match[2]) -
          1,
        Number(match[3])
      );

    return new Intl.DateTimeFormat(
      'id-ID',
      {
        day:
          '2-digit',

        month:
          'long',

        year:
          'numeric',
      }
    ).format(date);
  };

  /*
  |--------------------------------------------------------------------------
  | FORMAT BULAN
  |--------------------------------------------------------------------------
  */

  const formatBulan = (
    value: string
  ) => {
    if (!value) {
      return 'Semua Bulan';
    }

    const [
      year,
      month,
    ] =
      value.split('-');

    if (
      !year ||
      !month
    ) {
      return value;
    }

    const date =
      new Date(
        Number(year),
        Number(month) -
          1,
        1
      );

    return new Intl.DateTimeFormat(
      'id-ID',
      {
        month:
          'long',

        year:
          'numeric',
      }
    ).format(date);
  };

  /*
  |--------------------------------------------------------------------------
  | PROGRESS BAR
  |--------------------------------------------------------------------------
  */

  const progressBarClass = (
    progress: number
  ) => {
    if (
      progress === 100
    ) {
      return 'bg-green-600';
    }

    if (
      progress >= 76
    ) {
      return 'bg-blue-600';
    }

    if (
      progress >= 51
    ) {
      return 'bg-cyan-600';
    }

    if (
      progress >= 26
    ) {
      return 'bg-yellow-500';
    }

    if (
      progress > 0
    ) {
      return 'bg-orange-500';
    }

    return 'bg-gray-400';
  };

  /*
  |--------------------------------------------------------------------------
  | OPTION NAME
  |--------------------------------------------------------------------------
  */

  const getOptionName = (
    options: FilterOption[],
    id: string
  ) => {
    if (!id) {
      return 'Semua';
    }

    return (
      options.find(
        (item) =>
          item.id === id
      )?.nama ||
      '-'
    );
  };

  /*
  |--------------------------------------------------------------------------
  | SORT LABEL
  |--------------------------------------------------------------------------
  */

  const getSortLabel =
    () => {
      switch (
        sortOrder
      ) {
        case 'terbaru':
          return 'Terbaru';

        case 'terlama':
          return 'Terlama';

        case 'siswa_az':
          return 'Siswa A-Z';

        case 'siswa_za':
          return 'Siswa Z-A';

        default:
          return '-';
      }
    };

  /*
  |--------------------------------------------------------------------------
  | KEPSEK LOCAL
  |--------------------------------------------------------------------------
  */

  const getKepsek =
    (): KepsekLocal => {
      try {
        const local =
          localStorage.getItem(
            'kepsek'
          );

        if (!local) {
          return {};
        }

        const parsed =
          JSON.parse(
            local
          );

        return {
          id:
            parsed?.id,

          nama:
            parsed?.nama,

          username:
            parsed?.username,
        };
      } catch {
        return {};
      }
    };

  /*
  |--------------------------------------------------------------------------
  | FILE DATE
  |--------------------------------------------------------------------------
  */

  const getFileDate =
    () => {
      const now =
        new Date();

      const year =
        now.getFullYear();

      const month =
        String(
          now.getMonth() +
            1
        ).padStart(
          2,
          '0'
        );

      const day =
        String(
          now.getDate()
        ).padStart(
          2,
          '0'
        );

      return `${year}-${month}-${day}`;
    };

  /*
  |--------------------------------------------------------------------------
  | EXPORT TIME
  |--------------------------------------------------------------------------
  */

  const getExportTime =
    () => {
      return new Intl.DateTimeFormat(
        'id-ID',
        {
          day:
            '2-digit',

          month:
            'long',

          year:
            'numeric',

          hour:
            '2-digit',

          minute:
            '2-digit',
        }
      ).format(
        new Date()
      );
    };

  /*
  |--------------------------------------------------------------------------
  | EXPORT EXCEL
  |--------------------------------------------------------------------------
  */

  const handleExportExcel =
    async () => {
      if (
        filteredData.length ===
        0
      ) {
        setError(
          'Tidak ada data yang dapat diexport.'
        );

        return;
      }

      try {
        setExportingExcel(
          true
        );

        setError('');

        /*
        |--------------------------------------------------------------------------
        | LOAD XLSX HANYA SAAT DIPERLUKAN
        |--------------------------------------------------------------------------
        */

        const XLSX =
          await import(
            'xlsx'
          );

        const kepsek =
          getKepsek();

        /*
        |--------------------------------------------------------------------------
        | RINGKASAN
        |--------------------------------------------------------------------------
        */

        const ringkasanData =
          [
            [
              'LAPORAN MONITORING PRAKTIK KERJA LAPANGAN',
            ],

            [
              'E-PKL SMK NEGERI 5',
            ],

            [],

            [
              'Kepala Sekolah',
              kepsek.nama ||
                'Kepala Sekolah',
            ],

            [
              'Tanggal Export',
              getExportTime(),
            ],

            [],

            [
              'RINGKASAN',
              'NILAI',
            ],

            [
              'Total Monitoring',
              summary.totalMonitoring,
            ],

            [
              'Siswa Dimonitor',
              summary.totalSiswa,
            ],

            [
              'Rata-rata Progress',
              `${summary.rataRataProgress}%`,
            ],

            [
              'Perlu Perhatian / Bermasalah',
              summary.perluPerhatian,
            ],

            [],

            [
              'FILTER AKTIF',
              'NILAI',
            ],

            [
              'Bulan',
              formatBulan(
                filterBulan
              ),
            ],

            [
              'Siswa',
              getOptionName(
                siswaOptions,
                filterSiswa
              ),
            ],

            [
              'Pembimbing',
              getOptionName(
                pembimbingOptions,
                filterPembimbing
              ),
            ],

            [
              'Perusahaan',
              getOptionName(
                perusahaanOptions,
                filterPerusahaan
              ),
            ],

            [
              'Status',
              filterStatus
                ? statusLabel(
                    filterStatus
                  )
                : 'Semua Status',
            ],

            [
              'Pencarian',
              search.trim() ||
                '-',
            ],

            [
              'Urutan',
              getSortLabel(),
            ],
          ];

        const worksheetRingkasan =
          XLSX.utils.aoa_to_sheet(
            ringkasanData
          );

        worksheetRingkasan[
          '!cols'
        ] = [
          {
            wch: 35,
          },
          {
            wch: 45,
          },
        ];

        /*
        |--------------------------------------------------------------------------
        | DATA MONITORING
        |--------------------------------------------------------------------------
        */

        const exportRows =
          filteredData.map(
            (
              item,
              index
            ) => {
              return {
                No:
                  index +
                  1,

                Tanggal:
                  formatTanggalPanjang(
                    item.tanggal
                  ),

                Waktu:
                  item.waktu ||
                  '-',

                'Nama Siswa':
                  item.siswaNama,

                Kelas:
                  item.kelas,

                Jurusan:
                  item.jurusan,

                Pembimbing:
                  item.pembimbingNama,

                Perusahaan:
                  item.perusahaanNama,

                'Jenis Monitoring':
                  jenisLabel(
                    item.jenisMonitoring
                  ),

                'Progress Project (%)':
                  typeof item.progressProject ===
                  'number'
                    ? item.progressProject
                    : 'Belum Diisi',

                'Status Perkembangan':
                  statusLabel(
                    item.statusPerkembangan
                  ),
              };
            }
          );

        const worksheetData =
          XLSX.utils.json_to_sheet(
            exportRows
          );

        /*
        |--------------------------------------------------------------------------
        | AUTO FILTER
        |--------------------------------------------------------------------------
        */

        if (
          worksheetData[
            '!ref'
          ]
        ) {
          worksheetData[
            '!autofilter'
          ] = {
            ref:
              worksheetData[
                '!ref'
              ]!,
          };
        }

        /*
        |--------------------------------------------------------------------------
        | COLUMN WIDTH
        |--------------------------------------------------------------------------
        */

        worksheetData[
          '!cols'
        ] = [
          {
            wch: 6,
          },
          {
            wch: 22,
          },
          {
            wch: 12,
          },
          {
            wch: 30,
          },
          {
            wch: 16,
          },
          {
            wch: 22,
          },
          {
            wch: 30,
          },
          {
            wch: 35,
          },
          {
            wch: 25,
          },
          {
            wch: 22,
          },
          {
            wch: 24,
          },
        ];

        /*
        |--------------------------------------------------------------------------
        | WORKBOOK
        |--------------------------------------------------------------------------
        */

        const workbook =
          XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
          workbook,
          worksheetRingkasan,
          'Ringkasan'
        );

        XLSX.utils.book_append_sheet(
          workbook,
          worksheetData,
          'Data Monitoring'
        );

        /*
        |--------------------------------------------------------------------------
        | FILE NAME
        |--------------------------------------------------------------------------
        */

        const periode =
          filterBulan ||
          getFileDate();

        const fileName =
          `Laporan_Monitoring_PKL_${periode}.xlsx`;

        /*
        |--------------------------------------------------------------------------
        | DOWNLOAD
        |--------------------------------------------------------------------------
        */

        XLSX.writeFile(
          workbook,
          fileName,
          {
            compression:
              true,
          }
        );
      } catch (err) {
        console.error(
          'Export Excel gagal:',
          err
        );

        setError(
          'Export Excel gagal. Silakan coba kembali.'
        );
      } finally {
        setExportingExcel(
          false
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | EXPORT PDF
  |--------------------------------------------------------------------------
  */

  const handleExportPdf =
    async () => {
      if (
        filteredData.length ===
        0
      ) {
        setError(
          'Tidak ada data yang dapat diexport.'
        );

        return;
      }

      try {
        setExportingPdf(
          true
        );

        setError('');

        /*
        |--------------------------------------------------------------------------
        | LOAD PDF LIBRARY HANYA SAAT DIPERLUKAN
        |--------------------------------------------------------------------------
        */

        const [
          jspdfModule,
          autoTableModule,
        ] =
          await Promise.all([
            import(
              'jspdf'
            ),

            import(
              'jspdf-autotable'
            ),
          ]);

        const {
          jsPDF,
        } = jspdfModule;

        const {
          autoTable,
        } = autoTableModule;

        const kepsek =
          getKepsek();

        /*
        |--------------------------------------------------------------------------
        | DOCUMENT
        |--------------------------------------------------------------------------
        */

        const docPdf =
          new jsPDF({
            orientation:
              'landscape',

            unit:
              'mm',

            format:
              'a4',
          });

        const pageWidth =
          docPdf.internal.pageSize.getWidth();

        const pageHeight =
          docPdf.internal.pageSize.getHeight();

        const margin =
          14;

        /*
        |--------------------------------------------------------------------------
        | TITLE
        |--------------------------------------------------------------------------
        */

        docPdf.setFont(
          'helvetica',
          'bold'
        );

        docPdf.setFontSize(
          15
        );

        docPdf.text(
          'LAPORAN MONITORING PRAKTIK KERJA LAPANGAN',
          pageWidth /
            2,
          16,
          {
            align:
              'center',
          }
        );

        docPdf.setFontSize(
          11
        );

        docPdf.text(
          'E-PKL SMK NEGERI 5',
          pageWidth /
            2,
          23,
          {
            align:
              'center',
          }
        );

        docPdf.setFont(
          'helvetica',
          'normal'
        );

        docPdf.setFontSize(
          8.5
        );

        docPdf.text(
          `Dicetak: ${getExportTime()}`,
          margin,
          31
        );

        docPdf.text(
          `Kepala Sekolah: ${
            kepsek.nama ||
            'Kepala Sekolah'
          }`,
          pageWidth -
            margin,
          31,
          {
            align:
              'right',
          }
        );

        /*
        |--------------------------------------------------------------------------
        | RINGKASAN
        |--------------------------------------------------------------------------
        */

        autoTable(
          docPdf,
          {
            startY:
              36,

            margin: {
              left:
                margin,

              right:
                margin,
            },

            theme:
              'grid',

            head: [
              [
                'Ringkasan',
                'Nilai',
              ],
            ],

            body: [
              [
                'Total Monitoring',
                String(
                  summary.totalMonitoring
                ),
              ],

              [
                'Siswa Dimonitor',
                String(
                  summary.totalSiswa
                ),
              ],

              [
                'Rata-rata Progress',
                `${summary.rataRataProgress}%`,
              ],

              [
                'Perlu Perhatian / Bermasalah',
                String(
                  summary.perluPerhatian
                ),
              ],
            ],

            styles: {
              fontSize:
                8,

              cellPadding:
                2,
            },

            headStyles: {
              fillColor: [
                37,
                99,
                235,
              ],

              textColor:
                255,

              fontStyle:
                'bold',
            },

            columnStyles: {
              0: {
                cellWidth:
                  48,
              },

              1: {
                cellWidth:
                  40,
              },
            },

            tableWidth:
              88,
          }
        );

        /*
        |--------------------------------------------------------------------------
        | LAST AUTO TABLE
        |--------------------------------------------------------------------------
        */

        const pdfWithTable =
          docPdf as typeof docPdf & {
            lastAutoTable?: {
              finalY: number;
            };
          };

        let currentY =
          (
            pdfWithTable
              .lastAutoTable
              ?.finalY ||
            36
          ) + 6;

        /*
        |--------------------------------------------------------------------------
        | FILTER AKTIF
        |--------------------------------------------------------------------------
        */

        docPdf.setFont(
          'helvetica',
          'bold'
        );

        docPdf.setFontSize(
          9
        );

        docPdf.text(
          'Filter Aktif',
          margin,
          currentY
        );

        currentY +=
          5;

        docPdf.setFont(
          'helvetica',
          'normal'
        );

        docPdf.setFontSize(
          8
        );

        const filterText =
          [
            `Bulan: ${formatBulan(
              filterBulan
            )}`,

            `Siswa: ${getOptionName(
              siswaOptions,
              filterSiswa
            )}`,

            `Pembimbing: ${getOptionName(
              pembimbingOptions,
              filterPembimbing
            )}`,

            `Perusahaan: ${getOptionName(
              perusahaanOptions,
              filterPerusahaan
            )}`,

            `Status: ${
              filterStatus
                ? statusLabel(
                    filterStatus
                  )
                : 'Semua Status'
            }`,

            `Pencarian: ${
              search.trim() ||
              '-'
            }`,

            `Urutan: ${getSortLabel()}`,
          ];

        const filterLines =
          docPdf.splitTextToSize(
            filterText.join(
              ' | '
            ),
            pageWidth -
              margin *
                2
          );

        docPdf.text(
          filterLines,
          margin,
          currentY
        );

        currentY +=
          filterLines.length *
            4 +
          4;

        /*
        |--------------------------------------------------------------------------
        | TABLE DATA
        |--------------------------------------------------------------------------
        */

        const pdfRows =
          filteredData.map(
            (
              item,
              index
            ) => [
              String(
                index +
                  1
              ),

              formatTanggal(
                item.tanggal
              ),

              item.waktu ||
                '-',

              item.siswaNama,

              `${item.kelas}${
                item.jurusan !==
                '-'
                  ? ` / ${item.jurusan}`
                  : ''
              }`,

              item.pembimbingNama,

              item.perusahaanNama,

              jenisLabel(
                item.jenisMonitoring
              ),

              typeof item.progressProject ===
              'number'
                ? `${item.progressProject}%`
                : 'Belum Diisi',

              statusLabel(
                item.statusPerkembangan
              ),
            ]
          );

        /*
        |--------------------------------------------------------------------------
        | MAIN TABLE
        |--------------------------------------------------------------------------
        */

        autoTable(
          docPdf,
          {
            startY:
              currentY,

            margin: {
              left:
                margin,

              right:
                margin,

              bottom:
                14,
            },

            theme:
              'grid',

            head: [
              [
                'No',
                'Tanggal',
                'Waktu',
                'Siswa',
                'Kelas / Jurusan',
                'Pembimbing',
                'Perusahaan',
                'Jenis Monitoring',
                'Progress',
                'Status',
              ],
            ],

            body:
              pdfRows,

            styles: {
              fontSize:
                6.5,

              cellPadding:
                1.7,

              overflow:
                'linebreak',

              valign:
                'middle',
            },

            headStyles: {
              fillColor: [
                37,
                99,
                235,
              ],

              textColor:
                255,

              fontStyle:
                'bold',

              halign:
                'center',
            },

            alternateRowStyles: {
              fillColor: [
                248,
                250,
                252,
              ],
            },

            columnStyles: {
              0: {
                cellWidth:
                  8,

                halign:
                  'center',
              },

              1: {
                cellWidth:
                  19,
              },

              2: {
                cellWidth:
                  13,

                halign:
                  'center',
              },

              3: {
                cellWidth:
                  29,
              },

              4: {
                cellWidth:
                  27,
              },

              5: {
                cellWidth:
                  31,
              },

              6: {
                cellWidth:
                  36,
              },

              7: {
                cellWidth:
                  29,
              },

              8: {
                cellWidth:
                  18,

                halign:
                  'center',
              },

              9: {
                cellWidth:
                  26,

                halign:
                  'center',
              },
            },
          }
        );

        /*
        |--------------------------------------------------------------------------
        | SIGNATURE
        |--------------------------------------------------------------------------
        */

        const finalTableY =
          pdfWithTable
            .lastAutoTable
            ?.finalY ||
          currentY;

        let signatureY =
          finalTableY +
          10;

        /*
        |--------------------------------------------------------------------------
        | TAMBAH PAGE JIKA TIDAK CUKUP
        |--------------------------------------------------------------------------
        */

        if (
          signatureY +
            33 >
          pageHeight -
            10
        ) {
          docPdf.addPage(
            'a4',
            'landscape'
          );

          signatureY =
            25;
        }

        const signatureX =
          pageWidth -
          75;

        docPdf.setFont(
          'helvetica',
          'normal'
        );

        docPdf.setFontSize(
          9
        );

        docPdf.text(
          'Mengetahui,',
          signatureX,
          signatureY
        );

        docPdf.text(
          'Kepala Sekolah',
          signatureX,
          signatureY +
            5
        );

        docPdf.setFont(
          'helvetica',
          'bold'
        );

        docPdf.text(
          kepsek.nama ||
            'Kepala Sekolah',
          signatureX,
          signatureY +
            27
        );

        /*
        |--------------------------------------------------------------------------
        | FOOTER SEMUA HALAMAN
        |--------------------------------------------------------------------------
        */

        const totalPagesPdf =
          docPdf.getNumberOfPages();

        for (
          let page =
            1;
          page <=
          totalPagesPdf;
          page++
        ) {
          docPdf.setPage(
            page
          );

          docPdf.setFont(
            'helvetica',
            'normal'
          );

          docPdf.setFontSize(
            7
          );

          docPdf.setTextColor(
            120
          );

          docPdf.text(
            'E-PKL - Laporan Monitoring Praktik Kerja Lapangan',
            margin,
            pageHeight -
              6
          );

          docPdf.text(
            `Halaman ${page} dari ${totalPagesPdf}`,
            pageWidth -
              margin,
            pageHeight -
              6,
            {
              align:
                'right',
            }
          );
        }

        docPdf.setTextColor(
          0
        );

        /*
        |--------------------------------------------------------------------------
        | FILE NAME
        |--------------------------------------------------------------------------
        */

        const periode =
          filterBulan ||
          getFileDate();

        const fileName =
          `Laporan_Monitoring_PKL_${periode}.pdf`;

        /*
        |--------------------------------------------------------------------------
        | DOWNLOAD
        |--------------------------------------------------------------------------
        */

        docPdf.save(
          fileName
        );
      } catch (err) {
        console.error(
          'Export PDF gagal:',
          err
        );

        setError(
          'Export PDF gagal. Silakan coba kembali.'
        );
      } finally {
        setExportingPdf(
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
      setSearch('');
      setFilterSiswa('');
      setFilterPembimbing('');
      setFilterPerusahaan('');
      setFilterBulan('');
      setFilterStatus('');

      setSortOrder(
        'terbaru'
      );

      setError('');
    };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div
        className="
          min-h-[400px]
          flex
          items-center
          justify-center
        "
      >
        <div
          className="
            text-center
          "
        >
          <div
            className="
              w-10
              h-10
              mx-auto
              border-4
              border-blue-200
              border-t-blue-600
              rounded-full
              animate-spin
            "
          />

          <p
            className="
              mt-4
              text-sm
              text-gray-500
              dark:text-gray-400
            "
          >
            Memuat laporan...
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
    <div
      className="
        max-w-7xl
        mx-auto
        space-y-6
      "
    >

      {/* ================================================================
          HEADER
      ================================================================= */}

      <div
        className="
          flex
          flex-col
          lg:flex-row
          lg:items-center
          lg:justify-between
          gap-4
        "
      >

        <div
          className="
            flex
            items-center
            gap-3
          "
        >
          <div
            className="
              w-11
              h-11
              flex
              items-center
              justify-center
              rounded-xl
              bg-blue-100
              dark:bg-blue-950
            "
          >
            <ClipboardList
              size={22}
              className="
                text-blue-600
                dark:text-blue-300
              "
            />
          </div>

          <div>
            <h1
              className="
                text-2xl
                font-bold
                text-gray-900
                dark:text-white
              "
            >
              Laporan PKL
            </h1>

            <p
              className="
                text-sm
                text-gray-500
                dark:text-gray-400
                mt-1
              "
            >
              Rekap laporan monitoring siswa PKL untuk Kepala Sekolah.
            </p>
          </div>
        </div>

        {/* ================================================================
            EXPORT
        ================================================================= */}

        <div
          className="
            flex
            flex-col
            sm:flex-row
            gap-3
          "
        >

          {/* EXCEL */}

          <button
            type="button"
            onClick={
              handleExportExcel
            }
            disabled={
              exportingExcel ||
              exportingPdf ||
              filteredData.length ===
                0
            }
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              px-4
              py-2.5
              rounded-xl
              bg-green-600
              hover:bg-green-700
              disabled:bg-green-400
              disabled:cursor-not-allowed
              text-white
              font-medium
              transition
              shadow-sm
            "
          >
            {exportingExcel ? (
              <>
                <div
                  className="
                    w-4
                    h-4
                    border-2
                    border-white/40
                    border-t-white
                    rounded-full
                    animate-spin
                  "
                />

                Memproses...
              </>
            ) : (
              <>
                <FileSpreadsheet
                  size={18}
                />

                <Download
                  size={16}
                />

                Export Excel
              </>
            )}
          </button>

          {/* PDF */}

          <button
            type="button"
            onClick={
              handleExportPdf
            }
            disabled={
              exportingExcel ||
              exportingPdf ||
              filteredData.length ===
                0
            }
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              px-4
              py-2.5
              rounded-xl
              bg-red-600
              hover:bg-red-700
              disabled:bg-red-400
              disabled:cursor-not-allowed
              text-white
              font-medium
              transition
              shadow-sm
            "
          >
            {exportingPdf ? (
              <>
                <div
                  className="
                    w-4
                    h-4
                    border-2
                    border-white/40
                    border-t-white
                    rounded-full
                    animate-spin
                  "
                />

                Memproses...
              </>
            ) : (
              <>
                <FileText
                  size={18}
                />

                <Download
                  size={16}
                />

                Export PDF
              </>
            )}
          </button>

        </div>
      </div>

      {/* ================================================================
          ERROR
      ================================================================= */}

      {error && (
        <div
          className="
            p-4
            rounded-xl
            bg-red-100
            text-red-700
            dark:bg-red-950
            dark:text-red-300
          "
        >
          {error}
        </div>
      )}

      {/* ================================================================
          SUMMARY
      ================================================================= */}

      <div
        className="
          grid
          grid-cols-2
          lg:grid-cols-4
          gap-4
        "
      >

        {/* TOTAL MONITORING */}

        <div
          className="
            bg-white
            dark:bg-gray-900
            border
            border-gray-200
            dark:border-gray-800
            rounded-2xl
            p-5
            shadow-sm
          "
        >
          <div
            className="
              w-10
              h-10
              rounded-xl
              bg-blue-100
              dark:bg-blue-950
              flex
              items-center
              justify-center
              mb-4
            "
          >
            <ClipboardList
              size={20}
              className="
                text-blue-600
              "
            />
          </div>

          <p
            className="
              text-3xl
              font-bold
              text-gray-900
              dark:text-white
            "
          >
            {
              summary.totalMonitoring
            }
          </p>

          <p
            className="
              text-sm
              text-gray-500
              dark:text-gray-400
              mt-1
            "
          >
            Total Monitoring
          </p>
        </div>

        {/* SISWA */}

        <div
          className="
            bg-white
            dark:bg-gray-900
            border
            border-gray-200
            dark:border-gray-800
            rounded-2xl
            p-5
            shadow-sm
          "
        >
          <div
            className="
              w-10
              h-10
              rounded-xl
              bg-purple-100
              dark:bg-purple-950
              flex
              items-center
              justify-center
              mb-4
            "
          >
            <Users
              size={20}
              className="
                text-purple-600
              "
            />
          </div>

          <p
            className="
              text-3xl
              font-bold
              text-gray-900
              dark:text-white
            "
          >
            {
              summary.totalSiswa
            }
          </p>

          <p
            className="
              text-sm
              text-gray-500
              dark:text-gray-400
              mt-1
            "
          >
            Siswa Dimonitor
          </p>
        </div>

        {/* PROGRESS */}

        <div
          className="
            bg-white
            dark:bg-gray-900
            border
            border-gray-200
            dark:border-gray-800
            rounded-2xl
            p-5
            shadow-sm
          "
        >
          <div
            className="
              w-10
              h-10
              rounded-xl
              bg-green-100
              dark:bg-green-950
              flex
              items-center
              justify-center
              mb-4
            "
          >
            <FolderKanban
              size={20}
              className="
                text-green-600
              "
            />
          </div>

          <p
            className="
              text-3xl
              font-bold
              text-gray-900
              dark:text-white
            "
          >
            {
              summary.rataRataProgress
            }
            %
          </p>

          <p
            className="
              text-sm
              text-gray-500
              dark:text-gray-400
              mt-1
            "
          >
            Rata-rata Progress
          </p>
        </div>

        {/* PERHATIAN */}

        <div
          className="
            bg-white
            dark:bg-gray-900
            border
            border-gray-200
            dark:border-gray-800
            rounded-2xl
            p-5
            shadow-sm
          "
        >
          <div
            className="
              w-10
              h-10
              rounded-xl
              bg-red-100
              dark:bg-red-950
              flex
              items-center
              justify-center
              mb-4
            "
          >
            <TriangleAlert
              size={20}
              className="
                text-red-600
              "
            />
          </div>

          <p
            className="
              text-3xl
              font-bold
              text-gray-900
              dark:text-white
            "
          >
            {
              summary.perluPerhatian
            }
          </p>

          <p
            className="
              text-sm
              text-gray-500
              dark:text-gray-400
              mt-1
            "
          >
            Perlu Perhatian
          </p>
        </div>

      </div>

      {/* ================================================================
          FILTER
      ================================================================= */}

      <div
        className="
          bg-white
          dark:bg-gray-900
          border
          border-gray-200
          dark:border-gray-800
          rounded-2xl
          shadow-sm
          p-5
        "
      >
        <div
          className="
            flex
            items-center
            gap-2
            mb-5
          "
        >
          <Filter
            size={18}
            className="
              text-blue-600
            "
          />

          <h2
            className="
              font-semibold
              text-gray-900
              dark:text-white
            "
          >
            Filter Laporan
          </h2>
        </div>

        <div
          className="
            grid
            md:grid-cols-2
            xl:grid-cols-3
            gap-4
          "
        >

          {/* SEARCH */}

          <div>
            <label
              className="
                block
                text-xs
                font-medium
                text-gray-500
                dark:text-gray-400
                mb-2
              "
            >
              Pencarian
            </label>

            <div
              className="
                relative
              "
            >
              <Search
                size={18}
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-gray-400
                "
              />

              <input
                type="text"
                value={
                  search
                }
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Cari siswa, perusahaan, pembimbing..."
                className="
                  w-full
                  pl-10
                  pr-3
                  py-2.5
                  border
                  border-gray-300
                  dark:border-gray-700
                  rounded-lg
                  bg-white
                  dark:bg-gray-800
                  text-gray-900
                  dark:text-white
                "
              />
            </div>
          </div>

          {/* BULAN */}

          <div>
            <label
              className="
                block
                text-xs
                font-medium
                text-gray-500
                dark:text-gray-400
                mb-2
              "
            >
              Bulan Monitoring
            </label>

            <input
              type="month"
              value={
                filterBulan
              }
              onChange={(e) =>
                setFilterBulan(
                  e.target.value
                )
              }
              className="
                w-full
                px-3
                py-2.5
                border
                border-gray-300
                dark:border-gray-700
                rounded-lg
                bg-white
                dark:bg-gray-800
                text-gray-900
                dark:text-white
              "
            />
          </div>

          {/* SISWA */}

          <div>
            <label
              className="
                block
                text-xs
                font-medium
                text-gray-500
                dark:text-gray-400
                mb-2
              "
            >
              Siswa
            </label>

            <select
              value={
                filterSiswa
              }
              onChange={(e) =>
                setFilterSiswa(
                  e.target.value
                )
              }
              className="
                w-full
                px-3
                py-2.5
                border
                border-gray-300
                dark:border-gray-700
                rounded-lg
                bg-white
                dark:bg-gray-800
                text-gray-900
                dark:text-white
              "
            >
              <option value="">
                Semua Siswa
              </option>

              {siswaOptions.map(
                (item) => (
                  <option
                    key={
                      item.id
                    }
                    value={
                      item.id
                    }
                  >
                    {
                      item.nama
                    }
                  </option>
                )
              )}
            </select>
          </div>

          {/* PEMBIMBING */}

          <div>
            <label
              className="
                block
                text-xs
                font-medium
                text-gray-500
                dark:text-gray-400
                mb-2
              "
            >
              Pembimbing
            </label>

            <select
              value={
                filterPembimbing
              }
              onChange={(e) =>
                setFilterPembimbing(
                  e.target.value
                )
              }
              className="
                w-full
                px-3
                py-2.5
                border
                border-gray-300
                dark:border-gray-700
                rounded-lg
                bg-white
                dark:bg-gray-800
                text-gray-900
                dark:text-white
              "
            >
              <option value="">
                Semua Pembimbing
              </option>

              {pembimbingOptions.map(
                (item) => (
                  <option
                    key={
                      item.id
                    }
                    value={
                      item.id
                    }
                  >
                    {
                      item.nama
                    }
                  </option>
                )
              )}
            </select>
          </div>

          {/* PERUSAHAAN */}

          <div>
            <label
              className="
                block
                text-xs
                font-medium
                text-gray-500
                dark:text-gray-400
                mb-2
              "
            >
              Perusahaan
            </label>

            <select
              value={
                filterPerusahaan
              }
              onChange={(e) =>
                setFilterPerusahaan(
                  e.target.value
                )
              }
              className="
                w-full
                px-3
                py-2.5
                border
                border-gray-300
                dark:border-gray-700
                rounded-lg
                bg-white
                dark:bg-gray-800
                text-gray-900
                dark:text-white
              "
            >
              <option value="">
                Semua Perusahaan
              </option>

              {perusahaanOptions.map(
                (item) => (
                  <option
                    key={
                      item.id
                    }
                    value={
                      item.id
                    }
                  >
                    {
                      item.nama
                    }
                  </option>
                )
              )}
            </select>
          </div>

          {/* STATUS */}

          <div>
            <label
              className="
                block
                text-xs
                font-medium
                text-gray-500
                dark:text-gray-400
                mb-2
              "
            >
              Status Perkembangan
            </label>

            <select
              value={
                filterStatus
              }
              onChange={(e) =>
                setFilterStatus(
                  e.target.value
                )
              }
              className="
                w-full
                px-3
                py-2.5
                border
                border-gray-300
                dark:border-gray-700
                rounded-lg
                bg-white
                dark:bg-gray-800
                text-gray-900
                dark:text-white
              "
            >
              <option value="">
                Semua Status
              </option>

              <option value="sangat_baik">
                Sangat Baik
              </option>

              <option value="baik">
                Baik
              </option>

              <option value="perlu_perhatian">
                Perlu Perhatian
              </option>

              <option value="bermasalah">
                Bermasalah
              </option>
            </select>
          </div>

        </div>

        {/* ================================================================
            FILTER FOOTER
        ================================================================= */}

        <div
          className="
            flex
            flex-col
            sm:flex-row
            sm:items-center
            sm:justify-between
            gap-3
            mt-5
            pt-5
            border-t
            border-gray-100
            dark:border-gray-800
          "
        >
          <p
            className="
              text-sm
              text-gray-500
              dark:text-gray-400
            "
          >
            Ditemukan{' '}

            <strong
              className="
                text-gray-900
                dark:text-white
              "
            >
              {
                filteredData.length
              }
            </strong>{' '}

            laporan monitoring.
          </p>

          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            <select
              value={
                sortOrder
              }
              onChange={(e) =>
                setSortOrder(
                  e.target
                    .value as SortOrder
                )
              }
              className="
                px-3
                py-2
                text-sm
                border
                border-gray-300
                dark:border-gray-700
                rounded-lg
                bg-white
                dark:bg-gray-800
                text-gray-900
                dark:text-white
              "
            >
              <option value="terbaru">
                Terbaru
              </option>

              <option value="terlama">
                Terlama
              </option>

              <option value="siswa_az">
                Siswa A-Z
              </option>

              <option value="siswa_za">
                Siswa Z-A
              </option>
            </select>

            <button
              type="button"
              onClick={
                resetFilter
              }
              className="
                px-3
                py-2
                text-sm
                border
                border-gray-300
                dark:border-gray-700
                rounded-lg
                text-gray-600
                dark:text-gray-300
                hover:bg-gray-100
                dark:hover:bg-gray-800
              "
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================
          TABLE
      ================================================================= */}

      <div
        className="
          bg-white
          dark:bg-gray-900
          border
          border-gray-200
          dark:border-gray-800
          rounded-2xl
          shadow-sm
          overflow-hidden
        "
      >
        {paginatedData.length >
        0 ? (
          <div
            className="
              overflow-x-auto
            "
          >
            <table
              className="
                min-w-full
              "
            >
              <thead
                className="
                  bg-gray-50
                  dark:bg-gray-800
                "
              >
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">
                    Tanggal
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                    Siswa
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                    Pembimbing
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                    Perusahaan
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                    Jenis
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 min-w-[160px]">
                    Progress
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                    Status
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">
                    Detail
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedData.map(
                  (item) => (
                    <tr
                      key={
                        item.id
                      }
                      className="
                        border-t
                        border-gray-100
                        dark:border-gray-800
                        hover:bg-gray-50
                        dark:hover:bg-gray-800/50
                        transition
                      "
                    >

                      {/* TANGGAL */}

                      <td
                        className="
                          px-4
                          py-4
                          whitespace-nowrap
                        "
                      >
                        <div
                          className="
                            flex
                            gap-2
                            items-start
                          "
                        >
                          <CalendarDays
                            size={16}
                            className="
                              text-gray-400
                              mt-0.5
                            "
                          />

                          <div>
                            <p
                              className="
                                text-sm
                                text-gray-800
                                dark:text-gray-200
                              "
                            >
                              {formatTanggal(
                                item.tanggal
                              )}
                            </p>

                            {item.waktu && (
                              <p
                                className="
                                  text-xs
                                  text-gray-400
                                  mt-1
                                "
                              >
                                {
                                  item.waktu
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* SISWA */}

                      <td
                        className="
                          px-4
                          py-4
                        "
                      >
                        <p
                          className="
                            text-sm
                            font-semibold
                            text-gray-900
                            dark:text-white
                          "
                        >
                          {
                            item.siswaNama
                          }
                        </p>

                        <p
                          className="
                            text-xs
                            text-gray-500
                            dark:text-gray-400
                            mt-1
                          "
                        >
                          {item.kelas}

                          {item.jurusan !==
                            '-' &&
                            ` • ${item.jurusan}`}
                        </p>
                      </td>

                      {/* PEMBIMBING */}

                      <td
                        className="
                          px-4
                          py-4
                        "
                      >
                        <div
                          className="
                            flex
                            items-center
                            gap-2
                          "
                        >
                          <UserRoundCheck
                            size={15}
                            className="
                              text-purple-500
                            "
                          />

                          <span
                            className="
                              text-sm
                              text-gray-700
                              dark:text-gray-300
                            "
                          >
                            {
                              item.pembimbingNama
                            }
                          </span>
                        </div>
                      </td>

                      {/* PERUSAHAAN */}

                      <td
                        className="
                          px-4
                          py-4
                          text-sm
                          text-gray-700
                          dark:text-gray-300
                        "
                      >
                        {
                          item.perusahaanNama
                        }
                      </td>

                      {/* JENIS */}

                      <td
                        className="
                          px-4
                          py-4
                          text-sm
                          text-gray-600
                          dark:text-gray-300
                          whitespace-nowrap
                        "
                      >
                        {jenisLabel(
                          item.jenisMonitoring
                        )}
                      </td>

                      {/* PROGRESS */}

                      <td
                        className="
                          px-4
                          py-4
                        "
                      >
                        {item.progressProject !==
                        undefined ? (
                          <div
                            className="
                              min-w-[140px]
                            "
                          >
                            <div
                              className="
                                flex
                                items-center
                                justify-between
                                mb-2
                              "
                            >
                              <span
                                className="
                                  text-sm
                                  font-semibold
                                  text-gray-900
                                  dark:text-white
                                "
                              >
                                {
                                  item.progressProject
                                }
                                %
                              </span>
                            </div>

                            <div
                              className="
                                w-full
                                h-2
                                rounded-full
                                bg-gray-200
                                dark:bg-gray-800
                                overflow-hidden
                              "
                            >
                              <div
                                style={{
                                  width:
                                    `${item.progressProject}%`,
                                }}
                                className={`
                                  h-full
                                  rounded-full
                                  ${progressBarClass(
                                    item.progressProject
                                  )}
                                `}
                              />
                            </div>
                          </div>
                        ) : (
                          <span
                            className="
                              text-xs
                              text-gray-400
                            "
                          >
                            Belum diisi
                          </span>
                        )}
                      </td>

                      {/* STATUS */}

                      <td
                        className="
                          px-4
                          py-4
                        "
                      >
                        <span
                          className={`
                            inline-flex
                            px-2.5
                            py-1.5
                            rounded-full
                            text-xs
                            font-medium
                            whitespace-nowrap
                            ${statusClass(
                              item.statusPerkembangan
                            )}
                          `}
                        >
                          {statusLabel(
                            item.statusPerkembangan
                          )}
                        </span>
                      </td>

                      {/* DETAIL */}

                      <td
                        className="
                          px-4
                          py-4
                          text-center
                        "
                      >
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/kepsek/monitoring/${item.id}`
                            )
                          }
                          className="
                            inline-flex
                            items-center
                            gap-1.5
                            text-sm
                            text-blue-600
                            dark:text-blue-400
                            hover:underline
                          "
                        >
                          <Eye
                            size={16}
                          />

                          Detail
                        </button>
                      </td>

                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            className="
              py-16
              text-center
            "
          >
            <ClipboardList
              size={40}
              className="
                mx-auto
                text-gray-300
                dark:text-gray-700
              "
            />

            <p
              className="
                mt-4
                text-gray-500
                dark:text-gray-400
              "
            >
              Tidak ada laporan yang sesuai dengan filter.
            </p>
          </div>
        )}

        {/* ================================================================
            PAGINATION
        ================================================================= */}

        {filteredData.length >
          0 && (
          <div
            className="
              flex
              flex-col
              sm:flex-row
              sm:items-center
              sm:justify-between
              gap-4
              px-5
              py-4
              border-t
              border-gray-200
              dark:border-gray-800
            "
          >
            <p
              className="
                text-sm
                text-gray-500
                dark:text-gray-400
              "
            >
              Menampilkan{' '}

              <strong>
                {startIndex +
                  1}
              </strong>

              {' - '}

              <strong>
                {Math.min(
                  startIndex +
                    itemsPerPage,
                  filteredData.length
                )}
              </strong>

              {' dari '}

              <strong>
                {
                  filteredData.length
                }
              </strong>

              {' laporan'}
            </p>

            <div
              className="
                flex
                items-center
                gap-2
              "
            >
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
                        prev - 1,
                        1
                      )
                  )
                }
                className="
                  w-9
                  h-9
                  flex
                  items-center
                  justify-center
                  border
                  border-gray-300
                  dark:border-gray-700
                  rounded-lg
                  disabled:opacity-40
                  hover:bg-gray-100
                  dark:hover:bg-gray-800
                "
              >
                <ChevronLeft
                  size={17}
                />
              </button>

              <span
                className="
                  px-3
                  text-sm
                  text-gray-600
                  dark:text-gray-300
                "
              >
                {currentPage}
                {' / '}
                {totalPages}
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
                        prev + 1,
                        totalPages
                      )
                  )
                }
                className="
                  w-9
                  h-9
                  flex
                  items-center
                  justify-center
                  border
                  border-gray-300
                  dark:border-gray-700
                  rounded-lg
                  disabled:opacity-40
                  hover:bg-gray-100
                  dark:hover:bg-gray-800
                "
              >
                <ChevronRight
                  size={17}
                />
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}