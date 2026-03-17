// src/pages/Home.jsx
import React from 'react';
import { BarChart3, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="bg-white pb-24">
      {/* Hero Section (Like Groww) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 text-center">
        <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Market is Open</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-extrabold text-gray-900 tracking-tight mb-6">
          Invest in <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">everything.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Online platform to invest in stocks, derivatives, mutual funds, ETFs, bonds, and more. Join millions of Indians today.
        </p>
        
        <Link to="/auth" state={{ isRegister: true }} className="inline-flex items-center space-x-2 bg-emerald-500 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/30 hover:-translate-y-1">
          <span>Get Started Now</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Clean Grid Section (Like Zerodha/Groww Features) */}
      <div className="bg-gray-50 py-24 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">
            India’s stock market at your fingertips
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition group">
              <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <BarChart3 className="w-7 h-7 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Zero Brokerage</h3>
              <p className="text-gray-500">Start investing today with zero commission on all delivery trades.</p>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition group">
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <ShieldCheck className="w-7 h-7 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Bank-Grade Security</h3>
              <p className="text-gray-500">Your assets are protected with industry-leading 256-bit encryption.</p>
            </div>

            {/* Feature Card 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition group">
              <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Zap className="w-7 h-7 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Lightning Fast</h3>
              <p className="text-gray-500">Execute trades instantly with our high-performance microservices.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;