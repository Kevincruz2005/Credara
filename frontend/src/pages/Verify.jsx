import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import BadgeDisplay from '../components/BadgeDisplay';
import FraudWarning from '../components/FraudWarning';
import CrossRefBadge from '../components/CrossRefBadge';
import { verifyProfile } from '../services/api';

export default function Verify() {
  const { link } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [link]);

  const loadProfile = async () => {
    try {
      const res = await verifyProfile(link);
      setData(res.data.data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const score = data?.consistencyScore || 0;
  const scoreColor = score >= 80 ? '#059669' : score >= 50 ? '#D97706' : '#DC2626';

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Verifying profile...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center text-center px-4">
        <p className="text-5xl mb-4">🔍</p>
        <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
        <p className="text-gray-500 text-sm">This link may be invalid or the profile has been removed.</p>
      </div>
    );
  }

  const ev = data.work_evidence_summary;

  return (
    <div className="min-h-screen bg-white">
      {/* Header bar */}
      <div className="bg-primary py-4 px-4 text-center">
        <p className="text-white font-bold text-xl">CREDARA</p>
        <p className="text-blue-200 text-xs">Your Work. Verified.</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* Fraud warning — shown to verifiers */}
        <FraudWarning flags={data.fraud_flags} />

        {/* Main profile card */}
        <div className="card text-center">
          <div className="flex justify-center mb-2">
            <BadgeDisplay level={data.badge_level} large={true} />
          </div>
          <h1 className="text-3xl font-extrabold mt-3 mb-1">{data.name}</h1>
          <p className="text-gray-500 font-medium">{data.jobTitle} · {data.yearsExperience} yrs experience</p>
          <div className="mt-4 flex justify-center">
            <div className="text-6xl font-extrabold" style={{ color: scoreColor }}>{score}%</div>
          </div>
          <p className="text-gray-500 text-sm mt-1">Verification Score</p>

          {data.id_verified && (
            <div className="mt-3 inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
              🪪 Government ID Verified
            </div>
          )}
        </div>

        {/* Profile text */}
        {data.profileText && (
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-2">Professional Profile</h3>
            <p className="text-gray-700 text-sm leading-relaxed">{data.profileText}</p>
          </div>
        )}

        {/* Skills */}
        {data.skills?.length > 0 && (
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-3">Verified Skills</h3>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((s, i) => (
                <span key={i} className="bg-blue-50 text-primary text-sm px-3 py-1 rounded-full font-medium">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* References */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-2">References</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-3xl font-extrabold text-primary">{data.confirmedReferences}</p>
              <p className="text-gray-500 text-xs">Confirmed</p>
            </div>
            {data.averageRating && (
              <div className="text-center">
                <p className="text-3xl font-extrabold text-primary">⭐ {data.averageRating}</p>
                <p className="text-gray-500 text-xs">Avg Rating</p>
              </div>
            )}
          </div>
        </div>

        {/* Work Evidence */}
        {ev?.has_evidence && (
          <div className="card bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200">
            <h3 className="font-bold text-teal-800 mb-3">💎 Work Evidence</h3>
            <div className="space-y-2">
              {ev.unique_payers > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-teal-600">📊</span>
                  <span className="text-gray-700">
                    <strong>{ev.unique_payers}</strong> unique clients paid via {ev.statement_type || 'mobile money'} over{' '}
                    <strong>{ev.date_range_months}</strong> months
                  </span>
                </div>
              )}
              {ev.cross_ref_matches > 0 && (
                <div className="mt-2">
                  <CrossRefBadge count={ev.cross_ref_matches} />
                </div>
              )}
              {ev.photos?.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-2">📸 Work Photos ({ev.photos.length})</p>
                  <div className="flex gap-2 flex-wrap">
                    {ev.photos.slice(0, 5).map((url, i) => (
                      <img
                        key={i} src={`${process.env.REACT_APP_API_URL}${url}`} alt={`Work ${i + 1}`}
                        className="w-20 h-20 object-cover rounded-xl border border-teal-200"
                      />
                    ))}
                  </div>
                </div>
              )}
              {ev.video_url && (
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-2">🎬 Video Reference</p>
                  <video
                    src={`${process.env.REACT_APP_API_URL}${ev.video_url}`}
                    controls className="w-full max-w-xs rounded-xl border border-teal-200"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Account age */}
        <div className="card flex items-center justify-between text-sm">
          <span className="text-gray-500">Account age</span>
          <span className="font-semibold text-gray-800">{data.accountAge} days</span>
        </div>

        {/* Disclaimer — required on every verify page */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs text-gray-500">
          <p className="font-semibold text-gray-700 mb-1">⚠️ Disclaimer</p>
          <p>
            This profile was generated by Credara, an AI-assisted verification platform. Credara does not guarantee
            employment suitability or character. Verification scores reflect data provided by the worker and their
            references. Employers should perform their own due diligence. Fraud flags, where present, are shared
            transparently for informed decision-making.
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 pb-4">credara.app · Verified at {new Date(data.verifiedAt).toLocaleDateString()}</p>
      </div>
    </div>
  );
}
