import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../../components/Navbar';
import ProgressBar from '../../components/ProgressBar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { uploadStatement, uploadPhotos, uploadVideo } from '../../services/api';

export default function EvidenceUpload() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const profileId = state?.profileId;
  const answers   = state?.answers || [];

  const [statementFile, setStatementFile] = useState(null);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [uploadingStatement, setUploadingStatement] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [results, setResults] = useState({});

  const handleStatementUpload = async () => {
    if (!statementFile) return toast.error('Select a PDF file first');
    setUploadingStatement(true);
    try {
      const fd = new FormData();
      fd.append('statement', statementFile);
      fd.append('profileId', profileId);
      const res = await uploadStatement(fd);
      const d = res.data.data;
      setResults(r => ({ ...r, statement: d }));
      toast.success(`📊 ${d.unique_payers} unique payers found! ${d.cross_ref_matches > 0 ? `🔗 ${d.cross_ref_matches} cross-matched with refs!` : ''}`);
    } catch {
      toast.error('Statement parsing failed. Check the file is a valid mobile money PDF.');
    } finally {
      setUploadingStatement(false);
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoFiles.length) return toast.error('Select at least one photo');
    setUploadingPhotos(true);
    try {
      const fd = new FormData();
      photoFiles.forEach(f => fd.append('photos', f));
      fd.append('profileId', profileId);
      const res = await uploadPhotos(fd);
      const d = res.data.data;
      setResults(r => ({ ...r, photos: d }));
      toast.success(`📸 ${d.photos_saved} work photo(s) verified! ${d.photos_flagged > 0 ? `(${d.photos_flagged} flagged as inconsistent)` : ''}`);
    } catch {
      toast.error('Photo upload failed.');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleVideoUpload = async () => {
    if (!videoFile) return toast.error('Select a video first');
    setUploadingVideo(true);
    try {
      const fd = new FormData();
      fd.append('video', videoFile);
      fd.append('profileId', profileId);
      const res = await uploadVideo(fd);
      setResults(r => ({ ...r, video: res.data.data }));
      toast.success('🎬 Video reference saved!');
    } catch {
      toast.error('Video upload failed.');
    } finally {
      setUploadingVideo(false);
    }
  };

  const hasAnyEvidence = results.statement || results.photos || results.video;

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <div className="pt-20 max-w-2xl mx-auto px-4 pb-16">
        <ProgressBar current={4} />

        <div className="card mt-4 mb-4 bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
          <h2 className="text-2xl font-bold mb-1">💎 Add Work Evidence</h2>
          <p className="text-gray-600 text-sm">
            <strong>Optional but powerful.</strong> Evidence unlocks the Work Evidenced badge and raises your score cap to 100%.
          </p>
        </div>

        {/* Mobile Money Statement */}
        <div className="card mb-4">
          <h3 className="text-lg font-bold mb-1">1. Mobile Money Statement (PDF)</h3>
          <p className="text-gray-500 text-xs mb-3">M-Pesa, UPI, MTN MoMo, PIX, OPay — any PDF statement showing income payments</p>
          {results.statement ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm">
              ✅ <strong>{results.statement.unique_payers} unique payers</strong> over {results.statement.date_range_months} months
              {results.statement.cross_ref_matches > 0 && (
                <span className="ml-2 text-green-700 font-bold">🔗 {results.statement.cross_ref_matches} cross-verified!</span>
              )}
              <div className="text-xs text-green-600 mt-1">Score updated: {results.statement.new_score}%</div>
            </div>
          ) : (
            <div className="flex gap-3 items-center">
              <input
                type="file" accept=".pdf"
                onChange={e => setStatementFile(e.target.files[0])}
                className="text-sm text-gray-600 flex-1 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary file:text-white file:text-sm file:font-medium"
              />
              <button onClick={handleStatementUpload} disabled={uploadingStatement || !statementFile} className="btn-primary text-sm py-2 px-4 whitespace-nowrap">
                {uploadingStatement ? <LoadingSpinner size="sm" /> : 'Upload'}
              </button>
            </div>
          )}
        </div>

        {/* Work Photos */}
        <div className="card mb-4">
          <h3 className="text-lg font-bold mb-1">2. Work Photos</h3>
          <p className="text-gray-500 text-xs mb-3">Up to 10 photos of you doing your work (job site, tools, products, finished work)</p>
          {results.photos ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm">
              ✅ <strong>{results.photos.photos_saved} photo(s)</strong> verified as consistent with job title
              {results.photos.photos_flagged > 0 && <span className="ml-2 text-yellow-600">({results.photos.photos_flagged} flagged)</span>}
              <div className="text-xs text-green-600 mt-1">Score updated: {results.photos.new_score}%</div>
            </div>
          ) : (
            <div className="flex gap-3 items-center">
              <input
                type="file" accept="image/*" multiple
                onChange={e => setPhotoFiles(Array.from(e.target.files))}
                className="text-sm text-gray-600 flex-1 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary file:text-white file:text-sm file:font-medium"
              />
              <button onClick={handlePhotoUpload} disabled={uploadingPhotos || !photoFiles.length} className="btn-primary text-sm py-2 px-4 whitespace-nowrap">
                {uploadingPhotos ? <LoadingSpinner size="sm" /> : 'Upload'}
              </button>
            </div>
          )}
          {photoFiles.length > 0 && !results.photos && (
            <p className="text-xs text-gray-400 mt-1">{photoFiles.length} file(s) selected</p>
          )}
        </div>

        {/* Video Reference */}
        <div className="card mb-6">
          <h3 className="text-lg font-bold mb-1">3. Video Reference</h3>
          <p className="text-gray-500 text-xs mb-3">A short video of a client or employer speaking about your work</p>
          {results.video ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm">✅ Video reference saved!</div>
          ) : (
            <div className="flex gap-3 items-center">
              <input
                type="file" accept="video/*"
                onChange={e => setVideoFile(e.target.files[0])}
                className="text-sm text-gray-600 flex-1 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary file:text-white file:text-sm file:font-medium"
              />
              <button onClick={handleVideoUpload} disabled={uploadingVideo || !videoFile} className="btn-primary text-sm py-2 px-4 whitespace-nowrap">
                {uploadingVideo ? <LoadingSpinner size="sm" /> : 'Upload'}
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/onboarding/complete', { state: { profileId, answers } })}
            className={hasAnyEvidence ? 'btn-primary flex-1' : 'btn-gray flex-1'}
          >
            {hasAnyEvidence ? '✅ Continue to Complete' : 'Skip Evidence →'}
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center">
          Evidence is never shared without your consent. AI analysis is for scoring only.
        </p>
      </div>
    </div>
  );
}
