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
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || '');
  const [previewProduct, setPreviewProduct] = useState(null);

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
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      setToken(urlToken);
      localStorage.setItem(TOKEN_KEY, urlToken);
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchPages(urlToken);
    } else if (token) {
      fetchPages(token);
    }
    fetchProducts();
  }, [token]);

  const connectFacebook = () => {
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const authWindow = window.open(
      FACEBOOK_AUTH_URL,
      'Facebook Login',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    const timer = setInterval(() => {
      if (authWindow.closed) {
        clearInterval(timer);
        fetchPages();
      }
    }, 1000);
  };

  const fetchPages = async (authToken = token) => {
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
      setPreviewProduct(null);
    } catch (err) {
      console.error('Post failed:', err);
      setError(err.message || 'Failed to post to Facebook');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
    setPages([]);
    setConnected(false);
  };

  const handleProductSelect = (e) => {
    const productId = e.target.value;
    setSelectedProduct(productId);
    if (productId) {
      const selected = products.find(p => p._id === productId);
      setPreviewProduct({
        name: selected.name,
        price: selected.finalPrice ?? selected.price,
        description: selected.description,
        imageUrl: Array.isArray(selected.image) ? selected.image[0] : selected.image
      });
    } else {
      setPreviewProduct(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-gray-100 min-h-screen">
      {/* Facebook-like header */}
      <div className="bg-blue-600 text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Facebook Page Manager</h1>
          {token && (
            <button 
              onClick={handleLogout}
              className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg"
            >
              Logout
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {!token ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Connect Your Facebook Account</h2>
            <p className="mb-6 text-gray-600">To manage your Facebook pages, please connect your account.</p>
            <button
              onClick={connectFacebook}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Connect with Facebook
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Page selection card */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Your Pages</h2>
                <button
                  onClick={() => fetchPages(token)}
                  disabled={loading}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : pages.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No pages found.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pages.map((page) => (
                    <div 
                      key={page.id} 
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${selectedPage === page.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                      onClick={() => setSelectedPage(page.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          {page.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-medium">{page.name}</h3>
                          <p className="text-sm text-gray-500">ID: {page.id}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Post composer - Facebook style */}
            {pages.length > 0 && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b">
                  <h2 className="font-semibold">Create Post</h2>
                </div>
                
                <form onSubmit={handlePost} className="p-4">
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0"></div>
                    <div className="flex-1">
                      <select
                        className="w-full p-2 border rounded mb-3 text-sm"
                        value={selectedPage}
                        onChange={e => setSelectedPage(e.target.value)}
                      >
                        <option value="">Select a Page to Post</option>
                        {pages.map(page => (
                          <option key={page.id} value={page.id}>{page.name}</option>
                        ))}
                      </select>
                      
                      <textarea
                        className="w-full p-3 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        rows={4}
                        value={postMessage}
                        onChange={e => setPostMessage(e.target.value)}
                        placeholder="What's on your mind?"
                      />
                    </div>
                  </div>

                  {/* Product preview */}
                  {previewProduct && (
                    <div className="mb-4 border rounded-lg overflow-hidden">
                      <div className="flex">
                        <div className="w-1/3 bg-gray-100">
                          <img 
                            src={previewProduct.imageUrl} 
                            alt={previewProduct.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="w-2/3 p-3">
                          <h3 className="font-medium">{previewProduct.name}</h3>
                          <p className="text-blue-600 font-semibold mt-1">₱{previewProduct.price.toFixed(2)}</p>
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{previewProduct.description}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Product selector */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Attach Product</label>
                    <select
                      value={selectedProduct}
                      onChange={handleProductSelect}
                      className="w-full p-2 border rounded text-sm"
                    >
                      <option value="">Select a Product to Share</option>
                      {products.map(product => (
                        <option key={product._id} value={product._id}>
                          {product.name} (₱{product.finalPrice ?? product.price})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t">
                    <div className="text-sm text-gray-500">
                      {selectedPage && `Posting to: ${pages.find(p => p.id === selectedPage)?.name}`}
                    </div>
                    <button
                      type="submit"
                      disabled={!selectedPage || !postMessage}
                      className={`px-4 py-2 rounded-lg font-medium ${(!selectedPage || !postMessage) ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    >
                      Post
                    </button>
                  </div>
                </form>

                {postResult && (
                  <div className="bg-green-50 text-green-700 p-4 border-t">
                    {postResult}
                  </div>
                )}
                {error && (
                  <div className="bg-red-50 text-red-700 p-4 border-t">
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FacebookManager;