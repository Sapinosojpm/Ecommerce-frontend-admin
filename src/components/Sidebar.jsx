import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { 
  FaPlus, FaList, FaBox, FaChartBar, FaUsers, FaHome, FaCogs, 
  FaClipboard, FaNewspaper, FaRegClock, FaClipboardList, 
  FaYoutube, FaQuestionCircle, FaShoppingCart, FaStore,
  FaFileAlt, FaMapMarkerAlt, FaInfoCircle, FaPhoneAlt, 
  FaFootballBall, FaCalendarAlt, FaBriefcase, FaPercentage, 
  FaComments, FaEdit, FaTachometerAlt, FaAngleDown, FaAngleRight
} from 'react-icons/fa';

const Sidebar = () => {
  const [openCategory, setOpenCategory] = useState(null);
  const [collapsed, setCollapsed] = useState(false); // For future mobile responsiveness
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to dashboard on initial load or login 
  useEffect(() => {
    // List of paths that should redirect to dashboard
    const redirectPaths = ['/', '/login'];
    if (redirectPaths.includes(location.pathname)) {
      navigate('/orderAnalytics');
    }
  }, [location.pathname, navigate]);

  const toggleCategory = (category) => {
    if (openCategory === category) {
      setOpenCategory(null);
    } else {
      setOpenCategory(category);
    }
  };

  // Main menu items that always appear
  const mainMenuItems = [
    { path: '/orderAnalytics', icon: <FaTachometerAlt className='w-5 h-5' />, text: 'Dashboard' },
    { path: '/add', icon: <FaPlus className='w-5 h-5' />, text: 'Add items' },
    { path: '/list', icon: <FaList className='w-5 h-5' />, text: 'List items' },
    { path: '/orders', icon: <FaBox className='w-5 h-5' />, text: 'Orders' },
    { path: '/users', icon: <FaUsers className='w-5 h-5' />, text: 'Users' },
  ];

  // Dropdown categories
  const categories = {
    ecommerce: {
      icon: <FaStore className='w-5 h-5' />,
      title: 'E-Commerce Management',
      items: [
        { path: '/ask-discount', icon: <FaPercentage className='w-5 h-5' />, text: 'Ask discount editor' },
        { path: '/voucheramount', icon: <FaPercentage className='w-5 h-5' />, text: 'Voucher Amount' },
        { path: '/bestseller', icon: <FaShoppingCart className='w-5 h-5' />, text: 'Best Seller Display' },
        { path: '/latestproduct', icon: <FaShoppingCart className='w-5 h-5' />, text: 'Latest Product Display' },
        { path: '/category', icon: <FaClipboard className='w-5 h-5' />, text: 'Category' },
        { path: '/region', icon: <FaMapMarkerAlt className='w-5 h-5' />, text: 'Region Fee' },
        { path: '/weight', icon: <FaClipboard className='w-5 h-5' />, text: 'Fee per Kilo' },
        { path: '/adminDiscount', icon: <FaPercentage className='w-5 h-5' />, text: 'New Subscriber Discount' },
        { path: '/deals', icon: <FaPercentage className='w-5 h-5' />, text: 'Deals' },
      ]
    },
    content: {
      icon: <FaEdit className='w-5 h-5' />,
      title: 'Content Management',
      items: [
        { path: '/homepage', icon: <FaHome className='w-5 h-5' />, text: 'Home Page' },
        { path: '/ads-editor', icon: <FaNewspaper className='w-5 h-5' />, text: 'Ads Editor' },
        { path: '/navlinks', icon: <FaList className='w-5 h-5' />, text: 'Navlinks' },
        { path: '/hero', icon: <FaHome className='w-5 h-5' />, text: 'Hero' },
        { path: '/addIntro', icon: <FaNewspaper className='w-5 h-5' />, text: 'Blog' },
        { path: '/map', icon: <FaMapMarkerAlt className='w-5 h-5' />, text: 'Map' },
        { path: '/addCard', icon: <FaClipboard className='w-5 h-5' />, text: 'Portfolio' },
        { path: '/logo', icon: <FaClipboardList className='w-5 h-5' />, text: 'Logo' },
        { path: '/addMemberCard', icon: <FaUsers className='w-5 h-5' />, text: 'Member' },
        { path: '/policy', icon: <FaFileAlt className='w-5 h-5' />, text: 'Policy' },
        { path: '/about', icon: <FaInfoCircle className='w-5 h-5' />, text: 'About' },
        { path: '/contact', icon: <FaPhoneAlt className='w-5 h-5' />, text: 'Contact' },
        { path: '/footer', icon: <FaFootballBall className='w-5 h-5' />, text: 'Footer' },
        { path: '/eventCalendar', icon: <FaCalendarAlt className='w-5 h-5' />, text: 'Event Calendar' },
        { path: '/job', icon: <FaBriefcase className='w-5 h-5' />, text: 'Job Editor' },
        { path: '/youtubeUrl', icon: <FaYoutube className='w-5 h-5' />, text: 'YouTube' },
        { path: '/faq', icon: <FaQuestionCircle className='w-5 h-5' />, text: 'FAQ' },
        { path: '/review', icon: <FaComments className='w-5 h-5' />, text: 'Review' },
      ]
    }
  };

  const activeStyle = "bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl";
  const inactiveStyle = "hover:bg-gray-100 text-gray-700";

  return (
    <div className='w-64 min-h-screen bg-white border-r border-gray-100 shadow-lg'>
      {/* Logo/Brand Section */}
      <div className="px-6 py-8 border-b border-gray-100">
        <h1 className="text-xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text">Sales Management</h1>
        <p className="mt-1 text-xs text-gray-500">Admin Portal</p>
      </div>
      
      {/* Main Navigation */}
      <div className='px-4 py-6'>
        <div className="mb-8">
          <p className="px-3 mb-4 text-xs font-semibold tracking-wider text-gray-400 uppercase">Main Menu</p>
          <div className="space-y-2">
            {mainMenuItems.map((item) => (
              <NavLink 
                key={item.path}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-3 transition duration-200 rounded-xl ${isActive ? activeStyle : inactiveStyle}`
                }
                to={item.path}
              >
                <div className="flex items-center justify-center w-6 h-6">
                  {item.icon}
                </div>
                <p className='text-sm font-medium'>{item.text}</p>
              </NavLink>
            ))}
          </div>
        </div>

        {/* System Settings Categories */}
        <div>
          <p className="px-3 mb-4 text-xs font-semibold tracking-wider text-gray-400 uppercase">System Settings</p>
          <div className="space-y-2">
            {Object.entries(categories).map(([key, category]) => (
              <div key={key} className="mb-1">
                <button 
                  className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-xl ${inactiveStyle}`}
                  onClick={() => toggleCategory(key)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6">
                      {category.icon}
                    </div>
                    <p>{category.title}</p>
                  </div>
                  {openCategory === key ? 
                    <FaAngleDown className="text-gray-500" /> : 
                    <FaAngleRight className="text-gray-500" />
                  }
                </button>

                {openCategory === key && (
                  <div className="pl-2 mt-1 ml-6 space-y-1 border-l-2 border-gray-100">
                    {category.items.map((item) => (
                      <NavLink
                        key={item.path}
                        className={({ isActive }) => 
                          `flex items-center gap-3 px-4 py-2 text-sm transition duration-200 rounded-lg ${isActive ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"}`
                        }
                        to={item.path}
                      >
                        <div className="flex items-center justify-center w-5 h-5 text-gray-500">
                          {item.icon}
                        </div>
                        <p className="text-xs">{item.text}</p>
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

// Redirect root path to dashboard
const RedirectToDashboard = () => {
  return <Navigate to="/orderAnalytics" replace />;
};

// Export both components
export { RedirectToDashboard };
export default Sidebar;