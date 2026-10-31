import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Calendar, ArrowRight } from 'lucide-react';

export function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>The Next-Generation Workshop & Seminar Platform</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
          Elevate Your Learning with{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
            Convene
          </span>
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
          Discover cutting-edge workshops, register with intelligent waitlists, seamless QR check-in, and instant verified certificates of participation.
        </p>
      </div>
      <div id="events-container">
        {/* Event cards and filters will be loaded here in Phase 2 */}
      </div>
    </div>
  );
}
