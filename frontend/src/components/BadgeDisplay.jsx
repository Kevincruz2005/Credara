import React from 'react';

const BADGE_MAP = {
  WORK_EVIDENCED:    { label: '💎 Work Evidenced',    css: 'badge-diamond' },
  FULLY_VERIFIED:    { label: '✅ Fully Verified',    css: 'badge-verified' },
  IDENTITY_VERIFIED: { label: '✅ Identity Verified', css: 'badge-identity' },
  SELF_REPORTED:     { label: '🔵 Self Reported',     css: 'badge-self' },
  FLAGGED:           { label: '⚠️ Flagged',           css: 'badge-flagged' },
};

export default function BadgeDisplay({ level, large = false }) {
  const badge = BADGE_MAP[level] || BADGE_MAP['SELF_REPORTED'];
  return (
    <span className={`${badge.css} ${large ? 'text-base px-6 py-3' : ''}`}>
      {badge.label}
    </span>
  );
}
