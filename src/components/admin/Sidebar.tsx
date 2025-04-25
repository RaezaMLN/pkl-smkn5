// Sidebar component (tidak berubah)
import React from 'react';
import { FaHome, FaUsers, FaBuilding, FaClipboardList, FaBars, FaPaperPlane } from 'react-icons/fa';
import Link from 'next/link';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar = ({ isOpen, toggleSidebar }: SidebarProps) => {
  return (
    <div
      className={`fixed top-0 left-0 z-50 bg-gray-800 text-white h-full transition-all duration-300 ease-in-out
        ${isOpen ? 'w-64' : 'w-16'} overflow-hidden`}
    >
      <div className="flex justify-between items-center p-4">
        <button onClick={toggleSidebar} className="text-white">
          <FaBars />
        </button>
        {isOpen && <h2 className="text-xl font-bold">Admin</h2>}
      </div>
      <nav>
        <ul>
          <SidebarItem href="/admin/dashboard" icon={<FaHome />} label="Dashboard" isOpen={isOpen} />
          <SidebarItem href="/admin/perusahaan" icon={<FaBuilding />} label="Perusahaan" isOpen={isOpen} />
          <SidebarItem href="/admin/pengajuan" icon={<FaPaperPlane />} label="Pengajuan" isOpen={isOpen} />
          <SidebarItem href="/admin/siswa" icon={<FaUsers />} label="Siswa" isOpen={isOpen} />
          <SidebarItem href="/admin/pendaftaran" icon={<FaClipboardList />} label="Pendaftaran" isOpen={isOpen} />
        </ul>
      </nav>
    </div>
  );
};

const SidebarItem = ({
  href,
  icon,
  label,
  isOpen,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  isOpen: boolean;
}) => (
  <li>
    <Link
      href={href}
      className="flex items-center p-4 hover:bg-gray-700 transition-colors duration-200"
    >
      <span className="text-lg">{icon}</span>
      <span
        className={`ml-3 whitespace-nowrap transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      >
        {label}
      </span>
    </Link>
  </li>
);

export default Sidebar;
