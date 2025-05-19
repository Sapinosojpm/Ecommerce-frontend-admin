import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { FiX } from 'react-icons/fi';

const ActionModal = ({ isOpen, onClose, returnItem, onAction }) => {
  const [notes, setNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundMethod, setRefundMethod] = useState('original_payment');
  const [actionType, setActionType] = useState(null);
  
  // Reset form when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setNotes('');
      setRefundAmount(returnItem ? String(returnItem.refundAmount || '') : '');
      setRefundMethod('original_payment');
      setActionType(null);
    }
  }, [isOpen, returnItem]);
  
  const handlePrepareAction = (action) => {
    setActionType(action);
  };
  
  const handleConfirmAction = () => {
    // Only proceed if we have an action type selected
    if (!actionType) return;
    
    // Handle different action types
    switch (actionType) {
      case 'approve':
        onAction(
          returnItem._id,
          'approve',
          notes,
          refundAmount ? parseFloat(refundAmount) : undefined,
          refundMethod
        );
        break;
      case 'reject':
        onAction(returnItem._id, 'reject', notes);
        break;
      case 'refund':
        onAction(
          returnItem._id,
          'refund',
          notes,
          refundAmount ? parseFloat(refundAmount) : undefined,
          refundMethod
        );
        break;
      default:
        console.error('Unknown action type:', actionType);
    }
    
    onClose();
  };
  
  if (!returnItem) return null;
  
  const originalAmount = returnItem.refundAmount || 0;
  const itemDetails = returnItem.itemDetails || {};
  
  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="relative z-50 w-full max-w-md p-6 mx-auto bg-white rounded shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Return Request: {returnItem._id.slice(0, 8)}</h3>
          <button onClick={onClose}>
            <FiX className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Return Details */}
        <div className="p-3 mb-4 rounded bg-gray-50">
          <p className="mb-1 text-sm"><strong>Status:</strong> {returnItem.status}</p>
          <p className="mb-1 text-sm"><strong>Item:</strong> {itemDetails.name || returnItem.itemId?.substring(0, 8)}</p>
          <p className="mb-1 text-sm"><strong>Reason:</strong> {returnItem.reason?.replace('_', ' ')}</p>
          <p className="text-sm"><strong>Description:</strong> {returnItem.description || 'No details provided'}</p>
        </div>

        {/* Action Selection */}
        {!actionType ? (
          <>
            <p className="mb-4 text-sm text-gray-700">
              What action would you like to perform on this return request?
            </p>
            <div className="flex flex-col space-y-2">
              {/* Only show Approve button if status is not already approved */}
              {returnItem.status !== 'approved' && (
                <button 
                  onClick={() => handlePrepareAction('approve')} 
                  className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  Approve
                </button>
              )}
              
              {/* Only show Reject button if status is pending */}
              {returnItem.status === 'pending' && (
                <button 
                  onClick={() => handlePrepareAction('reject')} 
                  className="w-full px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
                >
                  Reject
                </button>
              )}
              
              {/* Only show Process Refund button if status is approved */}
              {returnItem.status === 'approved' && (
                <button 
                  onClick={() => handlePrepareAction('refund')} 
                  className="w-full px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
                >
                  Process Refund
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Action Form */}
            <div className="mb-4">
              <h4 className="mb-2 font-medium">
                {actionType === 'approve' ? 'Approve Return' : 
                 actionType === 'reject' ? 'Reject Return' : 'Process Refund'}
              </h4>
              
              {/* Admin Notes - Common to all actions */}
              <div className="mb-3">
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Admin Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  rows="2"
                  placeholder="Add any notes about this action"
                />
              </div>
              
              {/* Refund Options - Only for approve and refund actions */}
              {(actionType === 'approve' || actionType === 'refund') && (
                <>
                  <div className="mb-3">
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Refund Amount
                    </label>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder={`Original amount: ${originalAmount}`}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Refund Method
                    </label>
                    <select
                      value={refundMethod}
                      onChange={(e) => setRefundMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="original_payment">Original Payment Method</option>
                      <option value="store_credit">Store Credit</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="gcash">GCash</option>
                      <option value="none">No Refund (Store Exchange)</option>
                    </select>
                  </div>
                </>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => setActionType(null)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
              >
                Back
              </button>
              <button
                onClick={handleConfirmAction}
                className={`flex-1 px-4 py-2 text-white rounded ${
                  actionType === 'approve' ? 'bg-blue-600 hover:bg-blue-700' :
                  actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-green-600 hover:bg-green-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
};

export default ActionModal;