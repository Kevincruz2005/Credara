import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../../components/Navbar';
import ProgressBar from '../../components/ProgressBar';
import LoadingSpinner from '../../components/LoadingSpinner';
import BadgeDisplay from '../../components/BadgeDisplay';
import { generateProfile, generateDocument } from '../../services/api';

export default function Complete() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const profileId = state?.profileId;
  const answers   = state?.answers || [];

  const [phase, setPhase] = useState('generating'); // generating | done | error
  const [result, setResult] = useState(null);
  const [genDoc, setGenDoc] = useState(false);
  const [docResult, setDocResult] = useState(null);

  useEffect(() => {
    if (!profileId) { navigate('/onboarding/voice'); return; }
    generateAll();
  }, []);

  const generateAll = async () => {
    try {
      setPhase('generating');
      const res = await generateProfile(profileId, answers);
      setResult(res.data.data);
      setPhase('done');
      toast.success('🎉 Your Credara profile is ready!');
    } catch {
      toast.error('Profile generation failed. Try again.');
      setPhase('error');
    }
  };

  const handleGenerateDocument = async () => {
    setGenDoc(true);
    try {
      const res = await generateDocument(profileId);
      setDocResult(res.data.data);
      toast.success('📄 PDF identity document generated!');
    } catch {
      toast.error('PDF generation failed.');
    } finally {
      setGenDoc(false);
    }
  };

  const score = result?.consistencyScore || 0;
  const scoreColor = score >= 80 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-500';

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <div className="pt-20 max-w-2xl mx-auto px-4 pb-16">
        <ProgressBar current={5} />

        {phase === 'generating' && (
          <div className="card mt-4 flex flex-col items-center py-16 gap-4">
            <LoadingSpinner size="lg" />
            <p className="text-primary font-semibold">AI is writing your professional profile...</p>
            <p className="text-gray-500 text-sm">This takes about 10-20 seconds</p>
          </div>
        )}

        {phase === 'error' && (
          <div className="card mt-4 text-center py-12">
            <p className="text-red-500 font-semibold mb-4">Generation failed. Please try again.</p>
            <button onClick={generateAll} className="btn-primary">Retry</button>
          </div>
        )}

        {phase === 'done' && result && (
          <div className="space-y-4 mt-4">
            {/* Score Hero */}
            <div className="card text-center py-10">
              <h2 className="text-3xl font-extrabold mb-2">🎉 Profile Complete!</h2>
              <div className={`text-7xl font-extrabold mb-2 ${scoreColor}`}>{score}%</div>
              <p className="text-gray-500 text-sm mb-4">Verification Score</p>

              {result.fraudFlags && result.fraudFlags.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 text-left">
                  <p className="text-yellow-800 font-semibold text-sm">⚠️ {result.fraudFlags.length} fraud signal(s) detected</p>
                  <ul className="mt-1 space-y-0.5">
                    {result.fraudFlags.map(f => (
                      <li key={f} className="text-yellow-700 text-xs bg-yellow-100 px-2 py-0.5 rounded">{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Profile Text */}
              {result.profileText && (
                <div className="text-left bg-gray-50 border border-gray-200 rounded-xl p-4 mt-2">
                  <p className="text-sm text-gray-700 leading-relaxed">{result.profileText}</p>
                </div>
              )}
            </div>

            {/* Generate PDF */}
            {!docResult ? (
              <div className="card">
                <h3 className="text-lg font-bold mb-2">📄 Generate Your Identity Document</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Create a shareable, verifiable PDF with your score, badge, and QR code.
                </p>
                <button onClick={handleGenerateDocument} disabled={genDoc} className="btn-primary w-full">
                  {genDoc ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" /> Generating PDF...</span> : '📄 Generate PDF'}
                </button>
              </div>
            ) : (
              <div className="card bg-green-50 border-green-200">
                <h3 className="text-lg font-bold text-green-800 mb-2">✅ Document Ready!</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Share this link with employers:
                  <br />
                  <a
                    href={docResult.verifyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary font-semibold underline text-sm"
                  >
                    {docResult.verifyUrl}
                  </a>
                </p>
                <div className="flex gap-3 flex-wrap">
                  <a
                    href={`${process.env.REACT_APP_API_URL}${docResult.pdfUrl}`}
                    download
                    className="btn-primary text-sm py-2 px-4"
                  >
                    ⬇️ Download PDF
                  </a>
                  <button
                    onClick={() => { navigator.clipboard.writeText(docResult.verifyUrl); toast.success('Link copied!'); }}
                    className="btn-outline text-sm py-2 px-4"
                  >
                    📋 Copy Link
                  </button>
                  <button onClick={() => navigate('/dashboard')} className="btn-gray text-sm py-2 px-4">
                    Dashboard →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
