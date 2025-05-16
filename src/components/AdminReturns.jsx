import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FiRotateCw, 
  FiCheck, 
  FiX, 
  FiSearch, 
  FiFilter,
  FiDownload,
  FiEye,
  FiChevronDown,
  FiChevronUp
} from 'react-icons/fi';
import moment from 'moment';
import ReturnDetailsModal from './ReturnDetailsModal';

const AdminReturns = () => {

  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [returnsPerPage] = useState(10);
  const [processingAction, setProcessingAction] = useState(null);
const backendUrl = import.meta.env.VITE_BACKEND_URL;
 
 const token = localStorage.getItem('token');

  // Fetch returns data
  useEffect(() => {
    const fetchReturns = async () => {
  try {
    setLoading(true);
    const response = await axios.get(`${backendUrl}/api/returns/admin`, { 
      params: { 
        status: statusFilter,
        dateRange: dateFilter,
        search: searchTerm
      },
       headers: { Authorization: `Bearer ${token}` }
    });
    setReturns(response.data.returns);
  } catch (error) {
    console.error('Error fetching returns:', error);
    toast.error('Failed to load returns data');
  } finally {
    setLoading(false);
  }
};

    fetchReturns();
  }, [backendUrl, token]);

  // Filter returns based on search and filters
  const filteredReturns = returns.filter(returnItem => {
    const matchesSearch = 
      returnItem.orderId?.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' || returnItem.status === statusFilter;

    const matchesDate = () => {
      const now = new Date();
      const returnDate = new Date(returnItem.createdAt);
      
      switch(dateFilter) {
        case 'today':
          return returnDate.toDateString() === now.toDateString();
        case 'week':
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          return returnDate >= oneWeekAgo;
        case 'month':
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          return returnDate >= oneMonthAgo;
        default:
          return true;
      }
    };

    return matchesSearch && matchesStatus && matchesDate();
  });

  // Pagination logic
  const indexOfLastReturn = currentPage * returnsPerPage;
  const indexOfFirstReturn = indexOfLastReturn - returnsPerPage;
  const currentReturns = filteredReturns.slice(indexOfFirstReturn, indexOfLastReturn);
  const totalPages = Math.ceil(filteredReturns.length / returnsPerPage);

  // Handle return status update
  const updateReturnStatus = async (returnId, action, refundAmount = 0, refundMethod = 'original_payment') => {
    try {
      setProcessingAction(returnId);
      
      const response = await axios.post(
  `${backendUrl}/api/returns/${returnId}/process`,
  { action, refundAmount, refundMethod },
  { headers: { Authorization: `Bearer ${token}` } }
);


      if (response.data.success) {
        toast.success(`Return ${action}d successfully`);
        setReturns(returns.map(item => 
          item._id === returnId ? response.data.return : item
        ));
      } else {
        toast.error(response.data.message || `Failed to ${action} return`);
      }
    } catch (error) {
      console.error(`Error ${action}ing return:`, error);
      toast.error(error.response?.data?.message || `Failed to ${action} return`);
    } finally {
      setProcessingAction(null);
    }
  };

  // Handle refund processing
  const processRefund = async (returnId) => {
    try {
      setProcessingAction(returnId);
      
      const response = await axios.post(
        `${backendUrl}/api/returns/${returnId}/refund`,
        {},
       { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Refund processed successfully');
        setReturns(returns.map(item => 
          item._id === returnId ? response.data.return : item
        ));
      } else {
        toast.error(response.data.message || 'Failed to process refund');
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error(error.response?.data?.message || 'Failed to process refund');
    } finally {
      setProcessingAction(null);
    }
  };

  // Get status badge style
  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1>Return Management</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by order #, return ID, or customer..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <FiFilter className="mr-2" />
                Filters
                {showFilters ? (
                  <FiChevronUp className="ml-2" />
                ) : (
                  <FiChevronDown className="ml-2" />
                )}
              </button>

              <button className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                <FiDownload className="mr-2" />
                Export
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <select
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Returns Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Return ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order #
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Refund Amount
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : currentReturns.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No returns found matching your criteria
                  </td>
                </tr>
              ) : (
                currentReturns.map((returnItem) => (
                  <tr key={returnItem._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{returnItem._id.slice(-6)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {returnItem.orderId?.orderNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {returnItem.userId?.name || 'Guest'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {moment(returnItem.createdAt).format('MMM D, YYYY')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(returnItem.status)}`}>
                        {returnItem.status.charAt(0).toUpperCase() + returnItem.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(returnItem.refundAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedReturn(returnItem);
                            setIsModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="View Details"
                        >
                          <FiEye size={18} />
                        </button>

                        {returnItem.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateReturnStatus(returnItem._id, 'approve', returnItem.refundAmount)}
                              disabled={processingAction === returnItem._id}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 disabled:opacity-50"
                              title="Approve"
                            >
                              {processingAction === returnItem._id ? (
                                <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <FiCheck size={18} />
                              )}
                            </button>
                            <button
                              onClick={() => updateReturnStatus(returnItem._id, 'reject')}
                              disabled={processingAction === returnItem._id}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 disabled:opacity-50"
                              title="Reject"
                            >
                              {processingAction === returnItem._id ? (
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <FiX size={18} />
                              )}
                            </button>
                          </>
                        )}

                        {returnItem.status === 'approved' && (
                          <button
                            onClick={() => processRefund(returnItem._id)}
                            disabled={processingAction === returnItem._id}
                            className="flex items-center px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            {processingAction === returnItem._id ? (
                              <div className="w-3 h-3 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <FiRotateCw className="mr-1" size={14} />
                            )}
                            Process Refund
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredReturns.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium">{indexOfFirstReturn + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(indexOfLastReturn, filteredReturns.length)}
              </span>{' '}
              of <span className="font-medium">{filteredReturns.length}</span> returns
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Return Details Modal */}
      {isModalOpen && selectedReturn && (
        <ReturnDetailsModal 
          returnItem={selectedReturn} 
          onClose={() => setIsModalOpen(false)}
          onUpdateStatus={updateReturnStatus}
          processingAction={processingAction}
        />
      )}
    </div>
  );
};

export default AdminReturns;