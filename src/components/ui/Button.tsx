// src/components/ui/Button.tsx
import React from 'react';

interface ButtonProps {
  onClick: () => void;
  className?: string;
  children: React.ReactNode; // Ganti label dengan children
}

const Button = ({ onClick, className, children }: ButtonProps) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${className}`}
  >
    {children}
  </button>
);

export default Button;
