import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../../components/Navbar';
import ProgressBar from '../../components/ProgressBar';
import LoadingSpinner from '../../components/LoadingSpinner';
import PhoneBadge from '../../components/PhoneBadge';
import { sendReferences, getRefStatus } from '../../services/api';

export default function References() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const profileId = state?.profileId;
  const answers   = state?.answers || [];

  const [phones, setPhones] = useState(['', '', '']);
  const [sending, setSending] = useState(false);
  const [refs, setRefs] = useState([]);
  const [polling, setPolling] = useState(false);
  const pollInterval = useRef(null);

  useEffect(() => {
    if (!profileId) { navigate('/onboarding/voice'); return; }
    return () => clearInterval(pollInterval.current);
  }, []);

  const handleSend = async () => {
    const validPhones = phones.filter(p => p.trim().length >= 7);
    if (validPhones.length < 1) return toast.error('Enter at least 1 reference phone number');
    setSending(true);
    try {
      const res = await sendReferences(profileId, validPhones);
      setRefs(res.data.data.references);
      toast.success(`📱 SMS sent to ${res.data.data.sent} reference(s)`);
      startPolling();
    } catch {
      toast.error('Failed to send SMS. Check your Twilio config.');
    } finally {
      setSending(false);
    }
  };

  const startPolling = () => {
    setPolling(true);
    pollInterval.current = setInterval(async () => {
      try {
        const res = await getRefStatus(profileId);
        setRefs(res.data.data.references);
        const confirmed = res.data.data.confirmed;
        if (confirmed >= 1) {
          clearInterval(pollInterval.current);
          setPolling(false);
          toast.success(`✅ ${confirmed} reference(s) confirmed!`);
        }
      } catch { /* silently */ }
    }, 10000); // Poll every 10 seconds
  };

  const handleContinue = () => {
    const confirmed = refs.filter(r => r.status === 'confirmed').length;
    if (confirmed === 0) {
      toast.warn('No confirmations yet — you can still continue, but your score will be lower.');
    }
    clearInterval(pollInterval.current);
    navigate('/onboarding/evidence', { state: { profileId, answers } });
  };

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <div className="pt-20 max-w-2xl mx-auto px-4 pb-16">
        <ProgressBar current={3} />
        <div className="card mt-4">
          <h2 className="text-2xl font-bold mb-2">Add Your References</h2>
          <p className="text-gray-600 text-sm mb-6">
            Enter the phone numbers of clients or employers who can confirm your work. They'll receive a short SMS.
          </p>

          {refs.length === 0 ? (
            <div className="space-y-4">
              {phones.map((phone, i) => (
                <div key={i}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reference {i + 1} {i === 0 ? '(required)' : '(optional)'}
                  </label>
                  <input
                    type="tel" className="input-field" placeholder="+1234567890"
                    value={phone}
                    onChange={e => {
                      const updated = [...phones];
                      updated[i] = e.target.value;
                      setPhones(updated);
                    }}
                  />
                </div>
              ))}

              <div className="flex gap-3 mt-6">
                <button onClick={handleSend} disabled={sending} className="btn-primary flex-1">
                  {sending ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" /> Sending...</span> : '📤 Send SMS to References'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700 mb-3">
                {polling && <span className="text-primary">⏳ Waiting for replies (auto-checking every 10s)…</span>}
              </p>

              {refs.map(ref => (
                <div key={ref.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <PhoneBadge isVoip={ref.is_voip} lineType={ref.line_type} />
                    <span className="font-mono text-sm text-gray-700">{ref.phone}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full
                    ${ref.status === 'confirmed' ? 'bg-green-100 text-green-700' : ''}
                    ${ref.status === 'pending'   ? 'bg-yellow-100 text-yellow-700' : ''}
                    ${ref.status === 'declined'  ? 'bg-red-100 text-red-600' : ''}`}>
                    {ref.status.toUpperCase()}
                  </span>
                </div>
              ))}

              <div className="flex gap-3 mt-6">
                <button onClick={handleContinue} className="btn-primary flex-1">
                  → Continue to Evidence (optional)
                </button>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-4 text-center">
            🔐 All phones checked via Twilio for VoIP detection — Layer 1 fraud protection
          </p>
        </div>
      </div>
    </div>
  );
}
