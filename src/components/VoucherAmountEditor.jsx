import React, { useState, useEffect } from "react";
import axios from "axios";
import { backendUrl } from "../App";

const VoucherAmountEditor = () => {
  const [vouchers, setVouchers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [voucherList, setVoucherList] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [voucherAmount, setVoucherAmount] = useState("");
  const [minimumPurchase, setMinimumPurchase] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      console.log("📤 Fetching vouchers from:", `${backendUrl}/api/voucher-amounts`);
      const res = await axios.get(`${backendUrl}/api/voucher-amounts`);
      console.log("📥 Vouchers received:", res.data);
      setVouchers(res.data);
    } catch (error) {
      console.error("❌ Error fetching vouchers:", error.response?.data || error.message);
    }
  };

  const generateRandomCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleShowModal = () => {
    setShowModal(true);
    setVoucherList([]);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setLoading(false);
  };

  const handleGenerateMultiple = () => {
    if (quantity <= 0) {
      setAlert({ type: "error", message: "Quantity must be at least 1." });
      return;
    }

    const newVouchers = Array.from({ length: quantity }, () => ({
      code: generateRandomCode(),
      voucherAmount: Number(voucherAmount),
      minimumPurchase: Number(minimumPurchase),
      expirationDate: expirationDate ? new Date(expirationDate).toISOString() : null,
    }));

    setVoucherList(newVouchers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    if (voucherList.length === 0) {
      setAlert({ type: "error", message: "Please generate at least one voucher." });
      setLoading(false);
      return;
    }

    if (!window.confirm(`Are you sure you want to create ${voucherList.length} vouchers?`)) {
      setLoading(false);
      return;
    }

    try {
      await axios.post(
        `${backendUrl}/api/voucher-amounts/bulk`,
        { vouchers: voucherList },
        { headers: { "Content-Type": "application/json" } }
      );

      setAlert({ type: "success", message: `${voucherList.length} vouchers created successfully!` });
      fetchVouchers();
      handleCloseModal();
    } catch (error) {
      setAlert({ type: "error", message: error.response?.data?.message || "An error occurred while saving vouchers." });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVoucher = async (id) => {
    if (!window.confirm("Are you sure you want to delete this voucher?")) return;

    try {
      await axios.delete(`${backendUrl}/api/voucher-amounts/${id}`);
      setAlert({ type: "success", message: "Voucher deleted successfully!" });
      fetchVouchers();
    } catch (error) {
      console.error("Error deleting voucher:", error);
      setAlert({ type: "error", message: "Failed to delete voucher." });
    }
  };

  return (
    <div className="max-w-4xl p-6 mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-green-600">Voucher Amount Editor</h2>
        <button className="px-4 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600" onClick={handleShowModal}>
          + Add Vouchers
        </button>
      </div>

      {alert.message && (
        <div className={`p-3 mb-4 rounded-lg ${alert.type === "success" ? "bg-green-500 text-white" : "bg-red-100 text-red-600 border border-red-500"}`}>
          {alert.message}
        </div>
      )}

    {/* Display Vouchers */}
<div className="p-4 bg-white rounded-lg shadow">
  <h3 className="mb-2 text-lg font-semibold">Available Vouchers</h3>
  {vouchers.length === 0 ? (
    <p className="text-gray-600">No vouchers available.</p>
  ) : (
    <table className="min-w-full border-collapse table-auto">
      <thead>
        <tr className="bg-gray-100">
          <th className="px-4 py-2 text-sm font-semibold text-left text-gray-600">Code</th>
          <th className="px-4 py-2 text-sm font-semibold text-left text-gray-600">Voucher Amount (₱)</th>
          <th className="px-4 py-2 text-sm font-semibold text-left text-gray-600">Min. Purchase (₱)</th>
          <th className="px-4 py-2 text-sm font-semibold text-left text-gray-600">Actions</th>
        </tr>
      </thead>
      <tbody>
        {vouchers.map((voucher) => (
          <tr key={voucher._id} className="border-t">
            <td className="px-4 py-2 text-sm text-gray-800">{voucher.code}</td>
            <td className="px-4 py-2 text-sm text-gray-800">₱{voucher.voucherAmount}</td>
            <td className="px-4 py-2 text-sm text-gray-800">₱{voucher.minimumPurchase}</td>
            <td className="px-4 py-2 text-sm">
              <button
                className="px-3 py-1 text-white bg-red-500 rounded-lg hover:bg-red-600"
                onClick={() => handleDeleteVoucher(voucher._id)}
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
</div>


      {/* Modal for Creating Vouchers */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="p-6 bg-white rounded-lg shadow-lg w-[500px]">
            <h3 className="mb-4 text-lg font-semibold">Create Vouchers</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              
              <label className="block">
                <span className="text-gray-700">How many vouchers?</span>
                <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full p-2 mt-1 border rounded-lg" />
              </label>

              <label className="block">
                <span className="text-gray-700">Voucher Amount (₱)</span>
                <input type="number" value={voucherAmount} onChange={(e) => setVoucherAmount(e.target.value)} className="w-full p-2 mt-1 border rounded-lg" required min="1" />
              </label>

              <label className="block">
                <span className="text-gray-700">Minimum Purchase (₱)</span>
                <input type="number" value={minimumPurchase} onChange={(e) => setMinimumPurchase(e.target.value)} className="w-full p-2 mt-1 border rounded-lg" required min="0" />
              </label>

              <label className="block">
                <span className="text-gray-700">Expiration Date</span>
                <input type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} className="w-full p-2 mt-1 border rounded-lg" />
              </label>

              <button type="button" className="w-full px-4 py-2 text-white bg-gray-500 rounded-lg hover:bg-gray-600" onClick={handleGenerateMultiple}>
                Generate {quantity} Vouchers
              </button>

              <div className="flex justify-end mt-3 space-x-2">
                <button type="button" className="px-4 py-2 text-white bg-gray-500 rounded-lg hover:bg-gray-600" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600" disabled={loading}>
                  {loading ? "Saving..." : "Save All"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherAmountEditor;
