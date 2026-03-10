import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('credara_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---- Auth ----
export const register = (data) => api.post('/api/auth/register', data);
export const login    = (data) => api.post('/api/auth/login', data);

// ---- Voice ----
export const transcribeAudio = (formData) =>
  api.post('/api/voice/transcribe', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const transcribeText = (text) =>
  api.post('/api/voice/transcribe', { text });

// ---- AI ----
export const extractSkills      = (transcript) => api.post('/api/ai/extract-skills', { transcript });
export const getFollowupQuestions = (profileId) => api.post('/api/ai/followup-questions', { profileId });
export const generateProfile    = (profileId, answers) => api.post('/api/ai/generate-profile', { profileId, answers });

// ---- References ----
export const sendReferences    = (profileId, phones) => api.post('/api/references/send', { profileId, phones });
export const getRefStatus      = (profileId) => api.get(`/api/references/status/${profileId}`);

// ---- Evidence ----
export const uploadStatement = (formData) =>
  api.post('/api/evidence/upload-statement', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const uploadPhotos = (formData) =>
  api.post('/api/evidence/upload-photos', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const uploadVideo = (formData) =>
  api.post('/api/evidence/upload-video', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getEvidenceSummary = (profileId) => api.get(`/api/evidence/summary/${profileId}`);

// ---- Fraud ----
export const startIdVerify = () => api.post('/api/fraud/start-id-verify', {});

// ---- Documents ----
export const generateDocument = (profileId) => api.post('/api/documents/generate', { profileId });
export const downloadDocument = (profileId) => api.get(`/api/documents/download/${profileId}`, { responseType: 'blob' });

// ---- Verify (public) ----
export const verifyProfile = (shareLink) => axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/verify/${shareLink}`);

export default api;
