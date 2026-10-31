import React from 'react';

export function StatusBadge({ status, type = 'phase', className = '' }) {
  const normStatus = (status || '').toLowerCase();

  const configs = {
    // Event phase or status
    upcoming: {
      label: 'Upcoming',
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    },
    ongoing: {
      label: 'Live Now',
      bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse'
    },
    completed: {
      label: 'Completed',
      bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    },
    published: {
      label: 'Published',
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    },
    // Registration statuses
    confirmed: {
      label: 'Confirmed',
      bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
    },
    waitlisted: {
      label: 'Waitlisted',
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    },
    cancelled: {
      label: 'Cancelled',
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    },
    attended: {
      label: 'Attended',
      bg: 'bg-teal-500/10 text-teal-400 border-teal-500/20'
    },
    // User Roles
    admin: {
      label: 'Admin',
      bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    },
    organizer: {
      label: 'Organizer',
      bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    },
    attendee: {
      label: 'Attendee',
      bg: 'bg-slate-500/10 text-slate-300 border-slate-500/20'
    }
  };

  const config = configs[normStatus] || {
    label: status,
    bg: 'bg-slate-800 text-slate-300 border-slate-700'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75"></span>
      {config.label}
    </span>
  );
}
