export default function Footer() {
  return (
    <footer className="text-center py-4 px-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mb-14 md:mb-0">
      &copy; {new Date().getFullYear()} SMKN 5 Telkom Banda Aceh. All rights reserved.
    </footer>
  );
}