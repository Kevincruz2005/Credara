import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import BadgeDisplay from '../components/BadgeDisplay';
import ScoreBoostCard from '../components/ScoreBoostCard';
import EvidenceCard from '../components/EvidenceCard';
import { generateDocument, getEvidenceSummary } from '../services/api';
import api from '../services/api';

export default function Dashboard() {
  const { worker } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [evidence, setEvidence] = useState(null);
  const [docResult, setDocResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [genDoc, setGenDoc] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Get latest complete profile for this worker
      const res = await api.get('/api/ai/my-profile');
      setProfile(res.data.data);
      if (res.data.data?.id) {
        const evRes = await getEvidenceSummary(res.data.data.id);
        setEvidence(evRes.data.data);
      }
    } catch {
      // No profile yet — prompt to start onboarding
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const computeBadge = () => {
    if (!profile) return 'SELF_REPORTED';
    // fraud_flags may be a parsed array (pg auto-parses JSON columns),
    // a JSON string, null, or empty string — handle all cases safely
    let flags = [];
    try {
      const raw = profile.fraud_flags;
      if (Array.isArray(raw)) flags = raw;
      else if (raw && typeof raw === 'string' && raw.trim() !== '') flags = JSON.parse(raw);
    } catch { flags = []; }
    const hasEv  = evidence?.has_evidence || false;
    if (flags.length > 2)                              return 'FLAGGED';
    if (worker?.id_verified && hasEv && flags.length === 0) return 'WORK_EVIDENCED';
    if (worker?.id_verified && flags.length === 0)     return 'FULLY_VERIFIED';
    if (worker?.id_verified)                           return 'IDENTITY_VERIFIED';
    return 'SELF_REPORTED';
  };

  const handleGenerateDoc = async () => {
    if (!profile) return;
    setGenDoc(true);
    try {
      const res = await generateDocument(profile.id);
      setDocResult(res.data.data);
      toast.success('📄 PDF document generated!');
    } catch {
      toast.error('Document generation failed');
    } finally {
      setGenDoc(false);
    }
  };

  const score = profile?.consistency_score || 0;
  const scoreColor = score >= 80 ? '#059669' : score >= 50 ? '#D97706' : '#DC2626';
  const badge = computeBadge();

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <div className="pt-20 pb-16 max-w-4xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Welcome back, {worker?.name?.split(' ')[0]} 👋</h1>
            <p className="text-gray-500 text-sm mt-1">{worker?.phone}</p>
          </div>
          {!profile && (
            <button onClick={() => navigate('/onboarding/voice')} className="btn-primary text-sm py-2 px-4">
              + Build Profile
            </button>
          )}
        </div>

        {loading ? (
          <div className="card flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !profile ? (
          /* No profile yet */
          <div className="card text-center py-16">
            <p className="text-5xl mb-4">🎤</p>
            <h2 className="text-xl font-bold mb-2">You haven't built your profile yet</h2>
            <p className="text-gray-500 text-sm mb-6">Record a 1-minute voice note to get started. Takes under 5 minutes.</p>
            <button onClick={() => navigate('/onboarding/voice')} className="btn-primary px-8">
              Build My Profile
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Left column — score + badge */}
            <div className="lg:col-span-1 space-y-4">
              <div className="card text-center">
                <p className="text-sm font-medium text-gray-500 mb-2">Verification Score</p>
                <div className="text-6xl font-extrabold mb-2" style={{ color: scoreColor }}>
                  {score}%
                </div>
                <div className="flex justify-center mb-3">
                  <BadgeDisplay level={badge} />
                </div>
                <p className="text-xs text-gray-400">
                  {worker?.id_verified ? '🪪 Government ID Verified' : '⚪ ID not verified yet'}
                </p>
              </div>

              {/* Score boost CTAs */}
              {!worker?.id_verified && (
                <ScoreBoostCard currentScore={score} />
              )}
              {!evidence?.has_evidence && (
                <EvidenceCard />
              )}


            </div>

            {/* Right column — profile + evidence summary + document */}
            <div className="lg:col-span-2 space-y-4">

              {/* Profile text */}
              <div className="card">
                <h3 className="font-bold text-gray-900 mb-3">Your Professional Profile</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {profile.profile_text || 'Profile text not generated yet.'}
                </p>
              </div>

              {/* Work evidence summary */}
              {evidence?.has_evidence && (
                <div className="card bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
                  <h3 className="font-bold text-teal-800 mb-3">💎 Work Evidence Summary</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {evidence.mobile_money_stats && (
                      <>
                        <div className="bg-white rounded-xl p-3 border border-teal-100">
                          <p className="text-2xl font-bold text-teal-700">{evidence.mobile_money_stats.unique_payers}</p>
                          <p className="text-gray-500 text-xs">Unique Payers</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-teal-100">
                          <p className="text-2xl font-bold text-teal-700">{evidence.mobile_money_stats.date_range_months}</p>
                          <p className="text-gray-500 text-xs">Months of History</p>
                        </div>
                        {evidence.mobile_money_stats.cross_ref_matches > 0 && (
                          <div className="bg-green-50 rounded-xl p-3 border border-green-200 col-span-2">
                            <p className="text-green-700 font-bold text-sm">
                              🔗 {evidence.mobile_money_stats.cross_ref_matches} payer(s) also confirmed as references
                            </p>
                            <p className="text-green-600 text-xs">Strongest possible verification signal</p>
                          </div>
                        )}
                      </>
                    )}
                    {evidence.photos?.length > 0 && (
                      <div className="bg-white rounded-xl p-3 border border-teal-100">
                        <p className="text-2xl font-bold text-teal-700">{evidence.photos.length}</p>
                        <p className="text-gray-500 text-xs">Work Photos</p>
                      </div>
                    )}
                    {evidence.videos?.length > 0 && (
                      <div className="bg-white rounded-xl p-3 border border-teal-100">
                        <p className="text-2xl font-bold text-teal-700">{evidence.videos.length}</p>
                        <p className="text-gray-500 text-xs">Video References</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Document generation */}
              {!docResult ? (
                <div className="card">
                  <h3 className="font-bold mb-2">📄 Generate Identity Document</h3>
                  <p className="text-gray-600 text-sm mb-4">Create a shareable PDF with your score, badge, and QR code. Employers can verify it without logging in.</p>
                  <button onClick={handleGenerateDoc} disabled={genDoc} className="btn-primary">
                    {genDoc ? '⏳ Generating...' : '📄 Generate PDF'}
                  </button>
                </div>
              ) : (
                <div className="card bg-green-50 border-green-200">
                  <h3 className="font-bold text-green-800 mb-2">✅ Document Ready!</h3>
                  <p className="text-gray-600 text-sm mb-1">Share this link:</p>
                  <p className="font-mono text-primary text-sm mb-3 break-all">{docResult.verifyUrl}</p>
                  <div className="flex gap-3 flex-wrap">
                    <a href={`${process.env.REACT_APP_API_URL}${docResult.pdfUrl}`} download className="btn-primary text-sm py-2 px-4">
                      ⬇️ Download PDF
                    </a>
                    <button
                      onClick={() => { navigator.clipboard.writeText(docResult.verifyUrl); toast.success('Link copied!'); }}
                      className="btn-outline text-sm py-2 px-4"
                    >
                      📋 Copy Link
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
