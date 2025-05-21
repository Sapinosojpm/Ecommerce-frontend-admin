import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  FaPlus, FaList, FaBox, FaUsers, FaTachometerAlt, FaAngleDown, FaAngleRight,
  FaStore, FaPercentage, FaShoppingCart, FaClipboard, FaMapMarkerAlt,
  FaEdit, FaHome, FaQuestionCircle, FaPhoneAlt, FaNewspaper, FaClipboardList,
  FaFootballBall, FaCalendarAlt, FaBriefcase, FaComments
} from 'react-icons/fa';

const Sidebar = () => {
  const [openCategory, setOpenCategory] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (['/', '/login'].includes(location.pathname)) {
      navigate('/orderAnalytics');
    }
  }, [location.pathname, navigate]);

  const toggleCategory = (category) => {
    setOpenCategory(openCategory === category ? null : category);
  };

  const mainMenuItems = [
    { path: '/orderAnalytics', icon: <FaTachometerAlt />, text: 'Dashboard' },
    { path: '/add', icon: <FaPlus />, text: 'Add items' },
    { path: '/list', icon: <FaList />, text: 'List items' },
    { path: '/orders', icon: <FaBox />, text: 'Orders' },
    { path: '/return', icon: <FaBox />, text: 'Return' },
    { path: '/users', icon: <FaUsers />, text: 'Users' },
  ];

  const categories = {
    ecommerce: {
      icon: <FaStore />,
      title: 'E-Commerce',
      items: [
        { path: '/ask-discount', icon: <FaPercentage />, text: 'Ask Discount' },
        { path: '/voucheramount', icon: <FaPercentage />, text: 'Voucher Amount' },
        { path: '/bestseller', icon: <FaShoppingCart />, text: 'Best Seller' },
        { path: '/latestproduct', icon: <FaShoppingCart />, text: 'Latest Product' },
        { path: '/category', icon: <FaClipboard />, text: 'Category' },
        { path: '/region', icon: <FaMapMarkerAlt />, text: 'Region Fee' },
        { path: '/weight', icon: <FaClipboard />, text: 'Fee/Kilo' },
        { path: '/deals', icon: <FaPercentage />, text: 'Deals' },
      ]
    },
    content: {
      icon: <FaEdit />,
      title: 'Content',
      items: [
        { path: '/homepage', icon: <FaHome />, text: 'Home Page' },
        { path: '/about-page', icon: <FaQuestionCircle />, text: 'About Page' },
        { path: '/contact-page', icon: <FaPhoneAlt />, text: 'Contact Page' },
        { path: '/ads-editor', icon: <FaNewspaper />, text: 'Ads Editor' },
        { path: '/addCard', icon: <FaClipboard />, text: 'Portfolio' },
        { path: '/logo', icon: <FaClipboardList />, text: 'Logo' },
        { path: '/footer', icon: <FaFootballBall />, text: 'Footer' },
        { path: '/eventCalendar', icon: <FaCalendarAlt />, text: 'Events' },
        { path: '/job', icon: <FaBriefcase />, text: 'Job Editor' },
        { path: '/faq', icon: <FaQuestionCircle />, text: 'FAQ' },
        { path: '/review', icon: <FaComments />, text: 'Review' },
      ]
    }
  };

  const activeStyle = "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md";
  const inactiveStyle = "text-indigo-100 hover:bg-indigo-600 hover:text-white transition-all duration-200";

  return (
    <div className="w-64 min-h-screen text-sm font-medium bg-indigo-700 shadow-xl">
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
                `flex items-center gap-3 px-4 py-3 rounded-lg ${isActive ? activeStyle : inactiveStyle}`
              }
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.text}</span>
            </NavLink>
          ))}
        </div>

        {/* System Settings */}
        <div className="mt-10">
          <p className="mb-4 text-xs tracking-widest text-indigo-200 uppercase">System Settings</p>
          <div className="space-y-2">
            {Object.entries(categories).map(([key, category]) => (
              <div key={key}>
                <button
                  onClick={() => toggleCategory(key)}
                  className={`flex justify-between items-center w-full px-4 py-3 rounded-lg ${inactiveStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{category.icon}</span>
                    <span>{category.title}</span>
                  </div>
                  {openCategory === key ? <FaAngleDown /> : <FaAngleRight />}
                </button>

                {openCategory === key && (
                  <div className="mt-2 ml-6 space-y-1">
                    {category.items.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-md ${
                            isActive ? "bg-indigo-500 text-white font-medium" : "text-indigo-100 hover:bg-indigo-600 hover:text-white"
                          }`
                        }
                      >
                        <span className="text-sm">{item.icon}</span>
                        <span className="text-xs">{item.text}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
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
