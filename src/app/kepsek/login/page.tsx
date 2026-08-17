'use client';

import {
  FormEvent,
  useEffect,
  useState,
} from 'react';

import {
  useRouter,
} from 'next/navigation';

import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

import {
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Lock,
  LogIn,
  User,
} from 'lucide-react';

import { db } from '@/lib/firebase';

export default function LoginKepsekPage() {
  const router = useRouter();

  /*
  |--------------------------------------------------------------------------
  | FORM STATE
  |--------------------------------------------------------------------------
  */

  const [username, setUsername] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | UI STATE
  |--------------------------------------------------------------------------
  */

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  /*
  |--------------------------------------------------------------------------
  | CEK LOGIN
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const isLoggedIn =
      localStorage.getItem(
        'isKepsekLoggedIn'
      );

    const kepsek =
      localStorage.getItem(
        'kepsek'
      );

    /*
    |--------------------------------------------------------------------------
    | SUDAH LOGIN
    |--------------------------------------------------------------------------
    */

    if (
      isLoggedIn === 'true' &&
      kepsek
    ) {
      router.replace(
        '/kepsek/dashboard'
      );
    }
  }, [router]);

  /*
  |--------------------------------------------------------------------------
  | LOGIN
  |--------------------------------------------------------------------------
  */

  const handleLogin = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError('');

    /*
    |--------------------------------------------------------------------------
    | VALIDASI
    |--------------------------------------------------------------------------
    */

    if (!username.trim()) {
      setError(
        'Username wajib diisi.'
      );

      return;
    }

    if (!password) {
      setError(
        'Password wajib diisi.'
      );

      return;
    }

    try {
      setLoading(true);

      /*
      |--------------------------------------------------------------------------
      | CARI AKUN KEPSEK
      |--------------------------------------------------------------------------
      */

      const q = query(
        collection(
          db,
          'kepsek'
        ),
        where(
          'username',
          '==',
          username.trim()
        )
      );

      const snapshot =
        await getDocs(q);

      /*
      |--------------------------------------------------------------------------
      | AKUN TIDAK DITEMUKAN
      |--------------------------------------------------------------------------
      */

      if (snapshot.empty) {
        setError(
          'Username atau password salah.'
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | AMBIL AKUN
      |--------------------------------------------------------------------------
      */

      const kepsekDoc =
        snapshot.docs[0];

      const data =
        kepsekDoc.data();

      /*
      |--------------------------------------------------------------------------
      | STATUS
      |--------------------------------------------------------------------------
      */

      if (
        data.status &&
        data.status !== 'aktif'
      ) {
        setError(
          'Akun Kepala Sekolah sedang tidak aktif.'
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | PASSWORD
      |--------------------------------------------------------------------------
      */

      if (
        data.password !== password
      ) {
        setError(
          'Username atau password salah.'
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | SESSION LOCAL STORAGE
      |--------------------------------------------------------------------------
      */

      const kepsekData = {
        id:
          kepsekDoc.id,

        nama:
          data.nama ||
          'Kepala Sekolah',

        username:
          data.username ||
          username.trim(),
      };

      localStorage.setItem(
        'isKepsekLoggedIn',
        'true'
      );

      localStorage.setItem(
        'kepsek',
        JSON.stringify(
          kepsekData
        )
      );

      /*
      |--------------------------------------------------------------------------
      | REDIRECT
      |--------------------------------------------------------------------------
      */

      router.replace(
        '/kepsek/dashboard'
      );
    } catch (err) {
      console.error(
        'Login Kepala Sekolah gagal:',
        err
      );

      setError(
        'Terjadi kesalahan saat login. Silakan coba kembali.'
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div
      className="
        min-h-screen
        flex
        items-center
        justify-center
        bg-gray-50
        dark:bg-gray-950
        px-4
        py-10
      "
    >

      <div
        className="
          w-full
          max-w-md
        "
      >

        {/* ==========================================================
            LOGO
        ========================================================== */}

        <div
          className="
            text-center
            mb-8
          "
        >

          <div
            className="
              inline-flex
              items-center
              justify-center
              w-16
              h-16
              rounded-2xl
              bg-blue-600
              text-white
              shadow-lg
              mb-4
            "
          >
            <GraduationCap
              size={34}
            />
          </div>

          <h1
            className="
              text-3xl
              font-bold
              text-gray-900
              dark:text-white
            "
          >
            E-PKL
          </h1>

          <p
            className="
              text-gray-500
              dark:text-gray-400
              mt-1
            "
          >
            Monitoring Praktik Kerja Lapangan
          </p>

        </div>

        {/* ==========================================================
            LOGIN CARD
        ========================================================== */}

        <div
          className="
            bg-white
            dark:bg-gray-900
            border
            border-gray-200
            dark:border-gray-800
            rounded-2xl
            shadow-xl
            p-6
            sm:p-8
          "
        >

          {/* HEADER */}

          <div
            className="
              mb-6
            "
          >

            <h2
              className="
                text-xl
                font-semibold
                text-gray-900
                dark:text-white
              "
            >
              Login Kepala Sekolah
            </h2>

            <p
              className="
                text-sm
                text-gray-500
                dark:text-gray-400
                mt-1
              "
            >
              Masuk untuk melihat dashboard monitoring PKL.
            </p>

          </div>

          {/* ========================================================
              ERROR
          ======================================================== */}

          {error && (
            <div
              className="
                mb-5
                bg-red-50
                dark:bg-red-950/40
                border
                border-red-200
                dark:border-red-900
                text-red-700
                dark:text-red-300
                rounded-lg
                px-4
                py-3
                text-sm
              "
            >
              {error}
            </div>
          )}

          {/* ========================================================
              FORM
          ======================================================== */}

          <form
            onSubmit={
              handleLogin
            }
            className="
              space-y-5
            "
          >

            {/* USERNAME */}

            <div>

              <label
                htmlFor="username"
                className="
                  block
                  text-sm
                  font-medium
                  text-gray-700
                  dark:text-gray-200
                  mb-2
                "
              >
                Username
              </label>

              <div
                className="
                  relative
                "
              >

                <User
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
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  disabled={loading}
                  onChange={(e) =>
                    setUsername(
                      e.target.value
                    )
                  }
                  placeholder="Masukkan username"
                  className="
                    w-full
                    pl-10
                    pr-4
                    py-3
                    border
                    border-gray-300
                    dark:border-gray-700
                    rounded-lg
                    bg-white
                    dark:bg-gray-800
                    text-gray-900
                    dark:text-white
                    placeholder:text-gray-400
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-500
                    focus:border-blue-500
                    disabled:opacity-60
                  "
                />

              </div>

            </div>

            {/* PASSWORD */}

            <div>

              <label
                htmlFor="password"
                className="
                  block
                  text-sm
                  font-medium
                  text-gray-700
                  dark:text-gray-200
                  mb-2
                "
              >
                Password
              </label>

              <div
                className="
                  relative
                "
              >

                <Lock
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
                  id="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  autoComplete="current-password"
                  value={password}
                  disabled={loading}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  placeholder="Masukkan password"
                  className="
                    w-full
                    pl-10
                    pr-12
                    py-3
                    border
                    border-gray-300
                    dark:border-gray-700
                    rounded-lg
                    bg-white
                    dark:bg-gray-800
                    text-gray-900
                    dark:text-white
                    placeholder:text-gray-400
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-500
                    focus:border-blue-500
                    disabled:opacity-60
                  "
                />

                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    setShowPassword(
                      (prev) =>
                        !prev
                    )
                  }
                  className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    text-gray-400
                    hover:text-gray-600
                    dark:hover:text-gray-200
                    disabled:opacity-50
                  "
                  aria-label={
                    showPassword
                      ? 'Sembunyikan password'
                      : 'Tampilkan password'
                  }
                >

                  {showPassword ? (
                    <EyeOff
                      size={19}
                    />
                  ) : (
                    <Eye
                      size={19}
                    />
                  )}

                </button>

              </div>

            </div>

            {/* ======================================================
                BUTTON
            ====================================================== */}

            <button
              type="submit"
              disabled={loading}
              className="
                w-full
                flex
                items-center
                justify-center
                gap-2
                bg-blue-600
                hover:bg-blue-700
                disabled:bg-blue-400
                text-white
                font-medium
                py-3
                px-4
                rounded-lg
                transition
              "
            >

              {loading ? (
                <>
                  <Loader2
                    size={19}
                    className="
                      animate-spin
                    "
                  />

                  Memproses...
                </>
              ) : (
                <>
                  <LogIn
                    size={19}
                  />

                  Masuk
                </>
              )}

            </button>

          </form>

        </div>

        {/* ==========================================================
            FOOTER
        ========================================================== */}

        <p
          className="
            text-center
            text-xs
            text-gray-400
            dark:text-gray-500
            mt-6
          "
        >
          E-PKL • Akses Kepala Sekolah
        </p>

      </div>

    </div>
  );
}