import React from 'react';
import { FiX, FiRotateCw, FiCheck, FiXCircle, FiDollarSign } from 'react-icons/fi';
import moment from 'moment';

const ReturnDetailsModal = ({ returnItem, onClose, onUpdateStatus, processingAction }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-start">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Return Details (#{returnItem._id.slice(-6)})
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-2">Order Information</h4>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium text-gray-700">Order #:</span> {returnItem.orderId?.orderNumber || 'N/A'}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium text-gray-700">Customer:</span> {returnItem.userId?.name || 'Guest'}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium text-gray-700">Date:</span> {moment(returnItem.createdAt).format('MMM D, YYYY h:mm A')}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium text-gray-700">Status:</span> 
                    <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                      returnItem.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      returnItem.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                      returnItem.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {returnItem.status.charAt(0).toUpperCase() + returnItem.status.slice(1)}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-2">Refund Information</h4>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium text-gray-700">Refund Amount:</span> {formatCurrency(returnItem.refundAmount)}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium text-gray-700">Refund Method:</span> 
                    <span className="capitalize ml-1">
                      {returnItem.refundMethod?.replace('_', ' ') || 'Not specified'}
                    </span>
                  </p>
                  {returnItem.status === 'refunded' && (
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">Refund Date:</span> 
                      {moment(returnItem.updatedAt).format('MMM D, YYYY h:mm A')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-900 mb-2">Return Reason</h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm font-medium capitalize">{returnItem.reason.replace('_', ' ')}</p>
                <p className="text-sm text-gray-600 mt-1">{returnItem.description}</p>
              </div>
            </div>

            {returnItem.images && returnItem.images.length > 0 && (
              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-900 mb-2">Evidence Photos</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {returnItem.images.map((image, index) => (
                    <div key={index} className="border rounded-md overflow-hidden">
                      <img 
                        src={`${process.env.REACT_APP_BACKEND_URL}/${image.path}`} 
                        alt={`Evidence ${index + 1}`}
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-900 mb-2">Status History</h4>
              <div className="border-l-2 border-gray-200 pl-4 space-y-4">
                {returnItem.statusHistory?.map((history, index) => (
                  <div key={index} className="relative">
                    <div className="absolute -left-4 top-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="ml-2">
                      <p className="text-sm font-medium text-gray-900">
                        {history.status.charAt(0).toUpperCase() + history.status.slice(1)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {moment(history.changedAt).format('MMM D, YYYY h:mm A')}
                      </p>
                      {history.notes && (
                        <p className="text-xs text-gray-600 mt-1">{history.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {returnItem.status === 'pending' && (
              <>
                <button
                  type="button"
                  onClick={() => onUpdateStatus(returnItem._id, 'approve', returnItem.refundAmount)}
                  disabled={processingAction === returnItem._id}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {processingAction === returnItem._id ? (
                    <FiRotateCw className="animate-spin mr-2" />
                  ) : (
                    <FiCheck className="mr-2" />
                  )}
                  Approve Return
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateStatus(returnItem._id, 'reject')}
                  disabled={processingAction === returnItem._id}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {processingAction === returnItem._id ? (
                    <FiRotateCw className="animate-spin mr-2" />
                  ) : (
                    <FiXCircle className="mr-2" />
                  )}
                  Reject Return
                </button>
              </>
            )}

            {returnItem.status === 'approved' && (
              <button
                type="button"
                onClick={() => onUpdateStatus(returnItem._id, 'refund')}
                disabled={processingAction === returnItem._id}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {processingAction === returnItem._id ? (
                  <FiRotateCw className="animate-spin mr-2" />
                ) : (
                  <FiDollarSign className="mr-2" />
                )}
                Process Refund
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnDetailsModal;
