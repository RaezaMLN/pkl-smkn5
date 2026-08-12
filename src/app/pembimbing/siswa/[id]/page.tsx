'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useParams,
  useRouter,
} from 'next/navigation';

import { db } from '@/lib/firebase';

import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

import { motion } from 'framer-motion';

import {
  User,
  Building2,
  ArrowLeft,
  ClipboardCheck,
  Plus,
  Eye,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpDown,
} from 'lucide-react';

export default function DetailSiswaPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  /*
  |--------------------------------------------------------------------------
  | STATE UTAMA
  |--------------------------------------------------------------------------
  */

  const [siswa, setSiswa] = useState<any>(null);

  const [perusahaan, setPerusahaan] =
    useState<string>('Loading...');

  const [laporan, setLaporan] =
    useState<any[]>([]);

  const [monitoring, setMonitoring] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  /*
  |--------------------------------------------------------------------------
  | FILTER & PAGINATION LAPORAN
  |--------------------------------------------------------------------------
  */

  const [filterBulan, setFilterBulan] =
    useState('');

  const [sortLaporan, setSortLaporan] =
    useState<
      'terbaru' | 'az' | 'za'
    >('terbaru');

  const [currentPage, setCurrentPage] =
    useState(1);

  const itemsPerPage = 5;

  /*
  |--------------------------------------------------------------------------
  | CHECK LOGIN
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const isLoggedIn =
      localStorage.getItem(
        'isPembimbingLoggedIn'
      );

    if (isLoggedIn !== 'true') {
      router.replace(
        '/pembimbing/login'
      );
    }
  }, [router]);

  /*
  |--------------------------------------------------------------------------
  | FETCH DETAIL SISWA
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);

        const pembimbingLocal =
          localStorage.getItem(
            'pembimbing'
          );

        if (!pembimbingLocal) {
          router.replace(
            '/pembimbing/login'
          );
          return;
        }

        const pembimbing =
          JSON.parse(
            pembimbingLocal
          );

        /*
        |--------------------------------------------------------------------------
        | AMBIL DATA SISWA
        |--------------------------------------------------------------------------
        */

        const siswaDoc =
          await getDoc(
            doc(
              db,
              'siswa',
              id
            )
          );

        if (!siswaDoc.exists()) {
          setSiswa(null);
          return;
        }

        setSiswa({
          id: siswaDoc.id,
          ...siswaDoc.data(),
        });

        /*
        |--------------------------------------------------------------------------
        | CARI PERUSAHAAN
        |--------------------------------------------------------------------------
        */

        const perusahaanSnap =
          await getDocs(
            collection(
              db,
              'perusahaan'
            )
          );

        let perusahaanNama =
          'Belum PKL';

        for (
          const perDoc of
          perusahaanSnap.docs
        ) {
          const perData =
            perDoc.data();

          const siswaList =
            perData.siswa_terdaftar ||
            [];

          if (
            siswaList.includes(id)
          ) {
            perusahaanNama =
              perData.nama ||
              'Perusahaan';

            break;
          }
        }

        setPerusahaan(
          perusahaanNama
        );

        /*
        |--------------------------------------------------------------------------
        | AMBIL LAPORAN HARIAN
        |--------------------------------------------------------------------------
        */

        const laporanQuery =
          query(
            collection(
              db,
              'laporan'
            ),
            where(
              'siswaId',
              '==',
              id
            )
          );

        const laporanSnap =
          await getDocs(
            laporanQuery
          );

        const laporanData =
          laporanSnap.docs.map(
            (docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            })
          );

        setLaporan(
          laporanData
        );

        /*
        |--------------------------------------------------------------------------
        | AMBIL MONITORING
        |--------------------------------------------------------------------------
        */

        const monitoringQuery =
          query(
            collection(
              db,
              'monitoring'
            ),
            where(
              'siswaId',
              '==',
              id
            )
          );

        const monitoringSnap =
          await getDocs(
            monitoringQuery
          );

        const monitoringData =
          monitoringSnap.docs
            .map(
              (docSnap) => ({
                id: docSnap.id,
                ...docSnap.data(),
              })
            )
            .filter(
              (item: any) =>
                item.pembimbingId ===
                pembimbing.id
            );

        /*
        | Monitoring terbaru
        */

        monitoringData.sort(
          (
            a: any,
            b: any
          ) => {
            return (
              getTanggalTime(
                b.tanggal
              ) -
              getTanggalTime(
                a.tanggal
              )
            );
          }
        );

        setMonitoring(
          monitoringData
        );
      } catch (err) {
        console.error(
          'Gagal mengambil detail siswa:',
          err
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDetail();
    }
  }, [id, router]);

  /*
  |--------------------------------------------------------------------------
  | RESET PAGINATION
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setCurrentPage(1);
  }, [
    filterBulan,
    sortLaporan,
  ]);

  /*
  |--------------------------------------------------------------------------
  | HELPER STATUS MONITORING
  |--------------------------------------------------------------------------
  */

  const getStatusLabel = (
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

  const getStatusClass = (
    status?: string
  ) => {
    switch (status) {
      case 'sangat_baik':
        return `
          bg-green-100
          text-green-700
          dark:bg-green-900
          dark:text-green-200
        `;

      case 'baik':
        return `
          bg-blue-100
          text-blue-700
          dark:bg-blue-900
          dark:text-blue-200
        `;

      case 'perlu_perhatian':
        return `
          bg-yellow-100
          text-yellow-700
          dark:bg-yellow-900
          dark:text-yellow-200
        `;

      case 'bermasalah':
        return `
          bg-red-100
          text-red-700
          dark:bg-red-900
          dark:text-red-200
        `;

      default:
        return `
          bg-gray-100
          text-gray-700
          dark:bg-gray-700
          dark:text-gray-200
        `;
    }
  };

  /*
  |--------------------------------------------------------------------------
  | HELPER JENIS MONITORING
  |--------------------------------------------------------------------------
  */

  const getJenisMonitoringLabel = (
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
        return 'Koordinasi Pembimbing Industri';

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
  | HITUNG RATA-RATA MONITORING
  |--------------------------------------------------------------------------
  */

  const getAverage = (
    item: any
  ) => {
    if (!item?.kriteria) {
      return 0;
    }

    const values =
      Object.values(
        item.kriteria
      ).filter(
        (
          value
        ): value is number =>
          typeof value ===
            'number' &&
          value > 0
      );

    if (
      values.length === 0
    ) {
      return 0;
    }

    const total =
      values.reduce(
        (
          sum,
          value
        ) =>
          sum +
          value,
        0
      );

    return (
      total /
      values.length
    );
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

    /*
    | Format standar YYYY-MM-DD
    */

    const isoMatch =
      tanggal.match(
        /^(\d{4})-(\d{2})-(\d{2})$/
      );

    let date: Date;

    if (isoMatch) {
      date = new Date(
        Number(
          isoMatch[1]
        ),
        Number(
          isoMatch[2]
        ) - 1,
        Number(
          isoMatch[3]
        )
      );
    } else {
      date =
        new Date(
          tanggal
        );
    }

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return tanggal;
    }

    return new Intl.DateTimeFormat(
      'id-ID',
      {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }
    ).format(date);
  };

  /*
  |--------------------------------------------------------------------------
  | HELPER TIMESTAMP TANGGAL
  |--------------------------------------------------------------------------
  */

  function getTanggalTime(
    tanggal?: string
  ) {
    if (!tanggal) {
      return 0;
    }

    const isoMatch =
      tanggal.match(
        /^(\d{4})-(\d{2})-(\d{2})$/
      );

    if (isoMatch) {
      return new Date(
        Number(
          isoMatch[1]
        ),
        Number(
          isoMatch[2]
        ) - 1,
        Number(
          isoMatch[3]
        )
      ).getTime();
    }

    const date =
      new Date(
        tanggal
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return 0;
    }

    return date.getTime();
  }

  /*
  |--------------------------------------------------------------------------
  | AMBIL KEY BULAN DARI TANGGAL
  |--------------------------------------------------------------------------
  */

  const getMonthKey = (
    tanggal?: string
  ) => {
    if (!tanggal) {
      return '';
    }

    const isoMatch =
      tanggal.match(
        /^(\d{4})-(\d{2})-(\d{2})$/
      );

    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}`;
    }

    const date =
      new Date(
        tanggal
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return '';
    }

    return `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, '0')}`;
  };

  /*
  |--------------------------------------------------------------------------
  | LABEL BULAN
  |--------------------------------------------------------------------------
  */

  const getMonthLabel = (
    monthKey: string
  ) => {
    const [
      year,
      month,
    ] =
      monthKey.split(
        '-'
      );

    if (
      !year ||
      !month
    ) {
      return monthKey;
    }

    const date =
      new Date(
        Number(year),
        Number(month) - 1,
        1
      );

    return new Intl.DateTimeFormat(
      'id-ID',
      {
        month: 'long',
        year: 'numeric',
      }
    ).format(date);
  };

  /*
  |--------------------------------------------------------------------------
  | DAFTAR BULAN TERSEDIA
  |--------------------------------------------------------------------------
  */

  const availableMonths =
    useMemo(() => {
      const months =
        laporan
          .map(
            (
              item: any
            ) =>
              getMonthKey(
                item.tanggal
              )
          )
          .filter(
            Boolean
          );

      return Array.from(
        new Set(months)
      ).sort(
        (
          a,
          b
        ) =>
          b.localeCompare(
            a
          )
      );
    }, [laporan]);

  /*
  |--------------------------------------------------------------------------
  | FILTER + SORT LAPORAN
  |--------------------------------------------------------------------------
  */

  const filteredLaporan =
    useMemo(() => {
      let result =
        [...laporan];

      /*
      | FILTER BULAN
      */

      if (
        filterBulan
      ) {
        result =
          result.filter(
            (
              item: any
            ) =>
              getMonthKey(
                item.tanggal
              ) ===
              filterBulan
          );
      }

      /*
      | SORT
      */

      result.sort(
        (
          a: any,
          b: any
        ) => {
          /*
          | A - Z berdasarkan kegiatan
          */

          if (
            sortLaporan ===
            'az'
          ) {
            return (
              a.kegiatan ||
              ''
            ).localeCompare(
              b.kegiatan ||
                '',
              'id',
              {
                sensitivity:
                  'base',
              }
            );
          }

          /*
          | Z - A berdasarkan kegiatan
          */

          if (
            sortLaporan ===
            'za'
          ) {
            return (
              b.kegiatan ||
              ''
            ).localeCompare(
              a.kegiatan ||
                '',
              'id',
              {
                sensitivity:
                  'base',
              }
            );
          }

          /*
          | DEFAULT TERBARU
          */

          return (
            getTanggalTime(
              b.tanggal
            ) -
            getTanggalTime(
              a.tanggal
            )
          );
        }
      );

      return result;
    }, [
      laporan,
      filterBulan,
      sortLaporan,
    ]);

  /*
  |--------------------------------------------------------------------------
  | PAGINATION
  |--------------------------------------------------------------------------
  */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredLaporan.length /
          itemsPerPage
      )
    );

  const paginatedLaporan =
    useMemo(() => {
      const startIndex =
        (currentPage -
          1) *
        itemsPerPage;

      return filteredLaporan.slice(
        startIndex,
        startIndex +
          itemsPerPage
      );
    }, [
      filteredLaporan,
      currentPage,
    ]);

  /*
  |--------------------------------------------------------------------------
  | CLAMP CURRENT PAGE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);

  /*
  |--------------------------------------------------------------------------
  | PAGINATION INFO
  |--------------------------------------------------------------------------
  */

  const startItem =
    filteredLaporan.length ===
    0
      ? 0
      : (currentPage -
          1) *
          itemsPerPage +
        1;

  const endItem =
    Math.min(
      currentPage *
        itemsPerPage,
      filteredLaporan.length
    );

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="text-center py-10 text-gray-600 dark:text-gray-300">
        Loading...
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | DATA TIDAK DITEMUKAN
  |--------------------------------------------------------------------------
  */

  if (!siswa) {
    return (
      <div className="text-center py-10">
        Data siswa tidak ditemukan
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">

      {/* ================================================================
          BACK
      ================================================================= */}

      <button
        onClick={() =>
          router.back()
        }
        className="
          flex
          items-center
          gap-2
          mb-4
          text-blue-600
          dark:text-blue-400
          hover:underline
        "
      >
        <ArrowLeft
          size={16}
        />

        Kembali
      </button>

      {/* ================================================================
          HEADER
      ================================================================= */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Detail Siswa
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Informasi PKL,
            laporan harian, dan
            perkembangan
            monitoring siswa.
          </p>
        </div>

        {perusahaan !==
          'Belum PKL' && (
          <button
            onClick={() =>
              router.push(
                `/pembimbing/monitoring/tambah?siswaId=${id}`
              )
            }
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              bg-blue-600
              hover:bg-blue-700
              text-white
              px-4
              py-2.5
              rounded-lg
              transition
            "
          >
            <Plus
              size={18}
            />

            Tambah Monitoring
          </button>
        )}
      </div>

      {/* ================================================================
          DATA SISWA + PKL
      ================================================================= */}

      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="grid md:grid-cols-2 gap-6"
      >

        {/* DATA SISWA */}

        <div
          className="
            bg-white
            dark:bg-gray-800
            p-6
            rounded-xl
            shadow
            border
            border-gray-200
            dark:border-gray-700
          "
        >

          <div className="flex items-center gap-2 mb-5">

            <User className="text-blue-600 dark:text-blue-400" />

            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Data Siswa
            </h2>

          </div>

          <div className="space-y-3 text-sm">

            <div>
              <p className="text-gray-500 dark:text-gray-400">
                Nama
              </p>

              <p className="font-medium text-gray-900 dark:text-white">
                {siswa.nama ||
                  '-'}
              </p>
            </div>

            <div>
              <p className="text-gray-500 dark:text-gray-400">
                Kelas
              </p>

              <p className="font-medium text-gray-900 dark:text-white">
                {siswa.kelas ||
                  '-'}
              </p>
            </div>

            <div>
              <p className="text-gray-500 dark:text-gray-400">
                Jurusan
              </p>

              <p className="font-medium text-gray-900 dark:text-white">
                {siswa.jurusan ||
                  '-'}
              </p>
            </div>

            <div>
              <p className="text-gray-500 dark:text-gray-400">
                Email
              </p>

              <p className="font-medium text-gray-900 dark:text-white">
                {siswa.email ||
                  '-'}
              </p>
            </div>

            {siswa.nisn && (
              <div>
                <p className="text-gray-500 dark:text-gray-400">
                  NISN
                </p>

                <p className="font-medium text-gray-900 dark:text-white">
                  {
                    siswa.nisn
                  }
                </p>
              </div>
            )}

          </div>
        </div>

        {/* DATA PKL */}

        <div
          className="
            bg-white
            dark:bg-gray-800
            p-6
            rounded-xl
            shadow
            border
            border-gray-200
            dark:border-gray-700
          "
        >

          <div className="flex items-center gap-2 mb-5">

            <Building2 className="text-green-600 dark:text-green-400" />

            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Data PKL
            </h2>

          </div>

          <div className="space-y-3 text-sm">

            <div>
              <p className="text-gray-500 dark:text-gray-400">
                Perusahaan
              </p>

              <p className="font-medium text-gray-900 dark:text-white">
                {
                  perusahaan
                }
              </p>
            </div>

            <div>
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                Status
              </p>

              {perusahaan !==
              'Belum PKL' ? (
                <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 px-2.5 py-1 rounded-full text-xs font-medium">
                  Aktif PKL
                </span>
              ) : (
                <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 px-2.5 py-1 rounded-full text-xs font-medium">
                  Belum PKL
                </span>
              )}
            </div>

          </div>

        </div>

      </motion.div>

      {/* ================================================================
          RIWAYAT MONITORING
      ================================================================= */}

      <div
        className="
          mt-8
          bg-white
          dark:bg-gray-800
          p-6
          rounded-xl
          shadow
          border
          border-gray-200
          dark:border-gray-700
        "
      >

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">

          <div className="flex items-start gap-3">

            <div className="bg-blue-100 dark:bg-blue-900 p-2.5 rounded-lg">

              <ClipboardCheck
                size={21}
                className="text-blue-600 dark:text-blue-300"
              />

            </div>

            <div>

              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Riwayat Monitoring
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Perkembangan siswa
                berdasarkan hasil
                monitoring
                pembimbing.
              </p>

            </div>

          </div>

          {perusahaan !==
            'Belum PKL' && (
            <button
              onClick={() =>
                router.push(
                  `/pembimbing/monitoring/tambah?siswaId=${id}`
                )
              }
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                bg-blue-600
                hover:bg-blue-700
                text-white
                text-sm
                px-4
                py-2
                rounded-lg
              "
            >
              <Plus
                size={16}
              />

              Monitoring
            </button>
          )}

        </div>

        {monitoring.length >
        0 ? (
          <div className="space-y-4">

            {monitoring.map(
              (
                m: any,
                index: number
              ) => {
                const rataRata =
                  getAverage(
                    m
                  );

                return (
                  <div
                    key={
                      m.id
                    }
                    className="
                      border
                      border-gray-200
                      dark:border-gray-600
                      rounded-xl
                      p-5
                      bg-gray-50
                      dark:bg-gray-700
                    "
                  >

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                      <div>

                        <div className="flex flex-wrap items-center gap-2 mb-2">

                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            Monitoring #
                            {monitoring.length -
                              index}
                          </h3>

                          <span
                            className={`
                              text-xs
                              font-medium
                              px-2.5
                              py-1
                              rounded-full
                              ${getStatusClass(
                                m.statusPerkembangan
                              )}
                            `}
                          >
                            {getStatusLabel(
                              m.statusPerkembangan
                            )}
                          </span>

                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300">

                          <CalendarDays
                            size={
                              15
                            }
                          />

                          <span>
                            {formatTanggal(
                              m.tanggal
                            )}
                          </span>

                          {m.waktu && (
                            <>
                              <span>
                                •
                              </span>

                              <span>
                                {
                                  m.waktu
                                }
                              </span>
                            </>
                          )}

                        </div>

                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {getJenisMonitoringLabel(
                            m.jenisMonitoring
                          )}
                        </p>

                      </div>

                      <div className="flex items-center gap-5">

                        {rataRata >
                          0 && (
                          <div>

                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Rata-rata
                            </p>

                            <p className="font-semibold text-lg text-gray-900 dark:text-white">
                              {rataRata.toFixed(
                                2
                              )}{' '}
                              / 4
                            </p>

                          </div>
                        )}

                        <button
                          onClick={() =>
                            router.push(
                              `/pembimbing/monitoring/${m.id}`
                            )
                          }
                          className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
                        >
                          <Eye
                            size={
                              16
                            }
                          />

                          Detail
                        </button>

                      </div>

                    </div>

                    {m.deskripsiPerkembangan && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">

                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Perkembangan
                        </p>

                        <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                          {
                            m.deskripsiPerkembangan
                          }
                        </p>

                      </div>
                    )}

                    {m.kendala && (
                      <div className="mt-3">

                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Kendala
                        </p>

                        <p className="text-sm text-gray-700 dark:text-gray-200">
                          {
                            m.kendala
                          }
                        </p>

                      </div>
                    )}

                  </div>
                );
              }
            )}

          </div>
        ) : (
          <div className="text-center py-10 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl">

            <ClipboardCheck
              size={36}
              className="mx-auto mb-3 text-gray-400"
            />

            <p className="font-medium text-gray-700 dark:text-gray-200">
              Belum ada monitoring
            </p>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Belum ada data
              perkembangan
              monitoring untuk
              siswa ini.
            </p>

            {perusahaan !==
              'Belum PKL' && (
              <button
                onClick={() =>
                  router.push(
                    `/pembimbing/monitoring/tambah?siswaId=${id}`
                  )
                }
                className="inline-flex items-center gap-2 mt-4 text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
              >
                <Plus
                  size={
                    16
                  }
                />

                Tambahkan
                Monitoring
                Pertama
              </button>
            )}

          </div>
        )}

      </div>

      {/* ================================================================
          LAPORAN HARIAN
      ================================================================= */}

      <div
        className="
          mt-8
          bg-white
          dark:bg-gray-800
          rounded-xl
          shadow
          border
          border-gray-200
          dark:border-gray-700
          overflow-hidden
        "
      >

        {/* HEADER LAPORAN */}

        <div className="p-6 border-b border-gray-200 dark:border-gray-700">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

            <div>

              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Laporan Harian
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Riwayat kegiatan
                harian siswa selama
                pelaksanaan PKL.
              </p>

            </div>

            {/* FILTER */}

            <div className="flex flex-col sm:flex-row gap-3">

              {/* FILTER BULAN */}

              <div className="relative">

                <Filter
                  size={17}
                  className="absolute left-3 top-3 text-gray-400 pointer-events-none"
                />

                <select
                  value={
                    filterBulan
                  }
                  onChange={(
                    e
                  ) =>
                    setFilterBulan(
                      e.target
                        .value
                    )
                  }
                  className="
                    w-full
                    sm:w-52
                    pl-9
                    pr-8
                    py-2.5
                    border
                    border-gray-300
                    dark:border-gray-600
                    rounded-lg
                    bg-white
                    dark:bg-gray-700
                    text-sm
                    text-gray-900
                    dark:text-white
                  "
                >

                  <option value="">
                    Semua Bulan
                  </option>

                  {availableMonths.map(
                    (
                      month
                    ) => (
                      <option
                        key={
                          month
                        }
                        value={
                          month
                        }
                      >
                        {getMonthLabel(
                          month
                        )}
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* SORT */}

              <div className="relative">

                <ArrowUpDown
                  size={17}
                  className="absolute left-3 top-3 text-gray-400 pointer-events-none"
                />

                <select
                  value={
                    sortLaporan
                  }
                  onChange={(
                    e
                  ) =>
                    setSortLaporan(
                      e.target
                        .value as
                        | 'terbaru'
                        | 'az'
                        | 'za'
                    )
                  }
                  className="
                    w-full
                    sm:w-48
                    pl-9
                    pr-8
                    py-2.5
                    border
                    border-gray-300
                    dark:border-gray-600
                    rounded-lg
                    bg-white
                    dark:bg-gray-700
                    text-sm
                    text-gray-900
                    dark:text-white
                  "
                >

                  <option value="terbaru">
                    Terbaru
                  </option>

                  <option value="az">
                    Kegiatan A - Z
                  </option>

                  <option value="za">
                    Kegiatan Z - A
                  </option>

                </select>

              </div>

            </div>

          </div>

        </div>

        {/* HASIL LAPORAN */}

        <div className="p-6">

          {filteredLaporan.length >
          0 ? (
            <>
              <div className="space-y-4">

                {paginatedLaporan.map(
                  (
                    l: any
                  ) => (
                    <div
                      key={
                        l.id
                      }
                      className="
                        border
                        border-gray-200
                        dark:border-gray-600
                        rounded-xl
                        p-4
                        bg-gray-50
                        dark:bg-gray-700
                      "
                    >

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

                        <div className="flex items-center gap-2">

                          <CalendarDays
                            size={
                              16
                            }
                            className="text-blue-600 dark:text-blue-400"
                          />

                          <p className="font-semibold text-gray-900 dark:text-white">
                            {formatTanggal(
                              l.tanggal
                            )}
                          </p>

                        </div>

                        <span
                          className="
                            self-start
                            sm:self-auto
                            text-xs
                            bg-yellow-100
                            dark:bg-yellow-900
                            text-yellow-800
                            dark:text-yellow-200
                            px-2.5
                            py-1
                            rounded-full
                          "
                        >
                          {l.status ||
                            '-'}
                        </span>

                      </div>

                      <div className="mt-3">

                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Kegiatan
                        </p>

                        <p className="font-medium text-gray-800 dark:text-gray-200">
                          {l.kegiatan ||
                            '-'}
                        </p>

                      </div>

                      {l.keterangan && (
                        <div className="mt-3">

                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Keterangan
                          </p>

                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {
                              l.keterangan
                            }
                          </p>

                        </div>
                      )}

                      {l.foto && (
                        <div className="mt-4">

                          <a
                            href={
                              l.foto
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="
                              inline-block
                              bg-blue-600
                              text-white
                              text-xs
                              px-3
                              py-1.5
                              rounded
                              hover:bg-blue-700
                              transition
                            "
                          >
                            Lihat Foto
                          </a>

                        </div>
                      )}

                    </div>
                  )
                )}

              </div>

              {/* PAGINATION */}

              <div
                className="
                  flex
                  flex-col
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                  gap-4
                  mt-6
                  pt-5
                  border-t
                  border-gray-200
                  dark:border-gray-700
                "
              >

                {/* INFO */}

                <p className="text-sm text-gray-500 dark:text-gray-400">

                  Menampilkan{' '}
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {
                      startItem
                    }
                  </span>

                  {' - '}

                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {
                      endItem
                    }
                  </span>

                  {' dari '}

                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {
                      filteredLaporan.length
                    }
                  </span>

                  {' laporan'}

                </p>

                {/* BUTTON PAGINATION */}

                <div className="flex items-center gap-2">

                  <button
                    type="button"
                    disabled={
                      currentPage ===
                      1
                    }
                    onClick={() =>
                      setCurrentPage(
                        (
                          page
                        ) =>
                          Math.max(
                            page -
                              1,
                            1
                          )
                      )
                    }
                    className="
                      inline-flex
                      items-center
                      gap-1
                      px-3
                      py-2
                      border
                      border-gray-300
                      dark:border-gray-600
                      rounded-lg
                      text-sm
                      text-gray-700
                      dark:text-gray-200
                      hover:bg-gray-100
                      dark:hover:bg-gray-700
                      disabled:opacity-40
                      disabled:cursor-not-allowed
                    "
                  >
                    <ChevronLeft
                      size={
                        16
                      }
                    />

                    Sebelumnya
                  </button>

                  {/* NOMOR HALAMAN */}

                  <div className="hidden md:flex items-center gap-1">

                    {Array.from(
                      {
                        length:
                          totalPages,
                      },
                      (
                        _,
                        index
                      ) =>
                        index +
                        1
                    ).map(
                      (
                        page
                      ) => (
                        <button
                          key={
                            page
                          }
                          type="button"
                          onClick={() =>
                            setCurrentPage(
                              page
                            )
                          }
                          className={`
                            min-w-9
                            h-9
                            px-2
                            rounded-lg
                            text-sm
                            font-medium
                            transition
                            ${
                              currentPage ===
                              page
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }
                          `}
                        >
                          {
                            page
                          }
                        </button>
                      )
                    )}

                  </div>

                  {/* MOBILE PAGE */}

                  <div className="md:hidden px-3 text-sm text-gray-600 dark:text-gray-300">
                    {
                      currentPage
                    }{' '}
                    /{' '}
                    {
                      totalPages
                    }
                  </div>

                  <button
                    type="button"
                    disabled={
                      currentPage ===
                      totalPages
                    }
                    onClick={() =>
                      setCurrentPage(
                        (
                          page
                        ) =>
                          Math.min(
                            page +
                              1,
                            totalPages
                          )
                      )
                    }
                    className="
                      inline-flex
                      items-center
                      gap-1
                      px-3
                      py-2
                      border
                      border-gray-300
                      dark:border-gray-600
                      rounded-lg
                      text-sm
                      text-gray-700
                      dark:text-gray-200
                      hover:bg-gray-100
                      dark:hover:bg-gray-700
                      disabled:opacity-40
                      disabled:cursor-not-allowed
                    "
                  >
                    Berikutnya

                    <ChevronRight
                      size={
                        16
                      }
                    />
                  </button>

                </div>

              </div>
            </>
          ) : laporan.length >
            0 ? (
            /*
            | ADA LAPORAN TAPI FILTER KOSONG
            */

            <div className="text-center py-10">

              <Filter
                size={34}
                className="mx-auto text-gray-400 mb-3"
              />

              <p className="font-medium text-gray-700 dark:text-gray-200">
                Tidak ada laporan
                pada filter ini
              </p>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Pilih bulan lain
                atau tampilkan semua
                laporan.
              </p>

              <button
                onClick={() =>
                  setFilterBulan(
                    ''
                  )
                }
                className="mt-3 text-blue-600 dark:text-blue-400 text-sm hover:underline"
              >
                Tampilkan Semua
                Laporan
              </button>

            </div>
          ) : (
            /*
            | BELUM ADA LAPORAN
            */

            <div className="text-center py-10">

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Belum ada laporan
                harian.
              </p>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}