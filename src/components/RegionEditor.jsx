import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "../App";

const RegionEditor = () => {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingRegion, setEditingRegion] = useState(null);

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/regions`);
        setRegions(response.data);
      } catch (error) {
        toast.error("Failed to load regions.");
      }
    };
    fetchRegions();
  }, []);

  const updateRegionFee = async (id, fee) => {
    if (fee < 0) return toast.error("Delivery fee cannot be negative.");
    
    setLoading(true);
    try {
      await axios.put(`${backendUrl}/api/regions/${id}`, { fee: parseFloat(fee) });
      setRegions(regions.map((region) => 
        region._id === id ? { ...region, fee: parseFloat(fee) } : region
      ));
      setEditingRegion(null);
      toast.success("Delivery fee updated successfully!");
    } catch (error) {
      toast.error("Failed to update delivery fee.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="mb-4 text-2xl font-semibold text-gray-700">Manage Delivery Fees</h2>

      {/* Scrollable Table */}
      <div className="overflow-y-auto border border-gray-300 rounded-lg max-h-96">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-gray-100 shadow-md">
            <tr className="text-left">
              <th className="p-3 border">Region</th>
              <th className="p-3 border">Delivery Fee (₱)</th>
              <th className="p-3 text-center border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {regions.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-4 text-center text-gray-500">
                  No regions available.
                </td>
              </tr>
            ) : (
              regions.map((region) => (
                <tr key={region._id} className="transition hover:bg-gray-50">
                  <td className="p-3 border">{region.name}</td>
                  {editingRegion === region._id ? (
                    <>
                      <td className="p-3 border">
                        <input
                          type="number"
                          value={region.fee}
                          onChange={(e) =>
                            setRegions(
                              regions.map((r) =>
                                r._id === region._id ? { ...r, fee: e.target.value } : r
                              )
                            )
                          }
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                      </td>
                      <td className="p-3 text-center border">
                        <button
                          onClick={() => updateRegionFee(region._id, region.fee)}
                          className="px-3 py-2 mx-1 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                          disabled={loading}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingRegion(null)}
                          className="px-3 py-2 mx-1 text-white bg-gray-500 rounded-lg hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-3 border">₱{region.fee.toFixed(2)}</td>
                      <td className="p-3 text-center border">
                        <button
                          onClick={() => setEditingRegion(region._id)}
                          className="px-3 py-2 mx-1 text-white bg-yellow-500 rounded-lg hover:bg-yellow-600"
                        >
                          Edit Fee
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RegionEditor;
