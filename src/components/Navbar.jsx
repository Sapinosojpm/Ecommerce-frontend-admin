import React, { useEffect } from "react";
import { assets } from "../assets/assets";

const Navbar = ({ setToken }) => {
  const logout = () => {
    console.warn("🚪 Logging out...");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setToken("");
    window.location.href = "/login";
  };

  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const base64Url = token.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const payload = JSON.parse(atob(base64));
          if (payload.exp * 1000 < Date.now()) {
            console.warn("⚠️ Token expired. Logging out...");
            logout();
          }
        } catch (error) {
          console.error("❌ Invalid token format. Logging out...");
          logout();
        }
      }
    };

    checkTokenExpiration();
    const interval = setInterval(checkTokenExpiration, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-indigo-600 shadow-lg">
     <img
  className="w-auto h-10"
  src={assets.ecommerce}
  alt="Logo"
  style={{
    filter: `
      drop-shadow(1px 0 white)
      drop-shadow(-1px 0 white)
      drop-shadow(0 1px white)
      drop-shadow(0 -1px white)
      drop-shadow(1px 1px white)
      drop-shadow(-1px -1px white)
      drop-shadow(-1px 1px white)
      drop-shadow(1px -1px white)
    `,
  }}
/>

      <button
        onClick={logout}
        className="px-5 py-2 text-sm font-semibold text-white transition bg-indigo-700 rounded-full shadow-md hover:bg-indigo-800"
      >
        Logout
      </button>
    </div>
  );
};

export default Navbar;
