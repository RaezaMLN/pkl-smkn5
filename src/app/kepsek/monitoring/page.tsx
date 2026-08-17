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
  ClipboardCheck,
  Eye,
  Filter,
  Search,
} from 'lucide-react';

import { db } from '@/lib/firebase';

/*
|--------------------------------------------------------------------------
| INTERFACE
|--------------------------------------------------------------------------
*/

interface MonitoringItem {
  id: string;

  pembimbingId: string;
  pembimbingNama: string;

  siswaId: string;
  siswaNama: string;
  kelas: string;
  jurusan: string;

  perusahaanId: string;
  perusahaanNama: string;

  tanggal: string;
  waktu?: string;

  jenisMonitoring: string;

  progressProject?: number;

  statusPerkembangan: string;

  sortTime: number;
}

interface PembimbingOption {
  id: string;
  nama: string;
}

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function MonitoringKepsekPage() {
  const router = useRouter();

  /*
  |--------------------------------------------------------------------------
  | DATA
  |--------------------------------------------------------------------------
  */

  const [
    monitoring,
    setMonitoring,
  ] = useState<
    MonitoringItem[]
  >([]);

  const [
    pembimbingOptions,
    setPembimbingOptions,
  ] = useState<
    PembimbingOption[]
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
    filterPembimbing,
    setFilterPembimbing,
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
  ] = useState<
    'terbaru' | 'terlama'
  >('terbaru');

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
  | STATE
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
    let cancelled = false;

    const fetchData =
      async () => {
        try {
          setLoading(true);
          setError('');

          /*
          |--------------------------------------------------------------------------
          | SEMUA COLLECTION PARALEL
          |--------------------------------------------------------------------------
          */

          const [
            monitoringSnap,
            siswaSnap,
            pembimbingSnap,
            perusahaanSnap,
          ] =
            await Promise.all([
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
          | MAP SISWA
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

          siswaSnap.docs.forEach(
            (siswaDoc) => {
              const data =
                siswaDoc.data();

              siswaMap.set(
                siswaDoc.id,
                {
                  nama:
                    data.nama ||
                    'Siswa',

                  kelas:
                    data.kelas ||
                    '-',

                  jurusan:
                    data.jurusan ||
                    '-',
                }
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

          const pembimbingList: PembimbingOption[] =
            [];

          pembimbingSnap.docs.forEach(
            (pembimbingDoc) => {
              const data =
                pembimbingDoc.data();

              const nama =
                data.nama ||
                'Pembimbing';

              pembimbingMap.set(
                pembimbingDoc.id,
                nama
              );

              pembimbingList.push({
                id:
                  pembimbingDoc.id,

                nama,
              });
            }
          );

          pembimbingList.sort(
            (a, b) =>
              a.nama.localeCompare(
                b.nama,
                'id'
              )
          );

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
            (perusahaanDoc) => {
              const data =
                perusahaanDoc.data();

              perusahaanMap.set(
                perusahaanDoc.id,
                data.nama ||
                  '-'
              );
            }
          );

          /*
          |--------------------------------------------------------------------------
          | BUILD MONITORING
          |--------------------------------------------------------------------------
          */

          const result: MonitoringItem[] =
            monitoringSnap.docs.map(
              (monitorDoc) => {
                const data =
                  monitorDoc.data();

                const siswa =
                  siswaMap.get(
                    data.siswaId
                  );

                /*
                |--------------------------------------------------------------------------
                | SORT TIME
                |--------------------------------------------------------------------------
                */

                let sortTime =
                  0;

                if (
                  data.tanggal
                ) {
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
                    sortTime =
                      value;
                  }
                }

                if (
                  sortTime ===
                    0 &&
                  data.createdAt &&
                  typeof data.createdAt
                    .toMillis ===
                    'function'
                ) {
                  sortTime =
                    data.createdAt.toMillis();
                }

                /*
                |--------------------------------------------------------------------------
                | PROGRESS
                |--------------------------------------------------------------------------
                */

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

                  pembimbingId:
                    data.pembimbingId ||
                    '',

                  pembimbingNama:
                    pembimbingMap.get(
                      data.pembimbingId
                    ) ||
                    'Pembimbing',

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

                  sortTime,
                };
              }
            );

          /*
          |--------------------------------------------------------------------------
          | DEFAULT SORT
          |--------------------------------------------------------------------------
          */

          result.sort(
            (a, b) =>
              b.sortTime -
              a.sortTime
          );

          if (!cancelled) {
            setMonitoring(
              result
            );

            setPembimbingOptions(
              pembimbingList
            );
          }
        } catch (err) {
          console.error(
            'Gagal mengambil monitoring Kepala Sekolah:',
            err
          );

          if (!cancelled) {
            setError(
              'Data monitoring gagal dimuat.'
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
  | FILTERED
  |--------------------------------------------------------------------------
  */

  const filtered =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      const result =
        monitoring.filter(
          (item) => {
            /*
            |--------------------------------------------------------------------------
            | SEARCH
            |--------------------------------------------------------------------------
            */

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

            /*
            |--------------------------------------------------------------------------
            | PEMBIMBING
            |--------------------------------------------------------------------------
            */

            const matchPembimbing =
              !filterPembimbing ||
              item.pembimbingId ===
                filterPembimbing;

            /*
            |--------------------------------------------------------------------------
            | BULAN
            |--------------------------------------------------------------------------
            |
            | input month = YYYY-MM
            |
            */

            const matchBulan =
              !filterBulan ||
              item.tanggal.startsWith(
                filterBulan
              );

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */

            const matchStatus =
              !filterStatus ||
              item.statusPerkembangan ===
                filterStatus;

            return (
              matchSearch &&
              matchPembimbing &&
              matchBulan &&
              matchStatus
            );
          }
        );

      /*
      |--------------------------------------------------------------------------
      | SORT
      |--------------------------------------------------------------------------
      */

      return [
        ...result,
      ].sort(
        (a, b) =>
          sortOrder ===
          'terbaru'
            ? b.sortTime -
              a.sortTime
            : a.sortTime -
              b.sortTime
      );
    }, [
      monitoring,
      search,
      filterPembimbing,
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
    filterPembimbing,
    filterBulan,
    filterStatus,
    sortOrder,
  ]);

  /*
  |--------------------------------------------------------------------------
  | PAGINATION
  |--------------------------------------------------------------------------
  */

  const totalPages =
    Math.max(
      Math.ceil(
        filtered.length /
          itemsPerPage
      ),
      1
    );

  const startIndex =
    (currentPage - 1) *
    itemsPerPage;

  const paginated =
    filtered.slice(
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
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    ).format(date);
  };

  /*
  |--------------------------------------------------------------------------
  | JENIS
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
          ) || '-'
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
        return status || '-';
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
          text-gray-700
          dark:bg-gray-800
          dark:text-gray-300
        `;
    }
  };

  /*
  |--------------------------------------------------------------------------
  | PROGRESS
  |--------------------------------------------------------------------------
  */

  const progressLabel = (
    progress?: number
  ) => {
    if (
      progress === undefined
    ) {
      return 'Belum Diisi';
    }

    if (progress === 0) {
      return 'Belum Mulai';
    }

    if (progress <= 25) {
      return 'Tahap Awal';
    }

    if (progress <= 50) {
      return 'Dalam Proses';
    }

    if (progress <= 75) {
      return 'Berkembang';
    }

    if (progress < 100) {
      return 'Hampir Selesai';
    }

    return 'Selesai';
  };

  const progressBarClass = (
    progress: number
  ) => {
    if (progress === 100) {
      return 'bg-green-600';
    }

    if (progress >= 76) {
      return 'bg-blue-600';
    }

    if (progress >= 51) {
      return 'bg-cyan-600';
    }

    if (progress >= 26) {
      return 'bg-yellow-500';
    }

    if (progress > 0) {
      return 'bg-orange-500';
    }

    return 'bg-gray-400';
  };

  /*
  |--------------------------------------------------------------------------
  | RESET FILTER
  |--------------------------------------------------------------------------
  */

  const resetFilter = () => {
    setSearch('');
    setFilterPembimbing('');
    setFilterBulan('');
    setFilterStatus('');
    setSortOrder(
      'terbaru'
    );
  };

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

      <div>

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
            <ClipboardCheck
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
              Monitoring PKL
            </h1>

            <p
              className="
                text-sm
                text-gray-500
                dark:text-gray-400
                mt-1
              "
            >
              Rekap seluruh aktivitas monitoring pembimbing PKL.
            </p>

          </div>

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
          FILTER CARD
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
            Filter Monitoring
          </h2>

        </div>

        <div
          className="
            grid
            md:grid-cols-2
            xl:grid-cols-5
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
                placeholder="Cari siswa, pembimbing, perusahaan..."
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
              Bulan
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
              Status
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

        {/* BOTTOM FILTER */}

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
              {filtered.length}
            </strong>{' '}

            data monitoring.
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
                  e.target.value as
                    | 'terbaru'
                    | 'terlama'
                )
              }
              className="
                border
                border-gray-300
                dark:border-gray-700
                rounded-lg
                px-3
                py-2
                text-sm
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

        {loading ? (
          <div
            className="
              py-16
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
              Memuat data monitoring...
            </p>

          </div>
        ) : paginated.length >
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

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">
                    Jenis
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 min-w-[170px]">
                    Progress Project
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                    Status
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">
                    Aksi
                  </th>

                </tr>

              </thead>

              <tbody>

                {paginated.map(
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
                                text-gray-900
                                dark:text-white
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
                          text-sm
                          text-gray-700
                          dark:text-gray-300
                        "
                      >
                        {
                          item.pembimbingNama
                        }
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
                              min-w-[150px]
                            "
                          >

                            <div
                              className="
                                flex
                                items-center
                                justify-between
                                gap-3
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

                              <span
                                className="
                                  text-[10px]
                                  text-gray-500
                                  dark:text-gray-400
                                  whitespace-nowrap
                                "
                              >
                                {progressLabel(
                                  item.progressProject
                                )}
                              </span>

                            </div>

                            <div
                              className="
                                w-full
                                h-2
                                bg-gray-200
                                dark:bg-gray-800
                                rounded-full
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
                              inline-flex
                              px-2.5
                              py-1
                              rounded-full
                              text-xs
                              bg-gray-100
                              text-gray-500
                              dark:bg-gray-800
                              dark:text-gray-400
                            "
                          >
                            Belum Diisi
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
                            text-blue-600
                            dark:text-blue-400
                            hover:underline
                            text-sm
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
              text-gray-500
              dark:text-gray-400
            "
          >
            Tidak ada data monitoring yang sesuai.
          </div>
        )}

        {/* ================================================================
            PAGINATION
        ================================================================= */}

        {!loading &&
          filtered.length >
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
                {startIndex + 1}
              </strong>

              {' - '}

              <strong>
                {Math.min(
                  startIndex +
                    itemsPerPage,
                  filtered.length
                )}
              </strong>

              {' dari '}

              <strong>
                {
                  filtered.length
                }
              </strong>

              {' data'}
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