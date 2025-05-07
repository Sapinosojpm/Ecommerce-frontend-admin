import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "../App";

const FeePerKiloEditor = () => {
  const [feePerKilo, setFeePerKilo] = useState(0);

  useEffect(() => {
    const fetchFee = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/weight/fee-per-kilo`);
        if (response.data.success) {
          setFeePerKilo(response.data.fee);
        } else {
          toast.error("Failed to load fee per kilo.");
        }
      } catch (error) {
        toast.error("Error fetching fee data.");
      }
    };
    fetchFee();
  }, []);

  const handleSave = async () => {
    try {
      await axios.put(`${backendUrl}/api/weight/fee-per-kilo`, { perKilo: feePerKilo });
      toast.success("Fee per kilo updated!");
    } catch (error) {
      toast.error("Error updating fee.");
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="mb-2 text-xl font-semibold">Fee per Kilo</h2>
      <input
        type="number"
        className="w-full p-2 border rounded"
        value={feePerKilo}
        onChange={(e) => setFeePerKilo(parseFloat(e.target.value) || 0)}
      />
      <button
        className="px-4 py-2 mt-2 text-white bg-blue-500 rounded"
        onClick={handleSave}
      >
        Save
      </button>
    </div>
  );
};

export default FeePerKiloEditor;
