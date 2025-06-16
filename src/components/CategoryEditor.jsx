import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Ensure `backendUrl` is in a separate config file
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { backendUrl } from '../App';

const CategoryEditor = () => {
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const handleAddCategory = async () => {
    if (!categoryName.trim()) return toast.warn('Category name cannot be empty!');
    try {
      await axios.post(`${backendUrl}/api/categories`, { name: categoryName });
      setCategoryName('');
      fetchCategories();
      toast.success('Category added successfully!');
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category');
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !categoryName.trim()) return toast.warn('Category name cannot be empty!');
    try {
      await axios.put(`${backendUrl}/api/categories/${editingCategory._id}`, { name: categoryName });
      setCategoryName('');
      setEditingCategory(null);
      fetchCategories();
      toast.success('Category updated successfully!');
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await axios.delete(`${backendUrl}/api/categories/${id}`);
      fetchCategories();
      toast.success('Category deleted successfully!');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  return (
    <div className="p-6 bg-white rounded-md shadow-md">
      <h2 className="mb-4 text-xl font-semibold text-indigo-600">Category Editor</h2>

      {/* Category Input */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Category Name"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          className="w-full p-2 border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
          className="px-4 py-2 text-white transition bg-indigo-500 rounded hover:bg-indigo-800"
        >
          {editingCategory ? 'Update' : 'Add'}
        </button>
      </div>

      {/* Scrollable Category List */}
      <div className="p-2 overflow-y-auto border rounded max-h-60">
        {categories.length > 0 ? (
          <ul className="space-y-2">
            {categories.map((cat) => (
              <li key={cat._id} className="flex items-center justify-between p-2 border rounded">
                <span>{cat.name}</span>
                <div className="flex gap-2">
                  <button
                    className="px-4 py-[2px] text-yellow-800 transition bg-yellow-200 rounded hover:bg-yellow-600 hover:text-white"
                    onClick={() => {
                      setCategoryName(cat.name);
                      setEditingCategory(cat);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="px-3 py-1 text-red-800 transition bg-red-300 rounded hover:bg-red-600 hover:text-white"
                    onClick={() => handleDeleteCategory(cat._id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500">No categories available</p>
        )}
      </div>

      {/* Toast Notifications */}
      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
};

export default CategoryEditor;
