import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Landing    from './pages/Landing';
import Register   from './pages/Register';
import Login      from './pages/Login';
import Dashboard  from './pages/Dashboard';
import Verify     from './pages/Verify';
import NotFound   from './pages/NotFound';

// Onboarding
import VoiceRecord    from './pages/onboarding/VoiceRecord';
import SkillReview    from './pages/onboarding/SkillReview';
import References     from './pages/onboarding/References';
import EvidenceUpload from './pages/onboarding/EvidenceUpload';
import Complete       from './pages/onboarding/Complete';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"              element={<Landing />} />
          <Route path="/register"      element={<Register />} />
          <Route path="/login"         element={<Login />} />
          <Route path="/verify/:link"  element={<Verify />} />

          {/* Protected — onboarding flow */}
          <Route path="/onboarding/voice"    element={<ProtectedRoute><VoiceRecord /></ProtectedRoute>} />
          <Route path="/onboarding/skills"   element={<ProtectedRoute><SkillReview /></ProtectedRoute>} />
          <Route path="/onboarding/references" element={<ProtectedRoute><References /></ProtectedRoute>} />
          <Route path="/onboarding/evidence" element={<ProtectedRoute><EvidenceUpload /></ProtectedRoute>} />
          <Route path="/onboarding/complete" element={<ProtectedRoute><Complete /></ProtectedRoute>} />

          {/* Protected — dashboard */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} />
    </AuthProvider>
  );
}
