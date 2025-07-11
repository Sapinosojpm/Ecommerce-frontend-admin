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
  FiRefreshCw,
  FiMapPin
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
  carrierCode: 'jtexpress-ph'
});
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [loadingCarriers, setLoadingCarriers] = useState(false);
  const canvasRef = useRef(null);
const MANUAL_CARRIERS = [
  { carrier_code: 'jtexpress-ph', carrier_name: 'J&T Express Philippines' },
  { carrier_code: 'lbc', carrier_name: 'LBC Express' },
  { carrier_code: 'phlpost', carrier_name: 'Philippine Post' },
  { carrier_code: 'ninjavan-ph', carrier_name: 'Ninja Van Philippines' },
  { carrier_code: '2go', carrier_name: '2GO Express' },
  { carrier_code: 'flash-express-ph', carrier_name: 'Flash Express Philippines' },
  { carrier_code: 'grab-express-ph', carrier_name: 'Grab Express Philippines' },
  { carrier_code: 'lalamove-ph', carrier_name: 'Lalamove Philippines' },
  { carrier_code: 'dhl-ph', carrier_name: 'DHL Philippines' },
  { carrier_code: 'fedex-ph', carrier_name: 'FedEx Philippines' }
];
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

  // Add sync all statuses handler
  const [syncingStatuses, setSyncingStatuses] = useState(false);
  const syncAllStatuses = async () => {
    try {
      setSyncingStatuses(true);
      const response = await axios.post(
        `${backendUrl}/api/tracking/sync-statuses`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success(`Statuses synced! Updated: ${response.data.updatedCount}`);
        fetchAllOrders();
      } else {
        toast.error(response.data.message || 'Failed to sync statuses');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to sync statuses');
    } finally {
      setSyncingStatuses(false);
    }
  };

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
    setLoadingCarriers(true);
    // Use manual carriers instead of API
    setCarriers(MANUAL_CARRIERS);
  } catch (error) {
    console.error("Failed to set carriers:", error);
    toast.error('Failed to load carriers');
  } finally {
    setLoadingCarriers(false);
  }
};


  const statusHandler = async (event, orderId) => {
    const newStatus = event.target.value;
    const order = orders.find(o => o._id === orderId);
    // Prevent status change to certain statuses if no tracking number
    const needsTracking = [
      'Ready for Pickup',
      'Shipped',
      'Out for Delivery'
    ];
    if (needsTracking.includes(newStatus) && !(order.tracking && order.tracking.trackingNumber)) {
      toast.error('Cannot proceed: Please add a tracking number before changing status to "' + newStatus + '".');
      return;
    }
    try {
      const response = await axios.post(
        `${backendUrl}/api/order/status`,
        { orderId, status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success("Order status updated successfully.");
        fetchAllOrders();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error updating status.");
    }
  };

  const generateQrCode = async (order) => {
    try {
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
      toast.error('Failed to generate QR code');
      return null;
    }
  };

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

  const downloadQrCode = (orderId, qrCodeUrl) => {
    const link = document.createElement('a');
    link.download = `qr-code-order-${orderId}.png`;
    link.href = qrCodeUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR code downloaded successfully!');
  };

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

  const getTrackingInfo = async (orderId) => {
    try {
      setLoadingTracking(true);
      const response = await axios.get(
        `${backendUrl}/api/tracking/order/${orderId}/status`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setTrackingInfo(response.data.tracking);
        setShowTrackingModal(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to get tracking information");
    } finally {
      setLoadingTracking(false);
    }
  };

  const addTracking = async () => {
    try {
      if (!trackingForm.trackingNumber) {
        toast.error('Please enter a tracking number');
        return;
      }

      const response = await axios.post(
        `${backendUrl}/api/tracking/order/${selectedOrderForTracking._id}/tracking`,
        trackingForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Tracking added successfully');
        fetchAllOrders();
        setShowAddTrackingModal(false);
        setTrackingForm({ trackingNumber: '', carrierCode: 'jtexpress-ph' });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add tracking');
    }
  };

  const detectCarrier = async (trackingNumber) => {
    if (!trackingNumber) {
      toast.error('Please enter a tracking number');
      return;
    }
    
    try {
      setLoadingCarriers(true);
      const response = await axios.post(
        `${backendUrl}/api/tracking/detect-carrier`,
        { trackingNumber },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success && response.data.carriers.length > 0) {
        // Auto-select J&T Express if detected
        const jtExpress = response.data.carriers.find(c => c.carrier_code === 'jtexpress-ph');
        if (jtExpress) {
          setTrackingForm(prev => ({
            ...prev,
            carrierCode: 'jtexpress-ph'
          }));
          toast.success(`Detected carrier: J&T Express`);
        } else {
          // Show other options
          toast.info(
            <div>
              <p>Detected carriers:</p>
              <ul className="mt-2">
                {response.data.carriers.map(carrier => (
                  <li key={carrier.carrier_code} className="text-sm">
                    {carrier.carrier_name} ({carrier.carrier_code})
                  </li>
                ))}
              </ul>
            </div>,
            { autoClose: 5000 }
          );
        }
      } else {
        toast.error('No carriers detected for this tracking number');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to detect carrier');
    } finally {
      setLoadingCarriers(false);
    }
  };

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
      }
    } catch (error) {
      toast.error("Failed to confirm payment.");
    }
  };

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

  const getTrackingNumberFormat = (carrierCode) => {
    const formats = {
      'jtexpress-ph': 'JTV999999999999 (e.g., JTV123456789012)',
      'lbc': 'LL9999999999 (e.g., AB1234567890)',
      'phlpost': 'LL999999999LL (e.g., AB123456789XY)',
      'ninjavan': 'NV999999999999 (e.g., NV123456789012)',
      '2go': '2GO9999999999 (e.g., 2GO1234567890)'
    };
    return formats[carrierCode] || '8-20 alphanumeric characters';
  };

  // Collapsible state for each order
  const [expandedOrders, setExpandedOrders] = useState({});
  const toggleExpand = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const viewOrDownloadReceipt = (order) => {
    // If S3 URL exists, open/download directly
    if (order.receiptImage && order.receiptImage.url) {
      window.open(order.receiptImage.url, '_blank');
      return;
    }
    // Fallback: try to download from backend (legacy/local uploads)
    downloadReceipt(order._id);
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
          {/* Sync All Statuses Button */}
          <button
            onClick={syncAllStatuses}
            disabled={syncingStatuses}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <FiRefreshCw className={syncingStatuses ? 'animate-spin' : ''} />
            {syncingStatuses ? 'Syncing...' : 'Sync All Statuses'}
          </button>
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
                  <div className="mb-2 text-base font-semibold text-blue-700">Order Items</div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs border border-gray-200 rounded-lg bg-blue-50">
                      <thead className="sticky top-0 z-10 bg-blue-100">
                        <tr className="text-blue-900">
                          <th className="px-2 py-1 text-left">Product</th>
                          <th className="px-2 py-1 text-left">Variation(s)</th>
                          <th className="px-2 py-1 text-right">Base Price</th>
                          <th className="px-2 py-1 text-right">Variation Adj.</th>
                          <th className="px-2 py-1 text-right">Discount</th>
                          <th className="px-2 py-1 text-right">Final Price</th>
                          <th className="px-2 py-1 text-right">Qty</th>
                          <th className="px-2 py-1 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(expandedOrders[order._id] ? order.items : order.items.slice(0, 3)).map((item, index) => {
                          const capital = item.capital || 0;
                          let markup = 0;
                          if (item.additionalCapital) {
                            if (item.additionalCapital.type === 'percent') {
                              markup = capital * (item.additionalCapital.value / 100);
                            } else {
                              markup = item.additionalCapital.value || 0;
                            }
                          }
                          const basePlusMarkup = capital + markup;
                          const vat = basePlusMarkup * ((item.vat || 0) / 100);
                          const itemPrice = basePlusMarkup + vat;
                          let variationAdjustment = 0;
                          if (item.variationDetails && Array.isArray(item.variationDetails)) {
                            variationAdjustment = item.variationDetails.reduce(
                              (sum, v) => sum + (v.priceAdjustment || 0),
                              0
                            );
                          }
                          const discount = item.discount ? (itemPrice * (item.discount / 100)) : 0;
                          const finalPrice = Math.round((itemPrice - discount) * 100) / 100;
                          const itemTotal = Math.round(finalPrice * (item.quantity || 1) * 100) / 100;
                          return (
                            <tr key={index} className="border-t border-gray-200">
                              <td className="px-2 py-1 font-medium text-gray-800">{item.name}</td>
                              <td className="px-2 py-1 text-green-700">
                                {item.variationDetails?.length > 0 ? (
                                  item.variationDetails.map((v, idx) => (
                                    <div key={idx}>
                                      <span className="font-semibold">{v.variationName}</span>: {v.optionName}
                                    </div>
                                  ))
                                ) : (
                                  <span className="italic text-gray-400">None</span>
                                )}
                              </td>
                              <td className="px-2 py-1 text-right">{currency}{itemPrice.toLocaleString()}</td>
                              <td className="px-2 py-1 text-right">{currency}{variationAdjustment.toLocaleString()}</td>
                              <td className="px-2 py-1 text-right text-red-600">-{currency}{discount.toLocaleString()}</td>
                              <td className="px-2 py-1 text-right text-blue-900 font-semibold">{currency}{finalPrice.toLocaleString()}</td>
                              <td className="px-2 py-1 text-right">{item.quantity}</td>
                              <td className="px-2 py-1 text-right font-bold text-green-700">{currency}{itemTotal.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {order.items.length > 3 && (
                      <div className="mt-2 text-center">
                        <button
                          className="px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition"
                          onClick={() => toggleExpand(order._id)}
                        >
                          {expandedOrders[order._id] ? 'Show Less' : `Show All Items (${order.items.length})`}
                        </button>
                      </div>
                    )}
                  </div>
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

              <div className="space-y-1 text-sm ">
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
                <p><span className="font-medium">Date:</span> {formatDate(order.date)}</p>
              </div>


              <div className="flex flex-col gap-3">
                <select
                  onChange={(event) => statusHandler(event, order._id)}
                  value={order.status}
                  className="p-2 font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Order Placed">Order Placed</option>
                  <option value="Packing">Packing</option>
                  <option value="Ready for Pickup">Ready for Pickup</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Problem/Delayed">Problem/Delayed</option>
                  <option value="Canceled">Canceled</option>
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
                        onClick={() => viewOrDownloadReceipt(order)}
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

                {/* Subtotal, Shipping, Total */}
                {(() => {
                  const subtotal = Math.round(order.items.reduce((sum, item) => {
                    const capital = item.capital || 0;
                    let markup = 0;
                    if (item.additionalCapital) {
                      if (item.additionalCapital.type === 'percent') {
                        markup = capital * (item.additionalCapital.value / 100);
                      } else {
                        markup = item.additionalCapital.value || 0;
                      }
                    }
                    const basePlusMarkup = capital + markup;
                    const vat = basePlusMarkup * ((item.vat || 0) / 100);
                    const itemPrice = basePlusMarkup + vat;
                    let variationAdjustment = 0;
                    if (item.variationDetails && Array.isArray(item.variationDetails)) {
                      variationAdjustment = item.variationDetails.reduce(
                        (s, v) => s + (v.priceAdjustment || 0),
                        0
                      );
                    }
                    const discount = item.discount ? (itemPrice * (item.discount / 100)) : 0;
                    const finalPrice = Math.round((itemPrice - discount) * 100) / 100 + variationAdjustment;
                    return sum + finalPrice * (item.quantity || 1);
                  }, 0) * 100) / 100;
                  const voucher = order.voucherAmount || 0;
                  const total = Math.round((subtotal + (order.shippingFee || 0) - voucher) * 100) / 100;
                  return (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="mb-2 text-base font-semibold text-blue-700">Order Summary</div>
                      <div className="flex flex-col gap-1 text-sm text-gray-700">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        {voucher > 0 && (
                          <div className="flex justify-between text-green-700">
                            <span>Voucher:</span>
                            <span>-{voucher.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Shipping Fee:</span>
                          <span>{(order.shippingFee || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span>Total:</span>
                          <span>{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
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

      {/* Tracking Modal */}
      {showTrackingModal && trackingInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Tracking Information</h3>
              <button
                onClick={() => setShowTrackingModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Tracking Number:</span>
                  <span className="font-mono">{trackingInfo.tracking_number}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Carrier:</span>
                  <span>{trackingInfo.courier_code}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status:</span>
                  <span className={`capitalize font-medium ${
                    (trackingInfo.status === 'delivered' || trackingInfo.delivery_status === 'delivered') ? 'text-green-600' :
                    (trackingInfo.status === 'exception' || trackingInfo.delivery_status === 'exception') ? 'text-red-600' :
                    'text-blue-600'
                  }`}>
                    {(trackingInfo.status || trackingInfo.delivery_status)?.replace('_', ' ')}
                  </span>
                </div>
                {/* Optionally show TrackingMore raw status for debugging */}
                {trackingInfo && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-medium">TrackingMore Status:</span>
                    <span className="text-sm text-gray-500">{trackingInfo.status || trackingInfo.delivery_status}</span>
                  </div>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="font-medium">Last Updated:</span>
                  <span className="text-sm text-gray-500">
                    {new Date(trackingInfo.updated_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {trackingInfo.origin_info?.trackinfo?.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="font-medium">Tracking History</h4>
                  <div className="relative">
                    <div className="absolute left-4 h-full w-0.5 bg-gray-200 -translate-x-1/2"></div>
                    <div className="space-y-4">
                      {trackingInfo.origin_info.trackinfo.map((event, index) => (
                        <div key={index} className="relative pl-8">
                          <div className={`absolute left-4 w-3 h-3 rounded-full -translate-x-1/2 ${
                            index === 0 ? 'bg-green-500' : 'bg-blue-500'
                          }`}></div>
                          <div className="p-3 rounded-lg bg-gray-50">
                            <p className="font-medium">{event.tracking_detail}</p>
                            {event.location && (
                              <p className="text-sm text-gray-500">
                                <FiMapPin className="inline mr-1" />
                                {event.location}
                              </p>
                            )}
                            <p className="mt-1 text-xs text-gray-400">
                              {(
                                event.checkpoint_date && !isNaN(new Date(event.checkpoint_date))
                              ) ? (
                                new Date(event.checkpoint_date).toLocaleString()
                              ) : (
                                "No date available"
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-gray-500">
                  No tracking updates available yet
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <a
                  href={trackingInfo.trackingUrl || `https://trackingmore.com/tracking.php?nums=${trackingInfo.tracking_number}&courier=${trackingInfo.courier_code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-2 text-center text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  View Full Tracking Details
                </a>
                <button
                  onClick={() => getTrackingInfo(trackingInfo.orderId)}
                  className="px-4 py-2 text-white bg-gray-600 rounded hover:bg-gray-700"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Tracking Modal */}
      {showAddTrackingModal && selectedOrderForTracking && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
    <div className="w-full max-w-md bg-white rounded-lg shadow-xl">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">Add Tracking Information</h3>
        <button
          onClick={() => {
            setShowAddTrackingModal(false);
            setSelectedOrderForTracking(null);
            setTrackingForm({ trackingNumber: '', carrierCode: 'jtexpress-ph' });
          }}
          className="text-gray-400 hover:text-gray-500"
        >
          <FiX className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6">
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Tracking Number
          </label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded"
            value={trackingForm.trackingNumber}
            onChange={(e) => setTrackingForm(prev => ({
              ...prev,
              trackingNumber: e.target.value
            }))}
            placeholder="Enter tracking number"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Carrier
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded"
            value={trackingForm.carrierCode}
            onChange={(e) => setTrackingForm(prev => ({
              ...prev,
              carrierCode: e.target.value
            }))}
          >
            {carriers.map(carrier => (
              <option key={carrier.carrier_code} value={carrier.carrier_code}>
                {carrier.carrier_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              setShowAddTrackingModal(false);
              setSelectedOrderForTracking(null);
              setTrackingForm({ trackingNumber: '', carrierCode: 'jtexpress-ph' });
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