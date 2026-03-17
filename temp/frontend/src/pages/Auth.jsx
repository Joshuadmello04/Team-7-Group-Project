// src/pages/Auth.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loginAPI, registerAPI } from '../services/api';

const Auth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(!location.state?.isRegister);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({ username: '', email: '', password: '', panNumber: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (isLogin) {
        const response = await loginAPI({ email: formData.email, password: formData.password });
        localStorage.setItem('token', response.token); 
        setMessage({ type: 'success', text: 'Login Successful! Redirecting...' });
        setTimeout(() => navigate('/'), 1500); 
      } else {
        const payload = { username: formData.username, email: formData.email, password: formData.password };
        const response = await registerAPI(payload);
        setMessage({ type: 'success', text: response || 'Registration Successful! Please login.' });
        setTimeout(() => { setIsLogin(true); setMessage({ type: '', text: '' }); }, 2000);
      }
    } catch (error) {
        setMessage({ type: 'error', text: typeof error === 'string' ? error : 'Something went wrong' });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* Toggle Header */}
        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setIsLogin(true)} 
            className={`flex-1 py-4 text-sm font-bold transition-colors ${isLogin ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/30' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Login
          </button>
          <button 
            onClick={() => setIsLogin(false)} 
            className={`flex-1 py-4 text-sm font-bold transition-colors ${!isLogin ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/30' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Register
          </button>
        </div>

        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>

          {message.text && (
            <div className={`p-3 mb-6 rounded-md text-sm font-medium text-center ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" name="username" value={formData.username} onChange={handleChange} required 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition shadow-sm" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required 
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition shadow-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required 
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition shadow-sm" />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PAN Card Number</label>
                <input type="text" name="panNumber" value={formData.panNumber} onChange={handleChange} required 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition shadow-sm uppercase" />
              </div>
            )}

            <button type="submit" disabled={loading} 
              className="w-full mt-6 bg-emerald-500 text-white py-3.5 rounded-lg text-lg font-bold hover:bg-emerald-600 transition shadow-md disabled:opacity-50">
              {loading ? "Processing..." : isLogin ? "Login" : "Register"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;