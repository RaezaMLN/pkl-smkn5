'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  collection,
  getDocs,
} from 'firebase/firestore';

import {
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FolderKanban,
  GraduationCap,
  TrendingUp,
  UserRoundCheck,
  Users,
} from 'lucide-react';

import { db } from '@/lib/firebase';

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

interface DashboardStats {
  totalSiswa: number;
  totalPembimbing: number;
  totalPerusahaan: number;

  sudahMonitoring: number;
  belumMonitoring: number;

  rataRataProgress: number;
}

interface MonitoringTerbaru {
  id: string;

  siswaId: string;
  siswaNama: string;
  kelas: string;

  pembimbingNama: string;
  perusahaanNama: string;

  tanggal: string;
  waktu?: string;

  progressProject?: number;

  statusPerkembangan?: string;

  sortTime: number;
}

interface ProgressDistribution {
  belumDiisi: number;
  belumMulai: number;
  tahapAwal: number;
  dalamProses: number;
  berkembang: number;
  hampirSelesai: number;
  selesai: number;
}

interface LatestProgress {
  progress?: number;
  sortTime: number;
}

/*
|--------------------------------------------------------------------------
| INITIAL
|--------------------------------------------------------------------------
*/

const initialStats: DashboardStats = {
  totalSiswa: 0,
  totalPembimbing: 0,
  totalPerusahaan: 0,

  sudahMonitoring: 0,
  belumMonitoring: 0,

  rataRataProgress: 0,
};

const initialDistribution: ProgressDistribution = {
  belumDiisi: 0,
  belumMulai: 0,
  tahapAwal: 0,
  dalamProses: 0,
  berkembang: 0,
  hampirSelesai: 0,
  selesai: 0,
};

/*
|--------------------------------------------------------------------------
| HELPER TIME
|--------------------------------------------------------------------------
*/

const getMonitoringTime = (
  data: Record<string, any>
) => {
  /*
  |--------------------------------------------------------------------------
  | PRIORITAS TANGGAL + WAKTU
  |--------------------------------------------------------------------------
  */

  if (data.tanggal) {
    const dateString =
      `${data.tanggal}T${
        data.waktu ||
        '00:00'
      }`;

    const parsed =
      new Date(
        dateString
      ).getTime();

    if (
      !Number.isNaN(
        parsed
      )
    ) {
      return parsed;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | FALLBACK CREATED AT
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
| PAGE
|--------------------------------------------------------------------------
*/

export default function DashboardKepsekPage() {
  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [
    stats,
    setStats,
  ] =
    useState<DashboardStats>(
      initialStats
    );

  const [
    distribution,
    setDistribution,
  ] =
    useState<ProgressDistribution>(
      initialDistribution
    );

  const [
    monitoringTerbaru,
    setMonitoringTerbaru,
  ] = useState<
    MonitoringTerbaru[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  /*
  |--------------------------------------------------------------------------
  | FETCH DASHBOARD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let cancelled = false;

    const fetchDashboard =
      async () => {
        try {
          setLoading(true);
          setError('');

          /*
          |--------------------------------------------------------------------------
          | AMBIL SEMUA COLLECTION PARALEL
          |--------------------------------------------------------------------------
          */

          const [
            siswaSnap,
            pembimbingSnap,
            perusahaanSnap,
            monitoringSnap,
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
                  'pembimbing'
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
          | SISWA MAP
          |--------------------------------------------------------------------------
          */

          const siswaMap =
            new Map<
              string,
              {
                nama: string;
                kelas: string;
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
                }
              );
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

          pembimbingSnap.docs.forEach(
            (pembimbingDoc) => {
              const data =
                pembimbingDoc.data();

              pembimbingMap.set(
                pembimbingDoc.id,
                data.nama ||
                  'Pembimbing'
              );
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
          | SISWA VALID
          |--------------------------------------------------------------------------
          */

          const siswaIds =
            new Set(
              siswaSnap.docs.map(
                (doc) =>
                  doc.id
              )
            );

          /*
          |--------------------------------------------------------------------------
          | SISWA YANG PERNAH DIMONITORING
          |--------------------------------------------------------------------------
          */

          const monitoredSiswa =
            new Set<string>();

          /*
          |--------------------------------------------------------------------------
          | LATEST PROGRESS PER SISWA
          |--------------------------------------------------------------------------
          */

          const latestProgress =
            new Map<
              string,
              LatestProgress
            >();

          /*
          |--------------------------------------------------------------------------
          | RIWAYAT UNTUK TABLE
          |--------------------------------------------------------------------------
          */

          const monitoringRows: MonitoringTerbaru[] =
            [];

          monitoringSnap.docs.forEach(
            (monitorDoc) => {
              const data =
                monitorDoc.data();

              const siswaId =
                data.siswaId;

              if (!siswaId) {
                return;
              }

              /*
              |--------------------------------------------------------------------------
              | HANYA SISWA YANG MASIH ADA
              |--------------------------------------------------------------------------
              */

              if (
                siswaIds.has(
                  siswaId
                )
              ) {
                monitoredSiswa.add(
                  siswaId
                );
              }

              const sortTime =
                getMonitoringTime(
                  data
                );

              /*
              |--------------------------------------------------------------------------
              | LATEST PROGRESS
              |--------------------------------------------------------------------------
              */

              const existing =
                latestProgress.get(
                  siswaId
                );

              if (
                !existing ||
                sortTime >
                  existing.sortTime
              ) {
                latestProgress.set(
                  siswaId,
                  {
                    progress:
                      typeof data.progressProject ===
                      'number'
                        ? Math.min(
                            Math.max(
                              data.progressProject,
                              0
                            ),
                            100
                          )
                        : undefined,

                    sortTime,
                  }
                );
              }

              /*
              |--------------------------------------------------------------------------
              | TABLE MONITORING
              |--------------------------------------------------------------------------
              */

              const siswaData =
                siswaMap.get(
                  siswaId
                );

              monitoringRows.push(
                {
                  id:
                    monitorDoc.id,

                  siswaId,

                  siswaNama:
                    siswaData?.nama ||
                    'Siswa',

                  kelas:
                    siswaData?.kelas ||
                    '-',

                  pembimbingNama:
                    pembimbingMap.get(
                      data.pembimbingId
                    ) ||
                    'Pembimbing',

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

                  progressProject:
                    typeof data.progressProject ===
                    'number'
                      ? Math.min(
                          Math.max(
                            data.progressProject,
                            0
                          ),
                          100
                        )
                      : undefined,

                  statusPerkembangan:
                    data.statusPerkembangan ||
                    '',

                  sortTime,
                }
              );
            }
          );

          /*
          |--------------------------------------------------------------------------
          | TOTAL PROGRESS
          |--------------------------------------------------------------------------
          |
          | Siswa tanpa progress dihitung 0 untuk rata-rata sekolah.
          |
          */

          let totalProgress =
            0;

          const nextDistribution: ProgressDistribution =
            {
              ...initialDistribution,
            };

          siswaSnap.docs.forEach(
            (siswaDoc) => {
              const latest =
                latestProgress.get(
                  siswaDoc.id
                );

              const progress =
                latest?.progress;

              /*
              |--------------------------------------------------------------------------
              | BELUM ADA FIELD PROGRESS
              |--------------------------------------------------------------------------
              */

              if (
                progress ===
                undefined
              ) {
                nextDistribution.belumDiisi +=
                  1;

                return;
              }

              /*
              |--------------------------------------------------------------------------
              | MASUKKAN KE RATA-RATA
              |--------------------------------------------------------------------------
              */

              totalProgress +=
                progress;

              /*
              |--------------------------------------------------------------------------
              | DISTRIBUSI
              |--------------------------------------------------------------------------
              */

              if (
                progress ===
                0
              ) {
                nextDistribution.belumMulai +=
                  1;
              } else if (
                progress <=
                25
              ) {
                nextDistribution.tahapAwal +=
                  1;
              } else if (
                progress <=
                50
              ) {
                nextDistribution.dalamProses +=
                  1;
              } else if (
                progress <=
                75
              ) {
                nextDistribution.berkembang +=
                  1;
              } else if (
                progress <
                100
              ) {
                nextDistribution.hampirSelesai +=
                  1;
              } else {
                nextDistribution.selesai +=
                  1;
              }
            }
          );

          /*
          |--------------------------------------------------------------------------
          | RATA-RATA SELURUH SISWA
          |--------------------------------------------------------------------------
          */

          const rataRata =
            siswaSnap.size >
            0
              ? Math.round(
                  totalProgress /
                    siswaSnap.size
                )
              : 0;

          /*
          |--------------------------------------------------------------------------
          | MONITORING TERBARU
          |--------------------------------------------------------------------------
          */

          monitoringRows.sort(
            (a, b) =>
              b.sortTime -
              a.sortTime
          );

          const latestRows =
            monitoringRows.slice(
              0,
              5
            );

          /*
          |--------------------------------------------------------------------------
          | SET STATE
          |--------------------------------------------------------------------------
          */

          if (!cancelled) {
            setStats({
              totalSiswa:
                siswaSnap.size,

              totalPembimbing:
                pembimbingSnap.size,

              totalPerusahaan:
                perusahaanSnap.size,

              sudahMonitoring:
                monitoredSiswa.size,

              belumMonitoring:
                Math.max(
                  siswaSnap.size -
                    monitoredSiswa.size,
                  0
                ),

              rataRataProgress:
                rataRata,
            });

            setDistribution(
              nextDistribution
            );

            setMonitoringTerbaru(
              latestRows
            );
          }
        } catch (err) {
          console.error(
            'Gagal mengambil dashboard Kepala Sekolah:',
            err
          );

          if (!cancelled) {
            setError(
              'Data dashboard gagal dimuat. Silakan coba kembali.'
            );
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

    fetchDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CARD
  |--------------------------------------------------------------------------
  */

  const cards =
    useMemo(
      () => [
        {
          label:
            'Total Siswa PKL',

          value:
            stats.totalSiswa,

          icon:
            GraduationCap,

          className:
            'text-blue-600 bg-blue-100 dark:bg-blue-950',
        },

        {
          label:
            'Pembimbing',

          value:
            stats.totalPembimbing,

          icon:
            Users,

          className:
            'text-purple-600 bg-purple-100 dark:bg-purple-950',
        },

        {
          label:
            'Perusahaan',

          value:
            stats.totalPerusahaan,

          icon:
            Building2,

          className:
            'text-orange-600 bg-orange-100 dark:bg-orange-950',
        },

        {
          label:
            'Sudah Dimonitoring',

          value:
            stats.sudahMonitoring,

          icon:
            UserRoundCheck,

          className:
            'text-green-600 bg-green-100 dark:bg-green-950',
        },

        {
          label:
            'Belum Dimonitoring',

          value:
            stats.belumMonitoring,

          icon:
            ClipboardCheck,

          className:
            'text-red-600 bg-red-100 dark:bg-red-950',
        },
      ],
      [stats]
    );

  /*
  |--------------------------------------------------------------------------
  | PROGRESS COLOR
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
  | STATUS LABEL
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
            Memuat dashboard...
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
          TITLE
      ================================================================= */}

      <div>

        <h1
          className="
            text-2xl
            font-bold
            text-gray-900
            dark:text-white
          "
        >
          Dashboard Kepala Sekolah
        </h1>

        <p
          className="
            text-sm
            text-gray-500
            dark:text-gray-400
            mt-1
          "
        >
          Ringkasan monitoring dan perkembangan siswa PKL.
        </p>

      </div>

      {/* ERROR */}

      {error && (
        <div
          className="
            bg-red-100
            text-red-700
            dark:bg-red-950
            dark:text-red-300
            rounded-xl
            p-4
          "
        >
          {error}
        </div>
      )}

      {/* ================================================================
          KPI CARDS
      ================================================================= */}

      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          xl:grid-cols-5
          gap-4
        "
      >

        {cards.map(
          (card) => {
            const Icon =
              card.icon;

            return (
              <div
                key={
                  card.label
                }
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
                  className={`
                    w-11
                    h-11
                    rounded-xl
                    flex
                    items-center
                    justify-center
                    ${card.className}
                  `}
                >
                  <Icon
                    size={22}
                  />
                </div>

                <p
                  className="
                    mt-4
                    text-3xl
                    font-bold
                    text-gray-900
                    dark:text-white
                  "
                >
                  {card.value}
                </p>

                <p
                  className="
                    text-sm
                    text-gray-500
                    dark:text-gray-400
                    mt-1
                  "
                >
                  {card.label}
                </p>

              </div>
            );
          }
        )}

      </div>

      {/* ================================================================
          PROGRESS
      ================================================================= */}

      <div
        className="
          grid
          xl:grid-cols-3
          gap-6
        "
      >

        {/* RATA RATA */}

        <div
          className="
            bg-white
            dark:bg-gray-900
            border
            border-gray-200
            dark:border-gray-800
            rounded-2xl
            p-6
            shadow-sm
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
                bg-purple-100
                dark:bg-purple-950
                text-purple-600
              "
            >
              <FolderKanban
                size={22}
              />
            </div>

            <div>

              <h2
                className="
                  font-semibold
                  text-gray-900
                  dark:text-white
                "
              >
                Progress Project
              </h2>

              <p
                className="
                  text-xs
                  text-gray-500
                  dark:text-gray-400
                "
              >
                Rata-rata seluruh siswa
              </p>

            </div>

          </div>

          <div
            className="
              mt-7
              flex
              items-end
              gap-2
            "
          >

            <span
              className="
                text-5xl
                font-bold
                text-gray-900
                dark:text-white
              "
            >
              {
                stats.rataRataProgress
              }
            </span>

            <span
              className="
                text-xl
                text-gray-500
                mb-1
              "
            >
              %
            </span>

          </div>

          <div
            className="
              mt-5
              w-full
              h-3
              bg-gray-200
              dark:bg-gray-800
              rounded-full
              overflow-hidden
            "
          >

            <div
              style={{
                width:
                  `${stats.rataRataProgress}%`,
              }}
              className={`
                h-full
                rounded-full
                transition-all
                ${progressBarClass(
                  stats.rataRataProgress
                )}
              `}
            />

          </div>

        </div>

        {/* DISTRIBUSI */}

        <div
          className="
            xl:col-span-2
            bg-white
            dark:bg-gray-900
            border
            border-gray-200
            dark:border-gray-800
            rounded-2xl
            p-6
            shadow-sm
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

            <TrendingUp
              size={20}
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
              Distribusi Progress Project
            </h2>

          </div>

          <div
            className="
              grid
              grid-cols-2
              md:grid-cols-4
              gap-3
            "
          >

            {[
              {
                label:
                  'Belum Diisi',
                value:
                  distribution.belumDiisi,
              },

              {
                label:
                  '0%',
                value:
                  distribution.belumMulai,
              },

              {
                label:
                  '1–25%',
                value:
                  distribution.tahapAwal,
              },

              {
                label:
                  '26–50%',
                value:
                  distribution.dalamProses,
              },

              {
                label:
                  '51–75%',
                value:
                  distribution.berkembang,
              },

              {
                label:
                  '76–99%',
                value:
                  distribution.hampirSelesai,
              },

              {
                label:
                  '100%',
                value:
                  distribution.selesai,
              },
            ].map(
              (item) => (
                <div
                  key={
                    item.label
                  }
                  className="
                    bg-gray-50
                    dark:bg-gray-800
                    rounded-xl
                    p-4
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
                    {item.value}
                  </p>

                  <p
                    className="
                      text-xs
                      text-gray-500
                      dark:text-gray-400
                      mt-1
                    "
                  >
                    {item.label}
                  </p>

                </div>
              )
            )}

          </div>

        </div>

      </div>

      {/* ================================================================
          MONITORING TERBARU
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

        <div
          className="
            p-5
            md:p-6
            border-b
            border-gray-200
            dark:border-gray-800
            flex
            items-center
            justify-between
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

            <ClipboardCheck
              className="
                text-blue-600
              "
            />

            <div>

              <h2
                className="
                  font-semibold
                  text-gray-900
                  dark:text-white
                "
              >
                Monitoring Terbaru
              </h2>

              <p
                className="
                  text-xs
                  text-gray-500
                  dark:text-gray-400
                "
              >
                Lima aktivitas monitoring terbaru.
              </p>

            </div>

          </div>

        </div>

        {monitoringTerbaru.length >
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

                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                    Tanggal
                  </th>

                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                    Siswa
                  </th>

                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                    Pembimbing
                  </th>

                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                    Perusahaan
                  </th>

                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                    Progress
                  </th>

                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                    Status
                  </th>

                </tr>

              </thead>

              <tbody>

                {monitoringTerbaru.map(
                  (item) => (
                    <tr
                      key={
                        item.id
                      }
                      className="
                        border-t
                        border-gray-100
                        dark:border-gray-800
                      "
                    >

                      <td
                        className="
                          px-5
                          py-4
                          text-sm
                          whitespace-nowrap
                        "
                      >
                        {formatTanggal(
                          item.tanggal
                        )}

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

                      </td>

                      <td
                        className="
                          px-5
                          py-4
                        "
                      >

                        <p
                          className="
                            text-sm
                            font-medium
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
                          "
                        >
                          {
                            item.kelas
                          }
                        </p>

                      </td>

                      <td
                        className="
                          px-5
                          py-4
                          text-sm
                          text-gray-600
                          dark:text-gray-300
                        "
                      >
                        {
                          item.pembimbingNama
                        }
                      </td>

                      <td
                        className="
                          px-5
                          py-4
                          text-sm
                          text-gray-600
                          dark:text-gray-300
                        "
                      >
                        {
                          item.perusahaanNama
                        }
                      </td>

                      <td
                        className="
                          px-5
                          py-4
                          min-w-[150px]
                        "
                      >

                        {item.progressProject !==
                        undefined ? (
                          <div>

                            <div
                              className="
                                flex
                                items-center
                                justify-between
                                gap-2
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
                              text-xs
                              text-gray-400
                            "
                          >
                            Belum diisi
                          </span>
                        )}

                      </td>

                      <td
                        className="
                          px-5
                          py-4
                        "
                      >

                        <span
                          className="
                            inline-flex
                            items-center
                            gap-1
                            text-xs
                            text-gray-600
                            dark:text-gray-300
                          "
                        >
                          <CheckCircle2
                            size={14}
                          />

                          {statusLabel(
                            item.statusPerkembangan
                          )}
                        </span>

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
              py-12
              text-center
              text-gray-500
              dark:text-gray-400
            "
          >
            Belum ada data monitoring.
          </div>
        )}

      </div>

    </div>
  );
}