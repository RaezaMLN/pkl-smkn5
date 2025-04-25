// Modal.tsx
import React from "react";

interface ModalProps {
  message: string;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold text-center">{message}</h2>
        <div className="flex justify-center mt-4">
          <button
            onClick={onClose}
            className="bg-blue-600 text-white py-2 px-4 rounded-md"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
