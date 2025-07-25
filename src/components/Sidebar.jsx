import React, { useEffect, useState, useCallback, useRef } from 'react';
import { NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  FaPlus, FaList, FaBox, FaUsers, FaTachometerAlt,
  FaStore, FaPercentage, FaShoppingCart, FaClipboard, FaMapMarkerAlt,
  FaEdit, FaHome, FaQuestionCircle, FaPhoneAlt, FaComments,
  FaLock, FaUserCog, FaExclamationTriangle, FaFacebook, FaBars
} from 'react-icons/fa';
import { assets } from "../assets/assets";
import { backendUrl } from "../App";

// Constants
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const AUTH_TOKEN_KEY = 'authToken';

// Menu Configuration
const MENU_SECTIONS = [
  {
    title: 'Main Menu',
    items: [
      { path: '/admin/orderAnalytics', icon: <FaTachometerAlt />, text: 'Dashboard', permission: 'dashboard' },
      { path: '/admin/add', icon: <FaPlus />, text: 'Add items', permission: 'addItems' },
      { path: '/admin/list', icon: <FaList />, text: 'List items', permission: 'listItems' },
      { path: '/admin/orders', icon: <FaBox />, text: 'Orders', permission: 'orders' },
      { path: '/admin/users', icon: <FaUsers />, text: 'Users', permission: 'users' },
    ]
  },
  {
    title: 'E-Commerce',
    items: [
      { path: '/admin/voucheramount', icon: <FaPercentage />, text: 'Voucher Amount', permission: 'voucherAmount' },
      { path: '/admin/category', icon: <FaClipboard />, text: 'Category', permission: 'category' },
      { path: '/admin/region', icon: <FaMapMarkerAlt />, text: 'Region Fee', permission: 'regionFee' },
      { path: '/admin/weight', icon: <FaClipboard />, text: 'Fee/Kilo', permission: 'feeKilo' },
      { path: '/admin/deals', icon: <FaPercentage />, text: 'Deals', permission: 'deals' },
    ]
  },
  {
    title: 'Content',
    items: [
      { path: '/admin/homepage', icon: <FaHome />, text: 'Home Page', permission: 'homepage' },
      { path: '/admin/about-page', icon: <FaQuestionCircle />, text: 'About Page', permission: 'aboutPage' },
      { path: '/admin/contact-page', icon: <FaPhoneAlt />, text: 'Contact Page', permission: 'contactPage' },
      { path: '/admin/popup', icon: <FaComments />, text: 'Popup Manager', permission: 'popupManager' },
      // { path: '/admin/addCard', icon: <FaClipboard />, text: 'Portfolio', permission: 'portfolio' },
    ]
  },
];

// Permission Map for Route Guards
const PERMISSION_MAP = {
  '/orderAnalytics': 'dashboard',
  '/add': 'addItems',
  '/list': 'listItems',
  '/orders': 'orders',
  '/return': 'returns',
  '/users': 'users',
  '/admin-live-chat': 'adminLiveChat',
  '/ask-discount': 'askDiscount',
  '/voucheramount': 'voucherAmount',
  '/category': 'category',
  '/region': 'regionFee',
  '/weight': 'feeKilo',
  '/deals': 'deals',
  '/homepage': 'homepage',
  '/about-page': 'aboutPage',
  '/contact-page': 'contactPage',
  '/popup': 'popupManager',
  // '/addCard': 'portfolio',
  '/profile': 'dashboard',
  '/change-password': 'dashboard'
};

// Styles
const STYLES = {
  active: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg",
  inactive: "text-indigo-100 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-indigo-500 hover:text-white hover:shadow-lg transition-all duration-200",
  sidebar: "w-64 h-full flex flex-col text-sm font-medium bg-indigo-800 shadow-xl",
  header: "px-6 py-8 border-b border-indigo-700",
  menuSection: "px-4 py-4",
  menuTitle: "mb-3 text-xs font-semibold tracking-wider text-indigo-300 uppercase",
  menuItem: "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm",
  footer: "absolute bottom-0 left-0 right-0 px-4 py-4 border-t border-indigo-700",
  error: "p-3 mb-4 bg-red-900 rounded",
  loading: "flex items-center justify-center w-64 min-h-full bg-indigo-800 shadow-xl",
};

/**
 * Sidebar Component
 * Main navigation component that handles user authentication, permissions, and menu rendering
 */
const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState(null);
  const [userPermissions, setUserPermissions] = useState({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);
  const [userDetails, setUserDetails] = useState({});
  const [token, setToken] = useState(localStorage.getItem(AUTH_TOKEN_KEY));
  const [logoUrl, setLogoUrl] = useState("");
  
  const userDataFetched = useRef(false);

  /**
   * Fetches user details from the backend
   * @param {boolean} forceRefresh - Whether to force a refresh of user data
   */
  const fetchUserDetails = useCallback(async (forceRefresh = false) => {
    if (userDataFetched.current && !forceRefresh) return;

    setInitialLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        throw new Error("User not authenticated");
      }

      const response = await fetch(`${BACKEND_URL}/api/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || data.success === false) {
        throw new Error(data?.message || "Invalid user response");
      }

      const user = data.user || data.data?.user || data.data || data;
      
      if (!user || (!user._id && !user.id)) {
        throw new Error("No valid user data found in response");
      }

      setUserDetails(user);
      setUserId(user._id || user.id);
      setUserRole(user.role || 'user');
      setUserPermissions(user.permissions || {});
      userDataFetched.current = true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load user data";
      setError(errorMessage);
      
      if (errorMessage.includes('401') || errorMessage.includes('authentication') || errorMessage.includes('Unauthorized')) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        navigate("/login");
      }
    } finally {
      setInitialLoading(false);
    }
  }, [navigate]);

  // Listen for token changes (e.g., after login)
  useEffect(() => {
    const onStorage = () => {
      setToken(localStorage.getItem(AUTH_TOKEN_KEY));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  // Re-fetch user details when token changes
  useEffect(() => {
    userDataFetched.current = false;
    fetchUserDetails();
  }, [token]);

  // Initial fetch of user details
  useEffect(() => {
    if (!userDataFetched.current) {
      fetchUserDetails();
    }
  }, []);

  // Redirect from root or login to dashboard
  useEffect(() => {
    if (['/', '/login'].includes(location.pathname) && userRole) {
      navigate('/admin/orderAnalytics');
    }
  }, [location.pathname, navigate, userRole]);

  // Add effect to close sidebar on route change (mobile UX)
  useEffect(() => {
    // setSidebarOpen(false); // Removed sidebarOpen state, so this effect is no longer needed
  }, [location.pathname]);

  // Fetch logo on mount
  useEffect(() => {
    fetch(`${backendUrl}/api/logo`)
      .then((res) => res.json())
      .then((data) => setLogoUrl(data.imageUrl))
      .catch((error) => {
        console.error("Error fetching logo:", error);
        setLogoUrl(""); // fallback or default logo if needed
      });
  }, []);

  /**
   * Checks if user has permission for specific routes
   * @param {string} permissionKey - The permission key to check
   * @returns {boolean} indicating if user has permission
   */
  const hasPermission = useCallback((permissionKey) => {
    if (initialLoading || userRole === null) return false;
    if (userRole === 'admin') return true;
    return userPermissions[permissionKey] === true;
  }, [initialLoading, userRole, userPermissions]);

  // Filter menu sections based on permissions
  const filteredSections = MENU_SECTIONS
    .map(section => ({
      ...section,
      items: section.items.filter(item => hasPermission(item.permission))
    }))
    .filter(section => section.items.length > 0);

  // Handle retry after error
  const handleRetry = () => {
    setError(null);
    userDataFetched.current = false;
    fetchUserDetails(true);
  };

  // Logout logic from Navbar
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("role");
    localStorage.removeItem("botHelloShown");
    setToken && setToken("");
    window.location.href = "/login";
  };

  // Loading state
  if (initialLoading) {
    return (
      <div className={STYLES.loading}>
        <div className="text-center text-white">
          <div className="animate-pulse">Loading permissions...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={STYLES.sidebar}>
        <div className={STYLES.error}>
          <FaExclamationTriangle className="inline mr-2" />
          <div className="text-sm">{error}</div>
        </div>
        <button 
          onClick={handleRetry}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // No permissions state
  if (filteredSections.length === 0) {
    return (
      <div className={STYLES.sidebar}>
        {/* <div className={STYLES.header}>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-xs text-indigo-300">
            {userRole === 'admin' ? 'Admin Panel' : 'User Panel'}
          </p>
        </div> */}

        <div className="p-4">
          <div className="p-3 text-center text-red-100 bg-red-900 rounded-lg">
            <FaLock className="mx-auto mb-2 text-xl" />
            <p className="font-bold">Access Restricted</p>
            <p className="mt-2 text-xs">
              You don't have permission to access any features. Please contact your administrator.
            </p>
          </div>
        </div>

        <div className={STYLES.footer}>
          <div className="text-xs text-center text-indigo-300">
            <p>Role: <span className="font-semibold capitalize">{userRole}</span></p>
            <p className="mt-1">Dashboard v2.0</p>
          </div>
        </div>
      </div>
    );
  }

  // Main sidebar render
  return (
    <>
      {/* Removed hamburger button */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full transition-transform duration-300 md:translate-x-0 md:static md:block
          ${STYLES.sidebar}
        `}
        style={{ minWidth: '16rem', maxWidth: '16rem', display: 'flex', flexDirection: 'column' }}
      >
        {/* Logo at the top */}
        <div className="flex flex-col items-center py-6">
          <img
            className="w-auto h-12 mb-2"
            src={logoUrl || assets.ecommerce}
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
        </div>
        {/* <div className={STYLES.header}> */}
          {/* <h1 className="text-2xl font-bold text-white">Dashboard</h1> */}
          {/* Removed Admin Panel/User Panel label */}
        {/* </div> */}
        <div className="overflow-y-auto flex-1">
          {filteredSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className={STYLES.menuSection}>
              <p className={STYLES.menuTitle}>
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `${STYLES.menuItem} ${isActive ? STYLES.active : STYLES.inactive}`
                    }
                    // onClick={() => setSidebarOpen(false)} // Removed sidebarOpen state
                  >
                    <span className="text-base">
                      {item.icon}
                    </span>
                    <span>{item.text}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
          {/* Facebook Manager Section */}
          <div className={STYLES.menuSection}>
            <div className={STYLES.menuTitle}>Social</div>
            <div className="space-y-1">
              <NavLink
                to="/facebook-manager"
                className={({ isActive }) =>
                  `${STYLES.menuItem} ${isActive ? STYLES.active : STYLES.inactive}`
                }
                // onClick={() => setSidebarOpen(false)} // Removed sidebarOpen state
              >
                <span className="text-base flex items-center">
                  <FaFacebook className="mr-2 text-blue-400" />
                  Facebook Manager
                </span>
              </NavLink>
            </div>
          </div>
        </div>
        {/* Sticky footer with logout button always visible */}
        <div className="p-4 border-t border-indigo-700 bg-indigo-800 sticky bottom-0 w-full">
          <button
            onClick={logout}
            className="w-full px-5 py-2 text-sm font-semibold text-white transition bg-indigo-700 rounded-full shadow-md hover:bg-indigo-800"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

/**
 * Permission Guard Component
 * Wraps components that require specific permissions
 */
export const PermissionGuard = ({ children, requiredPermission, userRole, userPermissions }) => {
  if (userRole === 'admin') return <>{children}</>;
  if (userPermissions && userPermissions[requiredPermission]) return <>{children}</>;
  return <Navigate to="/admin/orderAnalytics" replace />;
};

PermissionGuard.propTypes = {
  children: PropTypes.node.isRequired,
  requiredPermission: PropTypes.string.isRequired,
  userRole: PropTypes.string,
  userPermissions: PropTypes.object.isRequired
};

/**
 * Route Permission Guard Component
 * Wraps routes with permission checks
 */
export const RoutePermissionGuard = ({ children, path, userRole, userPermissions }) => {
  const requiredPermission = PERMISSION_MAP[path] || null;
  if (!requiredPermission) return <>{children}</>;

  return (
    <PermissionGuard 
      requiredPermission={requiredPermission}
      userRole={userRole}
      userPermissions={userPermissions}
    >
      {children}
    </PermissionGuard>
  );
};

RoutePermissionGuard.propTypes = {
  children: PropTypes.node.isRequired,
  path: PropTypes.string.isRequired,
  userRole: PropTypes.string,
  userPermissions: PropTypes.object.isRequired
};

export default Sidebar;