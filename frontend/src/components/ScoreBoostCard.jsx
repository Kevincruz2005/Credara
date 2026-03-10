import React from 'react';
import { useNavigate } from 'react-router-dom';
import { startIdVerify } from '../services/api';
import { toast } from 'react-toastify';

export default function ScoreBoostCard({ currentScore }) {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const handleVerify = async () => {
    setLoading(true);
    try {
      const res = await startIdVerify();
      const { verification_url } = res.data.data;
      window.open(verification_url, '_blank');
      toast.success('ID verification opened — complete it and return here');
    } catch {
      toast.error('Failed to start ID verification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 mb-4">
      <p className="font-bold text-primary text-lg">🚀 Boost Your Score</p>
      <p className="text-gray-600 text-sm mt-1">
        Current max: <strong>{currentScore || 65}%</strong> → With verified ID: up to <strong>85%</strong>
      </p>
      <p className="text-gray-500 text-xs mt-1">Takes ~60 seconds. Government ID + selfie.</p>
      <button
        onClick={handleVerify}
        disabled={loading}
        className="btn-primary mt-3 text-sm py-2 px-4 flex items-center gap-2"
      >
        {loading ? '⏳ Starting...' : '🪪 Verify ID Now'}
      </button>
    </div>
  );
}
