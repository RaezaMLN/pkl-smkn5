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

interface Monitoring {
  id: string;
  siswaId: string;
  perusahaanId: string;
  tanggal: string;
  waktu?: string;
  jenisMonitoring: string;
  statusPerkembangan: string;

  siswaNama?: string;
  kelas?: string;
  perusahaanNama?: string;
}

export default function MonitoringPage() {
  const router = useRouter();

  const [monitoring, setMonitoring] =
    useState<Monitoring[]>([]);

  const [search, setSearch] =
    useState('');

  const [loading, setLoading] =
    useState(true);

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

  useEffect(() => {
    const fetchMonitoring =
      async () => {
        try {
          const pembimbingLocal =
            localStorage.getItem(
              'pembimbing'
            );

          if (!pembimbingLocal)
            return;

          const pembimbing =
            JSON.parse(
              pembimbingLocal
            );

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

          const result: Monitoring[] =
            [];

          for (
            const monitorDoc of
            monitoringSnap.docs
          ) {
            const data =
              monitorDoc.data();

            let siswaNama =
              'Siswa';
            let kelas = '-';
            let perusahaanNama =
              '-';

            if (data.siswaId) {
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
                siswaNama =
                  siswaDoc.data()
                    .nama ||
                  'Siswa';

                kelas =
                  siswaDoc.data()
                    .kelas ||
                  '-';
              }
            }

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
                perusahaanNama =
                  perusahaanDoc.data()
                    .nama ||
                  '-';
              }
            }

            result.push({
              id: monitorDoc.id,

              siswaId:
                data.siswaId,

              perusahaanId:
                data.perusahaanId,

              tanggal:
                data.tanggal,

              waktu:
                data.waktu,

              jenisMonitoring:
                data.jenisMonitoring,

              statusPerkembangan:
                data.statusPerkembangan,

              siswaNama,
              kelas,
              perusahaanNama,
            });
          }

          result.sort(
            (a, b) =>
              new Date(
                b.tanggal
              ).getTime() -
              new Date(
                a.tanggal
              ).getTime()
          );

          setMonitoring(result);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

    fetchMonitoring();
  }, []);

  const filtered =
    monitoring.filter(
      (item) =>
        item.siswaNama
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          )
    );

  const statusLabel = (
    status: string
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
        return status;
    }
  };

  const statusClass = (
    status: string
  ) => {
    switch (status) {
      case 'sangat_baik':
        return 'bg-green-100 text-green-700';

      case 'baik':
        return 'bg-blue-100 text-blue-700';

      case 'perlu_perhatian':
        return 'bg-yellow-100 text-yellow-700';

      case 'bermasalah':
        return 'bg-red-100 text-red-700';

      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="text-blue-600" />

          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Monitoring PKL
            </h1>

            <p className="text-sm text-gray-500">
              Riwayat monitoring
              perkembangan siswa
              bimbingan.
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            router.push(
              '/pembimbing/monitoring/tambah'
            )
          }
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg"
        >
          <Plus size={18} />

          Tambah Monitoring
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow">
        <div className="p-4 border-b dark:border-gray-700">
          <div className="relative max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-3 text-gray-400"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Cari siswa..."
              className="w-full pl-10 pr-3 py-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10">
            Loading...
          </div>
        ) : filtered.length >
          0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="text-left px-4 py-3">
                    Tanggal
                  </th>

                  <th className="text-left px-4 py-3">
                    Siswa
                  </th>

                  <th className="text-left px-4 py-3">
                    Kelas
                  </th>

                  <th className="text-left px-4 py-3">
                    Perusahaan
                  </th>

                  <th className="text-left px-4 py-3">
                    Jenis
                  </th>

                  <th className="text-left px-4 py-3">
                    Status
                  </th>

                  <th className="text-center px-4 py-3">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map(
                  (item) => (
                    <tr
                      key={item.id}
                      className="border-t dark:border-gray-700"
                    >
                      <td className="px-4 py-3">
                        {item.tanggal}

                        {item.waktu && (
                          <div className="text-xs text-gray-500">
                            {
                              item.waktu
                            }
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 font-medium">
                        {
                          item.siswaNama
                        }
                      </td>

                      <td className="px-4 py-3">
                        {item.kelas}
                      </td>

                      <td className="px-4 py-3">
                        {
                          item.perusahaanNama
                        }
                      </td>

                      <td className="px-4 py-3">
                        {item.jenisMonitoring
                          ?.replaceAll(
                            '_',
                            ' '
                          )}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-1 rounded ${statusClass(
                            item.statusPerkembangan
                          )}`}
                        >
                          {statusLabel(
                            item.statusPerkembangan
                          )}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() =>
                            router.push(
                              `/pembimbing/monitoring/${item.id}`
                            )
                          }
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <Eye
                            size={
                              16
                            }
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
          <div className="text-center py-10 text-gray-500">
            Belum ada data
            monitoring.
          </div>
        )}
      </div>
    </div>
  );
}