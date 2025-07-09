import React, { useState, useEffect } from 'react';
import { Facebook, RefreshCw, Send, User, Package, AlertCircle, CheckCircle, LogOut, Globe, Eye } from 'lucide-react';

// Note: Using your original API integration - no localStorage in this environment
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
  const [token, setToken] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/product/list`);
      console.log('Fetched products:', data.products);
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
      // Note: localStorage not available in this environment
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

  const handlePost = async () => {
    setPostResult(null);
    setError('');
    setIsPosting(true);
    
    if (!selectedPage || !postMessage) {
      setError('Please select a page and enter a message.');
      setIsPosting(false);
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
    } finally {
      setIsPosting(false);
    }
  };

  const handleLogout = () => {
    // Note: localStorage not available in this environment
    setToken('');
    setConnected(false);
    setPages([]);
    setSelectedPage('');
    setPostMessage('');
    setSelectedProduct('');
    setPostResult(null);
    setError('');
  };

  const selectedProductData = products.find(p => p._id === selectedProduct);
  const selectedPageData = pages.find(p => p.id === selectedPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Facebook className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Facebook Manager</h1>
                <p className="text-gray-600">Manage your Facebook pages and posts</p>
              </div>
            </div>
            {connected && (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>

        {/* Connection Status */}
        {!token ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Facebook className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Connect Your Facebook Account</h2>
            <p className="text-gray-600 mb-6">Link your Facebook account to start managing your pages and creating posts</p>
            <button
              onClick={connectFacebook}
              disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors font-semibold"
            >
              {loading ? 'Connecting...' : 'Connect Facebook'}
            </button>
            {error && (
              <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg flex items-center space-x-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pages Section */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Globe className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-800">Your Pages</h2>
                </div>
                <button
                  onClick={() => fetchPages(token)}
                  disabled={loading}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading pages...</span>
                </div>
              ) : pages.length === 0 ? (
                <div className="text-center py-8">
                  <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No pages found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pages.map((page) => (
                    <div
                      key={page.id}
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        selectedPage === page.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPage(page.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{page.name}</h3>
                          <p className="text-sm text-gray-600">ID: {page.id}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Post Creation Section */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Send className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-bold text-gray-800">Create Post</h2>
              </div>

              <div className="space-y-4">
                {/* Page Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Page
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={selectedPage}
                    onChange={e => setSelectedPage(e.target.value)}
                  >
                    <option value="">Choose a page...</option>
                    {pages.map(page => (
                      <option key={page.id} value={page.id}>{page.name}</option>
                    ))}
                  </select>
                </div>

                {/* Message Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Post Message
                  </label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    rows={4}
                    value={postMessage}
                    onChange={e => setPostMessage(e.target.value)}
                    placeholder="What's on your mind?"
                  />
                </div>

                {/* Product Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attach Product (Optional)
                  </label>
                  <select
                    value={selectedProduct}
                    onChange={e => setSelectedProduct(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">No product selected</option>
                    {products.map(product => (
                      <option key={product._id} value={product._id}>
                        {product.name} - ${product.finalPrice ?? product.price}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Product Preview */}
                {selectedProductData && (
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center space-x-2 mb-3">
                      <Package className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-gray-800">Product Preview</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{selectedProductData.name}</h4>
                        <p className="text-green-600 font-bold">${selectedProductData.finalPrice ?? selectedProductData.price}</p>
                        <p className="text-sm text-gray-600 mt-1">{selectedProductData.description}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Post Button */}
                <button
                  type="button"
                  onClick={handlePost}
                  disabled={!selectedPage || !postMessage || isPosting}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center space-x-2"
                >
                  {isPosting ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Posting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Post to Facebook</span>
                    </>
                  )}
                </button>
              </div>

              {/* Results */}
              {postResult && (
                <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg flex items-center space-x-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span>{postResult}</span>
                </div>
              )}
              
              {error && (
                <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg flex items-center space-x-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacebookManager;