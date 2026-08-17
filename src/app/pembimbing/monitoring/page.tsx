'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { db } from '@/lib/firebase';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

import {
  ClipboardCheck,
  Eye,
  Plus,
  Search,
} from 'lucide-react';

/*
|--------------------------------------------------------------------------
| INTERFACE
|--------------------------------------------------------------------------
*/

interface Monitoring {
  id: string;

  siswaId: string;
  perusahaanId: string;

  tanggal: string;
  waktu?: string;

  jenisMonitoring: string;
  statusPerkembangan: string;

  /*
  |--------------------------------------------------------------------------
  | PROGRESS PROJECT
  |--------------------------------------------------------------------------
  */

  progressProject?: number;

  /*
  |--------------------------------------------------------------------------
  | RELASI
  |--------------------------------------------------------------------------
  */

  siswaNama?: string;
  kelas?: string;
  perusahaanNama?: string;
}

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function MonitoringPage() {
  const router = useRouter();

  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [monitoring, setMonitoring] =
    useState<Monitoring[]>([]);

  const [search, setSearch] =
    useState('');

  const [loading, setLoading] =
    useState(true);

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

    if (isLoggedIn !== 'true') {
      router.replace(
        '/pembimbing/login'
      );
    }
  }, [router]);

  /*
  |--------------------------------------------------------------------------
  | FETCH MONITORING
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let cancelled = false;

    const fetchMonitoring = async () => {
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

        if (!pembimbing?.id) {
          router.replace(
            '/pembimbing/login'
          );

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | QUERY MONITORING
        |--------------------------------------------------------------------------
        */

        const q = query(
          collection(
            db,
            'monitoring'
          ),
          where(
            'pembimbingId',
            '==',
            pembimbing.id
          )
        );

        const monitoringSnap =
          await getDocs(q);

        /*
        |--------------------------------------------------------------------------
        | CACHE
        |--------------------------------------------------------------------------
        |
        | Digunakan agar siswa / perusahaan yang sama tidak
        | diambil berulang kali dari Firestore.
        |
        */

        const siswaCache =
          new Map<
            string,
            {
              nama: string;
              kelas: string;
            }
          >();

        const perusahaanCache =
          new Map<
            string,
            string
          >();

        /*
        |--------------------------------------------------------------------------
        | AMBIL DATA RELASI
        |--------------------------------------------------------------------------
        */

        const result =
          await Promise.all(
            monitoringSnap.docs.map(
              async (monitorDoc) => {
                const data =
                  monitorDoc.data();

                let siswaNama =
                  'Siswa';

                let kelas =
                  '-';

                let perusahaanNama =
                  '-';

                /*
                |--------------------------------------------------------------------------
                | SISWA
                |--------------------------------------------------------------------------
                */

                if (data.siswaId) {
                  const cachedSiswa =
                    siswaCache.get(
                      data.siswaId
                    );

                  if (cachedSiswa) {
                    siswaNama =
                      cachedSiswa.nama;

                    kelas =
                      cachedSiswa.kelas;
                  } else {
                    try {
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
                        const siswaData =
                          siswaDoc.data();

                        siswaNama =
                          siswaData.nama ||
                          'Siswa';

                        kelas =
                          siswaData.kelas ||
                          '-';

                        siswaCache.set(
                          data.siswaId,
                          {
                            nama:
                              siswaNama,

                            kelas,
                          }
                        );
                      }
                    } catch (err) {
                      console.error(
                        'Gagal mengambil siswa:',
                        data.siswaId,
                        err
                      );
                    }
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
                  const cachedPerusahaan =
                    perusahaanCache.get(
                      data.perusahaanId
                    );

                  if (
                    cachedPerusahaan
                  ) {
                    perusahaanNama =
                      cachedPerusahaan;
                  } else {
                    try {
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
                        perusahaanNama =
                          perusahaanDoc.data()
                            .nama ||
                          '-';

                        perusahaanCache.set(
                          data.perusahaanId,
                          perusahaanNama
                        );
                      }
                    } catch (err) {
                      console.error(
                        'Gagal mengambil perusahaan:',
                        data.perusahaanId,
                        err
                      );
                    }
                  }
                }

                /*
                |--------------------------------------------------------------------------
                | RETURN
                |--------------------------------------------------------------------------
                */

                return {
                  id:
                    monitorDoc.id,

                  siswaId:
                    data.siswaId ||
                    '',

                  perusahaanId:
                    data.perusahaanId ||
                    '',

                  tanggal:
                    data.tanggal ||
                    '',

                  waktu:
                    data.waktu ||
                    '',

                  jenisMonitoring:
                    data.jenisMonitoring ||
                    '',

                  statusPerkembangan:
                    data.statusPerkembangan ||
                    '',

                  /*
                  |--------------------------------------------------------------------------
                  | LANGSUNG DARI MONITORING
                  |--------------------------------------------------------------------------
                  |
                  | TIDAK ADA QUERY TAMBAHAN.
                  |
                  */

                  progressProject:
                    typeof data.progressProject ===
                    'number'
                      ? data.progressProject
                      : undefined,

                  siswaNama,

                  kelas,

                  perusahaanNama,
                } as Monitoring;
              }
            )
          );

        /*
        |--------------------------------------------------------------------------
        | SORT TANGGAL TERBARU
        |--------------------------------------------------------------------------
        */

        result.sort(
          (a, b) =>
            new Date(
              b.tanggal
            ).getTime() -
            new Date(
              a.tanggal
            ).getTime()
        );

        if (!cancelled) {
          setMonitoring(
            result
          );
        }
      } catch (err) {
        console.error(
          'Gagal mengambil monitoring:',
          err
        );

        if (!cancelled) {
          setError(
            'Gagal mengambil data monitoring.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchMonitoring();

    return () => {
      cancelled = true;
    };
  }, [router]);

  /*
  |--------------------------------------------------------------------------
  | FILTER SEARCH
  |--------------------------------------------------------------------------
  */

  const filtered =
    monitoring.filter(
      (item) => {
        const keyword =
          search
            .trim()
            .toLowerCase();

        if (!keyword) {
          return true;
        }

        return (
          item.siswaNama
            ?.toLowerCase()
            .includes(
              keyword
            ) ||
          item.kelas
            ?.toLowerCase()
            .includes(
              keyword
            ) ||
          item.perusahaanNama
            ?.toLowerCase()
            .includes(
              keyword
            )
        );
      }
    );

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
          dark:bg-green-900/40
          dark:text-green-300
        `;

      case 'baik':
        return `
          bg-blue-100
          text-blue-700
          dark:bg-blue-900/40
          dark:text-blue-300
        `;

      case 'perlu_perhatian':
        return `
          bg-yellow-100
          text-yellow-700
          dark:bg-yellow-900/40
          dark:text-yellow-300
        `;

      case 'bermasalah':
        return `
          bg-red-100
          text-red-700
          dark:bg-red-900/40
          dark:text-red-300
        `;

      default:
        return `
          bg-gray-100
          text-gray-700
          dark:bg-gray-700
          dark:text-gray-300
        `;
    }
  };

  /*
  |--------------------------------------------------------------------------
  | PROGRESS PROJECT
  |--------------------------------------------------------------------------
  */

  const progressLabel = (
    progress?: number
  ) => {
    /*
    |--------------------------------------------------------------------------
    | DATA MONITORING LAMA
    |--------------------------------------------------------------------------
    */

    if (
      progress === undefined ||
      progress === null
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

  const progressClass = (
    progress?: number
  ) => {
    if (
      progress === undefined ||
      progress === null
    ) {
      return `
        bg-gray-100
        text-gray-600
        dark:bg-gray-700
        dark:text-gray-300
      `;
    }

    if (progress === 100) {
      return `
        bg-green-100
        text-green-700
        dark:bg-green-900/40
        dark:text-green-300
      `;
    }

    if (progress >= 76) {
      return `
        bg-blue-100
        text-blue-700
        dark:bg-blue-900/40
        dark:text-blue-300
      `;
    }

    if (progress >= 51) {
      return `
        bg-cyan-100
        text-cyan-700
        dark:bg-cyan-900/40
        dark:text-cyan-300
      `;
    }

    if (progress >= 26) {
      return `
        bg-yellow-100
        text-yellow-700
        dark:bg-yellow-900/40
        dark:text-yellow-300
      `;
    }

    if (progress > 0) {
      return `
        bg-orange-100
        text-orange-700
        dark:bg-orange-900/40
        dark:text-orange-300
      `;
    }

    return `
      bg-gray-100
      text-gray-700
      dark:bg-gray-700
      dark:text-gray-300
    `;
  };

  /*
  |--------------------------------------------------------------------------
  | FORMAT JENIS MONITORING
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
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="max-w-7xl mx-auto">

      {/* ==========================================================
          HEADER
      ========================================================== */}

      <div
        className="
          flex
          flex-col
          md:flex-row
          md:items-center
          justify-between
          gap-4
          mb-6
        "
      >

        <div className="flex items-center gap-3">

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
              Monitoring PKL
            </h1>

            <p
              className="
                text-sm
                text-gray-500
                dark:text-gray-400
              "
            >
              Riwayat monitoring perkembangan siswa bimbingan.
            </p>

          </div>

        </div>

        <button
          onClick={() =>
            router.push(
              '/pembimbing/monitoring/tambah'
            )
          }
          className="
            flex
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

      </div>

      {/* ==========================================================
          ERROR
      ========================================================== */}

      {error && (
        <div
          className="
            mb-5
            p-4
            rounded-xl
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
          CARD
      ========================================================== */}

      <div
        className="
          bg-white
          dark:bg-gray-800
          border
          border-gray-200
          dark:border-gray-700
          rounded-xl
          shadow
        "
      >

        {/* SEARCH */}

        <div
          className="
            p-4
            border-b
            border-gray-200
            dark:border-gray-700
          "
        >

          <div className="relative max-w-md">

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
              placeholder="Cari siswa, kelas, atau perusahaan..."
              className="
                w-full
                pl-10
                pr-3
                py-2.5
                border
                border-gray-300
                rounded-lg
                dark:bg-gray-700
                dark:border-gray-600
                text-gray-900
                dark:text-white
              "
            />

          </div>

        </div>

        {/* ========================================================
            LOADING
        ======================================================== */}

        {loading ? (
          <div
            className="
              text-center
              py-10
              text-gray-500
              dark:text-gray-400
            "
          >
            Loading...
          </div>
        ) : filtered.length > 0 ? (

          /* ======================================================
              TABLE
          ====================================================== */

          <div className="overflow-x-auto">

            <table className="min-w-full">

              <thead
                className="
                  bg-gray-100
                  dark:bg-gray-700
                "
              >
                <tr>

                  <th
                    className="
                      text-left
                      px-4
                      py-3
                      whitespace-nowrap
                    "
                  >
                    Tanggal
                  </th>

                  <th
                    className="
                      text-left
                      px-4
                      py-3
                    "
                  >
                    Siswa
                  </th>

                  <th
                    className="
                      text-left
                      px-4
                      py-3
                    "
                  >
                    Kelas
                  </th>

                  <th
                    className="
                      text-left
                      px-4
                      py-3
                    "
                  >
                    Perusahaan
                  </th>

                  <th
                    className="
                      text-left
                      px-4
                      py-3
                      whitespace-nowrap
                    "
                  >
                    Jenis
                  </th>

                  {/* PROGRESS */}

                  <th
                    className="
                      text-left
                      px-4
                      py-3
                      whitespace-nowrap
                    "
                  >
                    Progress Project
                  </th>

                  <th
                    className="
                      text-left
                      px-4
                      py-3
                      whitespace-nowrap
                    "
                  >
                    Status
                  </th>

                  <th
                    className="
                      text-center
                      px-4
                      py-3
                    "
                  >
                    Aksi
                  </th>

                </tr>
              </thead>

              <tbody>

                {filtered.map(
                  (item) => (
                    <tr
                      key={
                        item.id
                      }
                      className="
                        border-t
                        border-gray-200
                        dark:border-gray-700
                        hover:bg-gray-50
                        dark:hover:bg-gray-700/40
                        transition
                      "
                    >

                      {/* TANGGAL */}

                      <td
                        className="
                          px-4
                          py-3
                          whitespace-nowrap
                        "
                      >
                        {
                          item.tanggal
                        }

                        {item.waktu && (
                          <div
                            className="
                              text-xs
                              text-gray-500
                              dark:text-gray-400
                              mt-1
                            "
                          >
                            {
                              item.waktu
                            }
                          </div>
                        )}

                      </td>

                      {/* SISWA */}

                      <td
                        className="
                          px-4
                          py-3
                          font-medium
                          text-gray-900
                          dark:text-white
                        "
                      >
                        {
                          item.siswaNama
                        }
                      </td>

                      {/* KELAS */}

                      <td
                        className="
                          px-4
                          py-3
                          whitespace-nowrap
                        "
                      >
                        {
                          item.kelas
                        }
                      </td>

                      {/* PERUSAHAAN */}

                      <td
                        className="
                          px-4
                          py-3
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
                          py-3
                          capitalize
                          whitespace-nowrap
                        "
                      >
                        {jenisMonitoringLabel(
                          item.jenisMonitoring
                        )}
                      </td>

                      {/* ==================================================
                          PROGRESS PROJECT
                      ================================================== */}

                      <td
                        className="
                          px-4
                          py-3
                          min-w-[180px]
                        "
                      >

                        {item.progressProject !==
                          undefined ? (
                          <div className="space-y-2">

                            <div
                              className="
                                flex
                                items-center
                                gap-2
                              "
                            >

                              <span
                                className="
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
                                className={`
                                  text-[11px]
                                  px-2
                                  py-1
                                  rounded-full
                                  whitespace-nowrap
                                  ${progressClass(
                                    item.progressProject
                                  )}
                                `}
                              >
                                {progressLabel(
                                  item.progressProject
                                )}
                              </span>

                            </div>

                            {/* BAR */}

                            <div
                              className="
                                w-full
                                max-w-[150px]
                                h-2
                                bg-gray-200
                                dark:bg-gray-700
                                rounded-full
                                overflow-hidden
                              "
                            >
                              <div
                                style={{
                                  width:
                                    `${Math.min(
                                      Math.max(
                                        item.progressProject,
                                        0
                                      ),
                                      100
                                    )}%`,
                                }}
                                className={`
                                  h-full
                                  rounded-full
                                  ${
                                    item.progressProject ===
                                    100
                                      ? 'bg-green-600'
                                      : item.progressProject >=
                                        76
                                      ? 'bg-blue-600'
                                      : item.progressProject >=
                                        51
                                      ? 'bg-cyan-600'
                                      : item.progressProject >=
                                        26
                                      ? 'bg-yellow-500'
                                      : item.progressProject >
                                        0
                                      ? 'bg-orange-500'
                                      : 'bg-gray-400'
                                  }
                                `}
                              />
                            </div>

                          </div>
                        ) : (
                          <span
                            className="
                              text-xs
                              text-gray-400
                              dark:text-gray-500
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
                          py-3
                        "
                      >

                        <span
                          className={`
                            text-xs
                            font-medium
                            px-2.5
                            py-1.5
                            rounded-full
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

                      {/* AKSI */}

                      <td
                        className="
                          px-4
                          py-3
                          text-center
                        "
                      >

                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/pembimbing/monitoring/${item.id}`
                            )
                          }
                          className="
                            inline-flex
                            items-center
                            gap-1
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

          /* ======================================================
              EMPTY
          ====================================================== */

          <div
            className="
              text-center
              py-10
              text-gray-500
              dark:text-gray-400
            "
          >
            {search
              ? 'Data monitoring tidak ditemukan.'
              : 'Belum ada data monitoring.'}
          </div>
        )}

      </div>

    </div>
  );
}