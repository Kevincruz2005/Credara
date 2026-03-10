import React from 'react';

export default function CrossRefBadge({ count }) {
  if (!count || count === 0) return null;
  return (
    <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 font-semibold px-3 py-1.5 rounded-full text-sm">
      <span>🔗</span>
      <span>{count} payer{count > 1 ? 's' : ''} cross-verified with references</span>
    </div>
  );
}
