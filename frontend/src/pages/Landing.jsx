import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const STEPS = [
  { icon: '🎤', title: 'Record Your Story', desc: 'Record a 2-minute voice note on any phone. AI transcribes it and extracts your skills, job title, and years of experience.' },
  { icon: '📱', title: 'Verify Your References', desc: 'Add up to 5 past employer phone numbers. Twilio Lookup checks every number for VoIP fraud before sending a confirmation SMS.' },
  { icon: '🧠', title: 'AI Fraud Analysis', desc: 'AI scores reference answers for consistency. Reply speed, number clusters, and copy-paste patterns are all checked automatically.' },
  { icon: '🪪', title: 'Verify Your Identity', desc: 'Optional: verify your government ID and selfie via Didit. Face match + liveness detection + duplicate detection. Takes 60 seconds.' },
  { icon: '💎', title: 'Upload Work Evidence', desc: 'Upload mobile money payment records, work photos, or a video reference. Cross-reference matching links payers to confirmed references.' },
];

const LAYERS = [
  { icon: '📱', num: 1, name: 'Phone Intelligence',       tech: 'Twilio Lookup',          desc: 'Checks every reference number for VoIP, virtual, or SIM-farm numbers before sending a single SMS.' },
  { icon: '⏱️', num: 2, name: 'Reply Speed Analysis',     tech: 'Custom timing logic',    desc: 'Real employers take minutes to reply. Pre-arranged references reply in seconds. Two fast replies = fraud flag.' },
  { icon: '🔢', num: 3, name: 'Number Cluster Detection', tech: 'Pattern matching',        desc: 'Detects when multiple reference numbers share the same prefix — the pattern of SIM-farm fraud.' },
  { icon: '🪪', num: 4, name: 'Government ID Verification', tech: 'Didit API',             desc: 'Face match + liveness + document tampering check + duplicate detection. One ID = one account.' },
  { icon: '🧠', num: 5, name: 'AI Consistency Scoring',   tech: 'llama3.3-70b-instruct',  desc: 'Compares every reference answer against the worker\'s story. Coached or copy-paste replies score near zero.' },
  { icon: '🏆', num: 6, name: 'Reputation Over Time',     tech: 'Score history',          desc: 'All fraud flags shown openly to verifiers. Profile age and repeat views build trust over long-term use.' },
  { icon: '💎', num: 7, name: 'Work Evidence',            tech: 'Gradient AI + pdf-parse', desc: 'Mobile money records, work photos, video references. Cross-reference matches are near-impossible to fake.' },
];

const BADGES = [
  { icon: '💎', label: 'WORK EVIDENCED', color: 'bg-sky-700', desc: 'ID verified + work evidence uploaded + zero fraud flags. Score cap: 100%.' },
  { icon: '✅', label: 'FULLY VERIFIED',  color: 'bg-emerald-600', desc: 'ID verified + zero fraud flags, no evidence yet. Score cap: 85%.' },
  { icon: '✅', label: 'IDENTITY VERIFIED', color: 'bg-blue-600', desc: 'ID verified but some fraud flags present. Score cap: 85%.' },
  { icon: '🔵', label: 'SELF REPORTED',  color: 'bg-gray-500',  desc: 'No ID, zero fraud flags. Score cap: 75%.' },
  { icon: '⚠️', label: 'FLAGGED',        color: 'bg-amber-500',  desc: 'More than 2 fraud signals detected. Score cap: 40%.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── HERO ── */}
      <section className="pt-28 pb-20 bg-gradient-to-b from-blue-50 to-white text-center px-4">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block text-xs font-semibold text-primary bg-blue-100 px-3 py-1 rounded-full mb-4 tracking-wide uppercase">
            DigitalOcean Gradient™ AI Hackathon
          </span>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Work Identity That<br />
            <span className="text-primary">Cannot Be Faked.</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            AI-powered verified work identity for informal workers. Voice-to-profile in minutes.
            7 independent fraud prevention layers. Shareable PDF with QR code.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary text-lg px-10 py-4 shadow-lg hover:shadow-xl transition-shadow">
              Build My Profile — Free
            </Link>
            <Link to="/login" className="btn-outline text-lg px-10 py-4">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-10 bg-primary text-white">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center px-4">
          {[
            { num: '1.6B', label: 'Informal workers worldwide' },
            { num: '7',    label: 'Fraud prevention layers' },
            { num: '7',    label: 'AI-powered features' },
            { num: '100%', label: 'Max score for Work Evidenced' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-4xl font-extrabold">{s.num}</p>
              <p className="text-blue-200 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-3">How Credara Works</h2>
          <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
            From voice note to shareable verified identity document — no app download required.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <div key={i} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{step.icon}</span>
                  <div>
                    <span className="text-xs font-bold text-primary uppercase tracking-wide">Step {i + 1}</span>
                    <h3 className="font-bold text-gray-900 text-base">{step.title}</h3>
                  </div>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
            {/* Result card */}
            <div className="card bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200 hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">📄</span>
                <div>
                  <span className="text-xs font-bold text-teal-700 uppercase tracking-wide">Result</span>
                  <h3 className="font-bold text-gray-900 text-base">Shareable Verified Profile</h3>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                A branded PDF with your verification score, badge, skills, AI-generated profile text, QR code,
                and a shareable link. Employers verify you in 30 seconds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7 FRAUD LAYERS ── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-3">
            7 Independent Fraud Prevention Layers
          </h2>
          <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">
            Each layer catches a different attack vector. Most work identity systems have zero fraud detection. Credara has seven.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {LAYERS.map(layer => (
              <div key={layer.num} className="card flex gap-4 hover:shadow-md transition-shadow">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl">
                  {layer.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-primary">Layer {layer.num}</span>
                    <span className="text-xs text-gray-400">· {layer.tech}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{layer.name}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{layer.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BADGE TIERS ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-3">Verification Badges</h2>
          <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
            Five badge tiers reflect how much a worker has verified. Employers see exactly what was checked.
          </p>
          <div className="flex flex-col gap-3">
            {BADGES.map(badge => (
              <div key={badge.label} className="card flex items-center gap-4 hover:shadow-md transition-shadow">
                <span className={`flex-shrink-0 text-white text-xs font-bold px-3 py-1.5 rounded-lg ${badge.color}`}>
                  {badge.icon} {badge.label}
                </span>
                <p className="text-gray-600 text-sm">{badge.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REAL STORIES ── */}
      <section className="py-20 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">Real Workers. Real Impact.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { name: 'Amara', role: 'Domestic Worker · Lagos', score: '94%', badge: '💎 WORK EVIDENCED', story: 'Three employers confirmed her work. She uploaded M-Pesa records from 8 clients. Found her next job in 3 days instead of 3 weeks.' },
              { name: 'Raj',   role: 'Tiler · Mumbai',          score: '87%', badge: '✅ FULLY VERIFIED',  story: 'Contractor scanned his QR code. 4 confirmed references, ID verified, 6 work photos. Hired the same day in 40 seconds.' },
              { name: 'Maria', role: 'Home Cook · Nairobi',      score: '96%', badge: '💎 WORK EVIDENCED', story: 'Mobile money records showed 23 unique clients over 18 months. 6 cross-reference matches. Corporate office hired her on the spot.' },
            ].map(s => (
              <div key={s.name} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <p className="font-extrabold text-gray-900 text-lg">{s.name}</p>
                    <p className="text-gray-500 text-xs">{s.role}</p>
                  </div>
                  <p className="text-3xl font-extrabold text-primary">{s.score}</p>
                </div>
                <span className="text-xs font-semibold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">{s.badge}</span>
                <p className="text-gray-600 text-sm mt-3 leading-relaxed">{s.story}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FOOTER ── */}
      <section className="py-20 px-4 bg-primary text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold mb-4">Your Work Deserves to Be Believed.</h2>
          <p className="text-blue-200 mb-8 text-lg">
            1.6 billion informal workers. Zero way to prove their experience. Credara changes that.
          </p>
          <Link to="/register" className="inline-block bg-white text-primary font-bold text-lg px-10 py-4 rounded-xl hover:bg-blue-50 transition-colors shadow-lg">
            Build My Free Profile →
          </Link>
          <p className="text-blue-300 text-sm mt-6">No app download. Works on any phone. Takes under 5 minutes.</p>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 text-sm py-6 text-center">
        <p>Credara v3 — DigitalOcean Gradient™ AI Hackathon · MIT License</p>
      </footer>
    </div>
  );
}
