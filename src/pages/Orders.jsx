import React, { useState, useEffect } from "react";
import axios from "axios";
import { backendUrl, currency } from "../App";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [sortCriteria, setSortCriteria] = useState("date");

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
        { headers: { Authorization: `Bearer ${token}` } } // Use 'Bearer' prefix
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
        { headers: { Authorization: `Bearer ${token}` } } // ✅ Use 'Bearer' format
      );

      if (response.data.success) {
        toast.success("Order status updated successfully.");
        fetchAllOrders(); // ✅ Refresh orders
      } else {
        toast.error(response.data.message || "Failed to update status.");
      }
    } catch (error) {
      console.error("Error updating status:", error.response?.data || error);
      toast.error(error.response?.data?.message || "Error updating status.");
    }
  };

  // Update the sorting logic to match backend status values:
  const sortedOrders = [...orders].sort((a, b) => {
    if (sortCriteria === "date") return new Date(b.date) - new Date(a.date);
    if (sortCriteria === "amount") return b.amount - a.amount;
    if (sortCriteria === "status") return a.status.localeCompare(b.status);
    if (sortCriteria === "cancelled") return a.status === "cancelled" ? -1 : 1;
    if (sortCriteria === "shipped") return a.status === "shipped" ? -1 : 1;
    if (sortCriteria === "orderPlaced")
      return a.status === "order placed" ? -1 : 1;
    if (sortCriteria === "packing") return a.status === "packing" ? -1 : 1;
    if (sortCriteria === "outForDelivery")
      return a.status === "out for delivery" ? -1 : 1;
    if (sortCriteria === "delivered") return a.status === "delivered" ? -1 : 1;
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
      a.download = `receipt_${orderId}.jpg`; // Adjust extension if needed
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
        fetchAllOrders(); // Refresh orders
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error confirming payment:", error.response?.data || error);
      toast.error("Failed to confirm payment.");
    }
  };

  const handleConfirm = async () => {
    try {
      await axios.post(`${backendUrl}/api/order/confirm-payment`, { orderId });
      setOrder((prevOrder) => ({ ...prevOrder, payment: true }));
    } catch (error) {
      console.error("Error confirming payment:", error);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold">Orders</h3>

      {/* Sorting Dropdown */}
      <div className="mb-4">
        <label htmlFor="sort" className="mr-2 font-medium">
          Sort By:
        </label>
        <select
          id="sort"
          className="p-2 border rounded"
          value={sortCriteria}
          onChange={(e) => setSortCriteria(e.target.value)}
        >
          <option value="date">Date</option>
          <option value="amount">Amount</option>
          <option value="status">Status</option>
          <option value="packing">Packing</option>
          <option value="cancelled">Canceled</option>
          <option value="shipped">Shipped</option>
          <option value="orderPlaced">Order Placed</option>
          <option value="outForDelivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>

      {/* Order List */}
      {sortedOrders.length > 0 ? (
        sortedOrders.map((order) => (
          <div
            key={order._id}
            className="grid grid-cols-1 sm:grid-cols-[0.5fr_2fr_1fr] lg:grid-cols-[0.5fr_2fr_1fr_1fr_1fr] gap-3 items-start border-2 border-gray-200 p-5 md:p-8 my-3 md:my-4 text-xs sm:text-sm text-gray-700"
          >
            <img className="w-12" src={assets.parcel_icon} alt="Parcel" />
            <div>
              <div className="font-medium">
                {order.items.map((item, index) => (
                  <div key={index} className="py-0.5">
                    <p>
                      {item.name} x {item.quantity}
                    </p>

                    {item.variationDetails?.length > 0 && (
                      <p className="mt-1 text-sm">
                        Variations:{" "}
                        <span className="text-green-500">
                          {item.variationDetails.map((v, idx) => (
                            <span key={idx} className="mr-2">
                              {v.variationName} - {v.optionName}
                              {/* {v.priceAdjustment > 0 &&
                                ` (+₱${v.priceAdjustment})`} */}
                            </span>
                          ))}
                        </span>
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <hr />
              <p className="mt-3 mb-2 font-medium">
                {order.address?.firstName} {order.address?.lastName}
              </p>
              <div>
                <p>{order.address?.street},</p>
                <p>
                  {order.address?.city}, {order.address?.barangay},{" "}
                  {order.address?.province}, {order.address?.postalCode}
                </p>
              </div>
              <p>{order.address?.phone}</p>
            </div>

            <div>
              <p className="text-sm sm:text-[15px]">
                Items: {order.items.length}
              </p>
              <p className="mt-3">Method: {order.paymentMethod}</p>
              <p>Payment: {order.payment ? "Done" : "Pending"}</p>
              <p>Date: {new Date(order.date).toLocaleDateString()}</p>
            </div>

            <p className="text-sm sm:text-[15px]">
              {currency}
              {order.amount.toLocaleString()}
            </p>

            <div className="flex flex-col gap-3">
              <select
                onChange={(event) => statusHandler(event, order._id)}
                value={order.status}
                className="p-2 font-semibold border rounded"
              >
                <option value="order placed">Order Placed</option>
                <option value="packing">Packing</option>
                <option value="shipped">Shipped</option>
                <option value="out for delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Canceled</option>
              </select>

              <div className="flex gap-3">
                {order.paymentMethod === "receipt_upload" && (
                  <>
                    <button
                      onClick={() => downloadReceipt(order._id)}
                      className="px-3 py-1 text-white bg-blue-500 rounded hover:bg-blue-600"
                    >
                      View Receipt
                    </button>

                    {!order.payment && (
                      <button
                        onClick={() => confirmPayment(order._id)}
                        className="px-3 py-1 text-white bg-green-500 rounded hover:bg-green-600"
                      >
                        Confirm Payment
                      </button>
                    )}

                    {order.payment && (
                      <button
                        className="px-3 py-1 text-white bg-gray-400 rounded cursor-not-allowed"
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
        <p className="text-gray-500">No orders found.</p>
      )}
    </div>
  );
};

export default Orders;
