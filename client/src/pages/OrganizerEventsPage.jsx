import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyEvents, cancelEvent } from '../api/events.js';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { formatDate } from '../components/EventCard.jsx';
import { Spinner } from '../components/Spinner.jsx';
import { Pagination } from '../components/Pagination.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit,
  Sliders,
  XCircle,
  Calendar,
  Users,
  Search,
  ExternalLink
} from 'lucide-react';

export function OrganizerEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal state
  const [cancelTargetId, setCancelTargetId] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchMyEvents({ page, limit: 10 });
      if (res.success && res.data) {
        setEvents(res.data.items || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to load organizer events');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleConfirmCancel = async () => {
    if (!cancelTargetId) return;
    setCancelling(true);
    try {
      const res = await cancelEvent(cancelTargetId);
      if (res.success) {
        toast.success('Event cancelled successfully');
        setCancelTargetId(null);
        loadEvents();
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to cancel event');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Organizer Studio
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Create, manage, monitor registrations, and check-in attendees for your events
          </p>
        </div>

        <Link
          to="/organizer/events/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Event</span>
        </Link>
      </div>

      {/* Table Container */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center p-12">
          <Spinner size="lg" className="text-indigo-500 mb-3" />
          <p className="text-sm font-medium text-slate-400">Loading your events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white">No events published yet</h3>
          <p className="mt-1.5 text-sm text-slate-400">
            You haven't created any workshops or seminars yet. Launch your first event to get started.
          </p>
          <Link
            to="/organizer/events/new"
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Event</span>
          </Link>
        </div>
      ) : (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/70 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-4">Event</th>
                  <th scope="col" className="px-6 py-4">Phase</th>
                  <th scope="col" className="px-6 py-4">Confirmed / Capacity</th>
                  <th scope="col" className="px-6 py-4">Schedule</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {events.map((event) => {
                  const isLocked = event.phase === 'completed' || event.phase === 'cancelled';
                  return (
                    <tr key={event._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-medium text-white max-w-xs">
                        <Link
                          to={`/events/${event._id}`}
                          className="hover:text-indigo-300 transition-colors line-clamp-1 font-semibold"
                        >
                          {event.title}
                        </Link>
                        <div className="text-xs text-slate-400 font-normal mt-0.5">
                          Speaker: {event.speakerName} • <span className="capitalize">{event.mode}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={event.phase} type="phase" />
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{event.confirmedCount}</span>
                          <span className="text-slate-500">/</span>
                          <span className="text-slate-400">{event.capacity}</span>
                          <span className="text-xs text-indigo-400">({event.seatsLeft} left)</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                        {formatDate(event.startTime)}
                      </td>

                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        <Link
                          to={`/organizer/events/${event._id}/manage`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Manage</span>
                        </Link>

                        {!isLocked && (
                          <Link
                            to={`/organizer/events/${event._id}/edit`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </Link>
                        )}

                        {!isLocked && (
                          <button
                            onClick={() => setCancelTargetId(event._id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-800">
            <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(cancelTargetId)}
        title="Cancel Event"
        message="Are you sure you want to cancel this event? This action is irreversible. All confirmed and waitlisted attendees will be notified and their tickets invalidated."
        confirmText="Yes, Cancel Event"
        isDanger={true}
        loading={cancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelTargetId(null)}
      />
    </div>
  );
}
