import React from 'react';

const STEPS = ['Voice', 'Skills', 'References', 'Evidence', 'Complete'];

export default function ProgressBar({ current }) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        {/* Line behind */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
        <div
          className="absolute top-4 left-0 h-0.5 bg-primary z-0 transition-all duration-500"
          style={{ width: `${((current - 1) / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((label, i) => {
          const step = i + 1;
          const done    = step < current;
          const active  = step === current;
          return (
            <div key={label} className="flex flex-col items-center z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300
                ${done   ? 'bg-primary border-primary text-white'   : ''}
                ${active ? 'bg-white border-primary text-primary'   : ''}
                ${!done && !active ? 'bg-white border-gray-300 text-gray-400' : ''}`}>
                {done ? '✓' : step}
              </div>
              <span className={`mt-1 text-xs font-medium hidden sm:block
                ${active ? 'text-primary' : done ? 'text-gray-500' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-center text-sm text-gray-500 mt-4">Step {current} of {STEPS.length} — {STEPS[current - 1]}</p>
    </div>
  );
}
