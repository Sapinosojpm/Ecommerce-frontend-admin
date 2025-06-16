import React from 'react';
import { Dialog } from '@headlessui/react';
import { FiX } from 'react-icons/fi';

const ActionModal = ({ isOpen, onClose, returnItem, onAction }) => {
  const handleAction = (action) => {
    onAction(returnItem._id, action);
    onClose();
  };

  if (!returnItem) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="relative z-50 w-full max-w-md p-6 mx-auto bg-white rounded shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Manage Return: {returnItem._id.slice(0, 8)}</h3>
          <button onClick={onClose}>
            <FiX className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-700">
          What action would you like to perform on this return request?
        </p>

        <div className="flex flex-col space-y-2">
          <button onClick={() => handleAction('approved')} className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700">Approve</button>
          <button onClick={() => handleAction('rejected')} className="w-full px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700">Reject</button>
          <button onClick={() => handleAction('refunded')} className="w-full px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700">Refund</button>
        </div>
      </div>
    </Dialog>
  );
};

export default ActionModal;
