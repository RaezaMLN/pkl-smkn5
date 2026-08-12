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
  Save,
} from 'lucide-react';

interface Siswa {
  id: string;
  nama: string;
  kelas?: string;
  jurusan?: string;
  perusahaanId: string;
  perusahaanNama: string;
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

export default function TambahMonitoringPage() {
  const router = useRouter();

  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [selectedSiswaId, setSelectedSiswaId] = useState('');

  const [tanggal, setTanggal] = useState('');
  const [waktu, setWaktu] = useState('');

  const [jenisMonitoring, setJenisMonitoring] =
    useState('kunjungan_langsung');

  const [kriteria, setKriteria] =
    useState<any>(defaultKriteria);

  const [deskripsiPerkembangan, setDeskripsiPerkembangan] =
    useState('');

  const [kendala, setKendala] = useState('');
  const [tindakLanjut, setTindakLanjut] = useState('');

  const [statusPerkembangan, setStatusPerkembangan] =
    useState('baik');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');

  useEffect(() => {
    const isLoggedIn =
      localStorage.getItem('isPembimbingLoggedIn');

    if (isLoggedIn !== 'true') {
      router.replace('/pembimbing/login');
    }
  }, [router]);

  useEffect(() => {
    const fetchSiswa = async () => {
      try {
        const pembimbingLocal =
          localStorage.getItem('pembimbing');

        if (!pembimbingLocal) return;

        const pembimbing =
          JSON.parse(pembimbingLocal);

        const perusahaanSnap =
          await getDocs(collection(db, 'perusahaan'));

        const result: Siswa[] = [];

        for (const perDoc of perusahaanSnap.docs) {
          const perData = perDoc.data();

          if (
            perData.pembimbingId ===
            pembimbing.id
          ) {
            const siswaIds =
              perData.siswa_terdaftar || [];

            for (const siswaId of siswaIds) {
              const siswaDoc =
                await getDoc(
                  doc(db, 'siswa', siswaId)
                );

              if (siswaDoc.exists()) {
                const data = siswaDoc.data();

                result.push({
                  id: siswaDoc.id,
                  nama: data.nama,
                  kelas: data.kelas,
                  jurusan: data.jurusan,
                  perusahaanId: perDoc.id,
                  perusahaanNama:
                    perData.nama,
                });
              }
            }
          }
        }

        setSiswaList(result);
      } catch (err) {
        console.error(err);
        setError(
          'Gagal mengambil data siswa bimbingan.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSiswa();
  }, []);

  const selectedSiswa =
    siswaList.find(
      (s) => s.id === selectedSiswaId
    );

  const handleKriteriaChange = (
    key: string,
    value: number
  ) => {
    setKriteria((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  const validateForm = () => {
    if (!selectedSiswa) {
      setError(
        'Silakan pilih siswa yang dimonitoring.'
      );
      return false;
    }

    if (!tanggal) {
      setError(
        'Tanggal monitoring wajib diisi.'
      );
      return false;
    }

    const nilaiKriteria =
      Object.values(kriteria);

    if (
      nilaiKriteria.some(
        (value) => value === 0
      )
    ) {
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

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError('');

    if (!validateForm()) return;

    try {
      setSaving(true);

      const pembimbingLocal =
        localStorage.getItem('pembimbing');

      if (!pembimbingLocal) {
        router.replace('/pembimbing/login');
        return;
      }

      const pembimbing =
        JSON.parse(pembimbingLocal);

      await addDoc(
        collection(db, 'monitoring'),
        {
          pembimbingId:
            pembimbing.id,

          siswaId:
            selectedSiswa!.id,

          perusahaanId:
            selectedSiswa!.perusahaanId,

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

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        }
      );

      router.push(
        '/pembimbing/monitoring'
      );
    } catch (err) {
      console.error(err);

      setError(
        'Monitoring gagal disimpan. Silakan coba kembali.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 mb-4 text-blue-600 hover:underline"
      >
        <ArrowLeft size={16} />
        Kembali
      </button>

      <div className="flex items-center gap-2 mb-6">
        <ClipboardCheck className="text-blue-600" />

        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Tambah Monitoring Siswa
        </h1>
      </div>

      {error && (
        <div className="mb-5 p-3 rounded-lg bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* DATA SISWA */}

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow rounded-xl p-6">
          <h2 className="font-semibold text-lg mb-4">
            Data Siswa
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2">
                Siswa *
              </label>

              <select
                value={selectedSiswaId}
                onChange={(e) =>
                  setSelectedSiswaId(
                    e.target.value
                  )
                }
                className="w-full border rounded-lg p-2.5 bg-white dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">
                  Pilih siswa
                </option>

                {siswaList.map((s) => (
                  <option
                    key={s.id}
                    value={s.id}
                  >
                    {s.nama}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2">
                Kelas
              </label>

              <input
                value={
                  selectedSiswa?.kelas ||
                  ''
                }
                readOnly
                className="w-full border rounded-lg p-2.5 bg-gray-100 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">
                Jurusan
              </label>

              <input
                value={
                  selectedSiswa?.jurusan ||
                  ''
                }
                readOnly
                className="w-full border rounded-lg p-2.5 bg-gray-100 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">
                Tempat PKL
              </label>

              <input
                value={
                  selectedSiswa?.perusahaanNama ||
                  ''
                }
                readOnly
                className="w-full border rounded-lg p-2.5 bg-gray-100 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
        </div>

        {/* WAKTU */}

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow rounded-xl p-6">
          <h2 className="font-semibold text-lg mb-4">
            Pelaksanaan Monitoring
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-2">
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
                className="w-full border rounded-lg p-2.5 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">
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
                className="w-full border rounded-lg p-2.5 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">
                Jenis Monitoring
              </label>

              <select
                value={jenisMonitoring}
                onChange={(e) =>
                  setJenisMonitoring(
                    e.target.value
                  )
                }
                className="w-full border rounded-lg p-2.5 dark:bg-gray-700 dark:border-gray-600"
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

        {/* KRITERIA */}

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow rounded-xl p-6">
          <h2 className="font-semibold text-lg mb-2">
            Penilaian Perkembangan
          </h2>

          <p className="text-sm text-gray-500 mb-6">
            Berikan penilaian berdasarkan
            hasil monitoring siswa.
          </p>

          <div className="space-y-5">
            {criteriaList.map(
              (item) => (
                <div
                  key={item.key}
                  className="border-b pb-4"
                >
                  <p className="font-medium mb-3">
                    {item.label}
                  </p>

                  <div className="flex flex-wrap gap-4">
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
                      (option) => (
                        <label
                          key={
                            option.value
                          }
                          className="flex items-center gap-2 cursor-pointer"
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
                          />

                          <span className="text-sm">
                            {
                              option.label
                            }
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

        {/* CATATAN */}

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow rounded-xl p-6 space-y-5">
          <h2 className="font-semibold text-lg">
            Catatan Monitoring
          </h2>

          <div>
            <label className="block text-sm mb-2">
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
              className="w-full border rounded-lg p-3 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">
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
              className="w-full border rounded-lg p-3 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">
              Tindak Lanjut / Saran
            </label>

            <textarea
              rows={4}
              value={tindakLanjut}
              onChange={(e) =>
                setTindakLanjut(
                  e.target.value
                )
              }
              placeholder="Tuliskan tindak lanjut atau saran pembimbing..."
              className="w-full border rounded-lg p-3 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">
              Status Perkembangan
            </label>

            <select
              value={statusPerkembangan}
              onChange={(e) =>
                setStatusPerkembangan(
                  e.target.value
                )
              }
              className="w-full md:w-1/2 border rounded-lg p-2.5 dark:bg-gray-700 dark:border-gray-600"
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

        {/* BUTTON */}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() =>
              router.push(
                '/pembimbing/monitoring'
              )
            }
            className="px-5 py-2.5 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg"
          >
            <Save size={18} />

            {saving
              ? 'Menyimpan...'
              : 'Simpan Monitoring'}
          </button>
        </div>
      </form>
    </div>
  );
}