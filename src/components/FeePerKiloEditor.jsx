import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "../App";

const FeePerKiloEditor = () => {
  const [feePerKilo, setFeePerKilo] = useState(0);
  const [originalFee, setOriginalFee] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    setSaving(true);
    try {
      await axios.put(`${backendUrl}/api/weight/fee-per-kilo`, {
        perKilo: feePerKilo,
      });
      setOriginalFee(feePerKilo);
      toast.success("Fee per kilo updated!");
    } catch (error) {
      toast.error("Error updating fee.");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setFeePerKilo(value);
    } else {
      setFeePerKilo(0);
    }
  };

  return (
    <div className="max-w-md p-6 mx-auto mt-10 bg-white shadow-md rounded-2xl">
      <h2 className="mb-6 text-2xl font-bold text-indigo-700">Weight-Based Fee</h2>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="w-1/2 h-4 bg-indigo-100 rounded"></div>
          <div className="h-10 bg-indigo-100 rounded"></div>
          <div className="h-10 bg-indigo-200 rounded"></div>
        </div>
      ) : (
        <>
          <label className="block mb-2 text-sm font-medium text-indigo-700">Fee (₱)</label>
          <input
            type="number"
            className="w-full px-4 py-3 mb-4 text-indigo-900 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={feePerKilo}
            min="0"
            step="0.01"
            onChange={handleInputChange}
          />

          <button
            onClick={handleSave}
            disabled={feePerKilo === originalFee || saving}
            className={`w-full py-2 font-semibold rounded-lg transition duration-200 ${
              feePerKilo === originalFee || saving
                ? "bg-indigo-300 cursor-not-allowed text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </>
      )}
    </div>
  );
};

export default FeePerKiloEditor;
