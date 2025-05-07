import { useState, useEffect } from "react";
import { backendUrl } from "../App";

const AdminDiscount = () => {
  const [discountCode, setDiscountCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [discountId, setDiscountId] = useState(null);
  const [message, setMessage] = useState("");

  // ✅ Fetch the latest discount on component mount
  useEffect(() => {
    const fetchDiscount = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/admin/discounts`);
        if (!response.ok) throw new Error("Failed to fetch discount");

        const data = await response.json();
        if (data) {
          setDiscountId(data._id);
          setDiscountCode(data.discountCode);
          setDiscountPercent(data.discountPercent);
        }
      } catch (error) {
        console.error("Error fetching discount:", error);
        setMessage("No discount found.");
      }
    };

    fetchDiscount();
  }, []);

  // ✅ Add or Update Discount
  const handleSaveDiscount = async () => {
    try {
      if (!discountCode.trim() || !discountPercent) {
        setMessage("Both discount code and percentage are required.");
        return;
      }

      const method = discountId ? "PUT" : "POST";
      const url = discountId
        ? `${backendUrl}/api/admin/discounts/${discountId}`
        : `${backendUrl}/api/admin/discounts`;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discountCode: discountCode.trim(), discountPercent: Number(discountPercent) }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to save discount");

      setMessage(discountId ? "Discount updated successfully!" : "Discount added successfully!");
      setDiscountId(data.discount?._id || discountId); // Ensure the ID is set after creation
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="flex justify-center items-start m-5 min-h-screen ">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 text-center">{discountId ? "Update" : "Add"} Discount</h2>

        {message && <p className="mt-2 text-center text-red-500">{message}</p>}

        <input
          type="text"
          placeholder="Discount Code"
          value={discountCode}
          onChange={(e) => setDiscountCode(e.target.value)}
          className="w-full mt-4 px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
        />

        <input
          type="number"
          placeholder="Discount Percentage"
          value={discountPercent}
          onChange={(e) => setDiscountPercent(e.target.value)}
          className="w-full mt-4 px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
        />

        <button
          onClick={handleSaveDiscount}
          className="w-full mt-4 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
        >
          {discountId ? "Update Discount" : "Add Discount"}
        </button>
      </div>
    </div>
  );
};

export default AdminDiscount;
