import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Add from './pages/Add';
import List from './pages/List';
import Orders from './pages/Orders';
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
import AdminDiscount from './components/adminDiscount';
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
import BestSellerEditor from '../../frontend/src/components/BestSellerEditor';
import LatestProductEditor from './components/LatestProductEditor';
import VoucherAmountEditor from './components/VoucherAmountEditor';
import AdsEditor from './components/AdsEditor';
import NavigationManager from './components/NavigationLinksManager';
import LiveSelling from './components/LiveSellingAdmin';
import AdminChatPanel from './components/AdminChatPanel';
export const backendUrl = import.meta.env.VITE_BACKEND_URL;
export const currency = '₱';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const location = useLocation(); // Get current route path

  useEffect(() => {
    localStorage.setItem('token', token);
  }, [token]);

  return (
    <div className='min-h-screen bg-gray-50'>
      <ToastContainer />
      {token === "" ? (
        <Login setToken={setToken} />
      ) : (
        <>
        <AutoLogout setToken={setToken} />
          <Navbar setToken={setToken} />
          <hr />
          <div className='flex w-full'>
            <Sidebar />
            
            <div className='w-[70%] mx-auto ml-[max(5vw,25px)] my-8 text-gray-600 text-base'>
              <Routes>
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
                <Route path='/adminDiscount' element={<AdminDiscount token={token} />} />
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
                <Route path='/navlinks' element={<NavigationManager token={token}/>}/>
                <Route path='/live-selling' element={<LiveSelling token={token}/>}/>
                <Route path='/live-chat' element={<AdminChatPanel token={token}/>}/>
              </Routes>
            
            
            
             
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
