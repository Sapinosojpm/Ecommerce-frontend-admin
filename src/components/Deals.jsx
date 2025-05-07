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
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Admin Panel</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold">Create New Deal</h2>
        <input
          type="text"
          className="mt-2 block w-full p-2 border border-gray-300 rounded"
          placeholder="Title"
          value={newDeal.title}
          onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
        />
        <textarea
          className="mt-2 block w-full p-2 border border-gray-300 rounded"
          placeholder="Description"
          value={newDeal.description}
          onChange={(e) => setNewDeal({ ...newDeal, description: e.target.value })}
        />
        <input
          type="number"
          className="mt-2 block w-full p-2 border border-gray-300 rounded"
          placeholder="Discount %"
          value={newDeal.discount}
          onChange={(e) => setNewDeal({ ...newDeal, discount: e.target.value })}
        />
        {/* <input
          type="text"
          className="mt-2 block w-full p-2 border border-gray-300 rounded"
          placeholder="Image URL (optional)"
          value={newDeal.imageUrl}
          onChange={(e) => setNewDeal({ ...newDeal, imageUrl: e.target.value })}
        /> */}
        <button
          className="mt-4 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
          onClick={handleCreateDeal}
        >
          Create Deal
        </button>
      </div>

      <h2 className="text-xl font-semibold">Current Deals</h2>
      <div>
        {deals.map((deal) => (
          <div key={deal._id} className="mb-4 p-4 border border-gray-300 rounded">
            <h3 className="font-semibold text-lg">{deal.title}</h3>
            <p>{deal.description}</p>
            <p>Discount: {deal.discount}%</p>
            <p>Status: {deal.active ? 'Active' : 'Inactive'}</p>
            <button
              className="mr-2 px-4 py-2 bg-yellow-500 text-white rounded"
              onClick={() => handleUpdateDeal(deal._id, { ...deal, active: !deal.active })}
            >
              {deal.active ? 'Deactivate' : 'Activate'}
            </button>
            <button
              className="px-4 py-2 bg-red-500 text-white rounded"
              onClick={() => handleDeleteDeal(deal._id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPanel;
