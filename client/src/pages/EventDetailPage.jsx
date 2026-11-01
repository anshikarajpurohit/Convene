import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { fetchEventById } from '../api/events.js';
import { registerForEvent, cancelRegistration } from '../api/registrations.js';
import { useAuth } from '../context/AuthContext.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { formatDate } from '../components/EventCard.jsx';
import { Spinner } from '../components/Spinner.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import toast from 'react-hot-toast';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  User,
  Star,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

export function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const loadEvent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchEventById(id);
      if (res.success && res.data) {
        setEvent(res.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  const handleRegister = async () => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }

    setRegistering(true);
    try {
      const res = await registerForEvent(id);
      if (res.success) {
        toast.success(
          res.data.status === 'confirmed'
            ? 'Registration confirmed!'
            : 'Added to waitlist. We will notify you if a seat opens!'
        );
        loadEvent();
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to register');
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    setCancelling(true);
    try {
      const res = await cancelRegistration(id);
      if (res.success) {
        toast.success('Registration cancelled');
        setCancelModalOpen(false);
        loadEvent();
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to cancel registration');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-12">
        <Spinner size="lg" className="text-indigo-500 mb-3" />
        <p className="text-sm font-medium text-slate-400">Loading workshop details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-white">Event not found</h2>
        <p className="mt-2 text-slate-400 text-sm">
          This event may have been deleted or is not currently published.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-white text-sm hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Explore Events</span>
        </Link>
      </div>
    );
  }

  const backendBase = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000';
  const posterSrc = event.posterUrl ? `${backendBase}${event.posterUrl}` : null;
  const isOwner = user && event.createdBy?._id === user._id;
  const myReg = event.myRegistration;
  const isStarted = new Date(event.startTime) <= new Date();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Return link */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Events</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Poster or Banner */}
          <div className="w-full h-64 sm:h-80 rounded-2xl bg-slate-950 overflow-hidden border border-slate-800 relative flex items-center justify-center">
            {posterSrc ? (
              <img src={posterSrc} alt={event.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-950/70 via-slate-900 to-violet-950/70 flex flex-col items-center justify-center p-6 text-center">
                <span className="text-5xl mb-3">🎓</span>
                <span className="text-sm uppercase tracking-widest font-extrabold text-indigo-400">
                  {event.category}
                </span>
              </div>
            )}
            <div className="absolute top-4 left-4 flex gap-2">
              <StatusBadge status={event.phase} type="phase" />
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-950/80 backdrop-blur-md text-slate-200 border border-slate-700 uppercase">
                {event.category}
              </span>
            </div>
          </div>

          {/* Event Header Details */}
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug">
              {event.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-300">
              <div className="flex items-center gap-1.5 font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                <Star className="w-4 h-4 fill-current" />
                <span>{event.avgRating ? `${event.avgRating} / 5` : 'No reviews yet'}</span>
                {event.ratingCount > 0 && (
                  <span className="text-slate-400 text-xs font-normal">({event.ratingCount})</span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-slate-400">
                <Users className="w-4 h-4 text-slate-500" />
                <span>
                  <strong className="text-indigo-400">{event.seatsLeft}</strong> seats remaining of{' '}
                  {event.capacity}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-3">About This Event</h2>
            <div className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
              {event.description}
            </div>
          </div>

          {/* Speaker Bio */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" />
              <span>Keynote Speaker</span>
            </h2>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-lg text-white flex-shrink-0 shadow-md">
                {event.speakerName.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-white text-base">{event.speakerName}</h3>
                <p className="mt-1 text-sm text-slate-400 leading-relaxed">
                  {event.speakerBio || 'Industry specialist & domain expert.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Register Card (Right 1 col) */}
        <div className="space-y-6">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-2xl sticky top-24">
            <h3 className="text-lg font-bold text-white mb-4">Event Details</h3>

            <div className="space-y-4 text-sm mb-6">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs uppercase font-semibold text-slate-400">Start Time</div>
                  <div className="text-white font-medium">{formatDate(event.startTime)}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs uppercase font-semibold text-slate-400">End Time</div>
                  <div className="text-white font-medium">{formatDate(event.endTime)}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                {event.mode === 'online' ? (
                  <Video className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <MapPin className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-xs uppercase font-semibold text-slate-400">Format & Venue</div>
                  <div className="text-white font-medium capitalize">
                    {event.mode}
                    {event.venue && ` • ${event.venue}`}
                  </div>
                  {event.mode !== 'offline' && myReg?.status === 'confirmed' && event.meetingLink && (
                    <a
                      href={event.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      <span>Join Meeting Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons based on status */}
            <div className="pt-4 border-t border-slate-800">
              {event.status === 'cancelled' ? (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm text-center font-medium">
                  This event has been cancelled by the organizer.
                </div>
              ) : event.phase === 'completed' ? (
                <div className="p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm text-center font-medium">
                  This event is now completed.
                </div>
              ) : isOwner ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs text-center font-medium">
                    You are the creator of this event.
                  </div>
                  <Link
                    to={`/organizer/events/${event._id}/manage`}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center transition-all"
                  >
                    Open Management Studio
                  </Link>
                </div>
              ) : myReg?.status === 'confirmed' ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>You are registered for this event!</span>
                  </div>

                  <Link
                    to="/dashboard"
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center transition-all"
                  >
                    View QR & Registration
                  </Link>

                  {!isStarted && !myReg.attended && (
                    <button
                      onClick={() => setCancelModalOpen(true)}
                      className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
                    >
                      Cancel Registration
                    </button>
                  )}
                </div>
              ) : myReg?.status === 'waitlisted' ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>You are on the waitlist!</span>
                  </div>

                  <Link
                    to="/dashboard"
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm flex items-center justify-center transition-all"
                  >
                    View Waitlist Status
                  </Link>

                  {!isStarted && (
                    <button
                      onClick={() => setCancelModalOpen(true)}
                      className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
                    >
                      Leave Waitlist
                    </button>
                  )}
                </div>
              ) : isStarted ? (
                <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-sm text-center">
                  Registration is closed (event has started).
                </div>
              ) : event.seatsLeft > 0 ? (
                <button
                  onClick={handleRegister}
                  disabled={registering}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  {registering ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                      <span>Registering...</span>
                    </>
                  ) : (
                    <span>Register Now (Free)</span>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={registering}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold text-sm shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  {registering ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                      <span>Joining Waitlist...</span>
                    </>
                  ) : (
                    <span>Join Waitlist</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={cancelModalOpen}
        title="Cancel Registration"
        message="Are you sure you want to cancel your registration? If you cancel, your seat will be automatically given to the next person on the waitlist."
        confirmText="Yes, Cancel Registration"
        loading={cancelling}
        onConfirm={handleCancelRegistration}
        onCancel={() => setCancelModalOpen(false)}
      />
    </div>
  );
}
