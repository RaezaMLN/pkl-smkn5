'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  collection,
  getDocs,
} from 'firebase/firestore';

import {
  AlertTriangle,
  Building2,
  ClipboardCheck,
  Copy,
  FileCheck2,
  GraduationCap,
  Send,
  UserCheck,
  Users,
} from 'lucide-react';

import {
  Card,
  CardContent,
} from '@/components/ui/Card';

import { db } from '@/lib/firebase';

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

interface DashboardCounts {
  totalAkunSiswa: number;

  siswaPklValid: number;

  selisihAkun: number;

  kelompokDuplikat: number;

  akunDuplikatLebih: number;

  perusahaan: number;

  pendaftaran: number;

  pengajuanTempatPkl: number;

  monitoring: number;
}

/*
|--------------------------------------------------------------------------
| NORMALISASI NAMA
|--------------------------------------------------------------------------
*/

const normalizeNama = (
  nama?: string
) => {
  return (
    nama || ''
  )
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
};

/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/

const AdminDashboard = () => {
  const [
    counts,
    setCounts,
  ] =
    useState<DashboardCounts>({
      totalAkunSiswa:
        0,

      siswaPklValid:
        0,

      selisihAkun:
        0,

      kelompokDuplikat:
        0,

      akunDuplikatLebih:
        0,

      perusahaan:
        0,

      pendaftaran:
        0,

      pengajuanTempatPkl:
        0,

      monitoring:
        0,
    });

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState('');

  /*
  |--------------------------------------------------------------------------
  | FETCH
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let cancelled =
      false;

    const fetchData =
      async () => {
        try {
          setLoading(
            true
          );

          setError('');

          /*
          |--------------------------------------------------------------------------
          | LOAD SEMUA COLLECTION SECARA PARALEL
          |--------------------------------------------------------------------------
          */

          const [
            siswaSnap,
            perusahaanSnap,
            pendaftaranSnap,
            pengajuanSnap,
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
                  'perusahaan'
                )
              ),

              getDocs(
                collection(
                  db,
                  'pendaftaran'
                )
              ),

              getDocs(
                collection(
                  db,
                  'pengajuan-tempat-pkl'
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
          | SEMUA ID SISWA
          |--------------------------------------------------------------------------
          */

          const semuaSiswaIds =
            new Set(
              siswaSnap.docs.map(
                (item) =>
                  item.id
              )
            );

          /*
          |--------------------------------------------------------------------------
          | SISWA YANG BENAR-BENAR TERDAFTAR PKL
          |--------------------------------------------------------------------------
          |
          | Ambil siswa_terdaftar dari seluruh perusahaan.
          | Set digunakan supaya satu siswa tidak terhitung lebih dari sekali.
          |
          |--------------------------------------------------------------------------
          */

          const siswaPklIds =
            new Set<string>();

          perusahaanSnap.docs.forEach(
            (perusahaanDoc) => {
              const data =
                perusahaanDoc.data();

              const siswaTerdaftar =
                Array.isArray(
                  data.siswa_terdaftar
                )
                  ? data.siswa_terdaftar
                  : [];

              siswaTerdaftar.forEach(
                (
                  siswaId: unknown
                ) => {
                  if (
                    typeof siswaId !==
                    'string'
                  ) {
                    return;
                  }

                  /*
                  |--------------------------------------------------------------------------
                  | HANYA HITUNG JIKA DOKUMEN SISWA MASIH ADA
                  |--------------------------------------------------------------------------
                  */

                  if (
                    semuaSiswaIds.has(
                      siswaId
                    )
                  ) {
                    siswaPklIds.add(
                      siswaId
                    );
                  }
                }
              );
            }
          );

          /*
          |--------------------------------------------------------------------------
          | DETEKSI NAMA DUPLIKAT
          |--------------------------------------------------------------------------
          */

          const namaCount =
            new Map<
              string,
              number
            >();

          siswaSnap.docs.forEach(
            (siswaDoc) => {
              const data =
                siswaDoc.data();

              const namaNormal =
                normalizeNama(
                  data.nama
                );

              if (
                !namaNormal
              ) {
                return;
              }

              namaCount.set(
                namaNormal,
                (
                  namaCount.get(
                    namaNormal
                  ) || 0
                ) + 1
              );
            }
          );

          let kelompokDuplikat =
            0;

          let akunDuplikatLebih =
            0;

          namaCount.forEach(
            (jumlah) => {
              if (
                jumlah >
                1
              ) {
                /*
                |--------------------------------------------------------------------------
                | Contoh:
                |
                | Ahmad ada 3 akun
                |
                | Kelompok duplikat = 1
                | Akun berlebih      = 2
                |--------------------------------------------------------------------------
                */

                kelompokDuplikat +=
                  1;

                akunDuplikatLebih +=
                  jumlah -
                  1;
              }
            }
          );

          /*
          |--------------------------------------------------------------------------
          | TOTAL
          |--------------------------------------------------------------------------
          */

          const totalAkunSiswa =
            siswaSnap.size;

          const siswaPklValid =
            siswaPklIds.size;

          /*
          |--------------------------------------------------------------------------
          | SELISIH
          |--------------------------------------------------------------------------
          |
          | Ini bukan otomatis berarti seluruhnya duplikat.
          | Bisa juga siswa belum ditempatkan PKL.
          |
          |--------------------------------------------------------------------------
          */

          const selisihAkun =
            Math.max(
              totalAkunSiswa -
                siswaPklValid,
              0
            );

          /*
          |--------------------------------------------------------------------------
          | SET STATE
          |--------------------------------------------------------------------------
          */

          if (
            !cancelled
          ) {
            setCounts({
              totalAkunSiswa,

              siswaPklValid,

              selisihAkun,

              kelompokDuplikat,

              akunDuplikatLebih,

              perusahaan:
                perusahaanSnap.size,

              pendaftaran:
                pendaftaranSnap.size,

              pengajuanTempatPkl:
                pengajuanSnap.size,

              monitoring:
                monitoringSnap.size,
            });
          }
        } catch (err) {
          console.error(
            'Gagal mengambil data dashboard:',
            err
          );

          if (
            !cancelled
          ) {
            setError(
              'Data dashboard gagal dimuat.'
            );
          }
        } finally {
          if (
            !cancelled
          ) {
            setLoading(
              false
            );
          }
        }
      };

    fetchData();

    return () => {
      cancelled =
        true;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (
    loading
  ) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">

        <div className="text-center">

          <div className="w-10 h-10 mx-auto border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />

          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
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
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">

      {/* ================================================================
          HEADER
      ================================================================= */}

      <div>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard Admin
        </h1>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Ringkasan data E-PKL dan kondisi data siswa.
        </p>

      </div>

      {/* ================================================================
          ERROR
      ================================================================= */}

      {error && (
        <div className="p-4 rounded-xl bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* ================================================================
          WARNING DATA
      ================================================================= */}

      {counts.selisihAkun >
        0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30">

          <AlertTriangle
            size={22}
            className="text-orange-600 dark:text-orange-400 shrink-0 mt-0.5"
          />

          <div>

            <p className="font-semibold text-orange-800 dark:text-orange-300">
              Perlu pemeriksaan data siswa
            </p>

            <p className="mt-1 text-sm text-orange-700 dark:text-orange-400">
              Terdapat{' '}
              <strong>
                {counts.selisihAkun}
              </strong>{' '}
              akun siswa yang belum tercatat sebagai siswa PKL aktif.
              Dari data tersebut terdapat{' '}
              <strong>
                {counts.kelompokDuplikat}
              </strong>{' '}
              kelompok nama ganda dengan sekitar{' '}
              <strong>
                {counts.akunDuplikatLebih}
              </strong>{' '}
              akun berlebih.
            </p>

          </div>

        </div>
      )}

      {/* ================================================================
          DATA SISWA
      ================================================================= */}

      <div>

        <div className="mb-3">

          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Data Siswa
          </h2>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Perbandingan akun aplikasi dan siswa yang sudah terdaftar PKL.
          </p>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

          <DashboardCard
            title="Total Akun Siswa"
            count={
              counts.totalAkunSiswa
            }
            description="Seluruh akun pada database siswa"
            icon={
              <Users size={22} />
            }
            iconClass="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300"
          />

          <DashboardCard
            title="Siswa PKL Valid"
            count={
              counts.siswaPklValid
            }
            description="Siswa yang tercatat pada perusahaan"
            icon={
              <UserCheck
                size={22}
              />
            }
            iconClass="bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-300"
          />

          <DashboardCard
            title="Selisih Akun"
            count={
              counts.selisihAkun
            }
            description="Belum teridentifikasi sebagai siswa PKL aktif"
            icon={
              <AlertTriangle
                size={22}
              />
            }
            iconClass="bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-300"
          />

          <DashboardCard
            title="Duplikat Nama"
            count={
              counts.kelompokDuplikat
            }
            description={`${counts.akunDuplikatLebih} akun berlebih terdeteksi`}
            icon={
              <Copy
                size={22}
              />
            }
            iconClass="bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300"
          />

        </div>

      </div>

      {/* ================================================================
          DATA PKL
      ================================================================= */}

      <div>

        <div className="mb-3">

          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Data PKL
          </h2>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Ringkasan kegiatan dan administrasi Praktik Kerja Lapangan.
          </p>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

          <DashboardCard
            title="Perusahaan"
            count={
              counts.perusahaan
            }
            description="Tempat PKL terdaftar"
            icon={
              <Building2
                size={22}
              />
            }
            iconClass="bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-300"
          />

          <DashboardCard
            title="Pendaftaran"
            count={
              counts.pendaftaran
            }
            description="Data pendaftaran PKL"
            icon={
              <FileCheck2
                size={22}
              />
            }
            iconClass="bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-300"
          />

          <DashboardCard
            title="Pengajuan Tempat PKL"
            count={
              counts.pengajuanTempatPkl
            }
            description="Pengajuan lokasi PKL siswa"
            icon={
              <Send
                size={22}
              />
            }
            iconClass="bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-300"
          />

          <DashboardCard
            title="Monitoring"
            count={
              counts.monitoring
            }
            description="Total riwayat monitoring"
            icon={
              <ClipboardCheck
                size={22}
              />
            }
            iconClass="bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300"
          />

        </div>

      </div>

      {/* ================================================================
          INFO VALIDASI
      ================================================================= */}

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">

        <div className="flex items-start gap-3">

          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center shrink-0">

            <GraduationCap
              size={21}
              className="text-blue-600 dark:text-blue-300"
            />

          </div>

          <div>

            <h3 className="font-semibold text-gray-900 dark:text-white">
              Cara membaca data siswa
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
              <strong className="text-gray-700 dark:text-gray-200">
                Total Akun Siswa
              </strong>{' '}
              menunjukkan seluruh dokumen pada collection siswa.
              Sedangkan{' '}
              <strong className="text-gray-700 dark:text-gray-200">
                Siswa PKL Valid
              </strong>{' '}
              adalah siswa yang ID-nya ditemukan pada
              <code className="mx-1 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-xs">
                perusahaan.siswa_terdaftar
              </code>
              dan dokumen siswanya masih tersedia.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
};

/*
|--------------------------------------------------------------------------
| DASHBOARD CARD
|--------------------------------------------------------------------------
*/

interface DashboardCardProps {
  title: string;

  count: number;

  description: string;

  icon: React.ReactNode;

  iconClass: string;
}

const DashboardCard = ({
  title,
  count,
  description,
  icon,
  iconClass,
}: DashboardCardProps) => {
  return (
    <div className="rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-800 overflow-hidden">

      <Card>

        <CardContent>

          <div className="p-5">

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {title}
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {count}
                </p>

              </div>

              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconClass}`}
              >
                {icon}
              </div>

            </div>

            <p className="mt-4 text-xs leading-5 text-gray-500 dark:text-gray-400">
              {description}
            </p>

          </div>

        </CardContent>

      </Card>

    </div>
  );
};

export default AdminDashboard;