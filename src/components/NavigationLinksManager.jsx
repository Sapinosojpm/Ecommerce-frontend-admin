import { useEffect, useState } from "react";
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
      setLinks(links.map(link => link._id === id ? { ...link, enabled: !link.enabled } : link));
    } catch (error) {
      console.error("Error updating link:", error);
    }
  };

  return (
    <div className="max-w-2xl p-6 mx-auto bg-white rounded-lg shadow-md">
      <h2 className="mb-4 text-2xl font-semibold text-gray-800">Navbar Link Editor</h2>
      
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link._id} className="flex items-center justify-between p-4 bg-gray-100 rounded-lg shadow-sm">
            <span className="text-lg font-medium text-gray-700">{link.name}</span>
            
            <button 
              onClick={() => toggleLink(link._id)}
              className={`px-4 py-2 text-white font-semibold rounded-lg transition-all 
                ${link.enabled ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}
              `}
            >
              {link.enabled ? "Disable" : "Enable"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminNavbarEditor;
