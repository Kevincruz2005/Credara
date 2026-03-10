import React from 'react';

export default function PhoneBadge({ isVoip, lineType }) {
  if (isVoip) {
    return (
      <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full">
        ⚠️ VoIP — {lineType}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
      📱 Mobile
    </span>
  );
}
