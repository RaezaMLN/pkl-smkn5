'use client';

import {
  useEffect,
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
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

import {
  ArrowLeft,
  Building2,
  ClipboardCheck,
  Save,
  User,
} from 'lucide-react';

interface Kriteria {
  kedisiplinan: number;
  sikapEtika: number;
  tanggungJawab: number;
  kemampuanTeknis: number;
  komunikasi: number;
  kerjaSama: number;
  perkembanganKompetensi: number;
}

interface MonitoringData {
  pembimbingId: string;
  siswaId: string;
  perusahaanId: string;

  tanggal: string;
  waktu?: string;
  jenisMonitoring?: string;

  kriteria?: Partial<Kriteria>;

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

  [key: string]: any;
}

interface PerusahaanData {
  id: string;
  nama?: string;

  [key: string]: any;
}

const criteriaList = [
  {
    key: 'kedisiplinan',
    label: 'Kedisiplinan',
  },
  {
    key: 'sikapEtika',
    label: 'Sikap & Etika Kerja',
  },
  {
    key: 'tanggungJawab',
    label: 'Tanggung Jawab',
  },
  {
    key: 'kemampuanTeknis',
    label: 'Kemampuan Teknis',
  },
  {
    key: 'komunikasi',
    label: 'Komunikasi',
  },
  {
    key: 'kerjaSama',
    label: 'Kerja Sama',
  },
  {
    key: 'perkembanganKompetensi',
    label: 'Perkembangan Kompetensi',
  },
] as const;

const defaultKriteria: Kriteria = {
  kedisiplinan: 0,
  sikapEtika: 0,
  tanggungJawab: 0,
  kemampuanTeknis: 0,
  komunikasi: 0,
  kerjaSama: 0,
  perkembanganKompetensi: 0,
};

export default function EditMonitoringPage() {
  const params = useParams();
  const router = useRouter();

  const id = Array.isArray(params.id)
    ? params.id[0]
    : (params.id as string);

  /*
  |--------------------------------------------------------------------------
  | DATA
  |--------------------------------------------------------------------------
  */

  const [siswa, setSiswa] =
    useState<SiswaData | null>(
      null
    );

  const [perusahaan, setPerusahaan] =
    useState<PerusahaanData | null>(
      null
    );

  const [tanggal, setTanggal] =
    useState('');

  const [waktu, setWaktu] =
    useState('');

  const [
    jenisMonitoring,
    setJenisMonitoring,
  ] = useState(
    'kunjungan_langsung'
  );

  const [
    kriteria,
    setKriteria,
  ] =
    useState<Kriteria>(
      defaultKriteria
    );

  const [
    deskripsiPerkembangan,
    setDeskripsiPerkembangan,
  ] = useState('');

  const [kendala, setKendala] =
    useState('');

  const [
    tindakLanjut,
    setTindakLanjut,
  ] = useState('');

  const [
    statusPerkembangan,
    setStatusPerkembangan,
  ] = useState('baik');

  /*
  |--------------------------------------------------------------------------
  | UI STATE
  |--------------------------------------------------------------------------
  */

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  /*
  |--------------------------------------------------------------------------
  | LOGIN
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
  | FETCH EXISTING MONITORING
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const fetchMonitoring =
      async () => {
        try {
          setLoading(true);
          setError('');

          const pembimbingLocal =
            localStorage.getItem(
              'pembimbing'
            );

          if (
            !pembimbingLocal
          ) {
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

          if (
            !monitoringDoc.exists()
          ) {
            setError(
              'Data monitoring tidak ditemukan.'
            );

            return;
          }

          const data =
            monitoringDoc.data() as MonitoringData;

          /*
          |--------------------------------------------------------------------------
          | OWNERSHIP
          |--------------------------------------------------------------------------
          */

          if (
            data.pembimbingId !==
            pembimbing.id
          ) {
            setError(
              'Anda tidak memiliki izin untuk mengedit monitoring ini.'
            );

            return;
          }

          /*
          |--------------------------------------------------------------------------
          | SET FORM
          |--------------------------------------------------------------------------
          */

          setTanggal(
            data.tanggal ||
              ''
          );

          setWaktu(
            data.waktu ||
              ''
          );

          setJenisMonitoring(
            data.jenisMonitoring ||
              'kunjungan_langsung'
          );

          setKriteria({
            ...defaultKriteria,
            ...(data.kriteria ||
              {}),
          });

          setDeskripsiPerkembangan(
            data.deskripsiPerkembangan ||
              ''
          );

          setKendala(
            data.kendala ||
              ''
          );

          setTindakLanjut(
            data.tindakLanjut ||
              ''
          );

          setStatusPerkembangan(
            data.statusPerkembangan ||
              'baik'
          );

          /*
          |--------------------------------------------------------------------------
          | SISWA
          |--------------------------------------------------------------------------
          */

          if (
            data.siswaId
          ) {
            const siswaDoc =
              await getDoc(
                doc(
                  db,
                  'siswa',
                  data.siswaId
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
            data.perusahaanId
          ) {
            const perusahaanDoc =
              await getDoc(
                doc(
                  db,
                  'perusahaan',
                  data.perusahaanId
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
            'Gagal mengambil monitoring:',
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
      fetchMonitoring();
    }
  }, [id, router]);

  /*
  |--------------------------------------------------------------------------
  | CHANGE KRITERIA
  |--------------------------------------------------------------------------
  */

  const handleKriteriaChange = (
    key: keyof Kriteria,
    value: number
  ) => {
    setKriteria(
      (prev) => ({
        ...prev,
        [key]: value,
      })
    );
  };

  /*
  |--------------------------------------------------------------------------
  | VALIDATE
  |--------------------------------------------------------------------------
  */

  const validateForm =
    () => {
      setError('');

      if (!tanggal) {
        setError(
          'Tanggal monitoring wajib diisi.'
        );

        return false;
      }

      const nilaiKriteria =
        Object.values(
          kriteria
        );

      const belumLengkap =
        nilaiKriteria.some(
          (nilai) =>
            !nilai ||
            nilai < 1 ||
            nilai > 4
        );

      if (belumLengkap) {
        setError(
          'Semua kriteria monitoring wajib dinilai.'
        );

        return false;
      }

      if (
        !deskripsiPerkembangan.trim()
      ) {
        setError(
          'Deskripsi perkembangan wajib diisi.'
        );

        return false;
      }

      return true;
    };

  /*
  |--------------------------------------------------------------------------
  | UPDATE
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const pembimbingLocal =
        localStorage.getItem(
          'pembimbing'
        );

      if (
        !pembimbingLocal
      ) {
        router.replace(
          '/pembimbing/login'
        );

        return;
      }

      const pembimbing =
        JSON.parse(
          pembimbingLocal
        );

      const monitoringRef =
        doc(
          db,
          'monitoring',
          id
        );

      /*
      | Ambil ulang untuk security check sederhana
      */

      const monitoringSnap =
        await getDoc(
          monitoringRef
        );

      if (
        !monitoringSnap.exists()
      ) {
        setError(
          'Data monitoring tidak ditemukan.'
        );

        return;
      }

      const oldData =
        monitoringSnap.data();

      if (
        oldData.pembimbingId !==
        pembimbing.id
      ) {
        setError(
          'Anda tidak memiliki izin mengedit monitoring ini.'
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | UPDATE FIRESTORE
      |--------------------------------------------------------------------------
      */

      await updateDoc(
        monitoringRef,
        {
          tanggal,
          waktu,

          jenisMonitoring,

          kriteria,

          deskripsiPerkembangan:
            deskripsiPerkembangan.trim(),

          kendala:
            kendala.trim(),

          tindakLanjut:
            tindakLanjut.trim(),

          statusPerkembangan,

          updatedAt:
            serverTimestamp(),
        }
      );

      router.replace(
        `/pembimbing/monitoring/${id}`
      );
    } catch (err) {
      console.error(
        'Gagal memperbarui monitoring:',
        err
      );

      setError(
        'Monitoring gagal diperbarui. Silakan coba kembali.'
      );
    } finally {
      setSaving(false);
    }
  };

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
  | ERROR TANPA DATA
  |--------------------------------------------------------------------------
  */

  if (
    error &&
    !siswa
  ) {
    return (
      <div className="max-w-5xl mx-auto">

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

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="max-w-5xl mx-auto">

      {/* ================================================================
          BACK
      ================================================================= */}

      <button
        type="button"
        onClick={() =>
          router.push(
            `/pembimbing/monitoring/${id}`
          )
        }
        className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400 hover:underline"
      >
        <ArrowLeft
          size={16}
        />

        Kembali
      </button>

      {/* ================================================================
          HEADER
      ================================================================= */}

      <div className="flex items-center gap-3 mb-6">

        <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-xl">

          <ClipboardCheck className="text-blue-600 dark:text-blue-300" />

        </div>

        <div>

          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Edit Monitoring PKL
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Perbarui hasil monitoring perkembangan siswa.
          </p>

        </div>

      </div>

      {/* ================================================================
          ERROR
      ================================================================= */}

      {error && (
        <div className="mb-5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-3 rounded-lg">
          {error}
        </div>
      )}

      <form
        onSubmit={
          handleSubmit
        }
        className="space-y-6"
      >

        {/* ================================================================
            SISWA
        ================================================================= */}

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow rounded-xl p-6">

          <div className="flex items-center gap-2 mb-5">

            <User className="text-blue-600 dark:text-blue-400" />

            <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
              Data Siswa
            </h2>

          </div>

          <div className="grid md:grid-cols-2 gap-4">

            {/* NAMA */}

            <div>

              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                Siswa
              </label>

              <input
                value={
                  siswa?.nama ||
                  ''
                }
                readOnly
                className="
                  w-full
                  border
                  border-gray-300
                  dark:border-gray-600
                  rounded-lg
                  p-2.5
                  bg-gray-100
                  dark:bg-gray-700
                  text-gray-900
                  dark:text-white
                "
              />

            </div>

            {/* KELAS */}

            <div>

              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                Kelas
              </label>

              <input
                value={
                  siswa?.kelas ||
                  ''
                }
                readOnly
                className="
                  w-full
                  border
                  border-gray-300
                  dark:border-gray-600
                  rounded-lg
                  p-2.5
                  bg-gray-100
                  dark:bg-gray-700
                  text-gray-900
                  dark:text-white
                "
              />

            </div>

            {/* JURUSAN */}

            <div>

              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                Jurusan
              </label>

              <input
                value={
                  siswa?.jurusan ||
                  ''
                }
                readOnly
                className="
                  w-full
                  border
                  border-gray-300
                  dark:border-gray-600
                  rounded-lg
                  p-2.5
                  bg-gray-100
                  dark:bg-gray-700
                  text-gray-900
                  dark:text-white
                "
              />

            </div>

            {/* PERUSAHAAN */}

            <div>

              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                Tempat PKL
              </label>

              <div className="relative">

                <Building2
                  size={17}
                  className="absolute left-3 top-3 text-gray-400"
                />

                <input
                  value={
                    perusahaan?.nama ||
                    ''
                  }
                  readOnly
                  className="
                    w-full
                    pl-10
                    border
                    border-gray-300
                    dark:border-gray-600
                    rounded-lg
                    p-2.5
                    bg-gray-100
                    dark:bg-gray-700
                    text-gray-900
                    dark:text-white
                  "
                />

              </div>

            </div>

          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            Siswa dan tempat PKL tidak dapat diubah dari halaman edit monitoring.
          </p>

        </div>

        {/* ================================================================
            PELAKSANAAN
        ================================================================= */}

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow rounded-xl p-6">

          <h2 className="font-semibold text-lg mb-5 text-gray-900 dark:text-white">
            Pelaksanaan Monitoring
          </h2>

          <div className="grid md:grid-cols-3 gap-4">

            {/* TANGGAL */}

            <div>

              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                Tanggal *
              </label>

              <input
                type="date"
                value={
                  tanggal
                }
                onChange={(
                  e
                ) =>
                  setTanggal(
                    e.target
                      .value
                  )
                }
                className="
                  w-full
                  border
                  border-gray-300
                  dark:border-gray-600
                  rounded-lg
                  p-2.5
                  bg-white
                  dark:bg-gray-700
                  text-gray-900
                  dark:text-white
                "
              />

            </div>

            {/* WAKTU */}

            <div>

              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                Waktu
              </label>

              <input
                type="time"
                value={
                  waktu
                }
                onChange={(
                  e
                ) =>
                  setWaktu(
                    e.target
                      .value
                  )
                }
                className="
                  w-full
                  border
                  border-gray-300
                  dark:border-gray-600
                  rounded-lg
                  p-2.5
                  bg-white
                  dark:bg-gray-700
                  text-gray-900
                  dark:text-white
                "
              />

            </div>

            {/* JENIS */}

            <div>

              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                Jenis Monitoring *
              </label>

              <select
                value={
                  jenisMonitoring
                }
                onChange={(
                  e
                ) =>
                  setJenisMonitoring(
                    e.target
                      .value
                  )
                }
                className="
                  w-full
                  border
                  border-gray-300
                  dark:border-gray-600
                  rounded-lg
                  p-2.5
                  bg-white
                  dark:bg-gray-700
                  text-gray-900
                  dark:text-white
                "
              >

                <option value="kunjungan_langsung">
                  Kunjungan Langsung
                </option>

                <option value="online">
                  Online / Video Call
                </option>

                <option value="telepon">
                  Telepon
                </option>

                <option value="koordinasi_industri">
                  Koordinasi Pembimbing Industri
                </option>

                <option value="lainnya">
                  Lainnya
                </option>

              </select>

            </div>

          </div>

        </div>

        {/* ================================================================
            KRITERIA
        ================================================================= */}

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow rounded-xl p-6">

          <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
            Penilaian Perkembangan
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-6">
            Perbarui penilaian berdasarkan kondisi terbaru yang dicatat pada monitoring ini.
          </p>

          <div className="space-y-5">

            {criteriaList.map(
              (item) => (
                <div
                  key={
                    item.key
                  }
                  className="border-b border-gray-200 dark:border-gray-700 pb-5 last:border-b-0"
                >

                  <p className="font-medium text-gray-900 dark:text-white mb-3">
                    {
                      item.label
                    }
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

                    {[
                      {
                        value: 1,
                        label:
                          'Kurang',
                      },
                      {
                        value: 2,
                        label:
                          'Cukup',
                      },
                      {
                        value: 3,
                        label:
                          'Baik',
                      },
                      {
                        value: 4,
                        label:
                          'Sangat Baik',
                      },
                    ].map(
                      (
                        option
                      ) => {
                        const active =
                          kriteria[
                            item.key
                          ] ===
                          option.value;

                        return (
                          <label
                            key={
                              option.value
                            }
                            className={`
                              flex
                              items-center
                              gap-2
                              border
                              rounded-lg
                              p-3
                              cursor-pointer
                              transition
                              ${
                                active
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                                  : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }
                            `}
                          >

                            <input
                              type="radio"
                              name={
                                item.key
                              }
                              checked={
                                active
                              }
                              onChange={() =>
                                handleKriteriaChange(
                                  item.key,
                                  option.value
                                )
                              }
                            />

                            <span className="text-sm text-gray-700 dark:text-gray-200">
                              {
                                option.label
                              }
                            </span>

                          </label>
                        );
                      }
                    )}

                  </div>

                </div>
              )
            )}

          </div>

        </div>

        {/* ================================================================
            CATATAN
        ================================================================= */}

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow rounded-xl p-6 space-y-5">

          <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
            Catatan Monitoring
          </h2>

          {/* PERKEMBANGAN */}

          <div>

            <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
              Deskripsi Perkembangan *
            </label>

            <textarea
              rows={5}
              value={
                deskripsiPerkembangan
              }
              onChange={(
                e
              ) =>
                setDeskripsiPerkembangan(
                  e.target
                    .value
                )
              }
              placeholder="Tuliskan perkembangan siswa selama PKL..."
              className="
                w-full
                border
                border-gray-300
                dark:border-gray-600
                rounded-lg
                p-3
                bg-white
                dark:bg-gray-700
                text-gray-900
                dark:text-white
              "
            />

          </div>

          {/* KENDALA */}

          <div>

            <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
              Kendala / Permasalahan
            </label>

            <textarea
              rows={4}
              value={
                kendala
              }
              onChange={(
                e
              ) =>
                setKendala(
                  e.target
                    .value
                )
              }
              placeholder="Tuliskan kendala jika ada..."
              className="
                w-full
                border
                border-gray-300
                dark:border-gray-600
                rounded-lg
                p-3
                bg-white
                dark:bg-gray-700
                text-gray-900
                dark:text-white
              "
            />

          </div>

          {/* TINDAK LANJUT */}

          <div>

            <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
              Tindak Lanjut / Saran
            </label>

            <textarea
              rows={4}
              value={
                tindakLanjut
              }
              onChange={(
                e
              ) =>
                setTindakLanjut(
                  e.target
                    .value
                )
              }
              placeholder="Tuliskan tindak lanjut atau saran pembimbing..."
              className="
                w-full
                border
                border-gray-300
                dark:border-gray-600
                rounded-lg
                p-3
                bg-white
                dark:bg-gray-700
                text-gray-900
                dark:text-white
              "
            />

          </div>

          {/* STATUS */}

          <div>

            <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
              Status Perkembangan *
            </label>

            <select
              value={
                statusPerkembangan
              }
              onChange={(
                e
              ) =>
                setStatusPerkembangan(
                  e.target
                    .value
                )
              }
              className="
                w-full
                md:w-1/2
                border
                border-gray-300
                dark:border-gray-600
                rounded-lg
                p-2.5
                bg-white
                dark:bg-gray-700
                text-gray-900
                dark:text-white
              "
            >

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
            ACTION
        ================================================================= */}

        <div className="flex justify-end gap-3 pb-6">

          <button
            type="button"
            disabled={
              saving
            }
            onClick={() =>
              router.push(
                `/pembimbing/monitoring/${id}`
              )
            }
            className="
              px-5
              py-2.5
              border
              border-gray-300
              dark:border-gray-600
              rounded-lg
              text-gray-700
              dark:text-gray-200
              hover:bg-gray-100
              dark:hover:bg-gray-800
              disabled:opacity-50
            "
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={
              saving
            }
            className="
              inline-flex
              items-center
              gap-2
              px-5
              py-2.5
              bg-blue-600
              hover:bg-blue-700
              disabled:bg-blue-400
              text-white
              rounded-lg
              transition
            "
          >
            <Save
              size={18}
            />

            {saving
              ? 'Menyimpan...'
              : 'Simpan Perubahan'}
          </button>

        </div>

      </form>

    </div>
  );
}