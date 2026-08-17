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
} from 'firebase/firestore';

import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Clock,
  FolderKanban,
  GraduationCap,
  User,
  UserRoundCheck,
} from 'lucide-react';

/*
|--------------------------------------------------------------------------
| INTERFACE
|--------------------------------------------------------------------------
*/

interface MonitoringData {
  id: string;

  pembimbingId: string;
  siswaId: string;
  perusahaanId: string;

  tanggal: string;
  waktu?: string;

  jenisMonitoring?: string;

  progressProject?: number;

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
  nisn?: string;
  email?: string;

  [key: string]: any;
}

interface PerusahaanData {
  id: string;

  nama?: string;
  alamat?: string;
  bidang?: string;

  [key: string]: any;
}

interface PembimbingData {
  id: string;

  nama?: string;
  nip?: string;
  email?: string;
  noHp?: string;

  [key: string]: any;
}

/*
|--------------------------------------------------------------------------
| KRITERIA
|--------------------------------------------------------------------------
*/

const criteriaLabels: Record<
  string,
  string
> = {
  kedisiplinan:
    'Kedisiplinan',

  sikapEtika:
    'Sikap & Etika Kerja',

  tanggungJawab:
    'Tanggung Jawab',

  kemampuanTeknis:
    'Kemampuan Teknis',

  komunikasi:
    'Komunikasi',

  kerjaSama:
    'Kerja Sama',

  perkembanganKompetensi:
    'Perkembangan Kompetensi',
};

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function DetailMonitoringKepsekPage() {
  const params =
    useParams();

  const router =
    useRouter();

  const id =
    Array.isArray(
      params.id
    )
      ? params.id[0]
      : (params.id as string);

  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [
    monitoring,
    setMonitoring,
  ] =
    useState<MonitoringData | null>(
      null
    );

  const [
    siswa,
    setSiswa,
  ] =
    useState<SiswaData | null>(
      null
    );

  const [
    perusahaan,
    setPerusahaan,
  ] =
    useState<PerusahaanData | null>(
      null
    );

  const [
    pembimbing,
    setPembimbing,
  ] =
    useState<PembimbingData | null>(
      null
    );

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
  | FETCH DETAIL
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let cancelled =
      false;

    const fetchDetail =
      async () => {
        try {
          setLoading(true);
          setError('');

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

          if (
            !monitoringDoc.exists()
          ) {
            if (!cancelled) {
              setError(
                'Data monitoring tidak ditemukan.'
              );
            }

            return;
          }

          const monitoringData =
            {
              id:
                monitoringDoc.id,

              ...monitoringDoc.data(),
            } as MonitoringData;

          if (!cancelled) {
            setMonitoring(
              monitoringData
            );
          }

          /*
          |--------------------------------------------------------------------------
          | AMBIL RELASI SECARA PARALEL
          |--------------------------------------------------------------------------
          */

          const siswaPromise =
            monitoringData.siswaId
              ? getDoc(
                  doc(
                    db,
                    'siswa',
                    monitoringData.siswaId
                  )
                )
              : Promise.resolve(
                  null
                );

          const perusahaanPromise =
            monitoringData.perusahaanId
              ? getDoc(
                  doc(
                    db,
                    'perusahaan',
                    monitoringData.perusahaanId
                  )
                )
              : Promise.resolve(
                  null
                );

          const pembimbingPromise =
            monitoringData.pembimbingId
              ? getDoc(
                  doc(
                    db,
                    'pembimbing',
                    monitoringData.pembimbingId
                  )
                )
              : Promise.resolve(
                  null
                );

          const [
            siswaDoc,
            perusahaanDoc,
            pembimbingDoc,
          ] =
            await Promise.all([
              siswaPromise,
              perusahaanPromise,
              pembimbingPromise,
            ]);

          /*
          |--------------------------------------------------------------------------
          | SISWA
          |--------------------------------------------------------------------------
          */

          if (
            !cancelled &&
            siswaDoc &&
            siswaDoc.exists()
          ) {
            setSiswa({
              id:
                siswaDoc.id,

              ...siswaDoc.data(),
            });
          }

          /*
          |--------------------------------------------------------------------------
          | PERUSAHAAN
          |--------------------------------------------------------------------------
          */

          if (
            !cancelled &&
            perusahaanDoc &&
            perusahaanDoc.exists()
          ) {
            setPerusahaan({
              id:
                perusahaanDoc.id,

              ...perusahaanDoc.data(),
            });
          }

          /*
          |--------------------------------------------------------------------------
          | PEMBIMBING
          |--------------------------------------------------------------------------
          */

          if (
            !cancelled &&
            pembimbingDoc &&
            pembimbingDoc.exists()
          ) {
            setPembimbing({
              id:
                pembimbingDoc.id,

              ...pembimbingDoc.data(),
            });
          }
        } catch (err) {
          console.error(
            'Gagal mengambil detail monitoring Kepala Sekolah:',
            err
          );

          if (!cancelled) {
            setError(
              'Terjadi kesalahan saat mengambil data monitoring.'
            );
          }
        } finally {
          if (!cancelled) {
            setLoading(
              false
            );
          }
        }
      };

    if (id) {
      fetchDetail();
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  /*
  |--------------------------------------------------------------------------
  | NILAI
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
          dark:bg-green-950
          dark:text-green-300
        `;

      case 3:
        return `
          bg-blue-100
          text-blue-700
          dark:bg-blue-950
          dark:text-blue-300
        `;

      case 2:
        return `
          bg-yellow-100
          text-yellow-700
          dark:bg-yellow-950
          dark:text-yellow-300
        `;

      case 1:
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
        return (
          status || '-'
        );
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
  | TANGGAL
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
        Number(
          match[1]
        ),
        Number(
          match[2]
        ) - 1,
        Number(
          match[3]
        )
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
  | PROGRESS
  |--------------------------------------------------------------------------
  */

  const hasProgress =
    typeof monitoring
      ?.progressProject ===
    'number';

  const progressProject =
    hasProgress
      ? Math.min(
          Math.max(
            monitoring!
              .progressProject!,
            0
          ),
          100
        )
      : 0;

  const progressLabel = (
    progress?: number
  ) => {
    if (
      progress ===
        undefined ||
      progress === null
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

  const progressBadgeClass = (
    progress?: number
  ) => {
    if (
      progress ===
        undefined ||
      progress === null
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
      <div className="min-h-[400px] flex items-center justify-center">

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

          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Memuat detail monitoring...
          </p>

        </div>

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
          type="button"
          onClick={() =>
            router.push(
              '/kepsek/monitoring'
            )
          }
          className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ArrowLeft
            size={16}
          />

          Kembali
        </button>

        <div className="bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 p-4 rounded-xl">
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
    <div
      className="
        max-w-7xl
        mx-auto
        space-y-6
      "
    >

      {/* ================================================================
          BACK
      ================================================================= */}

      <button
        type="button"
        onClick={() =>
          router.push(
            '/kepsek/monitoring'
          )
        }
        className="
          flex
          items-center
          gap-2
          text-blue-600
          dark:text-blue-400
          hover:underline
        "
      >
        <ArrowLeft
          size={16}
        />

        Kembali ke Monitoring
      </button>

      {/* ================================================================
          HEADER
      ================================================================= */}

      <div
        className="
          flex
          flex-col
          md:flex-row
          md:items-center
          md:justify-between
          gap-4
        "
      >

        <div className="flex items-center gap-3">

          <div
            className="
              w-12
              h-12
              flex
              items-center
              justify-center
              rounded-xl
              bg-blue-100
              dark:bg-blue-950
            "
          >
            <ClipboardCheck
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
              Detail Monitoring PKL
            </h1>

            <p
              className="
                text-sm
                text-gray-500
                dark:text-gray-400
                mt-1
              "
            >
              Detail hasil monitoring siswa oleh pembimbing.
            </p>

          </div>

        </div>

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

      </div>

      {/* ================================================================
          IDENTITAS
      ================================================================= */}

      <div
        className="
          grid
          lg:grid-cols-3
          gap-6
        "
      >

        {/* SISWA */}

        <div
          className="
            bg-white
            dark:bg-gray-900
            rounded-2xl
            shadow-sm
            border
            border-gray-200
            dark:border-gray-800
            p-6
          "
        >

          <div className="flex items-center gap-2 mb-5">

            <User
              className="
                text-blue-600
                dark:text-blue-400
              "
            />

            <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
              Data Siswa
            </h2>

          </div>

          <div className="space-y-4 text-sm">

            <div>

              <p className="text-gray-500 dark:text-gray-400">
                Nama
              </p>

              <p className="font-medium text-gray-900 dark:text-white mt-1">
                {siswa?.nama ||
                  '-'}
              </p>

            </div>

            <div>

              <p className="text-gray-500 dark:text-gray-400">
                Kelas
              </p>

              <p className="font-medium text-gray-900 dark:text-white mt-1">
                {siswa?.kelas ||
                  '-'}
              </p>

            </div>

            <div>

              <p className="text-gray-500 dark:text-gray-400">
                Jurusan
              </p>

              <p className="font-medium text-gray-900 dark:text-white mt-1">
                {siswa?.jurusan ||
                  '-'}
              </p>

            </div>

            {siswa?.nisn && (
              <div>

                <p className="text-gray-500 dark:text-gray-400">
                  NISN
                </p>

                <p className="font-medium text-gray-900 dark:text-white mt-1">
                  {siswa.nisn}
                </p>

              </div>
            )}

          </div>

        </div>

        {/* PERUSAHAAN */}

        <div
          className="
            bg-white
            dark:bg-gray-900
            rounded-2xl
            shadow-sm
            border
            border-gray-200
            dark:border-gray-800
            p-6
          "
        >

          <div className="flex items-center gap-2 mb-5">

            <Building2
              className="
                text-green-600
                dark:text-green-400
              "
            />

            <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
              Tempat PKL
            </h2>

          </div>

          <div className="space-y-4 text-sm">

            <div>

              <p className="text-gray-500 dark:text-gray-400">
                Perusahaan
              </p>

              <p className="font-medium text-gray-900 dark:text-white mt-1">
                {perusahaan?.nama ||
                  '-'}
              </p>

            </div>

            <div>

              <p className="text-gray-500 dark:text-gray-400">
                Bidang
              </p>

              <p className="font-medium text-gray-900 dark:text-white mt-1">
                {perusahaan?.bidang ||
                  '-'}
              </p>

            </div>

            <div>

              <p className="text-gray-500 dark:text-gray-400">
                Alamat
              </p>

              <p className="font-medium text-gray-900 dark:text-white mt-1">
                {perusahaan?.alamat ||
                  '-'}
              </p>

            </div>

          </div>

        </div>

        {/* PEMBIMBING */}

        <div
          className="
            bg-white
            dark:bg-gray-900
            rounded-2xl
            shadow-sm
            border
            border-gray-200
            dark:border-gray-800
            p-6
          "
        >

          <div className="flex items-center gap-2 mb-5">

            <UserRoundCheck
              className="
                text-purple-600
                dark:text-purple-400
              "
            />

            <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
              Pembimbing
            </h2>

          </div>

          <div className="space-y-4 text-sm">

            <div>

              <p className="text-gray-500 dark:text-gray-400">
                Nama Pembimbing
              </p>

              <p className="font-medium text-gray-900 dark:text-white mt-1">
                {pembimbing?.nama ||
                  '-'}
              </p>

            </div>

            {pembimbing?.nip && (
              <div>

                <p className="text-gray-500 dark:text-gray-400">
                  NIP
                </p>

                <p className="font-medium text-gray-900 dark:text-white mt-1">
                  {pembimbing.nip}
                </p>

              </div>
            )}

            {pembimbing?.email && (
              <div>

                <p className="text-gray-500 dark:text-gray-400">
                  Email
                </p>

                <p className="font-medium text-gray-900 dark:text-white mt-1 break-all">
                  {pembimbing.email}
                </p>

              </div>
            )}

          </div>

        </div>

      </div>

      {/* ================================================================
          PELAKSANAAN
      ================================================================= */}

      <div
        className="
          bg-white
          dark:bg-gray-900
          rounded-2xl
          shadow-sm
          border
          border-gray-200
          dark:border-gray-800
          p-6
        "
      >

        <h2 className="font-semibold text-lg mb-5 text-gray-900 dark:text-white">
          Pelaksanaan Monitoring
        </h2>

        <div
          className="
            grid
            sm:grid-cols-2
            lg:grid-cols-3
            gap-5
          "
        >

          <div className="flex items-start gap-3">

            <CalendarDays
              size={20}
              className="text-blue-600 dark:text-blue-400 mt-1"
            />

            <div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tanggal Monitoring
              </p>

              <p className="font-medium text-gray-900 dark:text-white mt-1">
                {formatTanggal(
                  monitoring.tanggal
                )}
              </p>

            </div>

          </div>

          <div className="flex items-start gap-3">

            <Clock
              size={20}
              className="text-blue-600 dark:text-blue-400 mt-1"
            />

            <div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Waktu
              </p>

              <p className="font-medium text-gray-900 dark:text-white mt-1">
                {monitoring.waktu ||
                  '-'}
              </p>

            </div>

          </div>

          <div className="flex items-start gap-3">

            <ClipboardCheck
              size={20}
              className="text-blue-600 dark:text-blue-400 mt-1"
            />

            <div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Jenis Monitoring
              </p>

              <p className="font-medium text-gray-900 dark:text-white mt-1">
                {jenisMonitoringLabel(
                  monitoring.jenisMonitoring
                )}
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* ================================================================
          PROGRESS PROJECT
      ================================================================= */}

      <div
        className="
          bg-white
          dark:bg-gray-900
          rounded-2xl
          shadow-sm
          border
          border-gray-200
          dark:border-gray-800
          p-6
        "
      >

        <div
          className="
            flex
            flex-col
            sm:flex-row
            sm:items-center
            sm:justify-between
            gap-4
            mb-6
          "
        >

          <div className="flex items-start gap-3">

            <div
              className="
                bg-purple-100
                dark:bg-purple-950
                p-3
                rounded-xl
              "
            >
              <FolderKanban
                className="
                  text-purple-600
                  dark:text-purple-300
                "
              />
            </div>

            <div>

              <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
                Progress Project Akhir PKL
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Progress project pada saat monitoring dilakukan.
              </p>

            </div>

          </div>

          <div className="flex items-center gap-3">

            <span
              className={`
                px-3
                py-1.5
                rounded-full
                text-sm
                font-medium
                ${progressBadgeClass(
                  monitoring.progressProject
                )}
              `}
            >
              {progressLabel(
                monitoring.progressProject
              )}
            </span>

            {hasProgress && (
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {progressProject}%
              </span>
            )}

          </div>

        </div>

        {hasProgress ? (
          <>
            <div
              className="
                w-full
                h-4
                bg-gray-200
                dark:bg-gray-800
                rounded-full
                overflow-hidden
              "
            >

              <div
                style={{
                  width:
                    `${progressProject}%`,
                }}
                className={`
                  h-full
                  rounded-full
                  transition-all
                  ${progressBarClass(
                    progressProject
                  )}
                `}
              />

            </div>

            <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">

              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>

            </div>
          </>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-sm text-gray-500 dark:text-gray-400">
            Progress project belum dicatat pada monitoring ini.
          </div>
        )}

      </div>

      {/* ================================================================
          PENILAIAN
      ================================================================= */}

      <div
        className="
          bg-white
          dark:bg-gray-900
          rounded-2xl
          shadow-sm
          border
          border-gray-200
          dark:border-gray-800
          p-6
        "
      >

        <div
          className="
            flex
            flex-col
            sm:flex-row
            sm:items-center
            sm:justify-between
            gap-4
            mb-6
          "
        >

          <div className="flex items-center gap-3">

            <GraduationCap
              className="
                text-blue-600
                dark:text-blue-400
              "
            />

            <div>

              <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
                Penilaian Perkembangan
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Hasil penilaian pembimbing pada setiap kriteria.
              </p>

            </div>

          </div>

          {rataRata > 0 && (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-2">

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

        <div
          className="
            grid
            md:grid-cols-2
            gap-4
          "
        >

          {Object.entries(
            criteriaLabels
          ).map(
            ([
              key,
              label,
            ]) => {
              const nilai =
                monitoring
                  .kriteria?.[
                    key as keyof typeof monitoring.kriteria
                  ];

              return (
                <div
                  key={key}
                  className="
                    flex
                    items-center
                    justify-between
                    gap-4
                    border
                    border-gray-200
                    dark:border-gray-800
                    rounded-xl
                    p-4
                  "
                >

                  <div>

                    <p className="font-medium text-gray-900 dark:text-white">
                      {label}
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

      {/* ================================================================
          CATATAN
      ================================================================= */}

      <div
        className="
          bg-white
          dark:bg-gray-900
          rounded-2xl
          shadow-sm
          border
          border-gray-200
          dark:border-gray-800
          p-6
        "
      >

        <h2 className="font-semibold text-lg mb-5 text-gray-900 dark:text-white">
          Catatan Monitoring
        </h2>

        <div className="space-y-6">

          <div>

            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Deskripsi Perkembangan
            </h3>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">
              {monitoring.deskripsiPerkembangan ||
                '-'}
            </div>

          </div>

          <div>

            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Kendala / Permasalahan
            </h3>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">
              {monitoring.kendala ||
                'Tidak ada kendala yang dicatat.'}
            </div>

          </div>

          <div>

            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Tindak Lanjut / Saran
            </h3>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">
              {monitoring.tindakLanjut ||
                'Belum ada tindak lanjut.'}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}