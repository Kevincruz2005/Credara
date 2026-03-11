import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../../components/Navbar';
import ProgressBar from '../../components/ProgressBar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { transcribeAudio, transcribeText, extractSkills } from '../../services/api';

export default function VoiceRecord() {
  const navigate = useNavigate();
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  const [phase, setPhase] = useState('idle'); // idle | recording | transcribing | extracting | done
  const [transcript, setTranscript] = useState('');
  const [profileId, setProfileId] = useState(null);
  const [textMode, setTextMode] = useState(false);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;

      recorder.ondataavailable = (e) => audioChunks.current.push(e.data);
      recorder.onstop = handleRecordingStop;

      recorder.start();
      setPhase('recording');
      toast.info('Recording… speak about your work experience');
    } catch {
      toast.error('Microphone access denied. Use text mode instead.');
      setTextMode(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.stop();
      setPhase('transcribing');
    }
  };

  const handleRecordingStop = async () => {
    try {
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const res = await transcribeAudio(formData);
      const text = res.data.data.transcript;
      setTranscript(text);
      await runExtraction(text);
    } catch (err) {
      toast.error('Transcription failed. Try text mode.');
      setPhase('idle');
    }
  };

  const handleTextSubmit = async () => {
    if (!transcript.trim()) return toast.error('Please describe your work experience');
    setPhase('extracting');
    await runExtraction(transcript);
  };

  const runExtraction = async (text) => {
    setPhase('extracting');
    try {
      const res = await extractSkills(text);
      const { profileId: pid } = res.data.data;
      setProfileId(pid);
      setPhase('done');
      toast.success('Skills extracted!');
      setTimeout(() => navigate('/onboarding/skills', { state: { profileId: pid } }), 1000);
    } catch {
      toast.error('Skill extraction failed. Please try again.');
      setPhase('idle');
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <div className="pt-20 max-w-2xl mx-auto px-4 pb-16">
        <ProgressBar current={1} />
        <div className="card mt-4">
          <h2 className="text-2xl font-bold mb-2">Tell Us About Your Work</h2>
          <p className="text-gray-600 text-sm mb-6">
            Record a voice note or type below. Describe what you do, how long you've worked, and your main skills.
          </p>

          {!textMode ? (
            <div className="space-y-4">
              <div className={`flex items-center justify-center w-full h-40 rounded-2xl border-2 border-dashed transition-all
                ${phase === 'recording' ? 'border-red-400 bg-red-50 animate-pulse' : 'border-gray-300 bg-gray-50'}`}>
                {phase === 'idle' && <p className="text-gray-500 text-sm">Press 🎤 to start recording</p>}
                {phase === 'recording' && <p className="text-red-500 font-semibold text-sm">🔴 Recording… Press Stop when done</p>}
                {(phase === 'transcribing' || phase === 'extracting') && (
                  <div className="flex flex-col items-center gap-3">
                    <LoadingSpinner />
                    <p className="text-primary text-sm">{phase === 'transcribing' ? 'Transcribing audio...' : 'Extracting skills with AI...'}</p>
                  </div>
                )}
                {phase === 'done' && <p className="text-success font-semibold">✓ Done! Redirecting...</p>}
              </div>

              <div className="flex gap-3">
                {phase === 'idle' && (
                  <button onClick={startRecording} className="btn-primary flex-1">🎤 Start Recording</button>
                )}
                {phase === 'recording' && (
                  <button onClick={stopRecording} className="bg-red-500 text-white font-semibold px-6 py-3 rounded-xl hover:bg-red-600 transition flex-1">
                    ⏹ Stop Recording
                  </button>
                )}
              </div>

              <button onClick={() => setTextMode(true)} className="text-sm text-gray-500 underline w-full text-center">
                Prefer to type instead?
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <textarea
                className="input-field h-40 resize-none"
                placeholder="E.g. I am a tailor with 8 years experience. I make and repair clothes for families in my area. I'm good at measuring, cutting, and sewing all types of fabric..."
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                disabled={phase === 'extracting' || phase === 'done'}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleTextSubmit}
                  disabled={phase === 'extracting' || phase === 'done'}
                  className="btn-primary flex-1"
                >
                  {phase === 'extracting' ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" /> Extracting...</span> : '→ Extract My Skills'}
                </button>
                <button onClick={() => setTextMode(false)} className="btn-gray">Use Voice</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
