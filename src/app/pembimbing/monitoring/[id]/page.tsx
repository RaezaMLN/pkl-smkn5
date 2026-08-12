'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { db } from '@/lib/firebase';

import {
  deleteDoc,
  doc,
  getDoc,
} from 'firebase/firestore';

import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Clock,
  Pencil,
  Trash2,
  User,
} from 'lucide-react';

import {
  AnimatePresence,
  motion,
} from 'framer-motion';

interface MonitoringData {
  id: string;
  pembimbingId: string;
  siswaId: string;
  perusahaanId: string;

  tanggal: string;
  waktu?: string;

  jenisMonitoring?: string;

  kriteria?: {
    kedisiplinan?: number;
    sikapEtika?: number;
    tanggungJawab?: number;
    kemampuanTeknis?: number;
    komunikasi?: number;
    kerjaSama?: number;
    perkembanganKompetensi?: number;
  };

  deskripsiPerkembangan?: string;
  kendala?: string;
  tindakLanjut?: string;

  statusPerkembangan?: string;

  [key: string]: any;
}

interface SiswaData {
  id: string;
  nama?: string;
  kelas?: string;
  jurusan?: string;
  email?: string;
  nisn?: string;

  [key: string]: any;
}

interface PerusahaanData {
  id: string;
  nama?: string;
  alamat?: string;
  bidang?: string;

  [key: string]: any;
}

const criteriaLabels: Record<string, string> = {
  kedisiplinan: 'Kedisiplinan',
  sikapEtika: 'Sikap & Etika Kerja',
  tanggungJawab: 'Tanggung Jawab',
  kemampuanTeknis: 'Kemampuan Teknis',
  komunikasi: 'Komunikasi',
  kerjaSama: 'Kerja Sama',
  perkembanganKompetensi: 'Perkembangan Kompetensi',
};

export default function DetailMonitoringPage() {
  const params = useParams();
  const router = useRouter();

  const id = Array.isArray(params.id)
    ? params.id[0]
    : (params.id as string);

  const [monitoring, setMonitoring] =
    useState<MonitoringData | null>(null);

  const [siswa, setSiswa] =
    useState<SiswaData | null>(null);

  const [perusahaan, setPerusahaan] =
    useState<PerusahaanData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  /*
  |--------------------------------------------------------------------------
  | DELETE
  |--------------------------------------------------------------------------
  */

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [deleteError, setDeleteError] =
    useState('');

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
  | FETCH DETAIL
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError('');

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
        | MONITORING
        |--------------------------------------------------------------------------
        */

        const monitoringDoc =
          await getDoc(
            doc(
              db,
              'monitoring',
              id
            )
          );

        if (!monitoringDoc.exists()) {
          setError(
            'Data monitoring tidak ditemukan.'
          );

          return;
        }

        const monitoringData = {
          id: monitoringDoc.id,
          ...monitoringDoc.data(),
        } as MonitoringData;

        /*
        |--------------------------------------------------------------------------
        | CEK KEPEMILIKAN
        |--------------------------------------------------------------------------
        */

        if (
          monitoringData.pembimbingId !==
          pembimbing.id
        ) {
          setError(
            'Anda tidak memiliki akses ke data monitoring ini.'
          );

          return;
        }

        setMonitoring(
          monitoringData
        );

        /*
        |--------------------------------------------------------------------------
        | SISWA
        |--------------------------------------------------------------------------
        */

        if (
          monitoringData.siswaId
        ) {
          const siswaDoc =
            await getDoc(
              doc(
                db,
                'siswa',
                monitoringData.siswaId
              )
            );

          if (
            siswaDoc.exists()
          ) {
            setSiswa({
              id: siswaDoc.id,
              ...siswaDoc.data(),
            });
          }
        }

        /*
        |--------------------------------------------------------------------------
        | PERUSAHAAN
        |--------------------------------------------------------------------------
        */

        if (
          monitoringData.perusahaanId
        ) {
          const perusahaanDoc =
            await getDoc(
              doc(
                db,
                'perusahaan',
                monitoringData.perusahaanId
              )
            );

          if (
            perusahaanDoc.exists()
          ) {
            setPerusahaan({
              id: perusahaanDoc.id,
              ...perusahaanDoc.data(),
            });
          }
        }
      } catch (err) {
        console.error(
          'Gagal mengambil detail monitoring:',
          err
        );

        setError(
          'Terjadi kesalahan saat mengambil data monitoring.'
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
  | DELETE MONITORING
  |--------------------------------------------------------------------------
  */

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setDeleteError('');

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
      | Ambil ulang sebelum delete
      */

      const monitoringRef =
        doc(
          db,
          'monitoring',
          id
        );

      const monitoringSnap =
        await getDoc(
          monitoringRef
        );

      if (!monitoringSnap.exists()) {
        setDeleteError(
          'Data monitoring sudah tidak tersedia.'
        );

        return;
      }

      const data =
        monitoringSnap.data();

      /*
      | Cek ownership lagi
      */

      if (
        data.pembimbingId !==
        pembimbing.id
      ) {
        setDeleteError(
          'Anda tidak memiliki izin menghapus monitoring ini.'
        );

        return;
      }

      await deleteDoc(
        monitoringRef
      );

      router.replace(
        '/pembimbing/monitoring'
      );
    } catch (err) {
      console.error(
        'Gagal menghapus monitoring:',
        err
      );

      setDeleteError(
        'Monitoring gagal dihapus. Silakan coba kembali.'
      );
    } finally {
      setDeleting(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | HELPER NILAI
  |--------------------------------------------------------------------------
  */

  const nilaiLabel = (
    nilai?: number
  ) => {
    switch (nilai) {
      case 4:
        return 'Sangat Baik';

      case 3:
        return 'Baik';

      case 2:
        return 'Cukup';

      case 1:
        return 'Kurang';

      default:
        return '-';
    }
  };

  const nilaiClass = (
    nilai?: number
  ) => {
    switch (nilai) {
      case 4:
        return `
          bg-green-100
          text-green-700
          dark:bg-green-900
          dark:text-green-200
        `;

      case 3:
        return `
          bg-blue-100
          text-blue-700
          dark:bg-blue-900
          dark:text-blue-200
        `;

      case 2:
        return `
          bg-yellow-100
          text-yellow-700
          dark:bg-yellow-900
          dark:text-yellow-200
        `;

      case 1:
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
  | JENIS MONITORING
  |--------------------------------------------------------------------------
  */

  const jenisMonitoringLabel = (
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

    let date: Date;

    if (match) {
      date = new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3])
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
  | RATA-RATA
  |--------------------------------------------------------------------------
  */

  const rataRata =
    useMemo(() => {
      if (
        !monitoring?.kriteria
      ) {
        return 0;
      }

      const values =
        Object.values(
          monitoring.kriteria
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
    }, [monitoring]);

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="text-center py-10">
        Loading...
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">

        <button
          onClick={() =>
            router.push(
              '/pembimbing/monitoring'
            )
          }
          className="flex items-center gap-2 mb-4 text-blue-600 hover:underline"
        >
          <ArrowLeft
            size={16}
          />

          Kembali
        </button>

        <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded-xl">
          {error}
        </div>

      </div>
    );
  }

  if (!monitoring) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <div className="max-w-6xl mx-auto">

        {/* ==========================================================
            BACK
        ========================================================== */}

        <button
          onClick={() =>
            router.push(
              '/pembimbing/monitoring'
            )
          }
          className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ArrowLeft
            size={16}
          />

          Kembali ke Monitoring
        </button>

        {/* ==========================================================
            HEADER
        ========================================================== */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">

          <div className="flex items-center gap-3">

            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-xl">

              <ClipboardCheck className="text-blue-600 dark:text-blue-300" />

            </div>

            <div>

              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Detail Monitoring PKL
              </h1>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Detail hasil monitoring perkembangan siswa.
              </p>

            </div>

          </div>

          <div className="flex flex-wrap items-center gap-3">

            <span
              className={`
                px-3
                py-1.5
                rounded-full
                text-sm
                font-medium
                ${statusClass(
                  monitoring.statusPerkembangan
                )}
              `}
            >
              {statusLabel(
                monitoring.statusPerkembangan
              )}
            </span>

            {/* EDIT */}

            <button
              onClick={() =>
                router.push(
                  `/pembimbing/monitoring/${id}/edit`
                )
              }
              className="
                inline-flex
                items-center
                gap-2
                px-4
                py-2
                bg-blue-600
                hover:bg-blue-700
                text-white
                rounded-lg
                transition
              "
            >
              <Pencil
                size={17}
              />

              Edit
            </button>

            {/* DELETE */}

            <button
              onClick={() => {
                setDeleteError('');
                setShowDeleteModal(
                  true
                );
              }}
              className="
                inline-flex
                items-center
                gap-2
                px-4
                py-2
                bg-red-600
                hover:bg-red-700
                text-white
                rounded-lg
                transition
              "
            >
              <Trash2
                size={17}
              />

              Hapus
            </button>

          </div>

        </div>

        {/* ==========================================================
            SISWA + PKL
        ========================================================== */}

        <div className="grid lg:grid-cols-2 gap-6 mb-6">

          {/* SISWA */}

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6">

            <div className="flex items-center gap-2 mb-5">

              <User className="text-blue-600 dark:text-blue-400" />

              <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
                Data Siswa
              </h2>

            </div>

            <div className="space-y-3 text-sm">

              <div>
                <p className="text-gray-500 dark:text-gray-400">
                  Nama
                </p>

                <p className="font-medium text-gray-900 dark:text-white">
                  {siswa?.nama ||
                    '-'}
                </p>
              </div>

              <div>
                <p className="text-gray-500 dark:text-gray-400">
                  Kelas
                </p>

                <p className="font-medium text-gray-900 dark:text-white">
                  {siswa?.kelas ||
                    '-'}
                </p>
              </div>

              <div>
                <p className="text-gray-500 dark:text-gray-400">
                  Jurusan
                </p>

                <p className="font-medium text-gray-900 dark:text-white">
                  {siswa?.jurusan ||
                    '-'}
                </p>
              </div>

              {siswa?.nisn && (
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

          {/* PKL */}

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6">

            <div className="flex items-center gap-2 mb-5">

              <Building2 className="text-green-600 dark:text-green-400" />

              <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
                Data PKL
              </h2>

            </div>

            <div className="space-y-3 text-sm">

              <div>
                <p className="text-gray-500 dark:text-gray-400">
                  Tempat PKL
                </p>

                <p className="font-medium text-gray-900 dark:text-white">
                  {perusahaan?.nama ||
                    '-'}
                </p>
              </div>

              <div>
                <p className="text-gray-500 dark:text-gray-400">
                  Bidang
                </p>

                <p className="font-medium text-gray-900 dark:text-white">
                  {perusahaan?.bidang ||
                    '-'}
                </p>
              </div>

              <div>
                <p className="text-gray-500 dark:text-gray-400">
                  Alamat
                </p>

                <p className="font-medium text-gray-900 dark:text-white">
                  {perusahaan?.alamat ||
                    '-'}
                </p>
              </div>

            </div>

          </div>

        </div>

        {/* ==========================================================
            PELAKSANAAN
        ========================================================== */}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 mb-6">

          <h2 className="font-semibold text-lg mb-5 text-gray-900 dark:text-white">
            Pelaksanaan Monitoring
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">

            {/* TANGGAL */}

            <div className="flex items-start gap-3">

              <CalendarDays
                size={20}
                className="text-blue-600 dark:text-blue-400 mt-1"
              />

              <div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tanggal Monitoring
                </p>

                <p className="font-medium text-gray-900 dark:text-white">
                  {formatTanggal(
                    monitoring.tanggal
                  )}
                </p>

              </div>

            </div>

            {/* WAKTU */}

            <div className="flex items-start gap-3">

              <Clock
                size={20}
                className="text-blue-600 dark:text-blue-400 mt-1"
              />

              <div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Waktu
                </p>

                <p className="font-medium text-gray-900 dark:text-white">
                  {monitoring.waktu ||
                    '-'}
                </p>

              </div>

            </div>

            {/* JENIS */}

            <div className="flex items-start gap-3">

              <ClipboardCheck
                size={20}
                className="text-blue-600 dark:text-blue-400 mt-1"
              />

              <div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Jenis Monitoring
                </p>

                <p className="font-medium text-gray-900 dark:text-white">
                  {jenisMonitoringLabel(
                    monitoring.jenisMonitoring
                  )}
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* ==========================================================
            PENILAIAN
        ========================================================== */}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 mb-6">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">

            <div>

              <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
                Penilaian Perkembangan
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Hasil penilaian pada setiap kriteria monitoring.
              </p>

            </div>

            {rataRata >
              0 && (
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Rata-rata Nilai
                </p>

                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {rataRata.toFixed(
                    2
                  )}{' '}
                  / 4
                </p>

              </div>
            )}

          </div>

          <div className="grid md:grid-cols-2 gap-4">

            {Object.entries(
              criteriaLabels
            ).map(
              ([
                key,
                label,
              ]) => {
                const nilai =
                  monitoring.kriteria?.[
                    key as keyof typeof monitoring.kriteria
                  ];

                return (
                  <div
                    key={
                      key
                    }
                    className="flex items-center justify-between gap-4 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >

                    <div>

                      <p className="font-medium text-gray-900 dark:text-white">
                        {
                          label
                        }
                      </p>

                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Nilai:{' '}
                        {nilai ||
                          '-'}{' '}
                        / 4
                      </p>

                    </div>

                    <span
                      className={`
                        text-xs
                        font-medium
                        px-3
                        py-1.5
                        rounded-full
                        ${nilaiClass(
                          nilai
                        )}
                      `}
                    >
                      {nilaiLabel(
                        nilai
                      )}
                    </span>

                  </div>
                );
              }
            )}

          </div>

        </div>

        {/* ==========================================================
            CATATAN
        ========================================================== */}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6">

          <h2 className="font-semibold text-lg mb-5 text-gray-900 dark:text-white">
            Catatan Monitoring
          </h2>

          <div className="space-y-6">

            {/* PERKEMBANGAN */}

            <div>

              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Deskripsi Perkembangan
              </h3>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">
                {monitoring.deskripsiPerkembangan ||
                  '-'}
              </div>

            </div>

            {/* KENDALA */}

            <div>

              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Kendala / Permasalahan
              </h3>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">
                {monitoring.kendala ||
                  'Tidak ada kendala yang dicatat.'}
              </div>

            </div>

            {/* TINDAK LANJUT */}

            <div>

              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Tindak Lanjut / Saran
              </h3>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">
                {monitoring.tindakLanjut ||
                  'Belum ada tindak lanjut.'}
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ================================================================
          MODAL HAPUS
      ================================================================= */}

      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="
              fixed
              inset-0
              z-50
              bg-black/50
              flex
              items-center
              justify-center
              p-4
            "
          >

            <motion.div
              initial={{
                scale: 0.95,
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              exit={{
                scale: 0.95,
                opacity: 0,
              }}
              className="
                w-full
                max-w-md
                bg-white
                dark:bg-gray-800
                rounded-2xl
                shadow-xl
                p-6
              "
            >

              <div className="flex items-center justify-center mb-4">

                <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full">

                  <AlertTriangle className="text-red-600 dark:text-red-300" />

                </div>

              </div>

              <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-white">
                Hapus Monitoring?
              </h2>

              <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-2">
                Data monitoring{' '}
                <strong>
                  {siswa?.nama ||
                    'siswa'}
                </strong>{' '}
                tanggal{' '}
                <strong>
                  {formatTanggal(
                    monitoring.tanggal
                  )}
                </strong>{' '}
                akan dihapus permanen.
              </p>

              {deleteError && (
                <div className="mt-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-3 rounded-lg text-sm">
                  {deleteError}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">

                <button
                  type="button"
                  disabled={
                    deleting
                  }
                  onClick={() =>
                    setShowDeleteModal(
                      false
                    )
                  }
                  className="
                    px-4
                    py-2
                    border
                    border-gray-300
                    dark:border-gray-600
                    rounded-lg
                    text-gray-700
                    dark:text-gray-200
                    hover:bg-gray-100
                    dark:hover:bg-gray-700
                    disabled:opacity-50
                  "
                >
                  Batal
                </button>

                <button
                  type="button"
                  disabled={
                    deleting
                  }
                  onClick={
                    handleDelete
                  }
                  className="
                    inline-flex
                    items-center
                    gap-2
                    px-4
                    py-2
                    bg-red-600
                    hover:bg-red-700
                    disabled:bg-red-400
                    text-white
                    rounded-lg
                  "
                >
                  <Trash2
                    size={17}
                  />

                  {deleting
                    ? 'Menghapus...'
                    : 'Ya, Hapus'}
                </button>

              </div>

            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}