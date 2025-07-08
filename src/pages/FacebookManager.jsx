import React, { useState, useEffect } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
const FACEBOOK_AUTH_URL = `${BACKEND_URL}/api/auth/facebook`;
const FACEBOOK_PAGES_URL = `${BACKEND_URL}/api/facebook/pages`;
const FACEBOOK_POST_URL = `${BACKEND_URL}/api/facebook/post`;
const PRODUCT_LIST_URL = `${BACKEND_URL}/api/product/list`;


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

  useEffect(() => {
    console.log("FacebookManager mounted", window.location.search);
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    console.log("Token from URL:", urlToken);
    if (urlToken) {
      setToken(urlToken);
      localStorage.setItem(TOKEN_KEY, urlToken);
      console.log("Token saved to localStorage:", urlToken);
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchPages(urlToken);
    } else if (token) {
      fetchPages(token);
    }
    fetchProducts();
    // eslint-disable-next-line
  }, [token]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(PRODUCT_LIST_URL);
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setProducts([]);
    }
  };

  const handleProductChange = (e) => {
    const productId = e.target.value;
    setSelectedProduct(productId);
    
    if (!productId) {
      setPostMessage('');
      return;
    }
    
    const product = products.find(p => p._id === productId);
    if (product) {
      const msg = `New Product: ${product.name}\nPrice: $${product.finalPrice ?? product.price}\n${product.description ?? ''}`;
      setPostMessage(msg);
    }
  };

  const connectFacebook = () => {
    setLoading(true);
    setError('');
    
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
        setLoading(false);
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
      // Clear invalid token
      localStorage.removeItem(TOKEN_KEY);
      setToken('');
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

  return (
    <div className="max-w-xl p-6 mx-auto bg-white rounded shadow">
      <h2 className="mb-4 text-2xl font-bold">Facebook Page Manager</h2>
      
      {!connected ? (
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
          <div className="mb-4">
            <button
              onClick={fetchPages}
              disabled={loading}
              className="px-3 py-1 mb-2 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:bg-gray-100"
            >
              Refresh Pages
            </button>
            
            <h3 className="mb-2 text-lg font-semibold">Your Facebook Pages:</h3>
            
            {loading ? (
              <div>Loading pages...</div>
            ) : pages.length === 0 ? (
              <div className="p-3 text-yellow-700 bg-yellow-100 border border-yellow-300 rounded">
                No pages found. Please make sure your Facebook account has pages you manage.
              </div>
            ) : (
              <ul className="pl-5 mb-4 list-disc">
                {pages.map(page => (
                  <li key={page.id} className="mb-1">
                    <span className="font-medium">{page.name}</span> (ID: {page.id})
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form onSubmit={handlePost} className="p-4 border border-gray-200 rounded">
            <div className="mb-4">
              <label className="block mb-1 font-medium">Select Page:</label>
              <select
                value={selectedPage}
                onChange={(e) => setSelectedPage(e.target.value)}
                className="w-full p-2 border rounded"
                disabled={pages.length === 0}
              >
                <option value="">-- Select a Page --</option>
                {pages.map(page => (
                  <option key={page.id} value={page.id}>{page.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-medium">Select Product (optional):</label>
              <select
                value={selectedProduct}
                onChange={handleProductChange}
                className="w-full p-2 border rounded"
                disabled={products.length === 0}
              >
                <option value="">-- Select a Product --</option>
                {products.map(product => (
                  <option key={product._id} value={product._id}>{product.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-medium">Message:</label>
              <textarea
                value={postMessage}
                onChange={(e) => setPostMessage(e.target.value)}
                className="w-full p-2 border rounded"
                rows={4}
                placeholder="Write your post here..."
              />
            </div>

            <button
              type="submit"
              disabled={!selectedPage || !postMessage || loading}
              className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading ? 'Posting...' : 'Post to Facebook Page'}
            </button>
          </form>

          {postResult && (
            <div className="p-3 mt-4 text-green-700 bg-green-100 border border-green-300 rounded">
              {postResult}
            </div>
          )}
          
          {error && (
            <div className="p-3 mt-4 text-red-700 bg-red-100 border border-red-300 rounded">
              {error}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FacebookManager;