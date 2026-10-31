import React, { useState, useEffect, useCallback } from 'react';
import { fetchEvents } from '../api/events.js';
import { EventCard } from '../components/EventCard.jsx';
import { Pagination } from '../components/Pagination.jsx';
import { Spinner } from '../components/Spinner.jsx';
import toast from 'react-hot-toast';
import { Search, Sparkles, Filter, Calendar, Layers, Video } from 'lucide-react';

export function HomePage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [mode, setMode] = useState('');
  const [phase, setPhase] = useState('');

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 9,
        ...(search.trim() && { q: search.trim() }),
        ...(category && { category }),
        ...(mode && { mode }),
        ...(phase && { phase })
      };

      const res = await fetchEvents(params);
      if (res.success && res.data) {
        setEvents(res.data.items || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [page, search, category, mode, phase]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadEvents();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('');
    setMode('');
    setPhase('');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Interactive Workshop & Seminar Platform</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
          Level Up Your Skills With{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
            Convene
          </span>
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
          Explore curated workshops and seminars. Register with automatic waitlists, fast QR check-in, and instant participation certificates.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 sm:p-5 mb-8 shadow-xl">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by topic, speaker, or keyword..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              <option value="workshop">Workshop</option>
              <option value="seminar">Seminar</option>
              <option value="webinar">Webinar</option>
              <option value="conference">Conference</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Mode Filter */}
          <div>
            <select
              value={mode}
              onChange={(e) => {
                setMode(e.target.value);
                setPage(1);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Modes</option>
              <option value="offline">Offline</option>
              <option value="online">Online</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          {/* Phase Filter */}
          <div>
            <select
              value={phase}
              onChange={(e) => {
                setPhase(e.target.value);
                setPage(1);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Phases</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Live Now</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </form>

        {(search || category || mode || phase) && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>
              Active filters applied • Found <strong className="text-white">{total}</strong> events
            </span>
            <button
              onClick={handleResetFilters}
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Events Grid / Loading / Empty State */}
      {loading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center p-12">
          <Spinner size="lg" className="text-indigo-500 mb-3" />
          <p className="text-sm font-medium text-slate-400">Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="min-h-[350px] flex flex-col items-center justify-center p-8 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl text-center">
          <div className="w-16 h-16 mb-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No events found</h3>
          <p className="mt-1.5 text-sm text-slate-400 max-w-sm">
            {search || category || mode || phase
              ? "We couldn't find any events matching your current filters. Try tweaking your search terms."
              : 'There are no published events right now. Check back soon!'}
          </p>
          {(search || category || mode || phase) && (
            <button
              onClick={handleResetFilters}
              className="mt-5 px-4 py-2 text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-colors"
            >
              Reset all filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
        </>
      )}
    </div>
  );
}
