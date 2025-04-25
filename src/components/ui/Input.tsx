import React from 'react';

interface InputProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Input = ({ label, value, onChange }: InputProps) => (
  <div className="mb-4">
    <label className="block text-sm font-semibold">{label}</label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      className="w-full p-2 border rounded"
    />
  </div>
);

export default Input;
