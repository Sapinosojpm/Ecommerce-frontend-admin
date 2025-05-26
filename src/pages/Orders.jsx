import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { backendUrl, currency } from "../App";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";
import QRCode from "qrcode";

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [sortCriteria, setSortCriteria] = useState("date");
  const [qrCodes, setQrCodes] = useState({});
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedOrderQr, setSelectedOrderQr] = useState(null);
  const canvasRef = useRef(null);

  // Define tabs with their corresponding statuses and colors
  const tabs = [
    { id: "all", label: "All Orders", color: "bg-gray-100 text-gray-800", activeColor: "bg-gray-500 text-white" },
    { id: "order placed", label: "Order Placed", color: "bg-blue-100 text-blue-800", activeColor: "bg-blue-500 text-white" },
    { id: "packing", label: "Packing", color: "bg-yellow-100 text-yellow-800", activeColor: "bg-yellow-500 text-white" },
    { id: "forPickup", label: "Ready for Pickup", color: "bg-orange-100 text-orange-800", activeColor: "bg-orange-500 text-white" },
    { id: "shipped", label: "Shipped", color: "bg-purple-100 text-purple-800", activeColor: "bg-purple-500 text-white" },
    { id: "out for delivery", label: "Out for Delivery", color: "bg-indigo-100 text-indigo-800", activeColor: "bg-indigo-500 text-white" },
    { id: "delivered", label: "Delivered", color: "bg-green-100 text-green-800", activeColor: "bg-green-500 text-white" },
    { id: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800", activeColor: "bg-red-500 text-white" }
  ];

  useEffect(() => {
    if (token) {
      fetchAllOrders();
    }
  }, [token]);

  const fetchAllOrders = async () => {
    try {
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
        trackingUrl: `${window.location.origin}/track-order/${order._id}` // Optional tracking URL
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

  // Print QR code
 const printQrCode = (order, qrCodeUrl) => {
  const logoUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Shopee_logo.svg/1200px-Shopee_logo.svg.png';
  const currency = '₱';

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>E-Invoice - ${order._id}</title>
        <style>
          @page {
            size: 105mm 148mm;
            margin: 5mm;
          }

          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            width: 100%;
            margin: 0 auto;
            color: #333;
            padding: 0;
            font-size: 11px;
          }

          header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid indigo;
            padding-bottom: 4px;
            margin-bottom: 10px;
          }

          header img {
            width: 60px;
            object-fit: contain;
          }

          header h2 {
            color: indigo;
            font-size: 1rem;
            margin: 0;
          }

          .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
          }

          .invoice-info > div {
            width: 48%;
          }

          .section-title {
            font-weight: 700;
            color: indigo;
            border-bottom: 1px solid indigo;
            padding-bottom: 2px;
            margin-bottom: 5px;
            font-size: 0.95rem;
          }

          .info-row {
            font-size: 11px;
            margin-bottom: 4px;
          }

          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
          }

          .items-table th, .items-table td {
            border: 1px solid #ccc;
            padding: 4px;
            font-size: 10px;
          }

          .items-table th {
            background: #f0f0f0;
            text-align: left;
          }

          .total-row {
            font-weight: bold;
          }

          .qr-section {
            text-align: center;
            margin-top: 5px;
          }

          .qr-section img {
            width: 100px;
            height: 100px;
            object-fit: contain;
            border: 1px solid #ddd;
            padding: 5px;
            border-radius: 5px;
          }

          footer {
            text-align: center;
            font-size: 10px;
            color: #999;
            margin-top: 15px;
            border-top: 1px solid #eee;
            padding-top: 5px;
          }

          @media print {
            body {
              margin: 0;
              padding: 0;
              width: 100%;
            }

            header, .invoice-info, .items-table, .qr-section {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <header>
          <img src="${logoUrl}" alt="Shopee Logo" />
          <h2>E-INVOICE</h2>
        </header>

        <div class="invoice-info">
          <div>
            <div class="section-title">Order Details</div>
            <div class="info-row"><strong>Order ID:</strong> ${order._id}</div>
            <div class="info-row"><strong>Date:</strong> ${new Date(order.date).toLocaleDateString()}</div>
          </div>
          <div class="qr-section">
            <img src="${qrCodeUrl}" alt="Order QR Code" />
            <div style="font-size: 9px; margin-top: 4px; color: #555;">Scan QR</div>
          </div>
        </div>

        <div class="invoice-info">
          <div>
            <div class="section-title">Customer</div>
            <div class="info-row"><strong>Name:</strong> ${order.address?.firstName || ''} ${order.address?.lastName || ''}</div>
            <div class="info-row"><strong>Address:</strong> ${order.address?.street || ''}, ${order.address?.city || ''}, ${order.address?.province || ''} ${order.address?.zip || ''}</div>
            <div class="info-row"><strong>Phone:</strong> ${order.address?.phone || 'N/A'}</div>
          </div>
          <div>
            <div class="section-title">Payment</div>
            <div class="info-row"><strong>Method:</strong> ${order.paymentMethod || 'N/A'}</div>
            <div class="info-row"><strong>Amount:</strong> ${currency}${order.amount.toLocaleString()}</div>
            <div class="info-row"><strong>Status:</strong> ${order.payment === false ? 'Paid' : order.payment}</div>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items && order.items.length > 0 
              ? order.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>${currency}${item.price.toLocaleString()}</td>
                    <td>${currency}${(item.price * item.quantity).toLocaleString()}</td>
                  </tr>
                `).join('')
              : `<tr><td colspan="4" style="text-align:center; color:#999;">No items</td></tr>`}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="3" style="text-align:right;">Grand Total</td>
              <td>${currency}${order.amount.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        <footer>Thank you for shopping with us!</footer>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
};




  // Bulk generate QR codes for all orders
  // const generateBulkQrCodes = async () => {
  //   const ordersToProcess = getFilteredOrders();
  //   toast.info(`Generating QR codes for ${ordersToProcess.length} orders...`);
    
  //   for (const order of ordersToProcess) {
  //     if (!qrCodes[order._id]) {
  //       await generateQrCode(order);
  //       // Small delay to prevent overwhelming the system
  //       await new Promise(resolve => setTimeout(resolve, 100));
  //     }
  //   }
    
  //   toast.success(`QR codes generated for ${ordersToProcess.length} orders!`);
  // };

  // Filter orders based on active tab
  const getFilteredOrders = () => {
    if (activeTab === "all") return orders;
    if (activeTab === "forPickup") return orders.filter(order => order.status === "for pickup");
    return orders.filter(order => order.status === activeTab);
  };

  // Get count for each tab
  const getTabCount = (tabId) => {
    if (tabId === "all") return orders.length;
    if (tabId === "forPickup") return orders.filter(order => order.status === "for pickup").length;
    return orders.filter(order => order.status === tabId).length;
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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-800">Order Management</h3>
        {/* <button
          onClick={generateBulkQrCodes}
          className="px-4 py-2 text-white transition-colors bg-purple-500 rounded-lg shadow-md hover:bg-purple-600"
        >
          Generate QR Codes ({getFilteredOrders().length})
        </button> */}
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
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isActive 
                    ? 'bg-white bg-opacity-20' 
                    : 'bg-black bg-opacity-10'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sorting Controls */}
        <div className="flex items-center gap-4">
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
            Showing {sortedOrders.length} orders
          </div>
        </div>
      </div>

      {/* Order List */}
      <div className="space-y-4">
        {sortedOrders.length > 0 ? (
          sortedOrders.map((order) => (
            <div
              key={order._id}
              className="grid grid-cols-1 sm:grid-cols-[0.5fr_2fr_1fr] lg:grid-cols-[0.5fr_2fr_1fr_1fr_1fr] gap-3 items-start border-2 border-gray-200 p-5 md:p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white"
            >
              <img className="w-12" src={assets.parcel_icon} alt="Parcel" />
              
              <div>
                <p className="mb-2 font-mono text-xs text-gray-600 break-all">{order._id}</p>
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
                    {order.payment ? "Done" : "Pending"}
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
                  <option value="for pickup">Ready for Courier Pickup</option>
                  <option value="shipped">Shipped</option>
                  <option value="out for delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Canceled</option>
                </select>

                {/* QR Code Button */}
                <button
                  onClick={() => showQrCode(order)}
                  className="flex items-center justify-center gap-2 px-3 py-2 text-white transition-colors bg-indigo-500 rounded-lg shadow-sm hover:bg-indigo-600"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM19 13h2v2h-2zM13 13h2v2h-2zM15 15h2v2h-2zM13 17h2v2h-2zM17 17h2v2h-2zM19 19h2v2h-2zM15 19h2v2h-2zM17 15h2v2h-2z"/>
                  </svg>
                  QR Code
                </button>

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
                : `No orders with status "${activeTab === "forPickup" ? "for pickup" : activeTab}".`
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
                ×
              </button>
            </div>

            <div className="text-center">
              <div className="p-4 mb-4 rounded-lg bg-gray-50">
                <p className="mb-2 text-sm text-gray-600">
                  <strong>Order ID:</strong> {selectedOrderQr.order._id}
                </p>
                <p className="mb-2 text-sm text-gray-600">
                  <strong>Customer:</strong> {selectedOrderQr.order.address?.firstName} {selectedOrderQr.order.address?.lastName}
                </p>
                <p className="mb-2 text-sm text-gray-600">
                  <strong>Amount:</strong> {currency}{selectedOrderQr.order.amount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Status:</strong> 
                  <span className="px-2 py-1 ml-2 text-xs text-blue-800 bg-blue-100 rounded-full">
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
                  className="px-4 py-2 text-sm text-white transition-colors bg-blue-500 rounded-lg shadow-sm hover:bg-blue-600"
                >
                  Download
                </button>
                <button
                  onClick={() => printQrCode(selectedOrderQr.order, selectedOrderQr.qrCode)}
                  className="px-4 py-2 text-sm text-white transition-colors bg-green-500 rounded-lg shadow-sm hover:bg-green-600"
                >
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;