import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import {
  FiSearch,
  FiRefreshCw,
  FiEye
} from 'react-icons/fi';
import ActionModal from './ReturnDetailsModal';

const backendUrl = import.meta.env.VITE_BACKEND_URL;
console.log('Backend URL:', backendUrl);

const AdminReturnsPage = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
  });
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const statusColors = {
    pending: 'bg-yellow-300 text-yellow-900',
    approved: 'bg-blue-300 text-blue-900',
    rejected: 'bg-red-300 text-red-900',
    refunded: 'bg-green-300 text-green-900',
    processing: 'bg-purple-300 text-purple-900',
    completed: 'bg-gray-300 text-gray-900',
  };

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${backendUrl}/api/returns/admin`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          status: filters.status,
          dateRange: filters.dateRange,
          search: searchTerm,
        },
      });
      const result = Array.isArray(response?.data?.returns) ? response.data.returns : [];
      setReturns(result);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch returns');
      console.error('Error fetching returns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [filters]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReturns();
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleRefresh = () => {
    fetchReturns();
  };

  const handleViewDetails = (returnItem) => {
    setSelectedReturn(returnItem);
    setIsModalOpen(true);
  };

  const handleAction = async (returnId, action, notes, refundAmount, refundMethod) => {
    try {

      const payload = { action, notes, refundAmount, refundMethod };

// Remove keys with undefined values
Object.keys(payload).forEach(
  (key) => payload[key] === undefined && delete payload[key]
);
      const token = localStorage.getItem('token');
      // Updated to match the backend route and expected payload structure
       console.log({ returnId, action, notes, refundAmount, refundMethod });
      await axios.post(
        `${backendUrl}/api/returns/${returnId}/process`,
        { 
         
          returnId,
          action,
          notes,
          refundAmount,
          refundMethod
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
     

      // If action is "approve" and refund should be processed immediately, handle refund
      if (action === 'approve' && refundMethod !== 'none') {
        try {
          await axios.post(
            `${backendUrl}/api/returns/${returnId}/refund`,
            { returnId },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        } catch (refundErr) {
          console.error('Error processing refund:', refundErr);
          setError('Return approved but refund processing failed');
        }
      }
      
      setIsModalOpen(false);
      fetchReturns();
    } catch (err) {
      console.error('Error updating return status:', err);
      setError('Failed to update return status: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-semibold">Return Requests Management</h1>

      {/* Filters and Search */}
      <div className="p-4 mb-6 bg-white rounded shadow">
        <div className="grid items-center grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-8">
          {/* Status Filter */}
          <div className="md:col-span-2">
            <label htmlFor="status-filter" className="block mb-1 text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status-filter"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="processing">Processing</option>
              <option value="refunded">Refunded</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="md:col-span-2">
            <label htmlFor="date-range-filter" className="block mb-1 text-sm font-medium text-gray-700">
              Date Range
            </label>
            <select
              id="date-range-filter"
              name="dateRange"
              value={filters.dateRange}
              onChange={handleFilterChange}
              className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>

          {/* Search */}
          <div className="md:col-span-3">
            <form onSubmit={handleSearchSubmit} className="flex">
              <input
                type="text"
                placeholder="Search by ID, customer, or order #"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <button
                type="submit"
                aria-label="Search"
                className="flex items-center justify-center px-3 text-white bg-indigo-600 hover:bg-indigo-700 rounded-r-md"
              >
                <FiSearch />
              </button>
            </form>
          </div>

          {/* Refresh */}
          <div className="flex justify-end md:col-span-1">
            <button
              onClick={handleRefresh}
              title="Refresh"
              className="p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Refresh"
            >
              <FiRefreshCw size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 mb-6 text-red-700 bg-red-100 border border-red-200 rounded-md">
          <p>{error}</p>
          <button 
            onClick={() => setError('')} 
            className="mt-2 text-sm font-medium text-red-700 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Returns Table */}
      <div className="bg-white rounded shadow overflow-auto max-h-[calc(100vh-300px)]">
        {loading ? (
          <div className="flex items-center justify-center h-72">
            <svg
              className="w-10 h-10 mr-3 -ml-1 text-indigo-600 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              ></path>
            </svg>
          </div>
        ) : (!returns || returns.length === 0) ? (
          <div className="p-6 text-center text-gray-600">
            No return requests found.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="sticky top-0 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Return ID
                </th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Order #
                </th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Item
                </th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Reason
                </th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {returns.map((returnItem) => (
                <tr key={returnItem._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {returnItem._id.substring(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {returnItem.orderId?.orderNumber || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {returnItem.userId?.name || 'Unknown User'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {returnItem.itemDetails?.name ||
                      'Item #' + returnItem.itemId?.substring(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {returnItem.reason?.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {format(new Date(returnItem.createdAt), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        statusColors[returnItem.status] || 'bg-gray-300 text-gray-900'
                      }`}
                    >
                      {returnItem.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    <button
                      onClick={() => handleViewDetails(returnItem)}
                      title="View Details"
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <FiEye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Modal for viewing and updating return details */}
      <ActionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        returnItem={selectedReturn}
        onAction={handleAction}
      />
    </div>
  );
};

export default AdminReturnsPage;