import React, { useEffect, useState } from "react";
import { backendUrl } from "../App";

const AdminNavbarEditor = () => {
  const [links, setLinks] = useState([]);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/navbar-links`);
        const data = await res.json();
        setLinks(data);
      } catch (error) {
        console.error("Error fetching links:", error);
      }
    };
    fetchLinks();
  }, []);

  const toggleLink = async (id) => {
    try {
      await fetch(`${backendUrl}/api/navbar-links/${id}/toggle`, { method: "PUT" });
      setLinks((prevLinks) =>
        prevLinks.map((link) =>
          link._id === id ? { ...link, enabled: !link.enabled } : link
        )
      );
    } catch (error) {
      console.error("Error updating link:", error);
    }
  };

  return (
    <div className="max-w-2xl p-6 mx-auto bg-white rounded-lg shadow-md">
      <h2 className="mb-4 text-2xl font-semibold text-gray-800">Navbar Links</h2>

      <ul className="space-y-3">
        {links.map((link) => (
          <li
            key={link._id}
            className="flex items-center justify-between p-4 bg-gray-100 rounded-lg shadow-sm"
          >
            <div className="flex items-center">
              <div
                className={`w-3 h-3 mr-3 rounded-full ${
                  link.enabled ? "bg-green-500" : "bg-red-400"
                }`}
              ></div>
              <span className="text-lg font-medium text-gray-700">{link.name}</span>
            </div>

            {/* Toggle switch style */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={link.enabled}
                onChange={() => toggleLink(link._id)}
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer-focus:ring-4 peer-focus:ring-indigo-300 peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminNavbarEditor;
