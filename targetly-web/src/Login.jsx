import React, { useState } from 'react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Email:', email);
    console.log('Password:', password);
  };

  return (
    <div className="min-h-screen flex">
      {/* Sol taraf - info alanı */}
      <div className="w-1/2 bg-gradient-to-br from-[#4C7CFF] to-[#1d3dd6] text-white flex flex-col justify-center px-16">
        <h1 className="text-4xl font-extrabold mb-4">Welcome Back to</h1>
        <h2 className="text-5xl font-black tracking-tight">TARGETLY</h2>
        <p className="mt-6 text-sm text-white/80 leading-relaxed">
          Social Media Intelligence platform with real-time tracking, trend prediction and brand monitoring.
        </p>
      </div>

      {/* Sağ taraf - login formu */}
      <div className="w-1/2 bg-white flex items-center justify-center px-8">
        <div className="w-full max-w-md">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Login to your account</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4C7CFF]"
            />

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm pr-20 focus:outline-none focus:ring-2 focus:ring-[#4C7CFF]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-[#4C7CFF] hover:bg-blue-700 text-white font-semibold py-3 rounded-md transition"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <a href="#" className="hover:underline">Forgot password?</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
