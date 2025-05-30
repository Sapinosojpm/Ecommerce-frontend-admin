import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { backendUrl, currency } from "../App";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";
import QRCode from "qrcode";
import { 
  FiTruck, 
  FiPrinter, 
  FiDownload, 
  FiX,
  FiPlus,
  FiExternalLink,
  FiRefreshCw
} from 'react-icons/fi';

const AdminOrders = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [sortCriteria, setSortCriteria] = useState("date");
  const [qrCodes, setQrCodes] = useState({});
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedOrderQr, setSelectedOrderQr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [showAddTrackingModal, setShowAddTrackingModal] = useState(false);
  const [carriers, setCarriers] = useState([]);
  const [trackingForm, setTrackingForm] = useState({
    trackingNumber: '',
    carrierCode: ''
  });
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const canvasRef = useRef(null);

  // Define tabs with their corresponding statuses and colors
  const tabs = [
    { id: "all", label: "All Orders", color: "bg-gray-100 text-gray-800", activeColor: "bg-gray-500 text-white" },
    { id: "order placed", label: "Order Placed", color: "bg-blue-100 text-blue-800", activeColor: "bg-blue-500 text-white" },
    { id: "packing", label: "Packing", color: "bg-yellow-100 text-yellow-800", activeColor: "bg-yellow-500 text-white" },
    { id: "for pickup", label: "Ready for Pickup", color: "bg-orange-100 text-orange-800", activeColor: "bg-orange-500 text-white" },
    { id: "shipped", label: "Shipped", color: "bg-purple-100 text-purple-800", activeColor: "bg-purple-500 text-white" },
    { id: "out for delivery", label: "Out for Delivery", color: "bg-indigo-100 text-indigo-800", activeColor: "bg-indigo-500 text-white" },
    { id: "delivered", label: "Delivered", color: "bg-green-100 text-green-800", activeColor: "bg-green-500 text-white" },
    { id: "canceled", label: "Cancelled", color: "bg-red-100 text-red-800", activeColor: "bg-red-500 text-white" }
  ];

  useEffect(() => {
    if (token) {
      fetchAllOrders();
      fetchCarriers();
    }
  }, [token]);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${backendUrl}/api/order/list`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setOrders(response.data.orders);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Failed to fetch orders.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCarriers = async () => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/order/carriers`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setCarriers(response.data.carriers);
      }
    } catch (error) {
      toast.error('Failed to fetch carriers');
      console.error(error);
    }
  };

  const statusHandler = async (event, orderId) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/order/status`,
        { orderId, status: event.target.value },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success("Order status updated successfully.");
        fetchAllOrders();
      } else {
        toast.error(response.data.message || "Failed to update status.");
      }
    } catch (error) {
      console.error("Error updating status:", error.response?.data || error);
      toast.error(error.response?.data?.message || "Error updating status.");
    }
  };

  // Generate QR Code for order
  const generateQrCode = async (order) => {
    try {
      // Create comprehensive order data for QR code
      const qrData = {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerName: `${order.address?.firstName} ${order.address?.lastName}`,
        amount: order.amount,
        status: order.status,
        date: order.date,
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          variations: item.variationDetails?.map(v => `${v.variationName}: ${v.optionName}`) || []
        })),
        paymentMethod: order.paymentMethod,
        trackingUrl: `${window.location.origin}/track-order/${order._id}`
      };

      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrCodes(prev => ({
        ...prev,
        [order._id]: qrCodeDataUrl
      }));

      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
      return null;
    }
  };

  // Show QR code in modal
  const showQrCode = async (order) => {
    let qrCodeUrl = qrCodes[order._id];
    
    if (!qrCodeUrl) {
      qrCodeUrl = await generateQrCode(order);
    }
    
    if (qrCodeUrl) {
      setSelectedOrderQr({ order, qrCode: qrCodeUrl });
      setShowQrModal(true);
    }
  };

  // Download QR code as image
  const downloadQrCode = (orderId, qrCodeUrl) => {
    const link = document.createElement('a');
    link.download = `qr-code-order-${orderId}.png`;
    link.href = qrCodeUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR code downloaded successfully!');
  };

  // Print QR code with order details
  const printQrCode = (order, qrCodeUrl) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>Order #${order.orderNumber}</title>
          <style>
            @page { size: auto; margin: 5mm; }
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
            h1 { font-size: 18px; margin-bottom: 10px; color: #333; }
            .order-info { margin-bottom: 15px; }
            .order-info p { margin: 5px 0; font-size: 14px; }
            .qr-container { text-align: center; margin: 20px 0; }
            .qr-container img { width: 200px; height: 200px; }
            .footer { font-size: 12px; color: #666; text-align: center; margin-top: 20px; }
            @media print { 
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Order #${order.orderNumber}</h1>
          <div class="order-info">
            <p><strong>Customer:</strong> ${order.address?.firstName} ${order.address?.lastName}</p>
            <p><strong>Amount:</strong> ${currency}${order.amount.toLocaleString()}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            <p><strong>Date:</strong> ${new Date(order.date).toLocaleString()}</p>
          </div>
          <div class="qr-container">
            <img src="${qrCodeUrl}" alt="Order QR Code" />
            <p>Scan to view order details</p>
          </div>
          <div class="footer">
            Printed on ${new Date().toLocaleString()}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  // Get tracking information
  const getTrackingInfo = async (orderId) => {
    try {
      setLoadingTracking(true);
      const response = await axios.get(
        `${backendUrl}/api/order/${orderId}/tracking`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setTrackingInfo(response.data.tracking);
        setShowTrackingModal(true);
      }
    } catch (error) {
      console.error("Error fetching tracking info:", error);
      toast.error("Failed to get tracking information");
    } finally {
      setLoadingTracking(false);
    }
  };

  // Add tracking information
  const addTracking = async () => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/order/${selectedOrderForTracking._id}/tracking`,
        trackingForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Tracking added successfully');
        fetchAllOrders();
        setShowAddTrackingModal(false);
      }
    } catch (error) {
      toast.error('Failed to add tracking');
      console.error(error);
    }
  };

  // Filter orders based on active tab and search query
  const getFilteredOrders = () => {
    let filtered = orders;
    
    if (activeTab !== "all") {
      filtered = filtered.filter(order => order.status.toLowerCase() === activeTab.toLowerCase());
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderNumber?.toLowerCase().includes(query) ||
        order._id?.toLowerCase().includes(query) ||
        `${order.address?.firstName} ${order.address?.lastName}`.toLowerCase().includes(query) ||
        order.items.some(item => item.name.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  };

  // Sort filtered orders
  const sortedOrders = [...getFilteredOrders()].sort((a, b) => {
    if (sortCriteria === "date") return new Date(b.date) - new Date(a.date);
    if (sortCriteria === "amount") return b.amount - a.amount;
    if (sortCriteria === "status") return a.status.localeCompare(b.status);
    return 0;
  });

  const downloadReceipt = async (orderId) => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/order/receipt/${orderId}`,
        {
          responseType: "blob",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt_${orderId}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      toast.error("Failed to download receipt.");
      console.error(error);
    }
  };

  const confirmPayment = async (orderId) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/order/confirm-payment`,
        { orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success("Payment confirmed successfully.");
        fetchAllOrders();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error confirming payment:", error.response?.data || error);
      toast.error("Failed to confirm payment.");
    }
  };

  // Get count for each tab
  const getTabCount = (tabId) => {
    if (tabId === "all") return orders.length;
    return orders.filter(order => order.status.toLowerCase() === tabId.toLowerCase()).length;
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      case 'shipped': 
      case 'out for delivery': return 'bg-blue-100 text-blue-800';
      case 'packing': 
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'order placed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canAddTracking = (order) => {
    return (
      order.status?.toLowerCase() === "packing" ||
      order.status?.toLowerCase() === "shipped" ||
      order.status?.toLowerCase() === "out for delivery"
    );
  };

  const hasTracking = (order) => {
    return order.tracking && order.tracking.trackingNumber;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <h3 className="text-2xl font-bold text-gray-800">Order Management</h3>
        
        <div className="flex gap-4">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search orders..."
              className="py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200">
          {tabs.map((tab) => {
            const count = getTabCount(tab.id);
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-t-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  isActive 
                    ? `${tab.activeColor} shadow-md -mb-px border-b-2 border-transparent`
                    : `${tab.color} hover:shadow-sm`
                }`}
              >
                <span>{tab.label}</span>
                {count > 0 && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isActive 
                      ? 'bg-white bg-opacity-20' 
                      : 'bg-black bg-opacity-10'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sorting Controls */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="font-medium text-gray-700">
              Sort By:
            </label>
            <select
              id="sort"
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={sortCriteria}
              onChange={(e) => setSortCriteria(e.target.value)}
            >
              <option value="date">Date (Newest First)</option>
              <option value="amount">Amount (Highest First)</option>
              <option value="status">Status (A-Z)</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-600">
            Showing {sortedOrders.length} of {orders.length} orders
          </div>
        </div>
      </div>

      {/* Order List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : sortedOrders.length > 0 ? (
          sortedOrders.map((order) => (
            <div
              key={order._id}
              className="grid grid-cols-1 sm:grid-cols-[0.5fr_2fr_1fr] lg:grid-cols-[0.5fr_2fr_1fr_1fr_1fr] gap-3 items-start border-2 border-gray-200 p-5 md:p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white"
            >
              <img className="w-12" src={assets.parcel_icon} alt="Parcel" />
              
              <div>
                <div className="flex items-start justify-between mb-2">
                  <p className="font-mono text-xs text-gray-600 break-all">{order.orderNumber || order._id}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div className="font-medium">
                  {order.items.map((item, index) => (
                    <div key={index} className="py-0.5">
                      <p className="text-gray-800">
                        {item.name} x {item.quantity}
                      </p>

                      {item.variationDetails?.length > 0 && (
                        <p className="mt-1 text-sm">
                          Variations:{" "}
                          <span className="font-medium text-green-600">
                            {item.variationDetails.map((v, idx) => (
                              <span key={idx} className="mr-2">
                                {v.variationName} - {v.optionName}
                              </span>
                            ))}
                          </span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <hr className="my-3 border-gray-200" />
                <p className="mb-2 font-semibold text-gray-800">
                  {order.address?.firstName} {order.address?.lastName}
                </p>
                <div className="text-sm text-gray-600">
                  <p>{order.address?.street},</p>
                  <p>
                    {order.address?.city}, {order.address?.barangay},{" "}
                    {order.address?.province}, {order.address?.postalCode}
                  </p>
                </div>
                <p className="font-medium text-gray-600">{order.address?.phone}</p>
              </div>

              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Items:</span> {order.items.length}</p>
                <p><span className="font-medium">Method:</span> {order.paymentMethod}</p>
                <p><span className="font-medium">Payment:</span> 
                  <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                    order.payment 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.payment ? "Paid" : "Pending"}
                  </span>
                </p>
                <p><span className="font-medium">Date:</span> {new Date(order.date).toLocaleDateString()}</p>
              </div>

              <p className="text-lg font-bold text-gray-800">
                {currency}
                {order.amount.toLocaleString()}
              </p>

              <div className="flex flex-col gap-3">
                <select
                  onChange={(event) => statusHandler(event, order._id)}
                  value={order.status}
                  className="p-2 font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="order placed">Order Placed</option>
                  <option value="packing">Packing</option>
                  <option value="for pickup">Ready for Pickup</option>
                  <option value="shipped">Shipped</option>
                  <option value="out for delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="canceled">Canceled</option>
                </select>

                {/* Tracking Buttons */}
                <div className="flex flex-wrap gap-2">
                  {hasTracking(order) ? (
                    <button
                      onClick={() => getTrackingInfo(order._id)}
                      className="flex items-center justify-center gap-2 px-3 py-2 text-white transition-colors bg-indigo-500 rounded-lg shadow-sm hover:bg-indigo-600"
                      disabled={loadingTracking}
                    >
                      <FiTruck className="w-4 h-4" />
                      {loadingTracking ? "Loading..." : "Track Order"}
                    </button>
                  ) : canAddTracking(order) && (
                    <button
                      onClick={() => {
                        setSelectedOrderForTracking(order);
                        setShowAddTrackingModal(true);
                      }}
                      className="flex items-center justify-center gap-2 px-3 py-2 text-white transition-colors bg-green-500 rounded-lg shadow-sm hover:bg-green-600"
                    >
                      <FiPlus className="w-4 h-4" />
                      Add Tracking
                    </button>
                  )}

                  {/* QR Code Button */}
                  <button
                    onClick={() => showQrCode(order)}
                    className="flex items-center justify-center gap-2 px-3 py-2 text-white transition-colors bg-purple-500 rounded-lg shadow-sm hover:bg-purple-600"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM19 13h2v2h-2zM13 13h2v2h-2zM15 15h2v2h-2zM13 17h2v2h-2zM17 17h2v2h-2zM19 19h2v2h-2zM15 19h2v2h-2zM17 15h2v2h-2z"/>
                    </svg>
                    QR Code
                  </button>
                </div>

                <div className="flex gap-2">
                  {order.paymentMethod === "receipt_upload" && (
                    <>
                      <button
                        onClick={() => downloadReceipt(order._id)}
                        className="px-3 py-1 text-xs text-white transition-colors bg-blue-500 rounded-lg hover:bg-blue-600"
                      >
                        View Receipt
                      </button>

                      {!order.payment && (
                        <button
                          onClick={() => confirmPayment(order._id)}
                          className="px-3 py-1 text-xs text-white transition-colors bg-green-500 rounded-lg hover:bg-green-600"
                        >
                          Confirm Payment
                        </button>
                      )}

                      {order.payment && (
                        <button
                          className="px-3 py-1 text-xs text-white bg-gray-400 rounded-lg cursor-not-allowed"
                          disabled
                        >
                          Confirmed
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center">
            <div className="mb-4 text-gray-400">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <p className="text-lg text-gray-500">
              {activeTab === "all" 
                ? "No orders found." 
                : `No orders with status "${activeTab}".`
              }
            </p>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQrModal && selectedOrderQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Order QR Code</h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-2xl text-gray-400 transition-colors hover:text-gray-600"
              >
                <FiX />
              </button>
            </div>

            <div className="text-center">
              <div className="p-4 mb-4 rounded-lg bg-gray-50">
                <p className="mb-2 text-sm text-gray-600">
                  <strong>Order ID:</strong> {selectedOrderQr.order._id}
                </p>
                <p className="mb-2 text-sm text-gray-600">
                  <strong>Order #:</strong> {selectedOrderQr.order.orderNumber}
                </p>
                <p className="mb-2 text-sm text-gray-600">
                  <strong>Customer:</strong> {selectedOrderQr.order.address?.firstName} {selectedOrderQr.order.address?.lastName}
                </p>
                <p className="mb-2 text-sm text-gray-600">
                  <strong>Amount:</strong> {currency}{selectedOrderQr.order.amount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Status:</strong> 
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(selectedOrderQr.order.status)}`}>
                    {selectedOrderQr.order.status}
                  </span>
                </p>
              </div>

              <div className="flex justify-center mb-4">
                <img 
                  src={selectedOrderQr.qrCode} 
                  alt="Order QR Code" 
                  className="border-2 border-gray-200 rounded-lg shadow-sm"
                />
              </div>

              <p className="mb-4 text-xs text-gray-500">
                Scan this QR code to view order details
              </p>

              <div className="flex justify-center gap-2">
                <button
                  onClick={() => downloadQrCode(selectedOrderQr.order._id, selectedOrderQr.qrCode)}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-white transition-colors bg-blue-500 rounded-lg shadow-sm hover:bg-blue-600"
                >
                  <FiDownload className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => printQrCode(selectedOrderQr.order, selectedOrderQr.qrCode)}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-white transition-colors bg-green-500 rounded-lg shadow-sm hover:bg-green-600"
                >
                  <FiPrinter className="w-4 h-4" />
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tracking Info Modal */}
      {showTrackingModal && trackingInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Order Tracking</h3>
              <button
                onClick={() => {
                  setShowTrackingModal(false);
                  setTrackingInfo(null);
                }}
                className="text-2xl text-gray-400 transition-colors hover:text-gray-600"
              >
                <FiX />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Tracking Number</p>
                  <p className="font-mono">{trackingInfo.trackingNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Carrier</p>
                  <p>{trackingInfo.carrierCode}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="capitalize">{trackingInfo.status?.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Updated</p>
                  <p>{trackingInfo.lastUpdated ? formatDate(trackingInfo.lastUpdated) : 'N/A'}</p>
                </div>
              </div>

              {trackingInfo.events?.length > 0 ? (
                <div>
                  <h4 className="mb-2 font-medium">Tracking History</h4>
                  <div className="pl-4 space-y-4 border-l-2 border-gray-200">
                    {trackingInfo.events.map((event, index) => (
                      <div key={index} className="relative">
                        <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-5 top-1.5"></div>
                        <div className="p-3 rounded-lg bg-gray-50">
                          <p className="font-medium">{event.description}</p>
                          <p className="text-sm text-gray-500">{event.location}</p>
                          <p className="mt-1 text-xs text-gray-400">
                            {formatDate(event.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="py-4 text-center text-gray-500">No tracking updates available yet</p>
              )}

              <div className="pt-4">
                <a
                  href={trackingInfo.trackingUrl || `https://trackingmore.com/tracking.php?nums=${trackingInfo.trackingNumber}&courier=${trackingInfo.carrierCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full gap-2 px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  <FiExternalLink className="w-4 h-4" />
                  View Full Tracking Details
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Tracking Modal */}
      {showAddTrackingModal && selectedOrderForTracking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Tracking Information</h3>
              <button
                onClick={() => {
                  setShowAddTrackingModal(false);
                  setSelectedOrderForTracking(null);
                }}
                className="text-2xl text-gray-400 transition-colors hover:text-gray-600"
              >
                <FiX />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Carrier
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded"
                  value={trackingForm.carrierCode}
                  onChange={(e) => setTrackingForm({
                    ...trackingForm,
                    carrierCode: e.target.value
                  })}
                >
                  <option value="">Select Carrier</option>
                  {carriers.map((carrier) => (
                    <option key={carrier.code} value={carrier.code}>
                      {carrier.name} ({carrier.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Tracking Number
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={trackingForm.trackingNumber}
                  onChange={(e) => setTrackingForm({
                    ...trackingForm,
                    trackingNumber: e.target.value
                  })}
                  placeholder="Enter tracking number"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowAddTrackingModal(false);
                    setSelectedOrderForTracking(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addTracking}
                  className="px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded hover:bg-blue-700"
                  disabled={!trackingForm.carrierCode || !trackingForm.trackingNumber}
                >
                  Add Tracking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;


