import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "../App";

const FeePerKiloEditor = () => {
  const [feePerKilo, setFeePerKilo] = useState(0);
  const [originalFee, setOriginalFee] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFee = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/weight/fee-per-kilo`);
        if (response.data.success) {
          setFeePerKilo(response.data.fee);
          setOriginalFee(response.data.fee);
        } else {
          toast.error("Failed to load fee per kilo.");
        }
      } catch (error) {
        toast.error("Error fetching fee data.");
      } finally {
        setLoading(false);
      }
    };
    fetchFee();
  }, []);

  const handleSave = async () => {
    try {
      await axios.put(`${backendUrl}/api/weight/fee-per-kilo`, { perKilo: feePerKilo });
      toast.success("Fee per kilo updated!");
      setOriginalFee(feePerKilo);
    } catch (error) {
      toast.error("Error updating fee.");
    }
  };

  return (
    <div className="max-w-md p-6 mx-auto mt-6 shadow-lg bg-indigo-50 rounded-2xl">
      <h2 className="mb-4 text-2xl font-bold text-indigo-800">Fee per Kilo Editor</h2>

      {loading ? (
        <p className="text-indigo-600">Loading...</p>
      ) : (
        <>
          <label className="block mb-2 text-sm font-medium text-indigo-700">Fee (₱)</label>
          <input
            type="number"
            className="w-full px-4 py-2 mb-4 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={feePerKilo}
            min="0"
            step="0.01"
            onChange={(e) => setFeePerKilo(parseFloat(e.target.value) || 0)}
          />
          <button
            onClick={handleSave}
            disabled={feePerKilo === originalFee}
            className={`w-full py-2 font-semibold text-white rounded-lg transition duration-200 ${
              feePerKilo === originalFee
                ? "bg-indigo-300 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            Save
          </button>
        </>
      )}
    </div>
  );
};

export default FeePerKiloEditor;
