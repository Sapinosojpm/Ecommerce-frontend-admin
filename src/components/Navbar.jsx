import React, { useEffect } from "react";
import { assets } from "../assets/assets";

const Navbar = ({ setToken }) => {
  
  // ✅ Auto Logout When Token Expires
  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1])); // Decode JWT payload
          const isExpired = payload.exp * 1000 < Date.now(); // Convert expiry to milliseconds
          if (isExpired) {
            console.warn("⚠️ Token expired. Logging out...");
            logout();
          }
        } catch (error) {
          console.error("❌ Invalid token format. Logging out...");
          logout();
        }
      }
    };

    checkTokenExpiration(); // ✅ Check on page load

    const interval = setInterval(checkTokenExpiration, 60000); // ✅ Check every 60 sec
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  // ✅ Logout Function
  const logout = () => {
    console.warn("🚪 Logging out...");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setToken(""); // Clear token state
    window.location.href = "/login"; // Redirect to login
  };

  return (
    <div className="flex items-center py-2 px-[4%] justify-between">
      <img className="w-[max(4%,50px)]" src={assets.hasharon} alt="Logo" />
      <button onClick={logout} className="px-5 py-2 text-xs text-white bg-gray-600 rounded-full sm:py-2 sm:text-sm">
        Logout
      </button>
    </div>
  );
};

export default Navbar;
