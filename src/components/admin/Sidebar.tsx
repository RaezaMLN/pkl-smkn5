'use client';

import React from 'react';
import { FaHome, FaUsers, FaBuilding, FaClipboardList, FaBars, FaPaperPlane, FaChalkboardTeacher } from 'react-icons/fa';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const adminNavItems = [
  { href: '/admin/dashboard', icon: FaHome, label: 'Dashboard', shortLabel: 'Dashboard' },
  { href: '/admin/perusahaan', icon: FaBuilding, label: 'Perusahaan', shortLabel: 'Industri' },
  { href: '/admin/pengajuan', icon: FaPaperPlane, label: 'Pengajuan', shortLabel: 'Ajuan' },
  { href: '/admin/siswa', icon: FaUsers, label: 'Siswa', shortLabel: 'Siswa' },
  { href: '/admin/pendaftaran', icon: FaClipboardList, label: 'Pendaftaran', shortLabel: 'Daftar' },
  { href: '/admin/pembimbing', icon: FaChalkboardTeacher, label: 'Pembimbing', shortLabel: 'Guru' },
];

const Sidebar = ({ isOpen, toggleSidebar }: SidebarProps) => {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === '/admin/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* ================================================================
          DESKTOP SIDEBAR (md ke atas)
      ================================================================= */}
      <div
        className={`hidden md:block fixed top-0 left-0 z-50 bg-gray-800 text-white h-full transition-all duration-300 ease-in-out
          ${isOpen ? 'w-64' : 'w-16'} overflow-hidden shadow-lg`}
      >
        <div className="flex justify-between items-center p-4">
          <button onClick={toggleSidebar} className="text-white hover:text-gray-300 transition" aria-label="Toggle Sidebar">
            <FaBars />
          </button>
          {isOpen && <h2 className="text-xl font-bold">Admin</h2>}
        </div>
        <nav>
          <ul>
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center p-4 transition-colors duration-200 ${
                      active ? 'bg-gray-700 text-blue-400 font-semibold' : 'hover:bg-gray-700 text-gray-200'
                    }`}
                  >
                    <span className="text-lg"><Icon /></span>
                    <span
                      className={`ml-3 whitespace-nowrap transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* ================================================================
          MOBILE STICKY BOTTOM NAVIGATION (< md)
      ================================================================= */}
      <nav
        aria-label="Admin Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md text-white border-t border-gray-700 px-1 py-1.5 shadow-[0_-4px_12px_rgba(0,0,0,0.25)]"
      >
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition-colors ${
                  active ? 'text-blue-400 font-semibold' : 'text-gray-400 hover:text-white'
                }`}
              >
                <div className={`p-1 rounded-md ${active ? 'bg-gray-800' : ''}`}>
                  <Icon className="text-base" />
                </div>
                <span className="text-[9px] mt-0.5 tracking-tight truncate max-w-[50px]">
                  {item.shortLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
