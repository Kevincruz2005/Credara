import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../../components/Navbar';
import ProgressBar from '../../components/ProgressBar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getFollowupQuestions } from '../../services/api';

export default function SkillReview() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const profileId = state?.profileId;

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loadingQ, setLoadingQ] = useState(true);
  const [proceeding, setProceeding] = useState(false);

  useEffect(() => {
    if (!profileId) {
      toast.error('No profile found. Start from voice recording.');
      navigate('/onboarding/voice');
      return;
    }
    loadQuestions();
  }, [profileId]);

  const loadQuestions = async () => {
    try {
      const res = await getFollowupQuestions(profileId);
      setQuestions(res.data.data.questions || []);
    } catch {
      toast.error('Could not load questions. Skipping.');
      setQuestions([]);
    } finally {
      setLoadingQ(false);
    }
  };

  const handleContinue = async () => {
    setProceeding(true);
    const answersArray = questions.map((q, i) => ({ question: q, answer: answers[i] || '' }));
    navigate('/onboarding/references', { state: { profileId, answers: answersArray } });
  };

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <div className="pt-20 max-w-2xl mx-auto px-4 pb-16">
        <ProgressBar current={2} />
        <div className="card mt-4">
          <h2 className="text-2xl font-bold mb-2">Your Skills & Story</h2>
          <p className="text-gray-600 text-sm mb-6">
            AI has generated questions based on your skills. Answer them to strengthen your verification score.
          </p>

          {loadingQ ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <LoadingSpinner />
              <p className="text-gray-500 text-sm">Generating smart questions with AI...</p>
            </div>
          ) : (
            <div className="space-y-5">
              {questions.length === 0 && (
                <p className="text-gray-500 text-sm italic">No questions generated. You can continue.</p>
              )}
              {questions.map((q, i) => (
                <div key={i}>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Q{i + 1}: {q}
                  </label>
                  <textarea
                    className="input-field h-24 resize-none text-sm"
                    placeholder="Your answer..."
                    value={answers[i] || ''}
                    onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                  />
                </div>
              ))}

              <button
                onClick={handleContinue}
                disabled={proceeding}
                className="btn-primary w-full mt-4"
              >
                {proceeding ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" /> Saving...</span> : '→ Continue to References'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
