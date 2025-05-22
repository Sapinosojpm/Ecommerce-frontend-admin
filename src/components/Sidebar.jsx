import React, { useEffect } from 'react';
import { NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  FaPlus, FaList, FaBox, FaUsers, FaTachometerAlt,
  FaStore, FaPercentage, FaShoppingCart, FaClipboard, FaMapMarkerAlt,
  FaEdit, FaHome, FaQuestionCircle, FaPhoneAlt, FaComments
} from 'react-icons/fa';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (['/', '/login'].includes(location.pathname)) {
      navigate('/orderAnalytics');
    }
  }, [location.pathname, navigate]);

  const mainMenuItems = [
    { path: '/orderAnalytics', icon: <FaTachometerAlt />, text: 'Dashboard' },
    { path: '/add', icon: <FaPlus />, text: 'Add items' },
    { path: '/list', icon: <FaList />, text: 'List items' },
    { path: '/orders', icon: <FaBox />, text: 'Orders' },
    { path: '/return', icon: <FaBox />, text: 'Return' },
    { path: '/users', icon: <FaUsers />, text: 'Users' },
    { path: '/admin-live-chat', icon: <FaUsers />, text: 'Users' },
  ];

  const ecommerceItems = [
    { path: '/ask-discount', icon: <FaPercentage />, text: 'Ask Discount' },
    { path: '/voucheramount', icon: <FaPercentage />, text: 'Voucher Amount' },
    { path: '/category', icon: <FaClipboard />, text: 'Category' },
    { path: '/region', icon: <FaMapMarkerAlt />, text: 'Region Fee' },
    { path: '/weight', icon: <FaClipboard />, text: 'Fee/Kilo' },
    { path: '/deals', icon: <FaPercentage />, text: 'Deals' },
  ];

  const contentItems = [
    { path: '/homepage', icon: <FaHome />, text: 'Home Page' },
    { path: '/about-page', icon: <FaQuestionCircle />, text: 'About Page' },
    { path: '/contact-page', icon: <FaPhoneAlt />, text: 'Contact Page' },
    { path: '/popup', icon: <FaComments />, text: 'Popup Manager' },
    { path: '/addCard', icon: <FaClipboard />, text: 'Portfolio' },
  ];

  const activeStyle = "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform scale-105";
  const inactiveStyle = "text-indigo-100 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-indigo-500 hover:text-white hover:shadow-lg hover:transform hover:scale-105 transition-all duration-300 ease-in-out";

  return (
    <div className="w-64 min-h-full text-sm font-medium bg-indigo-700 shadow-xl">
      {/* Logo */}
      <div className="px-6 py-8 border-b border-indigo-500">
        <h1 className="text-2xl font-bold text-white">Sales Dashboard</h1>
        <p className="mt-1 text-xs text-indigo-200">Admin Panel</p>
      </div>

      {/* Main Menu */}
      <div className="px-4 py-6">
        <p className="mb-4 text-xs tracking-widest text-indigo-200 uppercase">Main Menu</p>
        <div className="space-y-2">
          {mainMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg ${isActive ? activeStyle : inactiveStyle} group`
              }
            >
              <span className="text-base transition-transform duration-300 ease-in-out group-hover:scale-125 group-hover:rotate-12">
                {item.icon}
              </span>
              <span className="transition-all duration-300 ease-in-out group-hover:tracking-wider">
                {item.text}
              </span>
            </NavLink>
          ))}
        </div>

        {/* E-Commerce Section */}
        <div className="mt-10">
          <p className="mb-4 text-xs tracking-widest text-indigo-200 uppercase">E-Commerce</p>
          <div className="space-y-2">
            {ecommerceItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg ${isActive ? activeStyle : inactiveStyle} group`
                }
              >
                <span className="text-base transition-transform duration-300 ease-in-out group-hover:scale-125 group-hover:rotate-12">
                  {item.icon}
                </span>
                <span className="transition-all duration-300 ease-in-out group-hover:tracking-wider">
                  {item.text}
                </span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Content Section (Dropdown style remains if you want) */}
        <div className="mt-10">
          <p className="mb-4 text-xs tracking-widest text-indigo-200 uppercase">Content</p>
          <div className="space-y-2">
            {contentItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg ${isActive ? activeStyle : inactiveStyle} group`
                }
              >
                <span className="text-base transition-transform duration-300 ease-in-out group-hover:scale-125 group-hover:rotate-12">
                  {item.icon}
                </span>
                <span className="transition-all duration-300 ease-in-out group-hover:tracking-wider">
                  {item.text}
                </span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const RedirectToDashboard = () => {
  return <Navigate to="/orderAnalytics" replace />;
};

export { RedirectToDashboard };
export default Sidebar;
