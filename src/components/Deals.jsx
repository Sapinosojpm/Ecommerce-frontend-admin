import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';

const AdminPanel = () => {
  const [deals, setDeals] = useState([]);
  const [newDeal, setNewDeal] = useState({ title: '', description: '', discount: '', imageUrl: '', active: true });

  useEffect(() => {
    axios.get(`${backendUrl}/api/deals`)
      .then((response) => {
        setDeals(response.data);
      })
      .catch((error) => {
        console.error('Error fetching deals:', error);
      });
  }, []);

  const handleCreateDeal = () => {
    axios.post(`${backendUrl}/api/deals`, newDeal)
      .then((response) => {
        setDeals([...deals, response.data]);
        setNewDeal({ title: '', description: '', discount: '', imageUrl: '', active: true });
      })
      .catch((error) => {
        console.error('Error creating deal:', error);
      });
  };

  const handleDeleteDeal = (id) => {
    axios.delete(`${backendUrl}/api/deals/${id}`)
      .then(() => {
        setDeals(deals.filter((deal) => deal._id !== id));
      })
      .catch((error) => {
        console.error('Error deleting deal:', error);
      });
  };

  const handleUpdateDeal = (id, updatedDeal) => {
    axios.put(`${backendUrl}/api/deals/${id}`, updatedDeal)
      .then((response) => {
        setDeals(deals.map((deal) => (deal._id === id ? response.data : deal)));
      })
      .catch((error) => {
        console.error('Error updating deal:', error);
      });
  };

  return (
    <div className="max-w-4xl p-4 mx-auto">
      <h1 className="mb-4 text-2xl font-bold text-indigo-700">Deals Management</h1>

      <div className="p-4 mb-6 rounded-lg bg-indigo-50">
        <h2 className="mb-2 text-lg font-semibold text-indigo-800">Create New Deal</h2>
        <div className="space-y-2">
          <input
            type="text"
            className="w-full p-2 text-sm border border-indigo-200 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Title"
            value={newDeal.title}
            onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
          />
          <textarea
            className="w-full p-2 text-sm border border-indigo-200 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Description"
            rows="2"
            value={newDeal.description}
            onChange={(e) => setNewDeal({ ...newDeal, description: e.target.value })}
          />
          <div className="flex space-x-2">
            <input
              type="number"
              className="w-1/4 p-2 text-sm border border-indigo-200 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Discount %"
              value={newDeal.discount}
              onChange={(e) => setNewDeal({ ...newDeal, discount: e.target.value })}
            />
            <button
              className="flex-1 px-3 py-2 text-sm text-white transition-colors bg-indigo-600 rounded hover:bg-indigo-700"
              onClick={handleCreateDeal}
            >
              Create Deal
            </button>
          </div>
        </div>
      </div>

      <h2 className="mb-2 text-lg font-semibold text-indigo-800">Current Deals</h2>
      <div className="space-y-3">
        {deals.map((deal) => (
          <div key={deal._id} className="p-3 bg-white border border-indigo-100 rounded-lg shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-indigo-900">{deal.title}</h3>
                <p className="mb-1 text-sm text-gray-600">{deal.description}</p>
                <div className="flex items-center space-x-3 text-xs">
                  <span className="px-2 py-1 text-indigo-800 bg-indigo-100 rounded-full">{deal.discount}% off</span>
                  <span className={`px-2 py-1 rounded-full ${deal.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {deal.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  className="px-3 py-1 text-xs text-indigo-800 transition-colors bg-indigo-100 rounded hover:bg-indigo-200"
                  onClick={() => handleUpdateDeal(deal._id, { ...deal, active: !deal.active })}
                >
                  {deal.active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  className="px-3 py-1 text-xs text-red-800 transition-colors bg-red-100 rounded hover:bg-red-200"
                  onClick={() => handleDeleteDeal(deal._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPanel;