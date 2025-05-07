import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";

const ViewersTracker = () => {
  const [pageViews, setPageViews] = useState([]);
  const [timeFilter, setTimeFilter] = useState("monthly"); // Default filter
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPageViews = async () => {
        setLoading(true);
        setError(null);
      
        try {
          const token = localStorage.getItem("token");
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
          const response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/pageviews/views?filter=${timeFilter}`,
            { headers }
          );
      
          setPageViews(response.data);
        } catch (error) {
          if (error.response?.status === 401) {
            setError("⚠️ You must be logged in as an admin to view analytics.");
          } else {
            setError("❌ Error fetching page views.");
          }
          console.error("Error fetching page views:", error);
        }
        setLoading(false);
      };
      

    fetchPageViews();
  }, [timeFilter]);

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white shadow-lg rounded-lg">
      <motion.h2
        className="text-2xl font-bold text-center mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Page View Statistics
      </motion.h2>

      {/* Time Filter Dropdown */}
      <div className="flex justify-end mb-4">
        <select
          className="p-2 border rounded-lg bg-gray-100"
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
        >
          <option value="daily">Daily</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && <p className="text-center text-gray-500">Loading page views...</p>}

      {/* Error Message */}
      {error && <p className="text-center text-red-500">{error}</p>}

      {/* Page Views Table */}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-gray-100 shadow-md rounded-lg">
            <thead>
              <tr className="bg-blue-500 text-white">
                <th className="p-3 text-left">Page</th>
                <th className="p-3 text-left">{timeFilter === "daily" ? "Date" : "Month"}</th>
                <th className="p-3 text-left">User Type</th>
                <th className="p-3 text-left">Views</th>
              </tr>
            </thead>
            <tbody>
              {pageViews.map((page, index) => (
                <motion.tr
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  className="border-b hover:bg-blue-100 transition"
                >
                  <td className="p-3">{page.page}</td>
                  <td className="p-3">{page.timePeriod}</td>
                  <td className="p-3">{page.userType}</td>
                  <td className="p-3">{page.views}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ViewersTracker;
