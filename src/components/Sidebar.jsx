import React, { useEffect, useState, useCallback, useRef } from 'react';
import { NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaPlus, FaList, FaBox, FaUsers, FaTachometerAlt,
  FaStore, FaPercentage, FaShoppingCart, FaClipboard, FaMapMarkerAlt,
  FaEdit, FaHome, FaQuestionCircle, FaPhoneAlt, FaComments,
  FaLock, FaUserCog, FaExclamationTriangle
} from 'react-icons/fa';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState(null);
  const [userPermissions, setUserPermissions] = useState({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);
  const [userDetails, setUserDetails] = useState({});
  
  // Add ref to track if user data has been fetched
  const userDataFetched = useRef(false);

  // Placeholder function for updateDropdowns - implement based on your needs
  const updateDropdowns = useCallback((userData) => {
    // Add your dropdown update logic here
    console.log('Updating dropdowns with user data:', userData);
    // Example implementation:
    // if (userData.region) {
    //   // Update region dropdown
    // }
    // if (userData.province) {
    //   // Update province dropdown
    // }
  }, []);

  // Fetch user details - modified to prevent unnecessary re-fetching
  const fetchUserDetails = useCallback(async (forceRefresh = false) => {
    // If user data already fetched and not forcing refresh, skip
    if (userDataFetched.current && !forceRefresh) {
      return;
    }

    setInitialLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("User not authenticated");
        navigate("/login");
        return;
      }

      console.log('Fetching user profile from:', `${backendUrl}/api/profile`);

      const response = await fetch(`${backendUrl}/api/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error text:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Full API response:', data);

      // More flexible response handling
      if (data && (data.success !== false)) {
        let user = null;
        
        // Try different possible response structures
        if (data.user) {
          user = data.user;
        } else if (data.data && data.data.user) {
          user = data.data.user;
        } else if (data.data) {
          user = data.data;
        } else if (data._id || data.id) {
          // The response itself might be the user object
          user = data;
        }

        if (user && (user._id || user.id)) {
          console.log("Processed User:", user);

          setUserDetails(user);
          setUserId(user._id || user.id);
          setUserRole(user.role || 'user'); // Default to 'user' if no role
          setUserPermissions(user.permissions || {});

          // Mark user data as fetched
          userDataFetched.current = true;

          // Update dropdowns based on the user data
          setTimeout(() => updateDropdowns(user), 100);
        } else {
          console.error('No valid user object found in response:', data);
          throw new Error("No user data found in response");
        }
      } else {
        console.error('API returned success: false or invalid response:', data);
        throw new Error(data.message || "Invalid user response");
      }
    } catch (err) {
      console.error("Error fetching user details:", err);
      setError(err.message || "Failed to load user data");
      
      // Only remove token and redirect if it's an auth error
      if (err.message.includes('401') || err.message.includes('authentication') || err.message.includes('Unauthorized')) {
        localStorage.removeItem("authToken");
        navigate("/login");
      }
    } finally {
      setInitialLoading(false);
    }
  }, [backendUrl, navigate, updateDropdowns]);

  // Initial fetch of user details - only run once
  useEffect(() => {
    if (!userDataFetched.current) {
      fetchUserDetails();
    }
  }, []); // Empty dependency array to run only once

  // Redirect from root or login to dashboard
  useEffect(() => {
    if (['/', '/login'].includes(location.pathname) && userRole) {
      navigate('/orderAnalytics');
    }
  }, [location.pathname, navigate, userRole]);

  // Check if user has permission for specific routes
  const hasPermission = useCallback((permissionKey) => {
    // If still loading initially, don't show anything
    if (initialLoading || userRole === null) return false;
    
    // Admins have access to everything - bypass permission checks
    if (userRole === 'admin') return true;
    
    console.log('Checking permission:', permissionKey, 'for role:', userRole, 'with permissions:', userPermissions);
    
    // Check specific permission for non-admin users
    return userPermissions[permissionKey] === true;
  }, [initialLoading, userRole, userPermissions]);

  // Menu items configuration
  const menuSections = [
    {
      title: 'Main Menu',
      items: [
        { path: '/orderAnalytics', icon: <FaTachometerAlt />, text: 'Dashboard', permission: 'dashboard' },
        { path: '/add', icon: <FaPlus />, text: 'Add items', permission: 'addItems' },
        { path: '/list', icon: <FaList />, text: 'List items', permission: 'listItems' },
        { path: '/orders', icon: <FaBox />, text: 'Orders', permission: 'orders' },
        { path: '/return', icon: <FaBox />, text: 'Returns', permission: 'returns' },
        { path: '/users', icon: <FaUsers />, text: 'Users', permission: 'users' },
        { path: '/admin-live-chat', icon: <FaComments />, text: 'Live Chat', permission: 'adminLiveChat' },
      ]
    },
    {
      title: 'E-Commerce',
      items: [
  
        { path: '/voucheramount', icon: <FaPercentage />, text: 'Voucher Amount', permission: 'voucherAmount' },
        { path: '/category', icon: <FaClipboard />, text: 'Category', permission: 'category' },
        { path: '/region', icon: <FaMapMarkerAlt />, text: 'Region Fee', permission: 'regionFee' },
        { path: '/weight', icon: <FaClipboard />, text: 'Fee/Kilo', permission: 'feeKilo' },
        { path: '/deals', icon: <FaPercentage />, text: 'Deals', permission: 'deals' },
      ]
    },
    {
      title: 'Content',
      items: [
        { path: '/homepage', icon: <FaHome />, text: 'Home Page', permission: 'homepage' },
        { path: '/about-page', icon: <FaQuestionCircle />, text: 'About Page', permission: 'aboutPage' },
        { path: '/contact-page', icon: <FaPhoneAlt />, text: 'Contact Page', permission: 'contactPage' },
        { path: '/popup', icon: <FaComments />, text: 'Popup Manager', permission: 'popupManager' },
        { path: '/addCard', icon: <FaClipboard />, text: 'Portfolio', permission: 'portfolio' },
      ]
    },
    // {
    //   title: 'Account',
    //   items: [
    //     { path: '/profile', icon: <FaUserCog />, text: 'My Profile', permission: 'dashboard' },
    //     { path: '/change-password', icon: <FaLock />, text: 'Change Password', permission: 'dashboard' },
    //   ]
    // }
  ];

  // Filter items based on permissions
  const filteredSections = menuSections.map(section => ({
    ...section,
    items: section.items.filter(item => hasPermission(item.permission))
  })).filter(section => section.items.length > 0);

  const activeStyle = "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg";
  const inactiveStyle = "text-indigo-100 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-indigo-500 hover:text-white hover:shadow-lg transition-all duration-200";

  // Retry function
  const handleRetry = () => {
    setError(null);
    userDataFetched.current = false; // Reset the flag to allow refetch
    fetchUserDetails(true); // Force refresh
  };

  // Debug info component
  const DebugInfo = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <div className="p-4 m-4 text-xs text-white bg-gray-800 rounded">
        {/* <h4 className="font-bold">Debug Info:</h4> */}
        {/* <p>Backend URL: {backendUrl}</p>
        <p>User Role: {userRole}</p>
        <p>User ID: {userId}</p>
        <p>Permissions: {JSON.stringify(userPermissions)}</p>
        <p>Token exists: {!!localStorage.getItem("authToken")}</p> */}
      </div>
    );
  };

  // Show loading only during initial load, not when navigating
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center w-64 min-h-full bg-indigo-800 shadow-xl">
        <div className="text-center text-white">
          <div className="animate-pulse">Loading permissions...</div>
          <DebugInfo />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-64 min-h-full p-4 text-red-200 bg-indigo-800 shadow-xl">
        <div className="p-3 mb-4 bg-red-900 rounded">
          <FaExclamationTriangle className="inline mr-2" />
          <div className="text-sm">{error}</div>
        </div>
        <button 
          onClick={handleRetry}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700"
        >
          Try Again
        </button>
        <DebugInfo />
      </div>
    );
  }

  // Emergency admin access - if user is admin but no sections show up
  if (userRole === 'admin' && filteredSections.length === 0) {
    return (
      <div className="w-64 min-h-full text-sm font-medium bg-indigo-800 shadow-xl">
        <div className="px-6 py-8 border-b border-indigo-700">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-xs text-indigo-300">Admin Panel (Emergency Access)</p>
        </div>

        <div className="p-4">
          <div className="p-3 text-center text-yellow-100 bg-yellow-900 rounded-lg">
            <FaExclamationTriangle className="mx-auto mb-2 text-xl" />
            <p className="font-bold">Permission System Error</p>
            <p className="mt-2 text-xs">
              Showing all menu items as fallback for admin user.
            </p>
          </div>
        </div>

        {/* Show all menu sections for admin */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          {menuSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="px-4 py-4">
              <p className="mb-3 text-xs font-semibold tracking-wider text-indigo-300 uppercase">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 rounded-md text-sm ${isActive ? activeStyle : inactiveStyle}`
                    }
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
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-4 py-4 border-t border-indigo-700">
          <div className="text-xs text-center text-indigo-300">
            <p>Logged in as: <span className="font-semibold">{userId?.substring(0, 6)}...</span></p>
            <p className="mt-1">Role: <span className="font-semibold text-green-300 capitalize">{userRole}</span></p>
          </div>
        </div>
      </div>
    );
  }

  // If user has no permissions at all (non-admin)
  if (filteredSections.length === 0) {
    return (
      <div className="w-64 min-h-full text-sm font-medium bg-indigo-800 shadow-xl">
        <div className="px-6 py-8 border-b border-indigo-700">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-xs text-indigo-300">
            {userRole === 'admin' ? 'Admin Panel' : 'User Panel'}
          </p>
        </div>

        <div className="p-4">
          <div className="p-3 text-center text-red-100 bg-red-900 rounded-lg">
            <FaLock className="mx-auto mb-2 text-xl" />
            <p className="font-bold">Access Restricted</p>
            <p className="mt-2 text-xs">
              You don't have permission to access any features. Please contact your administrator.
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-4 py-4 border-t border-indigo-700">
          <div className="text-xs text-center text-indigo-300">
            <p>Role: <span className="font-semibold capitalize">{userRole}</span></p>
            <p className="mt-1">Dashboard v2.0</p>
          </div>
        </div>
        <DebugInfo />
      </div>
    );
  }

  return (
    <div className="w-64 min-h-full text-sm font-medium bg-indigo-800 shadow-xl">
      {/* Logo/Header */}
      <div className="px-6 py-8 border-b border-indigo-700">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-xs text-indigo-300">
          {userRole === 'admin' ? 'Admin Panel' : 'User Panel'}
        </p>
      </div>

      {/* Menu Sections */}
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
        {filteredSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="px-4 py-4">
            <p className="mb-3 text-xs font-semibold tracking-wider text-indigo-300 uppercase">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-md text-sm ${isActive ? activeStyle : inactiveStyle}`
                  }
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
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-4 border-t border-indigo-700">
        <div className="text-xs text-center text-indigo-300">
          <p>Logged in as: <span className="font-semibold">{userId?.substring(0, 6)}...</span></p>
          <p className="mt-1">Role: <span className="font-semibold capitalize">{userRole}</span></p>
          {userRole !== 'admin' && (
            <p className="mt-1 text-xxs">
              Permissions: {Object.values(userPermissions).filter(Boolean).length} granted
            </p>
          )}
        </div>
      </div>
      <DebugInfo />
    </div>
  );
};

// Permission Guard Component
export const PermissionGuard = ({ children, requiredPermission, userRole, userPermissions }) => {
  if (userRole === 'admin') return children;
  if (userPermissions && userPermissions[requiredPermission]) return children;
  return <Navigate to="/orderAnalytics" replace />;
};

// Route Permission Guard Component
export const RoutePermissionGuard = ({ children, path, userRole, userPermissions }) => {
  const permissionMap = {
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
    '/addCard': 'portfolio',
    '/profile': 'dashboard',
    '/change-password': 'dashboard'
  };

  const requiredPermission = permissionMap[path] || null;
  if (!requiredPermission) return children;

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

export default Sidebar;