'use client';

const Footer = () => {
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 py-4 px-4 border-t border-gray-200 dark:border-gray-700 mt-10 mb-14 md:mb-0 transition-colors">
      <div className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} Admin Panel - SMK PKL App
      </div>
    </footer>
  );
};

export default Footer;
