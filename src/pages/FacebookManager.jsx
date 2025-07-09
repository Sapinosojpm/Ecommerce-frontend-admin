import React, { useState, useEffect } from 'react';
import axios from "axios";
import { backendUrl } from "../App";
const FACEBOOK_AUTH_URL = '/api/auth/facebook';
const FACEBOOK_PAGES_URL = '/api/facebook/pages';
const FACEBOOK_POST_URL = '/api/facebook/post';
const PRODUCT_LIST_URL = '/api/product/list';
const TOKEN_KEY = 'fbAuthToken';

const FacebookManager = () => {
  const [pages, setPages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPage, setSelectedPage] = useState('');
  const [postMessage, setPostMessage] = useState('');
  const [postResult, setPostResult] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  // Use React state for token, do not use localStorage
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || '');

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/product/list`);
      setProducts(data.products || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setProducts([]);
    }
  };

  useEffect(() => {
    console.log("FacebookManager mounted", window.location.search);
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    console.log("Token from URL:", urlToken);
    if (urlToken) {
      setToken(urlToken);
      localStorage.setItem(TOKEN_KEY, urlToken);
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchPages(urlToken);
    } else if (token) {
      fetchPages(token);
    }
    fetchProducts();
    // eslint-disable-next-line
  }, [token]);

  const connectFacebook = () => {
    // Open Facebook OAuth in a new window
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const authWindow = window.open(
      FACEBOOK_AUTH_URL,
      'Facebook Login',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // Poll to check if the window is closed, then try to fetch pages
    const timer = setInterval(() => {
      if (authWindow.closed) {
        clearInterval(timer);
        fetchPages();
      }
    }, 1000);
  };

  const fetchPages = async (authToken) => {
    if (!authToken) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(FACEBOOK_PAGES_URL, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch pages');
      }
      setPages(data.data || []);
      setConnected(true);
    } catch (err) {
      console.error('Failed to fetch pages:', err);
      setError(err.message || 'Failed to fetch Facebook pages. Please reconnect.');
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    setPostResult(null);
    setError('');
    if (!selectedPage || !postMessage) {
      setError('Please select a page and enter a message.');
      return;
    }
    let product = null;
    if (selectedProduct) {
      const selected = products.find(p => p._id === selectedProduct);
      if (selected) {
        product = {
          name: selected.name,
          price: selected.finalPrice ?? selected.price,
          description: selected.description,
          imageUrl: Array.isArray(selected.image) ? selected.image[0] : selected.image
        };
      }
    }
    try {
      const response = await fetch(FACEBOOK_POST_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          pageId: selectedPage, 
          message: postMessage, 
          product 
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to post');
      }
      setPostResult(`Successfully posted! Post ID: ${data.id}`);
      setPostMessage('');
      setSelectedProduct('');
    } catch (err) {
      console.error('Post failed:', err);
      setError(err.message || 'Failed to post to Facebook');
    }
  };

  // Add a logout handler to clear token from localStorage and state
  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
    // Optionally, redirect or reload the page
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Facebook Page Manager</h2>
      {/* If token is missing, prompt user to connect Facebook again */}
      {!token ? (
        <>
          <button
            onClick={connectFacebook}
            disabled={loading}
            className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? 'Connecting...' : 'Connect Facebook Page'}
          </button>
          {error && <div className="mt-2 text-red-500">{error}</div>}
        </>
      ) : (
        <>
          <button
            onClick={fetchPages}
            className="px-3 py-1 bg-gray-200 rounded mb-4"
          >
            Refresh Pages
          </button>
          <h3 className="text-lg font-semibold mb-2">Your Facebook Pages:</h3>
          {loading ? (
            <div>Loading...</div>
          ) : pages.length === 0 ? (
            <div>No pages found.</div>
          ) : (
            <ul className="list-disc pl-6 mb-4">
              {pages.map((page) => (
                <li key={page.id} className="mb-2">
                  <span className="font-medium">{page.name}</span> (ID: {page.id})
                </li>
              ))}
            </ul>
          )}

          {/* Post to Page Form */}
          <form onSubmit={handlePost} className="mb-4 p-4 bg-gray-50 rounded">
            <label className="block mb-2 font-medium">Select Page:</label>
            <select
              className="w-full mb-2 p-2 border rounded"
              value={selectedPage}
              onChange={e => setSelectedPage(e.target.value)}
            >
              <option value="">-- Select a Page --</option>
              {pages.map(page => (
                <option key={page.id} value={page.id}>{page.name}</option>
              ))}
            </select>
            <label className="block mb-2 font-medium">Message:</label>
            <textarea
              className="w-full mb-2 p-2 border rounded"
              rows={3}
              value={postMessage}
              onChange={e => setPostMessage(e.target.value)}
              placeholder="Write your post here..."
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Post to Facebook Page
            </button>
          </form>
          {postResult && <div className="text-green-600 mb-2">{postResult}</div>}
          {error && <div className="text-red-500 mt-2">{error}</div>}
          <button onClick={handleLogout} className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Logout</button>
        </>
      )}
    </div>
  );
};

export default FacebookManager; 