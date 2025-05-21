import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";

const BestSellerEditor = () => {
  const [maxDisplay, setMaxDisplay] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchSetting = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/best-seller-setting`);
        setMaxDisplay(res.data.maxDisplay || 10);
      } catch (error) {
        console.error("Failed to fetch best seller setting", error);
        setMessage("Error fetching setting.");
      } finally {
        setLoading(false);
      }
    };

    fetchSetting();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await axios.put(`${backendUrl}/api/best-seller-setting`, { maxDisplay });
      setMessage(res.data.message);
    } catch (error) {
      console.error("Failed to update setting", error);
      setMessage("Error saving setting.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md p-4 mx-auto bg-white rounded-lg shadow-md">
      <h2 className="mb-4 text-2xl font-bold">Best Seller Display Setting</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <label className="block mb-2 font-medium">Max Number to Display:</label>
          <input
            type="number"
            className="w-full px-3 py-2 mb-4 border border-gray-300 rounded"
            value={maxDisplay}
            onChange={(e) => setMaxDisplay(Number(e.target.value))}
            min={1}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-white transition duration-500 bg-indigo-600 rounded hover:bg-black"
          >
            {saving ? "Saving..." : "Save Setting"}
          </button>
          {message && <p className="mt-3 text-green-600">{message}</p>}
        </>
      )}
    </div>
  );
};

export default BestSellerEditor;
