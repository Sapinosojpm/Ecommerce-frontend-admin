import React, { useState, useEffect } from "react";
import axios from "axios";
import { backendUrl } from "../App"; // Update this based on your setup
import { toast } from "react-toastify";

const UserManagement = () => {
  const [users, setUsers] = useState([]); // Stores all users
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch users from backend API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
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
      const token = localStorage.getItem("token");
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

      const token = localStorage.getItem("token");
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

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
  }, []);

  if (loading) return <div className="mt-6 text-xl font-bold text-center text-blue-500">Loading users...</div>;
  if (error) return <div className="text-lg text-center text-red-500">{error}</div>;

  const admins = users.filter(user => user.role === "admin");
  const regularUsers = users.filter(user => user.role !== "admin");

  return (
    <div className="container p-4 mx-auto md:p-6">
      <h1 className="mb-6 text-2xl font-semibold text-center md:text-3xl">User Management</h1>

      {/* Admin List */}
      <h2 className="mt-4 mb-3 text-lg font-bold text-green-700 md:text-2xl">Admins</h2>
      {admins.length === 0 ? (
        <p className="text-gray-500">No admins found.</p>
      ) : (
        <ul>
          {admins.map((user) => (
            <li
              key={user._id}
              className="flex flex-col items-center justify-between p-4 mb-4 bg-white rounded-lg shadow-md md:flex-row"
            >
              <div className="text-center md:text-left">
                <p className="font-bold text-gray-700">{user.firstName} {user.lastName}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
                <p className="text-sm text-gray-500">Phone: {user.phone}</p>
              </div>
              {currentUser?._id !== user._id && (
                <button
                  onClick={() => updateRole(user._id, "user")}
                  className="w-full px-4 py-2 mt-3 text-white bg-yellow-500 rounded-lg hover:bg-yellow-600 md:mt-0 md:ml-4 md:w-auto"
                >
                  Change to User
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* User List */}
      <h2 className="mt-8 mb-3 text-lg font-bold text-blue-700 md:text-2xl">Users</h2>
      {regularUsers.length === 0 ? (
        <p className="text-gray-500">No users found.</p>
      ) : (
        <ul>
          {regularUsers.map((user) => (
            <li
              key={user._id}
              className="flex flex-col items-center justify-between p-4 mb-4 bg-white rounded-lg shadow-md md:flex-row"
            >
              <div className="text-center md:text-left">
                <p className="font-bold text-gray-700">{user.firstName} {user.lastName}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
                <p className="text-sm text-gray-500">Phone: {user.phone}</p>
              </div>
              <button
                onClick={() => updateRole(user._id, "admin")}
                className="w-full px-4 py-2 mt-3 text-white bg-green-600 rounded-lg hover:bg-green-700 md:mt-0 md:ml-4 md:w-auto"
              >
                Promote to Admin
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserManagement;
