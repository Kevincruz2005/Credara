import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <div className="pt-32 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-6xl font-extrabold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Page Not Found</h2>
        <p className="text-gray-600 mb-8 max-w-md">The page you are looking for doesn't exist or has been moved.</p>
        <Link to="/" className="btn-primary">Return Home</Link>
      </div>
    </div>
  );
}
