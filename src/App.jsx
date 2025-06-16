import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Add from './pages/Add';
import List from './pages/List';
import Orders from './pages/AdminOrders';
import Login from './components/Login';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import OrderAnalytics from './pages/OrderAnalytics';
import Hero from './components/HeroSection';
import Users from './pages/Users';
import AddCard from './components/AddCard';
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
import LiveSelling from './components/LiveSellingAdmin';
import AdminChatPanel from './components/AdminChatPanel';
import AdminReturns from './components/AdminReturns';
import AboutPage from './components/AboutPageEditor';
import ContactPage from './components/ContactPageEditor';
import PopupManager from './components/PopupManager';
// import AdminLiveChat from './components/AdminLiveChat';
import BotHelloLottie from './components/BotHelloLottie';
import { Bot } from 'lucide-react';
export const backendUrl = import.meta.env.VITE_BACKEND_URL;
export const currency = '₱';

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
    <div className='min-h-screen bg-indigo-100'>
      <ToastContainer />
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
          <Navbar setToken={setToken} toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
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
            <div className='w-full md:w-[70%] px-4 md:px-8 mx-auto md:ml-[max(5vw,25px)] my-8 text-gray-600 text-base'>
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
                    {/* <Route path='/admin-live-chat' element={<AdminLiveChat token={token} />} /> */}
                    <Route path='/popup' element={<PopupManager token={token} />} />
                    <Route path='/contact-page' element={<ContactPage token={token} />} />
                    <Route path='/about-page' element={<AboutPage token={token} />} />
                    {/* <Route path='/return' element={<AdminReturns token={token} />} /> */}
                    <Route path='/add' element={<Add token={token} />} />
                    <Route path='/list' element={<List token={token} />} />
                    <Route path='/orders' element={<Orders token={token} />} />
                    <Route path='/orderAnalytics' element={<OrderAnalytics token={token} />} />
                    <Route path='/hero' element={<Hero token={token} />} />
                    <Route path='/users' element={<Users token={token} />} />
                    <Route path='/edit' element={<Edit token={token} />} />
                    <Route path='/addCard' element={<AddCard token={token} />} />
                    <Route path='/addMemberCard' element={<AddMemberCard token={token} />} />
                    <Route path='/addIntro' element={<AddIntro token={token} />} />
                    <Route path='*' element={<List token={token} />} />
                    <Route path='/deals' element={<Deals token={token} />} />
                    <Route path='/about' element={<AboutSection token={token} />} />
                    <Route path='/contact' element={<ContactSection token={token} />} />
                    <Route path='/footer' element={<FooterSection token={token} />} />
                    <Route path='/eventCalendar' element={<EventCalendar token={token} />} />
                    <Route path='/job' element={<JobPopupEditor token={token} />} />
                    <Route path='/youtubeUrl' element={<AdminYoutubeEditor token={token} />} />
                    <Route path='/newsletter' element={<NewsLetter token={token} />} />
                    <Route path='/faq' element={<FAQ token={token} />} />
                    <Route path='/logo' element={<LogoEditor token={token} />} />
                    <Route path='/policy' element={<Policy token={token} />} />
                    <Route path='/homepage' element={<HomePageEditor token={token} />} />
                    <Route path='/category' element={<CategoryEditor token={token} />} />
                    <Route path='/region' element={<Region token={token} />} />
                    <Route path='/review' element={<Review token={token} />} />
                    <Route path='/map' element={<AdminLocationEditor setToken={setToken} />} />
                    <Route path='/weight' element={<FeePerKiloEditor token={token} />} />
                    <Route path='/bestseller' element={<BestSellerEditor token={token} />} />
                    <Route path='/latestproduct' element={<LatestProductEditor token={token} />} />
                    <Route path='/voucheramount' element={<VoucherAmountEditor token={token} />} />
                    <Route path='/ads-editor' element={<AdsEditor token={token} />} />
                    <Route path='/navlinks' element={<NavigationManager token={token} />} />
                    <Route path='/live-selling' element={<LiveSelling token={token} />} />
                    <Route path='/live-chat' element={<AdminChatPanel token={token} />} />
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