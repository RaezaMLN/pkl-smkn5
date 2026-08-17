'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { db } from '@/lib/firebase';

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';

import {
  ArrowLeft,
  ClipboardCheck,
  FolderKanban,
  Save,
} from 'lucide-react';

/*
|--------------------------------------------------------------------------
| INTERFACE
|--------------------------------------------------------------------------
*/

interface Siswa {
  id: string;
  nama: string;

  kelas?: string;
  jurusan?: string;

  perusahaanId: string;
  perusahaanNama: string;
}

/*
|--------------------------------------------------------------------------
| KRITERIA
|--------------------------------------------------------------------------
*/

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
];

const defaultKriteria = {
  kedisiplinan: 0,
  sikapEtika: 0,
  tanggungJawab: 0,
  kemampuanTeknis: 0,
  komunikasi: 0,
  kerjaSama: 0,
  perkembanganKompetensi: 0,
};

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function TambahMonitoringPage() {
  const router = useRouter();

  /*
  |--------------------------------------------------------------------------
  | SISWA
  |--------------------------------------------------------------------------
  */

  const [siswaList, setSiswaList] =
    useState<Siswa[]>([]);

  const [
    selectedSiswaId,
    setSelectedSiswaId,
  ] = useState('');

  /*
  |--------------------------------------------------------------------------
  | PELAKSANAAN
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | PROGRESS PROJECT
  |--------------------------------------------------------------------------
  */

  const [
    progressProject,
    setProgressProject,
  ] = useState(0);

  /*
  |--------------------------------------------------------------------------
  | PENILAIAN
  |--------------------------------------------------------------------------
  */

  const [kriteria, setKriteria] =
    useState<any>(
      defaultKriteria
    );

  /*
  |--------------------------------------------------------------------------
  | CATATAN
  |--------------------------------------------------------------------------
  */

  const [
    deskripsiPerkembangan,
    setDeskripsiPerkembangan,
  ] = useState('');

  const [
    kendala,
    setKendala,
  ] = useState('');

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
  | STATE
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
  | CHECK LOGIN
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const isLoggedIn =
      localStorage.getItem(
        'isPembimbingLoggedIn'
      );

    if (
      isLoggedIn !== 'true'
    ) {
      router.replace(
        '/pembimbing/login'
      );
    }
  }, [router]);

  /*
  |--------------------------------------------------------------------------
  | FETCH SISWA BIMBINGAN
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const fetchSiswa =
      async () => {
        try {
          setLoading(true);
          setError('');

          /*
          |--------------------------------------------------------------------------
          | PEMBIMBING LOGIN
          |--------------------------------------------------------------------------
          */

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
          | AMBIL PERUSAHAAN
          |--------------------------------------------------------------------------
          */

          const perusahaanSnap =
            await getDocs(
              collection(
                db,
                'perusahaan'
              )
            );

          const result: Siswa[] =
            [];

          /*
          |--------------------------------------------------------------------------
          | FILTER PERUSAHAAN BIMBINGAN
          |--------------------------------------------------------------------------
          */

          for (
            const perDoc
            of perusahaanSnap.docs
          ) {
            const perData =
              perDoc.data();

            if (
              perData.pembimbingId ===
              pembimbing.id
            ) {
              const siswaIds =
                perData.siswa_terdaftar ||
                [];

              /*
              |--------------------------------------------------------------------------
              | AMBIL SISWA
              |--------------------------------------------------------------------------
              */

              for (
                const siswaId
                of siswaIds
              ) {
                const siswaDoc =
                  await getDoc(
                    doc(
                      db,
                      'siswa',
                      siswaId
                    )
                  );

                if (
                  siswaDoc.exists()
                ) {
                  const data =
                    siswaDoc.data();

                  result.push({
                    id:
                      siswaDoc.id,

                    nama:
                      data.nama ||
                      'Tanpa Nama',

                    kelas:
                      data.kelas,

                    jurusan:
                      data.jurusan,

                    perusahaanId:
                      perDoc.id,

                    perusahaanNama:
                      perData.nama ||
                      '-',
                  });
                }
              }
            }
          }

          /*
          |--------------------------------------------------------------------------
          | SORT A-Z
          |--------------------------------------------------------------------------
          */

          result.sort(
            (a, b) =>
              a.nama.localeCompare(
                b.nama,
                'id'
              )
          );

          setSiswaList(
            result
          );
        } catch (err) {
          console.error(
            'Gagal mengambil siswa:',
            err
          );

          setError(
            'Gagal mengambil data siswa bimbingan.'
          );
        } finally {
          setLoading(false);
        }
      };

    fetchSiswa();
  }, [router]);

  /*
  |--------------------------------------------------------------------------
  | SISWA TERPILIH
  |--------------------------------------------------------------------------
  */

  const selectedSiswa =
    siswaList.find(
      (siswa) =>
        siswa.id ===
        selectedSiswaId
    );

  /*
  |--------------------------------------------------------------------------
  | HANDLE KRITERIA
  |--------------------------------------------------------------------------
  */

  const handleKriteriaChange = (
    key: string,
    value: number
  ) => {
    setKriteria(
      (prev: any) => ({
        ...prev,
        [key]: value,
      })
    );
  };

  /*
  |--------------------------------------------------------------------------
  | HANDLE PROGRESS
  |--------------------------------------------------------------------------
  */

  const handleProgressChange = (
    value: number
  ) => {
    const normalizedValue =
      Math.min(
        Math.max(
          Number.isNaN(value)
            ? 0
            : value,
          0
        ),
        100
      );

    setProgressProject(
      normalizedValue
    );
  };

  /*
  |--------------------------------------------------------------------------
  | LABEL PROGRESS
  |--------------------------------------------------------------------------
  */

  const progressLabel = (
    progress: number
  ) => {
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
  | PROGRESS BAR COLOR
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
  | PROGRESS BADGE
  |--------------------------------------------------------------------------
  */

  const progressBadgeClass = (
    progress: number
  ) => {
    if (
      progress === 100
    ) {
      return `
        bg-green-100
        text-green-700
        dark:bg-green-900
        dark:text-green-200
      `;
    }

    if (
      progress >= 76
    ) {
      return `
        bg-blue-100
        text-blue-700
        dark:bg-blue-900
        dark:text-blue-200
      `;
    }

    if (
      progress >= 51
    ) {
      return `
        bg-cyan-100
        text-cyan-700
        dark:bg-cyan-900
        dark:text-cyan-200
      `;
    }

    if (
      progress >= 26
    ) {
      return `
        bg-yellow-100
        text-yellow-700
        dark:bg-yellow-900
        dark:text-yellow-200
      `;
    }

    if (
      progress > 0
    ) {
      return `
        bg-orange-100
        text-orange-700
        dark:bg-orange-900
        dark:text-orange-200
      `;
    }

    return `
      bg-gray-100
      text-gray-700
      dark:bg-gray-700
      dark:text-gray-200
    `;
  };

  /*
  |--------------------------------------------------------------------------
  | VALIDASI
  |--------------------------------------------------------------------------
  */

  const validateForm = () => {
    /*
    |--------------------------------------------------------------------------
    | SISWA
    |--------------------------------------------------------------------------
    */

    if (
      !selectedSiswa
    ) {
      setError(
        'Silakan pilih siswa yang dimonitoring.'
      );

      return false;
    }

    /*
    |--------------------------------------------------------------------------
    | TANGGAL
    |--------------------------------------------------------------------------
    */

    if (!tanggal) {
      setError(
        'Tanggal monitoring wajib diisi.'
      );

      return false;
    }

    /*
    |--------------------------------------------------------------------------
    | PROGRESS PROJECT
    |--------------------------------------------------------------------------
    */

    if (
      Number.isNaN(
        progressProject
      ) ||
      progressProject < 0 ||
      progressProject > 100
    ) {
      setError(
        'Progress project harus berada antara 0% sampai 100%.'
      );

      return false;
    }

    /*
    |--------------------------------------------------------------------------
    | KRITERIA
    |--------------------------------------------------------------------------
    */

    const nilaiKriteria =
      Object.values(
        kriteria
      );

    if (
      nilaiKriteria.some(
        (value) =>
          value === 0
      )
    ) {
      setError(
        'Semua kriteria monitoring wajib dinilai.'
      );

      return false;
    }

    /*
    |--------------------------------------------------------------------------
    | DESKRIPSI
    |--------------------------------------------------------------------------
    */

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
  | SUBMIT
  |--------------------------------------------------------------------------
  */

  const handleSubmit =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault();

      setError('');

      if (
        !validateForm()
      ) {
        return;
      }

      try {
        setSaving(true);

        /*
        |--------------------------------------------------------------------------
        | PEMBIMBING
        |--------------------------------------------------------------------------
        */

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
        | SIMPAN MONITORING
        |--------------------------------------------------------------------------
        */

        await addDoc(
          collection(
            db,
            'monitoring'
          ),
          {
            /*
            |--------------------------------------------------------------------------
            | RELASI
            |--------------------------------------------------------------------------
            */

            pembimbingId:
              pembimbing.id,

            siswaId:
              selectedSiswa!.id,

            perusahaanId:
              selectedSiswa!
                .perusahaanId,

            /*
            |--------------------------------------------------------------------------
            | PELAKSANAAN
            |--------------------------------------------------------------------------
            */

            tanggal,

            waktu,

            jenisMonitoring,

            /*
            |--------------------------------------------------------------------------
            | PROGRESS PROJECT AKHIR
            |--------------------------------------------------------------------------
            */

            progressProject,

            /*
            |--------------------------------------------------------------------------
            | PENILAIAN
            |--------------------------------------------------------------------------
            */

            kriteria,

            /*
            |--------------------------------------------------------------------------
            | CATATAN
            |--------------------------------------------------------------------------
            */

            deskripsiPerkembangan:
              deskripsiPerkembangan.trim(),

            kendala:
              kendala.trim(),

            tindakLanjut:
              tindakLanjut.trim(),

            statusPerkembangan,

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMP
            |--------------------------------------------------------------------------
            */

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          }
        );

        /*
        |--------------------------------------------------------------------------
        | REDIRECT
        |--------------------------------------------------------------------------
        */

        router.push(
          '/pembimbing/monitoring'
        );
      } catch (err) {
        console.error(
          'Monitoring gagal disimpan:',
          err
        );

        setError(
          'Monitoring gagal disimpan. Silakan coba kembali.'
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
      <div
        className="
          text-center
          py-10
          text-gray-600
          dark:text-gray-300
        "
      >
        Loading...
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

      {/* ==========================================================
          BACK
      ========================================================== */}

      <button
        type="button"
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

      {/* ==========================================================
          HEADER
      ========================================================== */}

      <div className="flex items-center gap-3 mb-6">

        <div
          className="
            bg-blue-100
            dark:bg-blue-900
            p-3
            rounded-xl
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
              font-semibold
              text-gray-900
              dark:text-white
            "
          >
            Tambah Monitoring Siswa
          </h1>

          <p
            className="
              text-sm
              text-gray-500
              dark:text-gray-400
              mt-1
            "
          >
            Catat hasil monitoring dan perkembangan siswa selama PKL.
          </p>

        </div>

      </div>

      {/* ==========================================================
          ERROR
      ========================================================== */}

      {error && (
        <div
          className="
            mb-5
            p-3
            rounded-lg
            bg-red-100
            text-red-700
            dark:bg-red-900
            dark:text-red-200
          "
        >
          {error}
        </div>
      )}

      {/* ==========================================================
          FORM
      ========================================================== */}

      <form
        onSubmit={
          handleSubmit
        }
        className="space-y-6"
      >

        {/* ========================================================
            DATA SISWA
        ======================================================== */}

        <div
          className="
            bg-white
            dark:bg-gray-800
            border
            border-gray-200
            dark:border-gray-700
            shadow
            rounded-xl
            p-6
          "
        >

          <h2
            className="
              font-semibold
              text-lg
              mb-4
              text-gray-900
              dark:text-white
            "
          >
            Data Siswa
          </h2>

          <div className="grid md:grid-cols-2 gap-4">

            {/* SISWA */}

            <div>

              <label
                className="
                  block
                  text-sm
                  mb-2
                  text-gray-700
                  dark:text-gray-200
                "
              >
                Siswa *
              </label>

              <select
                value={
                  selectedSiswaId
                }
                onChange={(e) =>
                  setSelectedSiswaId(
                    e.target.value
                  )
                }
                className="
                  w-full
                  border
                  rounded-lg
                  p-2.5
                  bg-white
                  dark:bg-gray-700
                  dark:border-gray-600
                  text-gray-900
                  dark:text-white
                "
              >
                <option value="">
                  Pilih siswa
                </option>

                {siswaList.map(
                  (siswa) => (
                    <option
                      key={
                        siswa.id
                      }
                      value={
                        siswa.id
                      }
                    >
                      {
                        siswa.nama
                      }
                    </option>
                  )
                )}

              </select>

              {siswaList.length ===
                0 && (
                <p
                  className="
                    text-xs
                    text-yellow-600
                    dark:text-yellow-400
                    mt-2
                  "
                >
                  Belum ada siswa bimbingan yang ditemukan.
                </p>
              )}

            </div>

            {/* KELAS */}

            <div>

              <label
                className="
                  block
                  text-sm
                  mb-2
                  text-gray-700
                  dark:text-gray-200
                "
              >
                Kelas
              </label>

              <input
                value={
                  selectedSiswa
                    ?.kelas ||
                  ''
                }
                readOnly
                placeholder="-"
                className="
                  w-full
                  border
                  rounded-lg
                  p-2.5
                  bg-gray-100
                  dark:bg-gray-700
                  dark:border-gray-600
                  text-gray-900
                  dark:text-white
                "
              />

            </div>

            {/* JURUSAN */}

            <div>

              <label
                className="
                  block
                  text-sm
                  mb-2
                  text-gray-700
                  dark:text-gray-200
                "
              >
                Jurusan
              </label>

              <input
                value={
                  selectedSiswa
                    ?.jurusan ||
                  ''
                }
                readOnly
                placeholder="-"
                className="
                  w-full
                  border
                  rounded-lg
                  p-2.5
                  bg-gray-100
                  dark:bg-gray-700
                  dark:border-gray-600
                  text-gray-900
                  dark:text-white
                "
              />

            </div>

            {/* TEMPAT PKL */}

            <div>

              <label
                className="
                  block
                  text-sm
                  mb-2
                  text-gray-700
                  dark:text-gray-200
                "
              >
                Tempat PKL
              </label>

              <input
                value={
                  selectedSiswa
                    ?.perusahaanNama ||
                  ''
                }
                readOnly
                placeholder="-"
                className="
                  w-full
                  border
                  rounded-lg
                  p-2.5
                  bg-gray-100
                  dark:bg-gray-700
                  dark:border-gray-600
                  text-gray-900
                  dark:text-white
                "
              />

            </div>

          </div>

        </div>

        {/* ========================================================
            PELAKSANAAN MONITORING
        ======================================================== */}

        <div
          className="
            bg-white
            dark:bg-gray-800
            border
            border-gray-200
            dark:border-gray-700
            shadow
            rounded-xl
            p-6
          "
        >

          <h2
            className="
              font-semibold
              text-lg
              mb-4
              text-gray-900
              dark:text-white
            "
          >
            Pelaksanaan Monitoring
          </h2>

          <div className="grid md:grid-cols-3 gap-4">

            {/* TANGGAL */}

            <div>

              <label
                className="
                  block
                  text-sm
                  mb-2
                  text-gray-700
                  dark:text-gray-200
                "
              >
                Tanggal *
              </label>

              <input
                type="date"
                value={tanggal}
                onChange={(e) =>
                  setTanggal(
                    e.target.value
                  )
                }
                className="
                  w-full
                  border
                  rounded-lg
                  p-2.5
                  dark:bg-gray-700
                  dark:border-gray-600
                  text-gray-900
                  dark:text-white
                "
              />

            </div>

            {/* WAKTU */}

            <div>

              <label
                className="
                  block
                  text-sm
                  mb-2
                  text-gray-700
                  dark:text-gray-200
                "
              >
                Waktu
              </label>

              <input
                type="time"
                value={waktu}
                onChange={(e) =>
                  setWaktu(
                    e.target.value
                  )
                }
                className="
                  w-full
                  border
                  rounded-lg
                  p-2.5
                  dark:bg-gray-700
                  dark:border-gray-600
                  text-gray-900
                  dark:text-white
                "
              />

            </div>

            {/* JENIS */}

            <div>

              <label
                className="
                  block
                  text-sm
                  mb-2
                  text-gray-700
                  dark:text-gray-200
                "
              >
                Jenis Monitoring
              </label>

              <select
                value={
                  jenisMonitoring
                }
                onChange={(e) =>
                  setJenisMonitoring(
                    e.target.value
                  )
                }
                className="
                  w-full
                  border
                  rounded-lg
                  p-2.5
                  dark:bg-gray-700
                  dark:border-gray-600
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

        {/* ========================================================
            PROGRESS PROJECT AKHIR
        ======================================================== */}

        <div
          className="
            bg-white
            dark:bg-gray-800
            border
            border-gray-200
            dark:border-gray-700
            shadow
            rounded-xl
            p-6
          "
        >

          {/* HEADER */}

          <div
            className="
              flex
              flex-col
              sm:flex-row
              sm:items-start
              sm:justify-between
              gap-4
              mb-6
            "
          >

            <div className="flex items-start gap-3">

              <div
                className="
                  bg-purple-100
                  dark:bg-purple-900
                  p-3
                  rounded-xl
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

                <h2
                  className="
                    font-semibold
                    text-lg
                    text-gray-900
                    dark:text-white
                  "
                >
                  Progress Project Akhir PKL
                </h2>

                <p
                  className="
                    text-sm
                    text-gray-500
                    dark:text-gray-400
                    mt-1
                  "
                >
                  Masukkan persentase progress project akhir siswa saat monitoring ini.
                </p>

              </div>

            </div>

            {/* STATUS */}

            <div
              className="
                flex
                items-center
                gap-3
              "
            >

              <span
                className={`
                  px-3
                  py-1.5
                  rounded-full
                  text-sm
                  font-medium
                  ${progressBadgeClass(
                    progressProject
                  )}
                `}
              >
                {progressLabel(
                  progressProject
                )}
              </span>

              <span
                className="
                  text-3xl
                  font-bold
                  text-gray-900
                  dark:text-white
                "
              >
                {progressProject}%
              </span>

            </div>

          </div>

          {/* SLIDER + NUMBER */}

          <div
            className="
              grid
              md:grid-cols-[1fr_120px]
              gap-5
              items-end
            "
          >

            {/* RANGE */}

            <div>

              <label
                className="
                  block
                  text-sm
                  font-medium
                  mb-3
                  text-gray-700
                  dark:text-gray-200
                "
              >
                Persentase Progress
              </label>

              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={
                  progressProject
                }
                onChange={(e) =>
                  handleProgressChange(
                    Number(
                      e.target.value
                    )
                  )
                }
                className="
                  w-full
                  cursor-pointer
                  accent-blue-600
                "
              />

              <div
                className="
                  flex
                  justify-between
                  mt-2
                  text-xs
                  text-gray-500
                  dark:text-gray-400
                "
              >
                <span>
                  0%
                </span>

                <span>
                  25%
                </span>

                <span>
                  50%
                </span>

                <span>
                  75%
                </span>

                <span>
                  100%
                </span>
              </div>

            </div>

            {/* INPUT NUMBER */}

            <div>

              <label
                className="
                  block
                  text-sm
                  font-medium
                  mb-2
                  text-gray-700
                  dark:text-gray-200
                "
              >
                Progress
              </label>

              <div className="relative">

                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={
                    progressProject
                  }
                  onChange={(e) =>
                    handleProgressChange(
                      Number(
                        e.target.value
                      )
                    )
                  }
                  className="
                    w-full
                    border
                    rounded-lg
                    p-2.5
                    pr-10
                    dark:bg-gray-700
                    dark:border-gray-600
                    text-gray-900
                    dark:text-white
                  "
                />

                <span
                  className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    text-sm
                    text-gray-500
                    dark:text-gray-400
                  "
                >
                  %
                </span>

              </div>

            </div>

          </div>

          {/* PROGRESS VISUAL */}

          <div className="mt-6">

            <div
              className="
                w-full
                h-4
                bg-gray-200
                dark:bg-gray-700
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
                  duration-300
                  ${progressBarClass(
                    progressProject
                  )}
                `}
              />
            </div>

          </div>

          {/* INFO */}

          <div
            className="
              mt-5
              bg-gray-50
              dark:bg-gray-700/60
              rounded-lg
              p-4
            "
          >

            <p
              className="
                text-sm
                text-gray-600
                dark:text-gray-300
              "
            >
              Progress ini merupakan kondisi project akhir siswa
              pada saat monitoring dilakukan dan akan menjadi
              data rekap progress yang dapat dilihat oleh Kepala Sekolah.
            </p>

          </div>

        </div>

        {/* ========================================================
            PENILAIAN PERKEMBANGAN
        ======================================================== */}

        <div
          className="
            bg-white
            dark:bg-gray-800
            border
            border-gray-200
            dark:border-gray-700
            shadow
            rounded-xl
            p-6
          "
        >

          <h2
            className="
              font-semibold
              text-lg
              mb-2
              text-gray-900
              dark:text-white
            "
          >
            Penilaian Perkembangan
          </h2>

          <p
            className="
              text-sm
              text-gray-500
              dark:text-gray-400
              mb-6
            "
          >
            Berikan penilaian berdasarkan hasil monitoring siswa.
          </p>

          <div className="space-y-5">

            {criteriaList.map(
              (item) => (
                <div
                  key={
                    item.key
                  }
                  className="
                    border-b
                    border-gray-200
                    dark:border-gray-700
                    pb-4
                  "
                >

                  <p
                    className="
                      font-medium
                      mb-3
                      text-gray-900
                      dark:text-white
                    "
                  >
                    {item.label}
                  </p>

                  <div className="flex flex-wrap gap-4">

                    {[
                      {
                        value: 1,
                        label: 'Kurang',
                      },
                      {
                        value: 2,
                        label: 'Cukup',
                      },
                      {
                        value: 3,
                        label: 'Baik',
                      },
                      {
                        value: 4,
                        label:
                          'Sangat Baik',
                      },
                    ].map(
                      (option) => (
                        <label
                          key={
                            option.value
                          }
                          className="
                            flex
                            items-center
                            gap-2
                            cursor-pointer
                            text-gray-700
                            dark:text-gray-200
                          "
                        >

                          <input
                            type="radio"
                            name={
                              item.key
                            }
                            checked={
                              kriteria[
                                item.key
                              ] ===
                              option.value
                            }
                            onChange={() =>
                              handleKriteriaChange(
                                item.key,
                                option.value
                              )
                            }
                            className="
                              accent-blue-600
                            "
                          />

                          <span className="text-sm">
                            {option.label}
                          </span>

                        </label>
                      )
                    )}

                  </div>

                </div>
              )
            )}

          </div>

        </div>

        {/* ========================================================
            CATATAN
        ======================================================== */}

        <div
          className="
            bg-white
            dark:bg-gray-800
            border
            border-gray-200
            dark:border-gray-700
            shadow
            rounded-xl
            p-6
            space-y-5
          "
        >

          <h2
            className="
              font-semibold
              text-lg
              text-gray-900
              dark:text-white
            "
          >
            Catatan Monitoring
          </h2>

          {/* PERKEMBANGAN */}

          <div>

            <label
              className="
                block
                text-sm
                mb-2
                text-gray-700
                dark:text-gray-200
              "
            >
              Deskripsi Perkembangan *
            </label>

            <textarea
              rows={5}
              value={
                deskripsiPerkembangan
              }
              onChange={(e) =>
                setDeskripsiPerkembangan(
                  e.target.value
                )
              }
              placeholder="Tuliskan perkembangan siswa selama pelaksanaan PKL..."
              className="
                w-full
                border
                rounded-lg
                p-3
                dark:bg-gray-700
                dark:border-gray-600
                text-gray-900
                dark:text-white
              "
            />

          </div>

          {/* KENDALA */}

          <div>

            <label
              className="
                block
                text-sm
                mb-2
                text-gray-700
                dark:text-gray-200
              "
            >
              Kendala / Permasalahan
            </label>

            <textarea
              rows={4}
              value={kendala}
              onChange={(e) =>
                setKendala(
                  e.target.value
                )
              }
              placeholder="Tuliskan kendala yang ditemukan jika ada..."
              className="
                w-full
                border
                rounded-lg
                p-3
                dark:bg-gray-700
                dark:border-gray-600
                text-gray-900
                dark:text-white
              "
            />

          </div>

          {/* TINDAK LANJUT */}

          <div>

            <label
              className="
                block
                text-sm
                mb-2
                text-gray-700
                dark:text-gray-200
              "
            >
              Tindak Lanjut / Saran
            </label>

            <textarea
              rows={4}
              value={
                tindakLanjut
              }
              onChange={(e) =>
                setTindakLanjut(
                  e.target.value
                )
              }
              placeholder="Tuliskan tindak lanjut atau saran pembimbing..."
              className="
                w-full
                border
                rounded-lg
                p-3
                dark:bg-gray-700
                dark:border-gray-600
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
                text-sm
                mb-2
                text-gray-700
                dark:text-gray-200
              "
            >
              Status Perkembangan
            </label>

            <select
              value={
                statusPerkembangan
              }
              onChange={(e) =>
                setStatusPerkembangan(
                  e.target.value
                )
              }
              className="
                w-full
                md:w-1/2
                border
                rounded-lg
                p-2.5
                dark:bg-gray-700
                dark:border-gray-600
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

        {/* ========================================================
            BUTTON
        ======================================================== */}

        <div
          className="
            flex
            flex-col-reverse
            sm:flex-row
            justify-end
            gap-3
            pb-4
          "
        >

          <button
            type="button"
            disabled={saving}
            onClick={() =>
              router.push(
                '/pembimbing/monitoring'
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
              flex
              items-center
              justify-center
              gap-2
              px-5
              py-2.5
              bg-blue-600
              hover:bg-blue-700
              disabled:bg-blue-400
              text-white
              rounded-lg
            "
          >
            <Save
              size={18}
            />

            {saving
              ? 'Menyimpan...'
              : 'Simpan Monitoring'}
          </button>

        </div>

      </form>

    </div>
  );
}