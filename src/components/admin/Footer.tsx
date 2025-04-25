'use client';

const Footer = () => {
  return (
    <footer className="bg-gray-100 py-4 border-t mt-10">
      <div className="text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Admin Panel - SMK PKL App
      </div>
    </footer>
  );
};

export default Footer;
