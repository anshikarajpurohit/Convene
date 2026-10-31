import React from 'react';
import { X, QrCode, Download } from 'lucide-react';

export function QrModal({ isOpen, onClose, qrDataUrl, registration }) {
  if (!isOpen || !registration) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
          <QrCode className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold text-white tracking-tight">Check-in Pass</h3>
        <p className="mt-1 text-xs text-slate-400 line-clamp-1">{registration.event?.title}</p>

        {/* QR Code Container */}
        <div className="my-6 p-4 bg-white rounded-2xl inline-block shadow-lg mx-auto">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Check-in QR Code" className="w-56 h-56 object-contain mx-auto" />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-slate-800 text-xs">
              Generating QR...
            </div>
          )}
        </div>

        <div className="text-xs text-slate-400 space-y-1">
          <div>
            Pass Holder: <strong className="text-slate-200">{registration.user?.name || 'Attendee'}</strong>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Ticket ID: {registration._id}
          </div>
        </div>

        <p className="mt-4 text-[11px] text-indigo-400 font-medium">
          Show this QR code to the event organizer at the entrance for quick check-in.
        </p>
      </div>
    </div>
  );
}
