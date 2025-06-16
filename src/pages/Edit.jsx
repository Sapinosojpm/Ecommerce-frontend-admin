import React from 'react';
import { NavLink } from 'react-router-dom';
import { assets } from '../assets/assets';

const Edit = () => {
  return (
    <div className='w-full border-b-2 flex justify-center p-2 bg-white shadow-md'>
      <div className='flex gap-4 text-[15px]'>
        <NavLink className='flex items-center gap-2 border border-gray-400 px-3 py-2 rounded' to="/addCard">
          <img className='w-5 h-5' src={assets.add_icon} alt="" />
          <p className='hidden md:block'>Portfolio</p>
        </NavLink>

        <NavLink className='flex items-center gap-2 border border-gray-400 px-3 py-2 rounded' to="/addIntro">
          <img className='w-5 h-5' src={assets.order_icon} alt="" />
          <p className='hidden md:block'>Blog</p>
        </NavLink>

        <NavLink className='flex items-center gap-2 border border-gray-400 px-3 py-2 rounded' to="/">
          <img className='w-5 h-5' src={assets.tracking} alt="" />
          <p className='hidden md:block'>Orders</p>
        </NavLink>

        <NavLink className='flex items-center gap-2 border border-gray-400 px-3 py-2 rounded' to="/">
          <img className='w-5 h-5' src={assets.dashboard} alt="" />
          <p className='hidden md:block'>Analytics</p>
        </NavLink>

        <NavLink className='flex items-center gap-2 border border-gray-400 px-3 py-2 rounded' to="/">
          <img className='w-5 h-5' src={assets.dashboard} alt="" />
          <p className='hidden md:block'>Users</p>
        </NavLink>

        <NavLink className='flex items-center gap-2 border border-gray-400 px-3 py-2 rounded' to="/">
          <img className='w-5 h-5' src={assets.dashboard} alt="" />
          <p className='hidden md:block'>Content</p>
        </NavLink>

        <NavLink className='flex items-center gap-2 border border-gray-400 px-3 py-2 rounded' to="/">
          <img className='w-5 h-5' src={assets.dashboard} alt="" />
          <p className='hidden md:block'>Portfolio</p>
          
        </NavLink>
        
        <NavLink className='flex items-center gap-2 border border-gray-400 px-3 py-2 rounded' to="/addMemberCard">
          <img className='w-5 h-5' src={assets.dashboard} alt="" />
          <p className='hidden md:block'>Member</p>
          
        </NavLink>

        
      </div>
    </div>
  );
};

export default Edit;
