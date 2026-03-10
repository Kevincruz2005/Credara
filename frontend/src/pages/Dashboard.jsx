import React from 'react';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <div className="pt-24 pb-16 max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">My Dashboard</h1>

        <div className="card">
          {/* Day 6/8 Implementation Here */}
          <p className="text-gray-600">Dashboard functionality will be implemented in Day 6.</p>
        </div>
      </div>
    </div>
  );
}
