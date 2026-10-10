import React from 'react';
import { ShieldCheck, AlertTriangle, HelpCircle } from 'lucide-react';

export const StatusBadge = ({ prediction }) => {
  if (prediction === 'LIKELY_REAL') {
    return (
      <span className="badge badge-real">
        <ShieldCheck size={14} />
        Likely Real
      </span>
    );
  }

  if (prediction === 'AI_GENERATED') {
    return (
      <span className="badge badge-fake">
        <AlertTriangle size={14} />
        AI-Generated
      </span>
    );
  }

  return (
    <span className="badge badge-inconclusive">
      <HelpCircle size={14} />
      Inconclusive
    </span>
  );
};
