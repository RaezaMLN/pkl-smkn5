'use client';

import Link from 'next/link';
import {
  usePathname,
  useRouter,
} from 'next/navigation';

import {
  ClipboardCheck,
  FileDown,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  TrendingUp,
} from 'lucide-react';

const menuItems = [
  {
    label: 'Dashboard',
    href: '/kepsek/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Monitoring',
    href: '/kepsek/monitoring',
    icon: ClipboardCheck,
  },
  {
    label: 'Progress',
    href: '/kepsek/progress',
    icon: TrendingUp,
  },
  {
    label: 'Laporan',
    href: '/kepsek/laporan',
    icon: FileDown,
  },
];

export default function SidebarKepsek() {
  const pathname = usePathname();
  const router = useRouter();

  /*
  |--------------------------------------------------------------------------
  | ACTIVE MENU
  |--------------------------------------------------------------------------
  */

  const isActive = (
    href: string
  ) => {
    if (
      href ===
      '/kepsek/dashboard'
    ) {
      return (
        pathname ===
        '/kepsek/dashboard'
      );
    }

    return pathname.startsWith(
      href
    );
  };

  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  const handleLogout = () => {
    localStorage.removeItem(
      'isKepsekLoggedIn'
    );

    localStorage.removeItem(
      'kepsek'
    );

    router.replace(
      '/kepsek/login'
    );
  };

  return (
    <>
      {/* ================================================================
          DESKTOP SIDEBAR
      ================================================================= */}

      <aside
        className="
          hidden
          lg:flex
          fixed
          left-0
          top-0
          bottom-0
          z-40
          w-64
          flex-col
          bg-white
          dark:bg-gray-900
          border-r
          border-gray-200
          dark:border-gray-800
        "
      >

        {/* LOGO */}

        <div
          className="
            h-20
            flex
            items-center
            px-6
            border-b
            border-gray-200
            dark:border-gray-800
          "
        >

          <div className="flex items-center gap-3">

            <div
              className="
                w-10
                h-10
                flex
                items-center
                justify-center
                rounded-xl
                bg-blue-600
                text-white
              "
            >
              <GraduationCap
                size={24}
              />
            </div>

            <div>

              <h1
                className="
                  font-bold
                  text-lg
                  text-gray-900
                  dark:text-white
                "
              >
                E-PKL
              </h1>

              <p
                className="
                  text-xs
                  text-gray-500
                  dark:text-gray-400
                "
              >
                Kepala Sekolah
              </p>

            </div>

          </div>

        </div>

        {/* MENU */}

        <nav
          className="
            flex-1
            px-4
            py-6
            space-y-2
          "
        >

          {menuItems.map(
            (item) => {
              const Icon =
                item.icon;

              const active =
                isActive(
                  item.href
                );

              return (
                <Link
                  key={
                    item.href
                  }
                  href={
                    item.href
                  }
                  className={`
                    flex
                    items-center
                    gap-3
                    px-4
                    py-3
                    rounded-xl
                    transition
                    ${
                      active
                        ? `
                          bg-blue-50
                          text-blue-700
                          dark:bg-blue-950/50
                          dark:text-blue-300
                        `
                        : `
                          text-gray-600
                          dark:text-gray-300
                          hover:bg-gray-100
                          dark:hover:bg-gray-800
                        `
                    }
                  `}
                >
                  <Icon
                    size={20}
                  />

                  <span
                    className="
                      font-medium
                    "
                  >
                    {item.label}
                  </span>

                </Link>
              );
            }
          )}

        </nav>

        {/* LOGOUT */}

        <div
          className="
            p-4
            border-t
            border-gray-200
            dark:border-gray-800
          "
        >

          <button
            type="button"
            onClick={
              handleLogout
            }
            className="
              w-full
              flex
              items-center
              gap-3
              px-4
              py-3
              rounded-xl
              text-red-600
              dark:text-red-400
              hover:bg-red-50
              dark:hover:bg-red-950/40
              transition
            "
          >
            <LogOut
              size={20}
            />

            <span
              className="
                font-medium
              "
            >
              Logout
            </span>

          </button>

        </div>

      </aside>

      {/* ================================================================
          MOBILE BOTTOM NAV
      ================================================================= */}

      <div
        className="
          lg:hidden
          fixed
          bottom-0
          left-0
          right-0
          z-50
          bg-white
          dark:bg-gray-900
          border-t
          border-gray-200
          dark:border-gray-800
          px-2
          py-2
        "
      >

        <div
          className="
            flex
            items-center
            justify-around
          "
        >

          {menuItems.map(
            (item) => {
              const Icon =
                item.icon;

              const active =
                isActive(
                  item.href
                );

              return (
                <Link
                  key={
                    item.href
                  }
                  href={
                    item.href
                  }
                  className={`
                    min-w-[60px]
                    flex
                    flex-col
                    items-center
                    gap-1
                    px-2
                    py-1.5
                    rounded-lg
                    text-xs
                    transition
                    ${
                      active
                        ? `
                          text-blue-600
                          dark:text-blue-400
                        `
                        : `
                          text-gray-500
                          dark:text-gray-400
                        `
                    }
                  `}
                >
                  <Icon
                    size={20}
                  />

                  <span>
                    {item.label}
                  </span>

                </Link>
              );
            }
          )}

          <button
            type="button"
            onClick={
              handleLogout
            }
            className="
              min-w-[60px]
              flex
              flex-col
              items-center
              gap-1
              px-2
              py-1.5
              rounded-lg
              text-xs
              text-red-500
            "
          >
            <LogOut
              size={20}
            />

            <span>
              Logout
            </span>

          </button>

        </div>

      </div>
    </>
  );
}