import React from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from './StatusBadge.jsx';
import { Calendar, MapPin, Video, Users, Star } from 'lucide-react';

export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

export function EventCard({ event }) {
  const backendBase = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000';
  const posterSrc = event.posterUrl ? `${backendBase}${event.posterUrl}` : null;

  return (
    <Link
      to={`/events/${event._id}`}
      className="group flex flex-col bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1"
    >
      {/* Poster / Header Image Container */}
      <div className="relative h-48 w-full bg-slate-950 overflow-hidden flex items-center justify-center">
        {posterSrc ? (
          <img
            src={posterSrc}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-950/60 via-slate-900 to-violet-950/60 flex flex-col items-center justify-center p-4 text-center">
            <span className="text-4xl mb-2">🎓</span>
            <span className="text-xs uppercase tracking-widest font-bold text-indigo-400">
              {event.category}
            </span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <StatusBadge status={event.phase} type="phase" />
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-950/80 backdrop-blur-md text-slate-300 border border-slate-700/60 uppercase">
            {event.category}
          </span>
        </div>

        {/* Mode Badge */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-950/80 backdrop-blur-md text-indigo-300 border border-indigo-500/30">
            {event.mode === 'online' ? (
              <Video className="w-3 h-3" />
            ) : event.mode === 'offline' ? (
              <MapPin className="w-3 h-3" />
            ) : (
              <span className="flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5" />+<Video className="w-2.5 h-2.5" />
              </span>
            )}
            <span className="capitalize">{event.mode}</span>
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-lg text-white group-hover:text-indigo-300 transition-colors line-clamp-2 leading-snug">
            {event.title}
          </h3>

          <p className="mt-1.5 text-xs text-slate-400 font-medium line-clamp-1">
            Speaker: <span className="text-slate-200">{event.speakerName}</span>
          </p>

          <div className="mt-3.5 space-y-1.5 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              <span>{formatDate(event.startTime)}</span>
            </div>

            <div className="flex items-center gap-2">
              {event.mode === 'online' ? (
                <Video className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              ) : (
                <MapPin className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              )}
              <span className="truncate">
                {event.mode === 'online'
                  ? 'Online Link Provided'
                  : event.venue || 'Offline Venue'}
              </span>
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-slate-400">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>
              <strong className="text-indigo-400">{event.seatsLeft}</strong> / {event.capacity} seats left
            </span>
          </div>

          <div className="flex items-center gap-1 font-semibold text-amber-400">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>{event.avgRating ? event.avgRating : 'New'}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
