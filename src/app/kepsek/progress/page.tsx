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
  Eye,
  Filter,
  FolderKanban,
  Search,
  TrendingUp,
  UserRoundCheck,
} from 'lucide-react';

import { db } from '@/lib/firebase';

/*
|--------------------------------------------------------------------------
| INTERFACE
|--------------------------------------------------------------------------
*/

interface ProgressSiswa {
  siswaId: string;

  nama: string;
  kelas: string;
  jurusan: string;

  perusahaanId: string;
  perusahaanNama: string;

  pembimbingId: string;
  pembimbingNama: string;

  monitoringId?: string;

  tanggalMonitoring?: string;
  waktuMonitoring?: string;

  progressProject?: number;

  sortTime: number;
}

type SortOption =
  | 'progress_desc'
  | 'progress_asc'
  | 'nama_asc'
  | 'nama_desc'
  | 'terbaru'
  | 'terlama';

/*
|--------------------------------------------------------------------------
| HELPER MONITORING TIME
|--------------------------------------------------------------------------
*/

const getMonitoringTime = (
  data: Record<string, any>
) => {
  /*
  |--------------------------------------------------------------------------
  | TANGGAL + WAKTU
  |--------------------------------------------------------------------------
  */

  if (data.tanggal) {
    const value =
      new Date(
        `${data.tanggal}T${
          data.waktu ||
          '00:00'
        }`
      ).getTime();

    if (
      !Number.isNaN(
        value
      )
    ) {
      return value;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | CREATED AT
  |--------------------------------------------------------------------------
  */

  if (
    data.createdAt &&
    typeof data.createdAt
      .toMillis ===
      'function'
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

export default function ProgressKepsekPage() {
  const router =
    useRouter();

  /*
  |--------------------------------------------------------------------------
  | DATA
  |--------------------------------------------------------------------------
  */

  const [
    progressData,
    setProgressData,
  ] = useState<
    ProgressSiswa[]
  >([]);

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
    filterStatus,
    setFilterStatus,
  ] = useState('');

  const [
    sortBy,
    setSortBy,
  ] =
    useState<SortOption>(
      'progress_desc'
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

  const itemsPerPage =
    10;

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

  /*
  |--------------------------------------------------------------------------
  | FETCH
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let cancelled =
      false;

    const fetchProgress =
      async () => {
        try {
          setLoading(true);
          setError('');

          /*
          |--------------------------------------------------------------------------
          | AMBIL COLLECTION PARALEL
          |--------------------------------------------------------------------------
          */

          const [
            siswaSnap,
            monitoringSnap,
            perusahaanSnap,
            pembimbingSnap,
          ] =
            await Promise.all([
              getDocs(
                collection(
                  db,
                  'siswa'
                )
              ),

              getDocs(
                collection(
                  db,
                  'monitoring'
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
                  'pembimbing'
                )
              ),
            ]);

          /*
          |--------------------------------------------------------------------------
          | MAP PERUSAHAAN
          |--------------------------------------------------------------------------
          */

          const perusahaanMap =
            new Map<
              string,
              string
            >();

          perusahaanSnap.docs.forEach(
            (docItem) => {
              const data =
                docItem.data();

              perusahaanMap.set(
                docItem.id,
                data.nama ||
                  '-'
              );
            }
          );

          /*
          |--------------------------------------------------------------------------
          | MAP PEMBIMBING
          |--------------------------------------------------------------------------
          */

          const pembimbingMap =
            new Map<
              string,
              string
            >();

          pembimbingSnap.docs.forEach(
            (docItem) => {
              const data =
                docItem.data();

              pembimbingMap.set(
                docItem.id,
                data.nama ||
                  'Pembimbing'
              );
            }
          );

          /*
          |--------------------------------------------------------------------------
          | MONITORING TERBARU PER SISWA
          |--------------------------------------------------------------------------
          */

          const latestMonitoringMap =
            new Map<
              string,
              {
                monitoringId: string;

                perusahaanId: string;
                pembimbingId: string;

                tanggal: string;
                waktu: string;

                progressProject?: number;

                sortTime: number;
              }
            >();

          monitoringSnap.docs.forEach(
            (monitorDoc) => {
              const data =
                monitorDoc.data();

              const siswaId =
                data.siswaId;

              if (!siswaId) {
                return;
              }

              const sortTime =
                getMonitoringTime(
                  data
                );

              const existing =
                latestMonitoringMap.get(
                  siswaId
                );

              /*
              |--------------------------------------------------------------------------
              | JIKA BELUM ADA ATAU MONITORING INI LEBIH BARU
              |--------------------------------------------------------------------------
              */

              if (
                !existing ||
                sortTime >
                  existing.sortTime
              ) {
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

                latestMonitoringMap.set(
                  siswaId,
                  {
                    monitoringId:
                      monitorDoc.id,

                    perusahaanId:
                      data.perusahaanId ||
                      '',

                    pembimbingId:
                      data.pembimbingId ||
                      '',

                    tanggal:
                      data.tanggal ||
                      '',

                    waktu:
                      data.waktu ||
                      '',

                    progressProject:
                      progress,

                    sortTime,
                  }
                );
              }
            }
          );

          /*
          |--------------------------------------------------------------------------
          | BUILD DATA PER SISWA
          |--------------------------------------------------------------------------
          */

          const result: ProgressSiswa[] =
            siswaSnap.docs.map(
              (siswaDoc) => {
                const siswa =
                  siswaDoc.data();

                const latest =
                  latestMonitoringMap.get(
                    siswaDoc.id
                  );

                return {
                  siswaId:
                    siswaDoc.id,

                  nama:
                    siswa.nama ||
                    'Siswa',

                  kelas:
                    siswa.kelas ||
                    '-',

                  jurusan:
                    siswa.jurusan ||
                    '-',

                  perusahaanId:
                    latest
                      ?.perusahaanId ||
                    siswa.perusahaanId ||
                    '',

                  perusahaanNama:
                    perusahaanMap.get(
                      latest
                        ?.perusahaanId ||
                        siswa.perusahaanId
                    ) ||
                    '-',

                  pembimbingId:
                    latest
                      ?.pembimbingId ||
                    '',

                  pembimbingNama:
                    pembimbingMap.get(
                      latest
                        ?.pembimbingId ||
                        ''
                    ) ||
                    '-',

                  monitoringId:
                    latest
                      ?.monitoringId,

                  tanggalMonitoring:
                    latest?.tanggal,

                  waktuMonitoring:
                    latest?.waktu,

                  progressProject:
                    latest
                      ?.progressProject,

                  sortTime:
                    latest
                      ?.sortTime ||
                    0,
                };
              }
            );

          if (!cancelled) {
            setProgressData(
              result
            );
          }
        } catch (err) {
          console.error(
            'Gagal mengambil progress siswa:',
            err
          );

          if (!cancelled) {
            setError(
              'Data progress siswa gagal dimuat.'
            );
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

    fetchProgress();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | PROGRESS LABEL
  |--------------------------------------------------------------------------
  */

  const getProgressLabel = (
    progress?: number
  ) => {
    if (
      progress === undefined
    ) {
      return 'Belum Diisi';
    }

    if (
      progress === 0
    ) {
      return 'Belum Mulai';
    }

    if (
      progress <= 25
    ) {
      return 'Tahap Awal';
    }

    if (
      progress <= 50
    ) {
      return 'Dalam Proses';
    }

    if (
      progress <= 75
    ) {
      return 'Berkembang';
    }

    if (
      progress < 100
    ) {
      return 'Hampir Selesai';
    }

    return 'Selesai';
  };

  /*
  |--------------------------------------------------------------------------
  | FILTER VALUE
  |--------------------------------------------------------------------------
  */

  const getProgressStatusValue = (
    progress?: number
  ) => {
    if (
      progress === undefined
    ) {
      return 'belum_diisi';
    }

    if (
      progress === 0
    ) {
      return 'belum_mulai';
    }

    if (
      progress <= 25
    ) {
      return 'tahap_awal';
    }

    if (
      progress <= 50
    ) {
      return 'dalam_proses';
    }

    if (
      progress <= 75
    ) {
      return 'berkembang';
    }

    if (
      progress < 100
    ) {
      return 'hampir_selesai';
    }

    return 'selesai';
  };

  /*
  |--------------------------------------------------------------------------
  | PROGRESS BAR
  |--------------------------------------------------------------------------
  */

  const getProgressBarClass = (
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
  | BADGE
  |--------------------------------------------------------------------------
  */

  const getProgressBadgeClass = (
    progress?: number
  ) => {
    if (
      progress === undefined
    ) {
      return `
        bg-gray-100
        text-gray-600
        dark:bg-gray-800
        dark:text-gray-300
      `;
    }

    if (
      progress === 100
    ) {
      return `
        bg-green-100
        text-green-700
        dark:bg-green-950
        dark:text-green-300
      `;
    }

    if (
      progress >= 76
    ) {
      return `
        bg-blue-100
        text-blue-700
        dark:bg-blue-950
        dark:text-blue-300
      `;
    }

    if (
      progress >= 51
    ) {
      return `
        bg-cyan-100
        text-cyan-700
        dark:bg-cyan-950
        dark:text-cyan-300
      `;
    }

    if (
      progress >= 26
    ) {
      return `
        bg-yellow-100
        text-yellow-700
        dark:bg-yellow-950
        dark:text-yellow-300
      `;
    }

    if (
      progress > 0
    ) {
      return `
        bg-orange-100
        text-orange-700
        dark:bg-orange-950
        dark:text-orange-300
      `;
    }

    return `
      bg-gray-100
      text-gray-700
      dark:bg-gray-800
      dark:text-gray-300
    `;
  };

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
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    ).format(date);
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
        progressData.filter(
          (item) => {
            const matchSearch =
              !keyword ||
              item.nama
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
              item.perusahaanNama
                .toLowerCase()
                .includes(
                  keyword
                ) ||
              item.pembimbingNama
                .toLowerCase()
                .includes(
                  keyword
                );

            const matchStatus =
              !filterStatus ||
              getProgressStatusValue(
                item.progressProject
              ) ===
                filterStatus;

            return (
              matchSearch &&
              matchStatus
            );
          }
        );

      const result =
        [...filtered];

      result.sort(
        (a, b) => {
          switch (sortBy) {
            /*
            |--------------------------------------------------------------------------
            | PROGRESS TINGGI
            |--------------------------------------------------------------------------
            */

            case 'progress_desc': {
              const aProgress =
                a.progressProject ??
                -1;

              const bProgress =
                b.progressProject ??
                -1;

              return (
                bProgress -
                aProgress
              );
            }

            /*
            |--------------------------------------------------------------------------
            | PROGRESS RENDAH
            |--------------------------------------------------------------------------
            */

            case 'progress_asc': {
              const aProgress =
                a.progressProject ??
                -1;

              const bProgress =
                b.progressProject ??
                -1;

              return (
                aProgress -
                bProgress
              );
            }

            /*
            |--------------------------------------------------------------------------
            | NAMA A-Z
            |--------------------------------------------------------------------------
            */

            case 'nama_asc':
              return a.nama.localeCompare(
                b.nama,
                'id'
              );

            /*
            |--------------------------------------------------------------------------
            | NAMA Z-A
            |--------------------------------------------------------------------------
            */

            case 'nama_desc':
              return b.nama.localeCompare(
                a.nama,
                'id'
              );

            /*
            |--------------------------------------------------------------------------
            | MONITORING TERBARU
            |--------------------------------------------------------------------------
            */

            case 'terbaru':
              return (
                b.sortTime -
                a.sortTime
              );

            /*
            |--------------------------------------------------------------------------
            | MONITORING TERLAMA
            |--------------------------------------------------------------------------
            */

            case 'terlama':
              return (
                a.sortTime -
                b.sortTime
              );

            default:
              return 0;
          }
        }
      );

      return result;
    }, [
      progressData,
      search,
      filterStatus,
      sortBy,
    ]);

  /*
  |--------------------------------------------------------------------------
  | RESET PAGE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    filterStatus,
    sortBy,
  ]);

  /*
  |--------------------------------------------------------------------------
  | SUMMARY
  |--------------------------------------------------------------------------
  */

  const summary =
    useMemo(() => {
      let belumDiisi =
        0;

      let belumMulai =
        0;

      let sedangBerjalan =
        0;

      let selesai =
        0;

      let totalProgress =
        0;

      let memilikiProgress =
        0;

      progressData.forEach(
        (item) => {
          const progress =
            item.progressProject;

          if (
            progress ===
            undefined
          ) {
            belumDiisi +=
              1;

            return;
          }

          memilikiProgress +=
            1;

          totalProgress +=
            progress;

          if (
            progress === 0
          ) {
            belumMulai +=
              1;
          } else if (
            progress <
            100
          ) {
            sedangBerjalan +=
              1;
          } else {
            selesai += 1;
          }
        }
      );

      /*
      |--------------------------------------------------------------------------
      | RATA-RATA HANYA SISWA YANG SUDAH ADA NILAI PROGRESS
      |--------------------------------------------------------------------------
      */

      const rataRata =
        memilikiProgress >
        0
          ? Math.round(
              totalProgress /
                memilikiProgress
            )
          : 0;

      return {
        total:
          progressData.length,

        belumDiisi,

        belumMulai,

        sedangBerjalan,

        selesai,

        rataRata,
      };
    }, [progressData]);

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
  | RESET FILTER
  |--------------------------------------------------------------------------
  */

  const resetFilter = () => {
    setSearch('');
    setFilterStatus('');
    setSortBy(
      'progress_desc'
    );
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

        <div className="text-center">

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
            Memuat progress siswa...
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
            bg-purple-100
            dark:bg-purple-950
          "
        >
          <FolderKanban
            size={22}
            className="
              text-purple-600
              dark:text-purple-300
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
            Progress Project PKL
          </h1>

          <p
            className="
              text-sm
              text-gray-500
              dark:text-gray-400
              mt-1
            "
          >
            Progress project terbaru setiap siswa berdasarkan monitoring terakhir.
          </p>

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
          md:grid-cols-3
          xl:grid-cols-6
          gap-4
        "
      >

        {/* TOTAL */}

        <div
          className="
            bg-white
            dark:bg-gray-900
            border
            border-gray-200
            dark:border-gray-800
            rounded-2xl
            p-4
            shadow-sm
          "
        >

          <p
            className="
              text-2xl
              font-bold
              text-gray-900
              dark:text-white
            "
          >
            {summary.total}
          </p>

          <p
            className="
              text-xs
              text-gray-500
              mt-1
            "
          >
            Total Siswa
          </p>

        </div>

        {/* BELUM DIISI */}

        <div
          className="
            bg-white
            dark:bg-gray-900
            border
            border-gray-200
            dark:border-gray-800
            rounded-2xl
            p-4
            shadow-sm
          "
        >

          <p
            className="
              text-2xl
              font-bold
              text-gray-900
              dark:text-white
            "
          >
            {summary.belumDiisi}
          </p>

          <p className="text-xs text-gray-500 mt-1">
            Belum Diisi
          </p>

        </div>

        {/* BELUM MULAI */}

        <div
          className="
            bg-white
            dark:bg-gray-900
            border
            border-gray-200
            dark:border-gray-800
            rounded-2xl
            p-4
            shadow-sm
          "
        >

          <p
            className="
              text-2xl
              font-bold
              text-gray-900
              dark:text-white
            "
          >
            {summary.belumMulai}
          </p>

          <p className="text-xs text-gray-500 mt-1">
            Belum Mulai
          </p>

        </div>

        {/* BERJALAN */}

        <div
          className="
            bg-white
            dark:bg-gray-900
            border
            border-gray-200
            dark:border-gray-800
            rounded-2xl
            p-4
            shadow-sm
          "
        >

          <p
            className="
              text-2xl
              font-bold
              text-blue-600
            "
          >
            {summary.sedangBerjalan}
          </p>

          <p className="text-xs text-gray-500 mt-1">
            Sedang Berjalan
          </p>

        </div>

        {/* SELESAI */}

        <div
          className="
            bg-white
            dark:bg-gray-900
            border
            border-gray-200
            dark:border-gray-800
            rounded-2xl
            p-4
            shadow-sm
          "
        >

          <p
            className="
              text-2xl
              font-bold
              text-green-600
            "
          >
            {summary.selesai}
          </p>

          <p className="text-xs text-gray-500 mt-1">
            Selesai
          </p>

        </div>

        {/* RATA-RATA */}

        <div
          className="
            bg-white
            dark:bg-gray-900
            border
            border-gray-200
            dark:border-gray-800
            rounded-2xl
            p-4
            shadow-sm
          "
        >

          <div
            className="
              flex
              items-center
              gap-2
            "
          >

            <TrendingUp
              size={18}
              className="
                text-purple-600
              "
            />

            <p
              className="
                text-2xl
                font-bold
                text-purple-600
              "
            >
              {summary.rataRata}%
            </p>

          </div>

          <p className="text-xs text-gray-500 mt-1">
            Rata-rata Progress
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
          p-5
          shadow-sm
        "
      >

        <div
          className="
            flex
            items-center
            gap-2
            mb-4
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
            Filter Progress
          </h2>

        </div>

        <div
          className="
            grid
            md:grid-cols-2
            xl:grid-cols-4
            gap-4
          "
        >

          {/* SEARCH */}

          <div
            className="
              xl:col-span-2
            "
          >

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
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Cari siswa, kelas, perusahaan, pembimbing..."
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
              Status Progress
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

              <option value="belum_diisi">
                Belum Diisi
              </option>

              <option value="belum_mulai">
                Belum Mulai
              </option>

              <option value="tahap_awal">
                Tahap Awal (1–25%)
              </option>

              <option value="dalam_proses">
                Dalam Proses (26–50%)
              </option>

              <option value="berkembang">
                Berkembang (51–75%)
              </option>

              <option value="hampir_selesai">
                Hampir Selesai (76–99%)
              </option>

              <option value="selesai">
                Selesai (100%)
              </option>

            </select>

          </div>

          {/* SORT */}

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
              Urutkan
            </label>

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target
                    .value as SortOption
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

              <option value="progress_desc">
                Progress Tertinggi
              </option>

              <option value="progress_asc">
                Progress Terendah
              </option>

              <option value="nama_asc">
                Nama A-Z
              </option>

              <option value="nama_desc">
                Nama Z-A
              </option>

              <option value="terbaru">
                Monitoring Terbaru
              </option>

              <option value="terlama">
                Monitoring Terlama
              </option>

            </select>

          </div>

        </div>

        <div
          className="
            flex
            flex-col
            sm:flex-row
            sm:items-center
            sm:justify-between
            gap-3
            mt-4
            pt-4
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
            Menampilkan{' '}

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

            siswa.
          </p>

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
            Reset Filter
          </button>

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

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                    Siswa
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                    Perusahaan
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                    Pembimbing
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 min-w-[210px]">
                    Progress Project
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                    Status
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">
                    Monitoring Terakhir
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
                        item.siswaId
                      }
                      className="
                        border-t
                        border-gray-100
                        dark:border-gray-800
                        hover:bg-gray-50
                        dark:hover:bg-gray-800/50
                      "
                    >

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
                          {item.nama}
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
                            size={16}
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
                              min-w-[180px]
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
                                  font-bold
                                  text-gray-900
                                  dark:text-white
                                "
                              >
                                {
                                  item.progressProject
                                }
                                %
                              </span>

                              <span
                                className="
                                  text-xs
                                  text-gray-500
                                  dark:text-gray-400
                                "
                              >
                                {getProgressLabel(
                                  item.progressProject
                                )}
                              </span>

                            </div>

                            <div
                              className="
                                w-full
                                h-2.5
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
                                  ${getProgressBarClass(
                                    item.progressProject
                                  )}
                                `}
                              />

                            </div>

                          </div>
                        ) : (
                          <span
                            className="
                              text-sm
                              text-gray-400
                            "
                          >
                            Belum ada progress
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
                            ${getProgressBadgeClass(
                              item.progressProject
                            )}
                          `}
                        >
                          {getProgressLabel(
                            item.progressProject
                          )}
                        </span>

                      </td>

                      {/* MONITORING TERAKHIR */}

                      <td
                        className="
                          px-4
                          py-4
                          whitespace-nowrap
                        "
                      >

                        {item.monitoringId ? (
                          <div
                            className="
                              flex
                              items-start
                              gap-2
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
                                  text-gray-700
                                  dark:text-gray-300
                                "
                              >
                                {formatTanggal(
                                  item.tanggalMonitoring
                                )}
                              </p>

                              {item.waktuMonitoring && (
                                <p
                                  className="
                                    text-xs
                                    text-gray-400
                                    mt-1
                                  "
                                >
                                  {
                                    item.waktuMonitoring
                                  }
                                </p>
                              )}

                            </div>

                          </div>
                        ) : (
                          <span
                            className="
                              text-sm
                              text-gray-400
                            "
                          >
                            Belum dimonitoring
                          </span>
                        )}

                      </td>

                      {/* DETAIL */}

                      <td
                        className="
                          px-4
                          py-4
                          text-center
                        "
                      >

                        {item.monitoringId ? (
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/kepsek/monitoring/${item.monitoringId}`
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
                        ) : (
                          <span
                            className="
                              text-xs
                              text-gray-400
                            "
                          >
                            -
                          </span>
                        )}

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

            <FolderKanban
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
              Tidak ada data progress yang sesuai.
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

              {' siswa'}
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