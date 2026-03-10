import React from 'react';

export default function FraudWarning({ flags }) {
  if (!flags || flags.length === 0) return null;
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
      <p className="font-bold text-yellow-800 flex items-center gap-2">⚠️ Fraud Signals Detected</p>
      <p className="text-yellow-700 text-sm mt-1">
        This profile has fraud signals. Verify independently before making decisions.
      </p>
      <ul className="mt-2 space-y-1">
        {flags.map((f) => (
          <li key={f} className="text-yellow-700 text-xs bg-yellow-100 px-2 py-1 rounded">
            {f.replace(/_/g, ' ')}
          </li>
        ))}
      </ul>
    </div>
  );
}
