import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function EvidenceCard() {
  const navigate = useNavigate();
  return (
    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-2xl p-5 mb-4">
      <p className="font-bold text-teal-700 text-lg">💎 Unlock Work Evidenced Badge</p>
      <p className="text-gray-600 text-sm mt-1">
        Upload payment history or work photos to earn the highest verification tier.
      </p>
      <p className="text-gray-500 text-xs mt-1">Score cap increases from 85% → 100%</p>
      <button
        onClick={() => navigate('/onboarding/evidence')}
        className="mt-3 bg-teal text-white font-semibold py-2 px-4 rounded-xl hover:opacity-90 transition text-sm"
        style={{ backgroundColor: '#0D9488' }}
      >
        💎 Add Evidence
      </button>
    </div>
  );
}
