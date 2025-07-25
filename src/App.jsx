import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Add from './pages/Add';
import List from './pages/List';
import Orders from './pages/AdminOrders';
import Login from './components/Login';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import OrderAnalytics from './pages/OrderAnalytics';
import Hero from './components/HeroSection';
import Users from './pages/Users';
// import AddCard from './components/AddCard';
import Edit from './pages/Edit';
import AddIntro from './components/AddIntro';
import AddMemberCard from './components/AddMemberCard';
import Deals from './components/Deals';
import AboutSection from './components/AboutSection';
import ContactSection from './components/ContactSection';
import FooterSection from './components/FooterSection';
import EventCalendar from './components/EventCalendar';
import JobPopupEditor from './components/JobPopupEditor';
import AdminYoutubeEditor from './components/AdminYoutubeEditor';
import NewsLetter from './components/NewsletterDiscount';
import FAQ from './components/AdminFAQPage';
import AutoLogout from './components/AutoLogout';
import LogoEditor from './components/LogoEditor';
import Policy from './components/PolicyEditor';
import HomePageEditor from './components/HomePageEditor';
import CategoryEditor from './components/CategoryEditor';
import Region from './components/RegionEditor';
import Review from './components/Review';
import AdminLocationEditor from './components/AdminLocationEditor';
import FeePerKiloEditor from './components/FeePerKiloEditor';
import BestSellerEditor from './components/BestSellerEditor';
import LatestProductEditor from './components/LatestProductEditor';
import VoucherAmountEditor from './components/VoucherAmountEditor';
import AdsEditor from './components/AdsEditor';
import NavigationManager from './components/NavigationLinksManager';
import AdminReturns from './components/AdminReturns';
import AboutPage from './components/AboutPageEditor';
import ContactPage from './components/ContactPageEditor';
import PopupManager from './components/PopupManager';
import BotHelloLottie from './components/BotHelloLottie';
import FacebookManager from './pages/FacebookManager';
export const backendUrl = import.meta.env.VITE_BACKEND_URL;
export const currency = '₱';
// 
const App = () => {
  const [token, setToken] = useState(localStorage.getItem('authToken') || '');
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Check for screen size to determine initial sidebar state
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    
    // Set initial state based on screen size
    handleResize();
    
    // Add event listener for window resize
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('authToken', token);
  }, [token]);

  // Close sidebar when navigating to a new page on mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);


  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className='min-h-screen bg-gray-20'>
      <ToastContainer position="top-right" />
      {token === "" ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Login setToken={setToken} />
        </motion.div>
      ) : (
        <>
          <AutoLogout setToken={setToken} />
          <hr />
          <div className='relative flex w-full'>
            {/* Sidebar with overlay for mobile */}
            <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block`}>
              <div 
                className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
                onClick={toggleSidebar}
              ></div>
              <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                fixed md:static top-0 left-0 h-full z-30 transition-transform duration-300 ease-in-out 
                bg-white shadow-lg md:shadow-none md:translate-x-0`}
              >
                <Sidebar />
              </div>
            </div>

            {/* Hamburger menu for mobile - This should be in Navbar component ideally */}
            <div className="fixed z-50 md:hidden bottom-4 right-4">
              <button 
                onClick={toggleSidebar}
                className="p-3 text-white transition-colors bg-indigo-600 rounded-full shadow-lg hover:bg-indigo-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Main content area */}
            <div className='w-full md:w-[75%] px-4 md:px-8 mx-auto md:ml-[max(5vw,25px)] my-8 text-gray-600 text-base pt-4'>
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                >
                  <BotHelloLottie />
                  <Routes location={location} key={location.pathname}>
                    {/* Redirect root and any non-admin path to /admin/homepage */}
                    <Route path="/" element={<Navigate to="/admin/homepage" replace />} />
                    <Route path="/admin" element={<Navigate to="/admin/homepage" replace />} />
                    {/* Admin routes */}
                    <Route path="/admin/homepage" element={<HomePageEditor />} />
                    <Route path="/admin/popup" element={<PopupManager token={token} />} />
                    <Route path="/admin/contact-page" element={<ContactPage token={token} />} />
                    <Route path="/admin/about-page" element={<AboutPage token={token} />} />
                    <Route path="/admin/add" element={<Add token={token} />} />
                    <Route path="/admin/list" element={<List token={token} />} />
                    <Route path="/admin/orders" element={<Orders token={token} />} />
                    <Route path="/admin/orderAnalytics" element={<OrderAnalytics token={token} />} />
                    <Route path="/admin/hero" element={<Hero token={token} />} />
                    <Route path="/admin/users" element={<Users token={token} />} />
                    <Route path="/admin/edit" element={<Edit token={token} />} />
                    <Route path="/admin/addMemberCard" element={<AddMemberCard token={token} />} />
                    <Route path="/admin/addIntro" element={<AddIntro token={token} />} />
                    <Route path="/admin/deals" element={<Deals token={token} />} />
                    <Route path='/admin/about' element={<AboutSection token={token} />} />
                    <Route path='/admin/contact' element={<ContactSection token={token} />} />
                    <Route path='/admin/footer' element={<FooterSection token={token} />} />
                    <Route path='/admin/eventCalendar' element={<EventCalendar token={token} />} />
                    <Route path='/admin/job' element={<JobPopupEditor token={token} />} />
                    <Route path='/admin/youtubeUrl' element={<AdminYoutubeEditor token={token} />} />
                    <Route path='/admin/newsletter' element={<NewsLetter token={token} />} />
                    <Route path='/admin/faq' element={<FAQ token={token} />} />
                    <Route path='/admin/logo' element={<LogoEditor token={token} />} />
                    <Route path='/admin/policy' element={<Policy token={token} />} />
                    <Route path='/admin/category' element={<CategoryEditor token={token} />} />
                    <Route path='/admin/region' element={<Region token={token} />} />
                    <Route path='/admin/review' element={<Review token={token} />} />
                    <Route path='/admin/map' element={<AdminLocationEditor setToken={setToken} />} />
                    <Route path='/admin/weight' element={<FeePerKiloEditor token={token} />} />
                    <Route path='/admin/bestseller' element={<BestSellerEditor token={token} />} />
                    <Route path='/admin/latestproduct' element={<LatestProductEditor token={token} />} />
                    <Route path='/admin/voucheramount' element={<VoucherAmountEditor token={token} />} />
                    <Route path='/admin/ads-editor' element={<AdsEditor token={token} />} />
                    <Route path='/admin/navlinks' element={<NavigationManager token={token} />} />
                    <Route path='/admin/facebook-manager' element={<FacebookManager />} />
                  </Routes>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default App;