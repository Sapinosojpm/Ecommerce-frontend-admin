import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FaPlus, FaList, FaBox, FaUsers, FaTachometerAlt,
  FaPercentage, FaClipboard, FaMapMarkerAlt, FaHome, 
  FaQuestionCircle, FaPhoneAlt, FaComments, FaUserCog,
  FaLock, FaEdit, FaSave, FaTimes, FaCheck, FaExclamationTriangle,
  FaChevronDown, FaChevronUp, FaUserShield, FaUser, FaUserTie, FaSearch, FaFilter
} from 'react-icons/fa';

const backendUrl = import.meta.env.VITE_BACKEND_URL;
const UserPermissionManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [expandedUsers, setExpandedUsers] = useState(new Set());
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  // Define all available permissions with their descriptions and icons
  const permissionDefinitions = {
    // Main Menu
    dashboard: {
      name: 'Dashboard',
      description: 'Access to main dashboard and analytics',
      icon: <FaTachometerAlt />,
      category: 'Main Menu',
      color: 'text-blue-500'
    },
    addItems: {
      name: 'Add Items',
      description: 'Add new products to inventory',
      icon: <FaPlus />,
      category: 'Main Menu',
      color: 'text-green-500'
    },
    listItems: {
      name: 'List Items',
      description: 'View and manage product listings',
      icon: <FaList />,
      category: 'Main Menu',
      color: 'text-indigo-500'
    },
    orders: {
      name: 'Orders',
      description: 'Manage customer orders',
      icon: <FaBox />,
      category: 'Main Menu',
      color: 'text-orange-500'
    },
    returns: {
      name: 'Returns',
      description: 'Handle product returns and refunds',
      icon: <FaBox />,
      category: 'Main Menu',
      color: 'text-red-500'
    },
    users: {
      name: 'User Management',
      description: 'Manage user accounts and permissions',
      icon: <FaUsers />,
      category: 'Main Menu',
      color: 'text-purple-500'
    },
    adminLiveChat: {
      name: 'Live Chat',
      description: 'Access admin chat system',
      icon: <FaComments />,
      category: 'Main Menu',
      color: 'text-teal-500'
    },
    
    // E-Commerce
    // askDiscount: {
    //   name: 'Ask Discount',
    //   description: 'Manage discount requests',
    //   icon: <FaPercentage />,
    //   category: 'E-Commerce',
    //   color: 'text-emerald-500'
    // },
    voucherAmount: {
      name: 'Voucher Amount',
      description: 'Configure voucher amounts',
      icon: <FaPercentage />,
      category: 'E-Commerce',
      color: 'text-yellow-500'
    },
    category: {
      name: 'Category Management',
      description: 'Manage product categories',
      icon: <FaClipboard />,
      category: 'E-Commerce',
      color: 'text-cyan-500'
    },
    regionFee: {
      name: 'Region Fee',
      description: 'Configure regional shipping fees',
      icon: <FaMapMarkerAlt />,
      category: 'E-Commerce',
      color: 'text-pink-500'
    },
    feeKilo: {
      name: 'Fee per Kilo',
      description: 'Configure weight-based fees',
      icon: <FaClipboard />,
      category: 'E-Commerce',
      color: 'text-rose-500'
    },
    deals: {
      name: 'Deals Management',
      description: 'Create and manage special deals',
      icon: <FaPercentage />,
      category: 'E-Commerce',
      color: 'text-violet-500'
    },
    
    // Content Management
    homepage: {
      name: 'Home Page',
      description: 'Edit homepage content',
      icon: <FaHome />,
      category: 'Content',
      color: 'text-amber-500'
    },
    aboutPage: {
      name: 'About Page',
      description: 'Edit about page content',
      icon: <FaQuestionCircle />,
      category: 'Content',
      color: 'text-lime-500'
    },
    contactPage: {
      name: 'Contact Page',
      description: 'Edit contact page content',
      icon: <FaPhoneAlt />,
      category: 'Content',
      color: 'text-sky-500'
    },
    popupManager: {
      name: 'Popup Manager',
      description: 'Manage website popups',
      icon: <FaComments />,
      category: 'Content',
      color: 'text-fuchsia-500'
    },
    portfolio: {
      name: 'Portfolio',
      description: 'Manage portfolio content',
      icon: <FaClipboard />,
      category: 'Content',
      color: 'text-stone-500'
    }
  };

  // Group permissions by category
  const groupedPermissions = Object.entries(permissionDefinitions).reduce((acc, [key, permission]) => {
    const category = permission.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push({ key, ...permission });
    return acc;
  }, {});

  // Fetch users from backend API
  const fetchUsers = async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem("authToken");
    console.log("Fetched token:", token); // Add this

    if (!token) {
      toast.error("No token found, please login again.");
      return;
    }

    const response = await axios.get(`${backendUrl}/api/user/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.data.success) {
      setUsers(response.data.users);
    } else {
      toast.error(response.data.message);
    }
  } catch (error) {
    console.log(error);
    setError("Failed to fetch users. Please try again later.");
    toast.error("Failed to fetch users. Please try again later.");
  } finally {
    setLoading(false);
  }
};

  // Fetch the current user's details
  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(`${backendUrl}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setCurrentUser(response.data.user);
      }
    } catch (error) {
      console.log("Failed to fetch current user:", error);
    }
  };

  // Handle Role Update
  const updateRole = async (id, newRole) => {
    try {
      if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
        return;
      }

      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const response = await axios.put(
        `${backendUrl}/api/user/update-role/${id}`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      if (response.data.success) {
        toast.success(`Role updated to ${newRole}`);
        setUsers(users.map(user => (user._id === id ? { ...user, role: newRole } : user)));
      } else {
        toast.error(response.data.message || "Failed to update role.");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error updating role.");
    }
  };

  // Handle Permission Update
  const updateUserPermissions = async (userId, permissions) => {
    setSavingPermissions(true);
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const response = await axios.put(
        `${backendUrl}/api/user/update-permissions/${userId}`,
        { permissions },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      if (response.data.success) {
        toast.success("Permissions updated successfully!");
        setUsers(users.map(user => 
          user._id === userId ? { ...user, permissions } : user
        ));
        setEditingUser(null);
      } else {
        toast.error(response.data.message || "Failed to update permissions.");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error updating permissions.");
    } finally {
      setSavingPermissions(false);
    }
  };

  // Toggle user expansion
  const toggleUserExpansion = (userId) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  // Start editing permissions
  const startEditingPermissions = (user) => {
    setEditingUser({
      ...user,
      permissions: user.permissions || {}
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingUser(null);
  };

  // Save permissions
  const savePermissions = () => {
    if (editingUser) {
      updateUserPermissions(editingUser._id, editingUser.permissions);
    }
  };

  // Toggle permission for editing user
  const togglePermission = (permissionKey) => {
    if (!editingUser) return;
    
    setEditingUser({
      ...editingUser,
      permissions: {
        ...editingUser.permissions,
        [permissionKey]: !editingUser.permissions[permissionKey]
      }
    });
  };

  // Select all permissions in a category
  const toggleCategoryPermissions = (category, enable) => {
    if (!editingUser) return;
    
    const categoryPermissions = groupedPermissions[category];
    const updatedPermissions = { ...editingUser.permissions };
    
    categoryPermissions.forEach(permission => {
      updatedPermissions[permission.key] = enable;
    });
    
    setEditingUser({
      ...editingUser,
      permissions: updatedPermissions
    });
  };

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
  }, []);

  const admins = filteredUsers.filter(user => user.role === "admin");
  const staff = filteredUsers.filter(user => user.role === "staff");
  const regularUsers = filteredUsers.filter(user => user.role === "user");

  const getRoleConfig = (role) => {
    switch (role) {
      case 'admin':
        return {
          icon: FaUserShield,
          bgColor: 'bg-gradient-to-r from-yellow-400 to-amber-500',
          textColor: 'text-yellow-900',
          borderColor: 'border-yellow-200',
          label: 'Administrator',
          description: 'Full system access'
        };
      case 'staff':
        return {
          icon: FaUserTie,
          bgColor: 'bg-gradient-to-r from-blue-500 to-indigo-600',
          textColor: 'text-blue-900',
          borderColor: 'border-blue-200',
          label: 'Staff Member',
          description: 'Limited permissions'
        };
      default:
        return {
          icon: FaUser,
          bgColor: 'bg-gradient-to-r from-gray-500 to-slate-600',
          textColor: 'text-gray-900',
          borderColor: 'border-gray-200',
          label: 'User',
          description: 'Basic access'
        };
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-xl font-bold text-blue-500">Loading users...</div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg text-center text-red-500">{error}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="mt-1 text-sm text-gray-600">Manage roles and permissions for your team</p>
            </div>
            
            {/* Search and filters */}
            <div className="flex flex-col gap-3 mt-4 md:mt-0 sm:flex-row">
              {/* Search */}
              <div className="relative">
                <FaSearch className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Role filter */}
              <div className="relative">
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="py-2 pl-3 pr-8 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Administrators</option>
                  <option value="staff">Staff</option>
                  <option value="user">Users</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <FaFilter className="text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Stats cards */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
          <div className="p-6 text-white shadow bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-100">Administrators</p>
                <p className="text-3xl font-bold">{admins.length}</p>
              </div>
              <FaUserShield className="w-8 h-8 text-yellow-200" />
            </div>
          </div>
          
          <div className="p-6 text-white shadow bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100">Staff Members</p>
                <p className="text-3xl font-bold">{staff.length}</p>
              </div>
              <FaUserTie className="w-8 h-8 text-blue-200" />
            </div>
          </div>
          
          <div className="p-6 text-white shadow bg-gradient-to-r from-gray-500 to-slate-600 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-100">Regular Users</p>
                <p className="text-3xl font-bold">{regularUsers.length}</p>
              </div>
              <FaUser className="w-8 h-8 text-gray-200" />
            </div>
          </div>
        </div>

        {/* User sections */}
        <div className="space-y-8">
          {/* Administrators */}
          {(filterRole === 'all' || filterRole === 'admin') && (
            <section>
              <h2 className="flex items-center gap-3 mb-6 text-xl font-bold text-gray-900">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-yellow-400 to-amber-500">
                  <FaUserShield className="w-4 h-4 text-white" />
                </div>
                Administrators
              </h2>
              
              {admins.length === 0 ? (
                <div className="p-6 text-center bg-white rounded-lg shadow">
                  <p className="text-gray-500">No administrators found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {admins.map(user => (
                    <div key={user._id} className="overflow-hidden bg-white rounded-lg shadow">
                      <div className="flex flex-col justify-between gap-6 p-6 md:flex-row md:items-center">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full">
                              <FaUserShield className="text-xl text-yellow-600" />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{user.firstName} {user.lastName}</h3>
                            <p className="text-gray-600">{user.email}</p>
                            <p className="text-sm text-gray-500">{user.phone}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {currentUser?._id !== user._id && (
                            <>
                              <button
                                onClick={() => updateRole(user._id, "staff")}
                                className="flex items-center gap-2 px-4 py-2 text-orange-700 transition-colors bg-orange-100 rounded-lg hover:bg-orange-200"
                              >
                                <FaUserTie />
                                Make Staff
                              </button>
                              <button
                                onClick={() => updateRole(user._id, "user")}
                                className="flex items-center gap-2 px-4 py-2 text-blue-700 transition-colors bg-blue-100 rounded-lg hover:bg-blue-200"
                              >
                                <FaUser />
                                Make User
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Staff */}
          {(filterRole === 'all' || filterRole === 'staff') && (
            <section>
              <h2 className="flex items-center gap-3 mb-6 text-xl font-bold text-gray-900">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600">
                  <FaUserTie className="w-4 h-4 text-white" />
                </div>
                Staff Members
              </h2>
              
              {staff.length === 0 ? (
                <div className="p-6 text-center bg-white rounded-lg shadow">
                  <p className="text-gray-500">No staff members found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {staff.map(user => {
                    const permissionCount = Object.values(user.permissions || {}).filter(Boolean).length;
                    return (
                      <div key={user._id} className="overflow-hidden bg-white rounded-lg shadow">
                        <div className="flex flex-col justify-between gap-6 p-6 md:flex-row md:items-center">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                                <FaUserTie className="text-xl text-blue-600" />
                              </div>
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">{user.firstName} {user.lastName}</h3>
                              <p className="text-gray-600">{user.email}</p>
                              <p className="text-sm text-gray-500">{user.phone}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded-full">
                                  {permissionCount} permissions
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => toggleUserExpansion(user._id)}
                              className="flex items-center gap-2 px-4 py-2 text-indigo-700 transition-colors bg-indigo-100 rounded-lg hover:bg-indigo-200"
                            >
                              {expandedUsers.has(user._id) ? <FaChevronUp /> : <FaChevronDown />}
                              {expandedUsers.has(user._id) ? 'Hide' : 'Show'} Permissions
                            </button>
                            {currentUser?._id !== user._id && (
                              <>
                                <button
                                  onClick={() => updateRole(user._id, "admin")}
                                  className="flex items-center gap-2 px-4 py-2 text-yellow-700 transition-colors bg-yellow-100 rounded-lg hover:bg-yellow-200"
                                >
                                  <FaUserShield />
                                  Make Admin
                                </button>
                                <button
                                  onClick={() => updateRole(user._id, "user")}
                                  className="flex items-center gap-2 px-4 py-2 text-blue-700 transition-colors bg-blue-100 rounded-lg hover:bg-blue-200"
                                >
                                  <FaUser />
                                  Make User
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* Permissions panel */}
                        {expandedUsers.has(user._id) && (
                          <div className="p-6 border-t border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between mb-6">
                              <h3 className="text-lg font-bold text-gray-900">Permission Settings</h3>
                              <button
                                onClick={() => startEditingPermissions(user)}
                                className="flex items-center gap-2 px-4 py-2 text-white transition-colors bg-indigo-600 rounded-lg hover:bg-indigo-700"
                              >
                                <FaEdit />
                                Edit Permissions
                              </button>
                            </div>
                            
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                              {Object.entries(groupedPermissions).map(([category, permissions]) => (
                                <div key={category} className="p-4 bg-white border border-gray-200 rounded-lg">
                                  <h4 className="mb-3 font-semibold text-gray-800">{category}</h4>
                                  <div className="space-y-2">
                                    {permissions.map(permission => {
                                      const hasPermission = user.permissions?.[permission.key] || false;
                                      return (
                                        <div key={permission.key} className="flex items-center gap-3">
                                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                            hasPermission ? 'bg-green-500 border-green-500' : 'border-gray-300'
                                          }`}>
                                            {hasPermission && <FaCheck className="text-xs text-white" />}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className={permission.color}>{permission.icon}</span>
                                            <span className="text-sm font-medium">{permission.name}</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Regular Users */}
          {(filterRole === 'all' || filterRole === 'user') && (
            <section>
              <h2 className="flex items-center gap-3 mb-6 text-xl font-bold text-gray-900">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-gray-500 to-slate-600">
                  <FaUser className="w-4 h-4 text-white" />
                </div>
                Regular Users
              </h2>
              
              {regularUsers.length === 0 ? (
                <div className="p-6 text-center bg-white rounded-lg shadow">
                  <p className="text-gray-500">No regular users found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {regularUsers.map(user => (
                    <div key={user._id} className="overflow-hidden bg-white rounded-lg shadow">
                      <div className="flex flex-col justify-between gap-6 p-6 md:flex-row md:items-center">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
                              <FaUser className="text-xl text-gray-600" />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{user.firstName} {user.lastName}</h3>
                            <p className="text-gray-600">{user.email}</p>
                            <p className="text-sm text-gray-500">{user.phone}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {currentUser?._id !== user._id && (
                            <>
                              <button
                                onClick={() => updateRole(user._id, "staff")}
                                className="flex items-center gap-2 px-4 py-2 text-orange-700 transition-colors bg-orange-100 rounded-lg hover:bg-orange-200"
                              >
                                <FaUserTie />
                                Make Staff
                              </button>
                              <button
                                onClick={() => updateRole(user._id, "admin")}
                                className="flex items-center gap-2 px-4 py-2 text-yellow-700 transition-colors bg-yellow-100 rounded-lg hover:bg-yellow-200"
                              >
                                <FaUserShield />
                                Make Admin
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* No results */}
        {filteredUsers.length === 0 && !loading && (
          <div className="p-8 text-center bg-white rounded-lg shadow">
            <div className="flex items-center justify-center w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full">
              <FaUsers className="text-3xl text-gray-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">No users found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Edit Permissions Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-xl overflow-hidden">
            {/* Modal header */}
            <div className="px-6 py-4 bg-indigo-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
                    <FaUserTie className="text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Edit Permissions
                    </h2>
                    <p className="text-indigo-100">
                      {editingUser.firstName} {editingUser.lastName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={cancelEditing}
                  className="text-white hover:text-indigo-200"
                >
                  <FaTimes size={20} />
                </button>
              </div>
            </div>

            {/* Modal content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid gap-6 md:grid-cols-2">
                {Object.entries(groupedPermissions).map(([category, permissions]) => (
                  <div key={category} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-800">{category}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleCategoryPermissions(category, true)}
                          className="px-2 py-1 text-xs text-green-700 bg-green-100 rounded hover:bg-green-200"
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => toggleCategoryPermissions(category, false)}
                          className="px-2 py-1 text-xs text-red-700 bg-red-100 rounded hover:bg-red-200"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {permissions.map(permission => (
                        <div
                          key={permission.key}
                          onClick={() => togglePermission(permission.key)}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${
                            editingUser.permissions[permission.key]
                              ? 'bg-indigo-50 border border-indigo-200'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            editingUser.permissions[permission.key]
                              ? 'bg-indigo-500 border-indigo-500'
                              : 'border-gray-300'
                          }`}>
                            {editingUser.permissions[permission.key] && <FaCheck className="text-xs text-white" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={permission.color}>{permission.icon}</span>
                              <span className="font-medium">{permission.name}</span>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">{permission.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end gap-4">
                <button
                  onClick={cancelEditing}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={savePermissions}
                  disabled={savingPermissions}
                  className="flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-70"
                >
                  {savingPermissions ? (
                    <>
                      <svg className="w-4 h-4 mr-2 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPermissionManagement;