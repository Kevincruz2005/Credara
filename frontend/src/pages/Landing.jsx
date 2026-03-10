import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="pt-24 pb-16 max-w-6xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center min-h-[80vh] text-center">
        <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
          Your Work. <span className="text-primary">Verified.</span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl">
          Build your professional identity. Record your skills, get verified by past clients, and prove your work history. Start winning better jobs today.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/register" className="btn-primary text-lg px-8 py-4">
            Build My Profile
          </Link>
        </div>
      </main>
    </div>
  );
}
