// src/components/Navbar.jsx
import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo Section */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-emerald-500 p-1.5 rounded-md">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-gray-900">
              Share<span className="text-emerald-500">Bazar</span>
            </span>
          </Link>

          {/* Links & CTA */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-600 hover:text-emerald-500 font-medium transition">Stocks</Link>
            <Link to="/" className="text-gray-600 hover:text-emerald-500 font-medium transition">Mutual Funds</Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <Link to="/auth" className="text-gray-900 font-semibold hover:text-emerald-500 transition">Log in</Link>
            <Link to="/auth" state={{ isRegister: true }} className="bg-emerald-500 text-white px-6 py-2.5 rounded-md font-bold hover:bg-emerald-600 transition shadow-sm">
              Register / Sign Up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;