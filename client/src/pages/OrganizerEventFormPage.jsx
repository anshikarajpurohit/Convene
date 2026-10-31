import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { createEvent, updateEvent, fetchEventById } from '../api/events.js';
import { Spinner } from '../components/Spinner.jsx';
import toast from 'react-hot-toast';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  User,
  Image,
  ArrowLeft,
  Save,
  CheckCircle2
} from 'lucide-react';

export function OrganizerEventFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'workshop',
    speakerName: '',
    speakerBio: '',
    mode: 'offline',
    venue: '',
    meetingLink: '',
    startTime: '',
    endTime: '',
    capacity: 50
  });

  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [confirmedCount, setConfirmedCount] = useState(0);

  useEffect(() => {
    if (isEdit) {
      fetchEventById(id)
        .then((res) => {
          if (res.success && res.data) {
            const e = res.data;
            setConfirmedCount(e.confirmedCount || 0);
            // Format start/end time for datetime-local input (YYYY-MM-DDTHH:MM)
            const formatForInput = (d) => {
              if (!d) return '';
              const date = new Date(d);
              const pad = (n) => String(n).padStart(2, '0');
              return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
            };

            setFormData({
              title: e.title,
              description: e.description,
              category: e.category,
              speakerName: e.speakerName,
              speakerBio: e.speakerBio || '',
              mode: e.mode,
              venue: e.venue || '',
              meetingLink: e.meetingLink || '',
              startTime: formatForInput(e.startTime),
              endTime: formatForInput(e.endTime),
              capacity: e.capacity
            });

            if (e.posterUrl) {
              const backendBase = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000';
              setPosterPreview(`${backendBase}${e.posterUrl}`);
            }
          }
        })
        .catch((err) => {
          toast.error(err.response?.data?.error?.message || 'Failed to load event for editing');
          navigate('/organizer');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Poster image must be less than 2MB');
        return;
      }
      setPosterFile(file);
      setPosterPreview(URL.createObjectURL(file));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.title.trim() || formData.title.trim().length < 3) {
      errs.title = 'Title must be between 3 and 120 characters';
    }
    if (!formData.description.trim() || formData.description.trim().length < 10) {
      errs.description = 'Description must be between 10 and 5000 characters';
    }
    if (!formData.speakerName.trim()) {
      errs.speakerName = 'Speaker name is required';
    }
    if (['offline', 'hybrid'].includes(formData.mode) && !formData.venue.trim()) {
      errs.venue = 'Venue location is required for offline and hybrid events';
    }
    if (['online', 'hybrid'].includes(formData.mode)) {
      if (!formData.meetingLink.trim() || !/^https?:\/\/.+/i.test(formData.meetingLink.trim())) {
        errs.meetingLink = 'A valid HTTP(S) link is required for online and hybrid events';
      }
    }
    if (!formData.startTime) {
      errs.startTime = 'Start time is required';
    } else if (!isEdit && new Date(formData.startTime) <= new Date()) {
      errs.startTime = 'Start time must be in the future';
    }
    if (!formData.endTime) {
      errs.endTime = 'End time is required';
    } else if (new Date(formData.endTime) <= new Date(formData.startTime)) {
      errs.endTime = 'End time must be after start time';
    }

    const cap = parseInt(formData.capacity, 10);
    if (isNaN(cap) || cap < 1 || cap > 10000) {
      errs.capacity = 'Capacity must be an integer between 1 and 10000';
    } else if (isEdit && cap < confirmedCount) {
      errs.capacity = `Capacity cannot be lower than confirmed attendees (${confirmedCount})`;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const data = new FormData();
    data.append('title', formData.title.trim());
    data.append('description', formData.description.trim());
    data.append('category', formData.category);
    data.append('speakerName', formData.speakerName.trim());
    if (formData.speakerBio) data.append('speakerBio', formData.speakerBio.trim());
    data.append('mode', formData.mode);
    if (['offline', 'hybrid'].includes(formData.mode)) data.append('venue', formData.venue.trim());
    if (['online', 'hybrid'].includes(formData.mode)) data.append('meetingLink', formData.meetingLink.trim());
    data.append('startTime', new Date(formData.startTime).toISOString());
    data.append('endTime', new Date(formData.endTime).toISOString());
    data.append('capacity', formData.capacity);

    if (posterFile) {
      data.append('poster', posterFile);
    }

    try {
      if (isEdit) {
        await updateEvent(id, data);
        toast.success('Event updated successfully');
      } else {
        await createEvent(data);
        toast.success('Event published successfully!');
      }
      navigate('/organizer');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-12">
        <Spinner size="lg" className="text-indigo-500 mb-3" />
        <p className="text-sm font-medium text-slate-400">Loading event data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/organizer"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Organizer Studio</span>
      </Link>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {isEdit ? 'Edit Event' : 'Create New Event'}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Provide the workshop or seminar schedule, capacity, and speaker details
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Event Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Modern Web Architecture & Micro-frontends"
              className={`w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.title ? 'border-rose-500/60' : 'border-slate-800'
              }`}
            />
            {errors.title && <p className="mt-1 text-xs text-rose-400">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Detailed Description *
            </label>
            <textarea
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Outline what attendees will learn, prerequisites, and agenda..."
              className={`w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.description ? 'border-rose-500/60' : 'border-slate-800'
              }`}
            />
            {errors.description && <p className="mt-1 text-xs text-rose-400">{errors.description}</p>}
          </div>

          {/* Category & Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="workshop">Workshop</option>
                <option value="seminar">Seminar</option>
                <option value="webinar">Webinar</option>
                <option value="conference">Conference</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Delivery Mode *
              </label>
              <select
                value={formData.mode}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="offline">Offline (In-Person)</option>
                <option value="online">Online (Virtual)</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          {/* Conditional Venue / Meeting Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {['offline', 'hybrid'].includes(formData.mode) && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Venue Location *
                </label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="e.g. Hall A, Tech Convention Center"
                  className={`w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.venue ? 'border-rose-500/60' : 'border-slate-800'
                  }`}
                />
                {errors.venue && <p className="mt-1 text-xs text-rose-400">{errors.venue}</p>}
              </div>
            )}

            {['online', 'hybrid'].includes(formData.mode) && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Online Meeting Link *
                </label>
                <input
                  type="url"
                  value={formData.meetingLink}
                  onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                  placeholder="https://meet.google.com/xyz-abc"
                  className={`w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.meetingLink ? 'border-rose-500/60' : 'border-slate-800'
                  }`}
                />
                {errors.meetingLink && <p className="mt-1 text-xs text-rose-400">{errors.meetingLink}</p>}
              </div>
            )}
          </div>

          {/* Schedule: Start Time & End Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Start Time *
              </label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.startTime ? 'border-rose-500/60' : 'border-slate-800'
                }`}
              />
              {errors.startTime && <p className="mt-1 text-xs text-rose-400">{errors.startTime}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                End Time *
              </label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.endTime ? 'border-rose-500/60' : 'border-slate-800'
                }`}
              />
              {errors.endTime && <p className="mt-1 text-xs text-rose-400">{errors.endTime}</p>}
            </div>
          </div>

          {/* Speaker Details & Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Speaker Name *
              </label>
              <input
                type="text"
                value={formData.speakerName}
                onChange={(e) => setFormData({ ...formData, speakerName: e.target.value })}
                placeholder="Dr. Alan Turing"
                className={`w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.speakerName ? 'border-rose-500/60' : 'border-slate-800'
                }`}
              />
              {errors.speakerName && <p className="mt-1 text-xs text-rose-400">{errors.speakerName}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Speaker Bio
              </label>
              <input
                type="text"
                value={formData.speakerBio}
                onChange={(e) => setFormData({ ...formData, speakerBio: e.target.value })}
                placeholder="Chief Scientist at TechLabs"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Max Capacity *
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.capacity ? 'border-rose-500/60' : 'border-slate-800'
                }`}
              />
              {errors.capacity && <p className="mt-1 text-xs text-rose-400">{errors.capacity}</p>}
            </div>
          </div>

          {/* Poster File Upload */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Event Poster (Optional, JPG/PNG/WEBP, max 2MB)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 file:cursor-pointer"
              />
              {posterPreview && (
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-700 flex-shrink-0">
                  <img src={posterPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-6 border-t border-slate-800 flex justify-end gap-3">
            <Link
              to="/organizer"
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  <span>Saving Event...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEdit ? 'Update Event' : 'Publish Event'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
